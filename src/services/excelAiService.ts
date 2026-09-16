import * as XLSX from 'xlsx';
import { CompanyProfile, DocumentGroup, DocumentItem, DocumentAttachment, DocumentStatus } from '../types';
import { saveAttachmentBlob } from '../utils/fileStorage';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';

export interface ExcelAnalysisResult {
  matchedGroupId: string;
  matchedGroupTitle: string;
  innoBizDomain: string;
  evalCriteriaCode: string;
  docTitle: string;
  docCode: string;
  executiveSummary: string[];
  narrativeReport: string;
  tableSummaryMarkdown: string;
  tableSummaryHtml?: string;
  googleDocsFormattedText: string;
  recommendedAction: string;
}

export interface ParsedExcelData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  activeSheetName: string;
  sampleRows: any[];
  csvSnippet: string;
  totalRows: number;
  totalCols: number;
  fileBlob: Blob;
}

/**
 * Parse an uploaded Excel or CSV file using SheetJS (XLSX)
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetNames = workbook.SheetNames || ['Sheet1'];
  const activeSheetName = sheetNames[0];
  const activeSheet = workbook.Sheets[activeSheetName];

  // Convert to JSON row array
  const rawRows: any[] = XLSX.utils.sheet_to_json(activeSheet, { header: 1, defval: '' });
  const csvSnippet = XLSX.utils.sheet_to_csv(activeSheet);

  const totalRows = rawRows.length;
  const totalCols = rawRows[0] ? (rawRows[0] as any[]).length : 0;
  const sampleRows = rawRows.slice(0, 25); // Take top 25 rows for AI analysis

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames,
    activeSheetName,
    sampleRows,
    csvSnippet,
    totalRows,
    totalCols,
    fileBlob: file,
  };
}

/**
 * Generate built-in sample Excel file for instant testing
 */
export function createSampleExcelFile(type: 'rnd' | 'production' | 'performance'): File {
  const wb = XLSX.utils.book_new();
  const today = new Date().toISOString().split('T')[0];

  if (type === 'rnd') {
    const wsData = [
      ['[2025년도 (주)더한농 R&D 연구개발비 집행 및 인프라 명세서]', '', '', '', ''],
      ['기업명', '(주)더한농', '연구소 인정번호', '제 2025155444호', '작성일자', today],
      [''],
      ['연번', '비목구분', '세부 연구개발 활동내역', '집행금액(천원)', '투자비율(%)', '비고(증빙서류)'],
      [1, '인건비', '친환경 기능성 농자재 전담연구원 급여(3인)', 108000, '68.35%', '급여대장 및 4대보험 원천징수부'],
      [2, '연구장비비', 'HPLC 고성능 액체크로마토그래피 등 리스/구입', 24500, '15.51%', '세금계산서 및 설비등록대장'],
      [3, '시약재료비', '미생물 고밀도 배양 배지 및 시험분석 시약', 14200, '8.99%', '연구노트 및 구매확인서'],
      [4, '지식재산권', '특허 출원/등록 수수료 및 선행기술조사', 6300, '3.99%', '특허청 납부영수증'],
      [5, '위탁시험비', '충북대 산학협력 약효/약해 시험분석 용역', 5000, '3.16%', '산학협력 계약서 및 성적서'],
      ['합계', '연구개발비 총계', '2025년도 R&D 총 투자액', 158000, '100.00%', '매출 39.4억원 대비 R&D 4.01%']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'R&D집행명세서');
    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new File([u8], '2025년도_더한농_R&D투자실적_및_인프라명세서.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  } else if (type === 'production') {
    const wsData = [
      ['[(주)더한농 충주공장 생산설비 가동현황 및 품질관리 검사대장]', '', '', '', ''],
      ['사업장', '충주공장 4대 제조라인', '공장부지', '4,625㎡', '작성일자', today],
      [''],
      ['설비관리번호', '설비명칭', '규격/용량', '설비도입일', '가동률(%)', '품질합격률(%)', '점검상태'],
      ['EQ-P-01', '미생물 발효 배양기 1호기', '5,000L SUS316L', '2024-12-06', '94.2%', '99.5%', '정상가동(A등급)'],
      ['EQ-P-02', '고속 자동 액제 충진기', '3000병/h 서보제어', '2024-12-06', '92.8%', '99.8%', '정상가동(A등급)'],
      ['EQ-P-03', '자동 캡핑 및 라벨러', '로터리 4헤드', '2024-12-06', '91.5%', '99.4%', '정상가동(A등급)'],
      ['EQ-P-04', '수직 분말 혼합기', '2,000L 패들타입', '2024-12-06', '88.5%', '98.9%', '정기점검 완료'],
      ['EQ-QC-01', '수분측정기 및 pH메터', '정밀 디지털', '2025-01-10', '99.0%', '100.0%', '검교정 완료']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, '공장설비품질대장');
    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new File([u8], '충주공장_4대제조라인_설비가동_및_품질검사대장.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  } else {
    const wsData = [
      ['[(주)더한농 최근 3개년 매출성장 및 수입대체 효과 분석표]', '', '', '', ''],
      ['대상기업', '(주)더한농', '대표이사', '대표자', '기준연도', '2023~2025'],
      [''],
      ['구분연도', '연간매출액(백만원)', '영업이익(백만원)', '당기순이익(백만원)', '전년대비성장률(%)', '수입대체효과(%)'],
      ['2023년(설립기)', 520, -45, -48, '-', '10%'],
      ['2024년(설비투자)', 1097, -38, -42, '+110.9%', '25%'],
      ['2025년(양산확대)', 3940, 79, 67, '+259.3%', '40% (수입산 대체)'],
      [''],
      ['주요 분석 요약', '충주공장 완공 및 친환경 농자재 국산화 성공으로 2025년 흑자 전환 달성', '', '', '', '']
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, '매출재무실적');
    const u8 = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new File([u8], '더한농_최근3개년_매출성장_및_수입대체실적표.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
  }
}

/**
 * Call Server-side Gemini API (/api/ai/convert-excel)
 */
export async function convertExcelToInnoBiz(
  parsed: ParsedExcelData,
  company: CompanyProfile,
  existingGroups: DocumentGroup[]
): Promise<ExcelAnalysisResult> {
  const payload = {
    fileName: parsed.fileName,
    sheetNames: parsed.sheetNames,
    activeSheetName: parsed.activeSheetName,
    sampleRows: parsed.sampleRows,
    csvSnippet: parsed.csvSnippet,
    company,
    existingGroups: existingGroups.map((g) => ({
      id: g.id,
      title: g.title,
      categoryName: g.categoryName,
      majorCategory: g.majorCategory,
    })),
  };

  const response = await fetch('/api/ai/convert-excel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Server returned ${response.status}`);
  }

  const json = await response.json();
  if (!json.success || !json.analysis) {
    throw new Error(json.error || 'Failed to analyze Excel data');
  }

  return json.analysis;
}

/**
 * Build clean styled HTML table from 2D sample rows
 */
export function generateHtmlTableFromRows(sampleRows: any[]): string {
  if (!sampleRows || !Array.isArray(sampleRows) || sampleRows.length === 0) {
    return '';
  }

  // Detect header row index
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
    return val !== undefined && val !== null && String(val).trim() !== '' ? String(val).trim() : `항목 ${idx + 1}`;
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

  // Dynamic column sizing and responsive styling for Word/Docs printing
  const colWidthPct = (100 / colCount).toFixed(2);
  const fontSize = colCount > 9 ? '7.5pt' : colCount > 6 ? '8.5pt' : '9pt';
  const cellPadding = colCount > 9 ? '3pt 2pt' : colCount > 6 ? '4pt 3pt' : '5pt 5pt';

  const thHtml = headers
    .map(
      (h) =>
        `<th style="width: ${colWidthPct}%; border: 1pt solid #94a3b8; background-color: #f1f5f9; padding: ${cellPadding}; text-align: center; font-weight: bold; color: #0f172a; font-size: ${fontSize}; word-break: break-all; word-wrap: break-word; overflow-wrap: break-word; white-space: normal;">${h}</th>`
    )
    .join('');

  const trHtml = dataRows
    .map((r, rIdx) => {
      const isTotalRow = r.some((c) => c.includes('합계') || c.includes('총계'));
      const bg = isTotalRow ? '#f1f5f9' : rIdx % 2 === 1 ? '#fafafa' : '#ffffff';
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

  return `
  <table style="width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse; margin: 10pt 0; font-family: 'Malgun Gothic', Dotum, sans-serif; box-sizing: border-box;">
    <thead>
      <tr>${thHtml}</tr>
    </thead>
    <tbody>
      ${trHtml}
    </tbody>
  </table>`;
}

/**
 * Automatically insert the converted report into the matched DocumentGroup!
 */
export async function insertConvertedDocIntoGroup(
  result: ExcelAnalysisResult,
  parsed: ParsedExcelData,
  group: DocumentGroup,
  company: CompanyProfile
): Promise<DocumentGroup> {
  const today = new Date().toISOString().split('T')[0];
  const docId = `doc-ai-excel-${Date.now()}`;
  const excelAttId = `att-raw-excel-${Date.now()}`;
  const wordAttId = `att-doc-report-${Date.now()}`;

  // 1. Save original Excel file to IndexedDB
  await saveAttachmentBlob(excelAttId, parsed.fileBlob);

  // 2. Generate and save MS Word / Google Docs compatible file to IndexedDB
  const wordBlob = await createWordDocBlob(result, company, parsed);
  await saveAttachmentBlob(wordAttId, wordBlob);

  // Create attachments array
  const attachments: DocumentAttachment[] = [
    {
      id: excelAttId,
      name: parsed.fileName,
      size: parsed.fileSize,
      uploadedAt: today,
      fileType: parsed.fileName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    {
      id: wordAttId,
      name: `[심사보고서]_${result.docTitle.replace(/[\\/:*?"<>|]/g, '_')}.doc`,
      size: wordBlob.size,
      uploadedAt: today,
      fileType: 'application/msword',
    },
  ];

  const newDocItem: DocumentItem = {
    id: docId,
    title: result.docTitle,
    code: result.docCode,
    sectionNumber: group.category === 'tech_innovation' ? '1' : group.category === 'tech_commercialize' ? '2' : group.category === 'tech_management' ? '3' : '4',
    majorCategory: group.majorCategory || result.innoBizDomain,
    evalItem: result.evalCriteriaCode,
    points: 30,
    currentStatus: `AI 엑셀 분석 완료 (${parsed.fileName} 원본 데이터 연계)`,
    evidenceDocNames: [parsed.fileName, `${result.docCode} 심사보고서`],
    isRequired: true,
    status: 'review' as DocumentStatus,
    formatGuide: `이노비즈 ${result.innoBizDomain} 심사용 공식 분석보고서 (엑셀 원본 대조필 날인 보관)`,
    attachments,
    notes: `[AI 자동 변환 및 구글 독스 연동 보고서]\n평가지표: ${result.evalCriteriaCode}\n요약: ${result.executiveSummary.join(' / ')}`,
    updatedAt: today,
  };

  return {
    ...group,
    documents: [newDocItem, ...group.documents],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Helper to build Word/Google Docs compliant HTML blob (with embedded Table!)
 */
export async function createWordDocBlob(
  result: ExcelAnalysisResult,
  company: CompanyProfile,
  parsed?: ParsedExcelData
): Promise<Blob> {
  const today = new Date().toISOString().split('T')[0];

  // Convert logo and seal to base64 for 100% offline Word embedding
  const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 260, 85) : '';
  const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 80, 80) : '';

  // Resolve HTML Table
  let tableHtml = result.tableSummaryHtml;
  if (!tableHtml && parsed?.sampleRows) {
    tableHtml = generateHtmlTableFromRows(parsed.sampleRows);
  }

  const wordHtml = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <meta charset="utf-8">
    <title>${result.docTitle}</title>
    <!--[if gte mso 9]>
    <xml>
      <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
      </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
      @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; mso-page-orientation: portrait; }
      body { width: 100% !important; max-width: 100% !important; font-family: 'Malgun Gothic', '맑은 고딕', Dotum, sans-serif; font-size: 10.5pt; line-height: 1.65; color: #1e293b; margin: 0; padding: 0; }
      table { width: 100% !important; max-width: 100% !important; table-layout: fixed !important; border-collapse: collapse !important; box-sizing: border-box !important; }
      th, td { word-break: break-all !important; word-wrap: break-word !important; overflow-wrap: break-word !important; white-space: normal !important; }
      .header-title { font-size: 17pt; font-weight: bold; color: #0f172a; text-align: left; padding: 6pt 0 10pt 0; border-bottom: 2.5pt solid #1e40af; margin-bottom: 14pt; }
      .meta-table { width: 100% !important; table-layout: fixed !important; border-collapse: collapse; margin: 12pt 0 16pt 0; font-size: 9.5pt; }
      .meta-table th { background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 8pt; text-align: left; font-weight: bold; color: #334155; }
      .meta-table td { border: 1pt solid #cbd5e1; padding: 5pt 8pt; color: #0f172a; }
      h2 { font-size: 12.5pt; font-weight: bold; color: #1e3a8a; border-left: 3.5pt solid #2563eb; padding-left: 7pt; margin-top: 16pt; margin-bottom: 6pt; }
      p { margin: 5pt 0; text-align: justify; }
      ul { margin: 5pt 0 5pt 16pt; padding: 0; }
      li { margin-bottom: 3pt; }
      .footer-sign { margin-top: 25pt; padding-top: 12pt; border-top: 1.5pt solid #94a3b8; text-align: right; font-size: 11pt; font-weight: bold; }
    </style>
  </head>
  <body>
    <!-- Top Header Layout: Left Logo & Tag, Right Fixed Approval Box -->
    <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; margin-bottom: 10pt;">
      <tr>
        <td style="width: 48%; border: none !important; vertical-align: top; text-align: left; padding: 0;">
          ${
            base64Logo
              ? `<div style="margin-bottom: 4pt;"><img src="${base64Logo}" alt="${company.companyName} 로고" style="max-height: 44pt; max-width: 165pt; object-fit: contain; display: block;" /></div>`
              : `<div style="font-size: 15pt; font-weight: bold; color: #1e3a8a; margin-bottom: 3pt;">${company.companyName}</div>`
          }
          <div style="font-size: 8.5pt; color: #64748b; font-weight: bold; border-left: 3pt solid #1e40af; padding-left: 5pt;">
            이노비즈(InnoBiz) 기술혁신 심사 공식 증빙철
          </div>
        </td>
        <td style="width: 52%; border: none !important; vertical-align: top; text-align: right; padding: 0;">
          <table align="right" style="margin-left: auto; margin-right: 0; width: 195pt !important; border-collapse: collapse !important; text-align: center; font-size: 8.5pt;">
            <tr>
              <th rowspan="2" style="width: 22pt; background-color: #f1f5f9; border: 1pt solid #475569; padding: 2pt 4pt; font-weight: bold; vertical-align: middle;">결<br/>재</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt 4pt; background-color: #f8fafc; font-weight: bold;">기 안</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt 4pt; background-color: #f8fafc; font-weight: bold;">검 토</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt 4pt; background-color: #f8fafc; font-weight: bold;">승 인</th>
            </tr>
            <tr style="height: 38pt;">
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: bottom; color: #64748b; font-size: 8pt;">기안자</td>
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: bottom; color: #64748b; font-size: 8pt;">연구소장</td>
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: middle; text-align: center; color: #64748b; font-size: 8pt;">
                ${
                  base64Seal 
                    ? `<img src="${base64Seal}" alt="직인" style="width: 30pt; height: 30pt; vertical-align: middle; display: inline-block;" />`
                    : '대표이사'
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div class="header-title">${result.docTitle}</div>

    <table class="meta-table">
      <tr>
        <th style="width: 18%;">문서번호</th>
        <td style="width: 32%;">${result.docCode}</td>
        <th style="width: 18%;">작성일자</th>
        <td style="width: 32%;">${today}</td>
      </tr>
      <tr>
        <th style="width: 18%;">대상기업</th>
        <td style="width: 32%;">${company.companyName} (대표: ${company.ceoName})</td>
        <th style="width: 18%;">소관부서</th>
        <td style="width: 32%;">기술연구소 / 품질보증팀 / 경영기획실</td>
      </tr>
      <tr>
        <th style="width: 18%;">평가지표</th>
        <td colspan="3">${result.innoBizDomain} &gt; <strong>${result.evalCriteriaCode}</strong></td>
      </tr>
      <tr>
        <th style="width: 18%;">증빙그룹</th>
        <td colspan="3">${result.matchedGroupTitle}</td>
      </tr>
    </table>

    <h2>1. 핵심 요약 (Executive Summary)</h2>
    <ul>
      ${result.executiveSummary.map((s) => `<li>${s}</li>`).join('')}
    </ul>

    <h2>2. 이노비즈 심사원 심사 착안사항 및 소명 보고</h2>
    <div style="white-space: pre-wrap; line-height: 1.65;">${result.narrativeReport}</div>

    ${
      tableHtml
        ? `
    <h2>3. 원본 엑셀 데이터 정량 집계 및 실적표 (Table)</h2>
    <div style="width: 100% !important; max-width: 100% !important; overflow: hidden !important;">${tableHtml}</div>
    `
        : ''
    }

    <div class="footer-sign">
      ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
      ${
        base64Seal
          ? `&nbsp; <img src="${base64Seal}" alt="직인" style="width: 42pt; height: 42pt; vertical-align: middle; display: inline-block; margin-left: 6pt;" />`
          : `&nbsp; (직인생략)`
      }
    </div>
  </body>
  </html>
  `;

  return new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
}

/**
 * Copy rich formatted text (with real HTML Table) to clipboard and open Google Docs in new tab
 */
export async function openAndCopyToGoogleDocs(
  result: ExcelAnalysisResult,
  company: CompanyProfile,
  parsed?: ParsedExcelData
): Promise<void> {
  const plainText = result.googleDocsFormattedText;
  let tableHtml = result.tableSummaryHtml;
  if (!tableHtml && parsed?.sampleRows) {
    tableHtml = generateHtmlTableFromRows(parsed.sampleRows);
  }

  const today = new Date().toISOString().split('T')[0];
  const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 240, 80) : '';
  const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 70, 70) : '';

  const fullHtml = `
  <div style="width: 100% !important; max-width: 100% !important; font-family: 'Malgun Gothic', Dotum, sans-serif; font-size: 10pt; line-height: 1.6;">
    <!-- Top Header Layout -->
    <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; margin-bottom: 12pt;">
      <tr>
        <td style="width: 50%; border: none !important; vertical-align: top; text-align: left; padding: 0;">
          ${
            base64Logo
              ? `<img src="${base64Logo}" alt="${company.companyName} 로고" style="max-height: 42px; max-width: 160px; object-fit: contain; margin-bottom: 4px; display: block;" />`
              : `<div style="font-size: 14pt; font-weight: bold; color: #1e3a8a;">${company.companyName}</div>`
          }
          <span style="font-size: 8.5pt; color: #64748b; font-weight: bold;">[이노비즈 평가지표 증빙철 편철용]</span>
        </td>
        <td style="width: 50%; border: none !important; vertical-align: top; text-align: right; padding: 0;">
          <table align="right" style="margin-left: auto; margin-right: 0; width: 195pt; border-collapse: collapse; text-align: center; font-size: 8.5pt;">
            <tr>
              <th rowspan="2" style="width: 22pt; background-color: #f1f5f9; border: 1pt solid #475569; padding: 2pt; font-weight: bold; vertical-align: middle;">결<br/>재</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt; background-color: #f8fafc; font-weight: bold;">기 안</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt; background-color: #f8fafc; font-weight: bold;">검 토</th>
              <th style="width: 57pt; border: 1pt solid #475569; padding: 3pt; background-color: #f8fafc; font-weight: bold;">승 인</th>
            </tr>
            <tr style="height: 36pt;">
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: bottom; color: #64748b; font-size: 8pt;">기안자</td>
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: bottom; color: #64748b; font-size: 8pt;">연구소장</td>
              <td style="border: 1pt solid #475569; padding: 2pt; vertical-align: middle; text-align: center; color: #64748b; font-size: 8pt;">
                ${
                  base64Seal
                    ? `<img src="${base64Seal}" style="width: 28px; height: 28px; vertical-align: middle;" />`
                    : '대표이사'
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <h1 style="font-size: 16pt; font-weight: bold; color: #1e3a8a; border-bottom: 2pt solid #1e40af; padding-bottom: 6pt; margin-top: 6pt;">${result.docTitle}</h1>
    
    <table style="width: 100% !important; table-layout: fixed; border-collapse: collapse; margin: 10pt 0 14pt 0; font-size: 9.5pt;">
      <tr>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">문서번호</th>
        <td style="width: 32%; border: 1pt solid #cbd5e1; padding: 5pt 7pt;">${result.docCode}</td>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">작성일자</th>
        <td style="width: 32%; border: 1pt solid #cbd5e1; padding: 5pt 7pt;">${today}</td>
      </tr>
      <tr>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">대상기업</th>
        <td style="width: 32%; border: 1pt solid #cbd5e1; padding: 5pt 7pt;">${company.companyName} (대표: ${company.ceoName})</td>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">소관부서</th>
        <td style="width: 32%; border: 1pt solid #cbd5e1; padding: 5pt 7pt;">기술연구소 / 품질보증팀</td>
      </tr>
      <tr>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">평가지표</th>
        <td colspan="3" style="border: 1pt solid #cbd5e1; padding: 5pt 7pt;">${result.innoBizDomain} &gt; <strong>${result.evalCriteriaCode}</strong></td>
      </tr>
      <tr>
        <th style="width: 18%; background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 5pt 7pt; text-align: left;">증빙그룹</th>
        <td colspan="3" style="border: 1pt solid #cbd5e1; padding: 5pt 7pt;">${result.matchedGroupTitle}</td>
      </tr>
    </table>

    <h2 style="font-size: 12pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt;">1. 핵심 요약</h2>
    <ul>
      ${result.executiveSummary.map((s) => `<li>${s}</li>`).join('')}
    </ul>
    
    <h2 style="font-size: 12pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt;">2. 이노비즈 심사원 소명 보고</h2>
    <div style="white-space: pre-wrap; line-height: 1.65;">${result.narrativeReport}</div>
    
    ${
      tableHtml
        ? `<h2 style="font-size: 12pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt;">3. 원본 엑셀 데이터 실적 집계표 (Table)</h2>
           <div style="width: 100% !important; max-width: 100% !important; overflow: hidden !important;">${tableHtml}</div>`
        : ''
    }
    <p style="margin-top: 25pt; padding-top: 10pt; border-top: 1pt solid #cbd5e1; text-align: right; font-weight: bold; font-size: 11pt;">${company.companyName} 대표이사 ${company.ceoName} (인)</p>
  </div>
  `;

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        }),
      ]);
    } catch (e) {
      // Fallback
      await navigator.clipboard.writeText(plainText);
    }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(plainText);
  }

  // Open Google Docs to create a brand new blank document
  window.open('https://docs.new', '_blank');
}
