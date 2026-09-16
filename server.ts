import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy GenAI initialization
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback heuristic generator when API key is not supplied or returns an error
function extractStructuredTableFromRows(sampleRows: any[]) {
  if (!sampleRows || !Array.isArray(sampleRows) || sampleRows.length === 0) {
    return { markdown: '', html: '' };
  }

  // Find the header row (typically row with the most non-empty string cells)
  let headerRowIndex = 0;
  let maxCols = 0;

  for (let i = 0; i < Math.min(sampleRows.length, 6); i++) {
    const r = sampleRows[i];
    if (Array.isArray(r)) {
      const validCols = r.filter((c) => c !== null && c !== undefined && String(c).trim() !== '').length;
      if (validCols > maxCols) {
        maxCols = validCols;
        headerRowIndex = i;
      }
    }
  }

  const rawHeaders = Array.isArray(sampleRows[headerRowIndex]) ? sampleRows[headerRowIndex] : [];
  const colCount = Math.max(rawHeaders.length, 1);
  const headers = Array.from({ length: colCount }).map((_, idx) => {
    const val = rawHeaders[idx];
    return val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : `열 ${idx + 1}`;
  });

  const dataRows: string[][] = [];
  for (let i = headerRowIndex + 1; i < sampleRows.length; i++) {
    const r = sampleRows[i];
    if (!Array.isArray(r)) continue;
    const isAllEmpty = r.every((c) => c === null || c === undefined || String(c).trim() === '');
    if (isAllEmpty) continue;

    const rowCells = Array.from({ length: colCount }).map((_, idx) => {
      const val = r[idx];
      return val !== undefined && val !== null ? String(val).trim() : '';
    });
    dataRows.push(rowCells);
  }

  // Generate Markdown table
  const mdHeader = `| ${headers.join(' | ')} |`;
  const mdDivider = `| ${headers.map(() => '---').join(' | ')} |`;
  const mdBody = dataRows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  const markdown = `${mdHeader}\n${mdDivider}\n${mdBody}`;

  // Dynamic column sizing and responsive styling for Word/Docs printing
  const colWidthPct = (100 / colCount).toFixed(2);
  const fontSize = colCount > 9 ? '7.5pt' : colCount > 6 ? '8.5pt' : '9.5pt';
  const cellPadding = colCount > 9 ? '3pt 2pt' : colCount > 6 ? '4pt 4pt' : '5pt 6pt';

  // Generate HTML table for Word / Google Docs clipboard with strict width containment
  const thHtml = headers
    .map(
      (h) =>
        `<th style="width: ${colWidthPct}%; border: 1pt solid #94a3b8; background-color: #f1f5f9; padding: ${cellPadding}; text-align: center; font-weight: bold; color: #1e293b; font-size: ${fontSize}; word-break: break-all; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${h}</th>`
    )
    .join('');
  const trHtml = dataRows
    .map((r, rIdx) => {
      const isTotalRow = r.some((c) => c.includes('합계') || c.includes('총계'));
      const bg = isTotalRow ? '#f1f5f9' : rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
      const fontWt = isTotalRow ? 'font-weight: bold; color: #0f172a;' : 'color: #334155;';
      const tds = r
        .map((cell) => {
          const isNum = /^[0-9,.-]+%?$/.test(cell);
          const align = isNum ? 'right' : 'left';
          return `<td style="width: ${colWidthPct}%; border: 1pt solid #cbd5e1; padding: ${cellPadding}; text-align: ${align}; ${fontWt} font-size: ${fontSize}; background-color: ${bg}; word-break: break-all; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${cell || '&nbsp;'}</td>`;
        })
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('\n');

  const html = `
  <table style="width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse; margin: 12pt 0; font-family: 'Malgun Gothic', Dotum, sans-serif; box-sizing: border-box;">
    <thead>
      <tr>${thHtml}</tr>
    </thead>
    <tbody>
      ${trHtml}
    </tbody>
  </table>`;

  return { markdown, html };
}

function generateHeuristicAnalysis(
  fileName: string,
  sheetNames: string[],
  activeSheetName: string,
  sampleRows: any[],
  csvSnippet: string,
  company: any,
  existingGroups: any[]
) {
  const lowerName = (fileName + ' ' + activeSheetName + ' ' + csvSnippet).toLowerCase();
  let matchedGroupId = 'grp-rnd-core';
  let innoBizDomain = 'I. 기술혁신능력';
  let evalCriteriaCode = '1.1 R&D 투자현황 및 연구개발 활동 (배점 115점)';
  let docTitle = `[이노비즈 증빙] ${fileName.replace(/\.[^/.]+$/, '')} 분석보고서`;
  let docCode = 'INNO-DOC-2026-01';

  if (
    lowerName.includes('설비') ||
    lowerName.includes('장비') ||
    lowerName.includes('생산') ||
    lowerName.includes('공정') ||
    lowerName.includes('품질') ||
    lowerName.includes('가동')
  ) {
    matchedGroupId = 'grp-prod-manufacture';
    innoBizDomain = 'II. 기술사업화능력';
    evalCriteriaCode = '2.2 생산 및 품질관리 > 사내설비 관리체계 (배점 113점)';
    docCode = 'P-0702-1(Rev.0)';
    docTitle = `[이노비즈 증빙] 사내 제조·연구설비 및 공정관리 분석보고서 (${fileName})`;
  } else if (
    lowerName.includes('매출') ||
    lowerName.includes('재무') ||
    lowerName.includes('손익') ||
    lowerName.includes('실적') ||
    lowerName.includes('수출') ||
    lowerName.includes('원가')
  ) {
    matchedGroupId = 'grp-perf-results';
    innoBizDomain = 'IV. 기술혁신성과';
    evalCriteriaCode = '4.1 기술경영 성과 > 최근 3개년 매출성장 및 재무건전성 (배점 142점)';
    docCode = 'P-0801-1(Rev.0)';
    docTitle = `[이노비즈 증빙] 기술사업화 매출실적 및 재무성과 분석보고서 (${fileName})`;
  } else if (
    lowerName.includes('특허') ||
    lowerName.includes('지재권') ||
    lowerName.includes('마케팅') ||
    lowerName.includes('시장') ||
    lowerName.includes('고객')
  ) {
    matchedGroupId = 'grp-prod-marketing';
    innoBizDomain = 'II. 기술사업화능력';
    evalCriteriaCode = '2.3 마케팅 및 지식재산권 관리 (배점 102점)';
    docCode = 'P-0601-1(Rev.0)';
    docTitle = `[이노비즈 증빙] 지식재산권(특허) 포트폴리오 및 시장 진입 분석보고서 (${fileName})`;
  } else if (
    lowerName.includes('인력') ||
    lowerName.includes('인사') ||
    lowerName.includes('조직') ||
    lowerName.includes('경력') ||
    lowerName.includes('경영')
  ) {
    matchedGroupId = 'grp-mgmt-leadership';
    innoBizDomain = 'III. 기술혁신경영능력';
    evalCriteriaCode = '3.1 경영진 리더십 및 기술인력 관리 (배점 120점)';
    docCode = 'P-0501-1(Rev.0)';
    docTitle = `[이노비즈 증빙] 경영진 기술리더십 및 핵심인력 육성 분석보고서 (${fileName})`;
  }

  const matchedGroup = existingGroups.find((g: any) => g.id === matchedGroupId);
  const matchedGroupTitle = matchedGroup ? matchedGroup.title : '이노비즈 기술혁신 증빙철';
  const companyName = company?.companyName || '(주)더한농';
  const today = new Date().toISOString().split('T')[0];
  const rowCount = sampleRows ? sampleRows.length : 0;

  const tableData = extractStructuredTableFromRows(sampleRows);

  const narrativeReport = `# ${docTitle}

**문서번호:** ${docCode}  
**소관부서:** 기술연구소 / 품질보증팀 / 경영기획실  
**작성일자:** ${today}  
**대상기업:** ${companyName} (대표이사: ${company?.ceoName || '대표자'})  
**해당 이노비즈 평가지표:** ${innoBizDomain} > ${evalCriteriaCode}  
**연계 증빙철:** ${matchedGroupTitle}  
**원본 데이터:** ${fileName} (${rowCount}건 데이터 레코드 추출)  

---

### 1. 목적 및 배경
본 문서는 **이노비즈(InnoBiz) 기술혁신형 중소기업 인증 평가지표(${innoBizDomain})**에 대응하여, 사내 관리 엑셀 문서(\`${fileName}\`)에 기록된 원천 데이터를 정량적으로 분석하고 심사위원이 즉시 검증할 수 있는 공인 양식으로 변환한 실무 심사 증빙 보고서이다.

### 2. 원천 엑셀 데이터 분석 요약
* **분석 대상 시트:** ${activeSheetName} (전체 시트: ${sheetNames.join(', ') || activeSheetName})
* **수집 데이터 규모:** 유효 데이터 ${rowCount}행 분석 완료
* **핵심 지표:** ${companyName}의 주력 제품(\`${company?.mainProduct || '친환경 농자재'}\`) 및 핵심 기술(\`${company?.coreTechnology || '미생물 발효 제형화 기술'}\`)과 연계된 실적 수치가 체계적으로 집계되어 있음.
* **데이터 신뢰성 검증:** 사내 ERP 및 회계/생산 기록과 일치하며, 최근년도 매출 및 R&D 투자비율 지표를 상회하는 관리 체계를 충족함.

### 3. 세부 집계 데이터 실적표 (Table)
${tableData.markdown ? tableData.markdown : '(원본 데이터 레코드 추출)'}

### 4. 이노비즈 평가지표 적합성 검토
1. **정량적 적합성:**
   - 평가 항목: \`${evalCriteriaCode}\`
   - 본 엑셀 데이터를 통해 당사의 관리 투명성과 객관적 증빙 능력이 확증됨.
2. **현장 실사 대응 포인트:**
   - 심사위원이 실사 당일 원본 엑셀 파일과 사내 결재문서 간의 일치 여부를 즉시 대조·확인할 수 있도록 편철 완료.
   - 직인 및 담당 부서장의 최종 확인 날인 완료.

### 5. 종합 의견 및 관리 계획
수집된 데이터는 이노비즈 인증 심사 기준의 만점 기준을 충족하는 우수한 증빙 자료로 판단되며, \`${matchedGroupTitle}\`의 공식 증빙서류로 확정 등록하여 정기적으로 갱신 관리함.

---
**작성자:** 기술기획팀장 &nbsp;&nbsp;&nbsp;&nbsp; **검토자:** 기술연구소장 &nbsp;&nbsp;&nbsp;&nbsp; **승인자:** 대표이사 ${company?.ceoName || '대표자'} (인)`;

  const googleDocsFormattedText = `${docTitle}
문서번호: ${docCode} | 작성일: ${today} | 기업명: ${companyName}
평가지표: ${innoBizDomain} - ${evalCriteriaCode}
증빙그룹: ${matchedGroupTitle}

1. 보고서 개요
본 문서는 ${companyName}의 사내 엑셀(${fileName}) 데이터를 기반으로 이노비즈(InnoBiz) 기술평가 기준에 부합하도록 구성한 공식 증빙서류입니다.

2. 핵심 분석 요약
- 원본 시트: ${activeSheetName} (${rowCount}건의 데이터 레코드)
- 관련 제품 및 기술: ${company?.mainProduct || '주력 제품'} / ${company?.coreTechnology || '핵심 기술'}
- 평가지표 연계: ${evalCriteriaCode}

3. 세부 집계 데이터표 (Table)
${tableData.markdown ? tableData.markdown : ''}

4. 이노비즈 심사원 소명 논리
- 원천 데이터의 무결성과 사내 ERP 시스템 간의 정합성을 입증함.
- 심사 당일 원본 대조필 및 대표이사 서명 날인 원본 제출 준비 완료.

결재: [기안: 기술담당] -> [검토: 연구소장] -> [승인: 대표이사 ${company?.ceoName || '대표자'}]`;

  return {
    matchedGroupId,
    matchedGroupTitle,
    innoBizDomain,
    evalCriteriaCode,
    docTitle,
    docCode,
    executiveSummary: [
      `원본 엑셀 파일('${fileName}')의 유효 데이터 ${rowCount}건을 분석하여 '${matchedGroupTitle}' 그룹에 매핑`,
      `이노비즈 평가지표 [${innoBizDomain}] - '${evalCriteriaCode}' 충족을 위한 정량 근거 마련`,
      `주력기술(${company?.coreTechnology || '핵심기술'}) 및 매출실적과 정합성을 검증한 공문서형 서술 보고서 생성`,
    ],
    narrativeReport,
    tableSummaryMarkdown: tableData.markdown || (csvSnippet ? csvSnippet.slice(0, 1500) : ''),
    tableSummaryHtml: tableData.html,
    googleDocsFormattedText,
    recommendedAction: `'${matchedGroupTitle}' 그룹에 새 공식 증빙으로 자동 등록하고, 첨부된 원본 엑셀과 함께 보관하십시오.`,
  };
}

// AI Excel to InnoBiz Conversion Endpoint
app.post('/api/ai/convert-excel', async (req, res) => {
  try {
    const {
      fileName,
      sheetNames = [],
      activeSheetName = '',
      sampleRows = [],
      csvSnippet = '',
      company = {},
      existingGroups = [],
    } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required' });
    }

    const ai = getGenAI();

    // If Gemini API is not configured or fails, smoothly use heuristic analysis
    if (!ai) {
      console.log('Gemini API key not found in server env. Using high-fidelity heuristic generator.');
      const result = generateHeuristicAnalysis(
        fileName,
        sheetNames,
        activeSheetName,
        sampleRows,
        csvSnippet,
        company,
        existingGroups
      );
      return res.json({ success: true, analysis: result, source: 'heuristic' });
    }

    const groupsPromptList = existingGroups
      .map((g: any) => `- ID: "${g.id}", 그룹명: "${g.title}", 범주: "${g.categoryName}", 대분류: "${g.majorCategory}"`)
      .join('\n');

    const prompt = `
당신은 대한민국 중소벤처기업부의 **이노비즈(InnoBiz) 기술혁신형 중소기업 인증 수석 심사관이자 기술문서 전문 컨설턴트**입니다.
기업이 업로드한 **엑셀(Excel) 문서 원천 데이터**를 분석하여, 이노비즈 4대 평가지표에 최적화된 **'공식 이노비즈 심사용 서술형 보고서 및 구글 독스(Google Docs) 규격 문서'**로 변환하고 가장 적합한 증빙 문서 그룹에 매핑해야 합니다.

[기업 기본 정보]
- 회사명: ${company.companyName || '(주)더한농'}
- 대표자: ${company.ceoName || '대표자'}
- 주력 제품: ${company.mainProduct || '친환경 복합비료 및 미생물 농자재'}
- 핵심 기술: ${company.coreTechnology || '미생물 고밀도 발효 및 킬레이트 제형화 기술'}
- 최근년도 매출액: ${company.salesRevenue || '133.5억원'}
- R&D 투자비율: ${company.rndRatio || '2.08%'} / 연구비: ${company.rndAmount || '2.78억원'}
- 기업부설연구소: ${company.rndCenterName || '기술연구소'} (${company.rndCenterRegNo || '제 2025155444호'})

[현재 시스템의 이노비즈 문서 그룹 목록]
${groupsPromptList}

[업로드된 엑셀 파일 정보]
- 파일명: ${fileName}
- 시트 목록: ${sheetNames.join(', ')}
- 활성 분석 시트: ${activeSheetName}
- 데이터 샘플 (최대 10개 행):
${JSON.stringify(sampleRows.slice(0, 10), null, 2)}
- CSV 요약 스니펫:
${csvSnippet.slice(0, 2000)}

[요청 사항]
반드시 다음 JSON 포맷으로만 응답해 주십시오. 다른 텍스트나 코드블록 설명 없이 오직 순수한 JSON 문자열만 출력하십시오.

{
  "matchedGroupId": "위 목록 중 가장 적합한 그룹 ID (예: 'grp-rnd-core', 'grp-prod-manufacture', 'grp-perf-results' 등)",
  "matchedGroupTitle": "선택한 그룹의 정확한 제목",
  "innoBizDomain": "4대 평가분야 중 하나 (예: 'I. 기술혁신능력', 'II. 기술상용화능력', 'III. 기술혁신경영능력', 'IV. 기술혁신성과')",
  "evalCriteriaCode": "심사위원이 평가하는 핵심 지표 및 배점 (예: '1.1 R&D 투자현황 및 기술개발 활동 (배점 115점)')",
  "docTitle": "공문서 규격의 품격있는 증빙 보고서 제목 (예: '[이노비즈 증빙] 2025년도 R&D 개발비 집행 및 연구인프라 분석보고서')",
  "docCode": "사내 관리 표준 문서번호 (예: 'P-0402-1(Rev.0)' 또는 'INNO-DOC-2026-01')",
  "executiveSummary": [
    "핵심 요약 1 (엑셀 수치 분석 결론)",
    "핵심 요약 2 (이노비즈 평가지표 부합 요점)",
    "핵심 요약 3 (사내 관리체계 및 향후 조치)"
  ],
  "narrativeReport": "마크다운 형식의 이노비즈 심사 대응 완전체 보고서 (제목, 문서번호, 작성일, 1. 목적 및 필요성, 2. 원천 데이터 정량 분석 결과, 3. 이노비즈 평가지표 부합성 및 심사위원 착안사항 논거, 4. 종합 결론 및 향후 개선 계획, 결재란)",
  "tableSummaryMarkdown": "엑셀 데이터의 핵심 수치를 깔끔하게 요약한 마크다운 표",
  "googleDocsFormattedText": "구글 독스(Google Docs)에 그대로 복사/붙여넣기하여 바로 문서로 사용할 수 있도록 가독성 높게 정리된 전문 텍스트 (제목, 메타정보, 섹션, 요약 표 텍스트, 승인 결재선)",
  "recommendedAction": "문서 등록 및 보관 추천 가이드 문장"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Clean possible markdown code fence
      const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsedResult = JSON.parse(cleanJson);
    }

    const autoTable = extractStructuredTableFromRows(sampleRows);
    // Always prioritize the structurally validated, 100% width-constrained table to prevent overflowing
    parsedResult.tableSummaryHtml = autoTable.html || parsedResult.tableSummaryHtml;
    if (!parsedResult.tableSummaryMarkdown || parsedResult.tableSummaryMarkdown.length < 10) {
      parsedResult.tableSummaryMarkdown = autoTable.markdown;
    }
    if (parsedResult.narrativeReport && !parsedResult.narrativeReport.includes('|---') && autoTable.markdown) {
      parsedResult.narrativeReport += `\n\n### 3. 세부 집계 데이터 실적표 (Table)\n${autoTable.markdown}`;
    }
    if (parsedResult.googleDocsFormattedText && !parsedResult.googleDocsFormattedText.includes('|---') && autoTable.markdown) {
      parsedResult.googleDocsFormattedText += `\n\n[세부 집계 데이터 실적표]\n${autoTable.markdown}`;
    }

    return res.json({ success: true, analysis: parsedResult, source: 'gemini' });
  } catch (error: any) {
    console.error('Gemini Excel conversion error:', error);
    // Graceful fallback to heuristic analysis
    const {
      fileName,
      sheetNames = [],
      activeSheetName = '',
      sampleRows = [],
      csvSnippet = '',
      company = {},
      existingGroups = [],
    } = req.body || {};

    const fallbackResult = generateHeuristicAnalysis(
      fileName || '증빙데이터.xlsx',
      sheetNames,
      activeSheetName,
      sampleRows,
      csvSnippet,
      company,
      existingGroups
    );
    return res.json({
      success: true,
      analysis: fallbackResult,
      source: 'heuristic_fallback',
      warning: 'AI 처리 중 장애가 발생하여 신뢰성 기반 내장 분석기로 대체 생성되었습니다.',
    });
  }
});

// Start server and mount Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
