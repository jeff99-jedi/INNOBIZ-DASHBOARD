import JSZip from 'jszip';
import { CompanyProfile, SelfAuditGuideItem } from '../types';
import { SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';

/**
 * Generates a clean text document representation of a single SelfAuditGuideItem
 * formatted exactly as shown in the UI screen.
 */
export function formatSingleItemText(
  item: SelfAuditGuideItem,
  company?: CompanyProfile,
  pageIndex?: number,
  totalPages?: number
): string {
  const lines: string[] = [];
  const divider = '='.repeat(78);
  const subDivider = '-'.repeat(78);

  const pageHeader = pageIndex && totalPages ? ` [페이지: ${pageIndex} / ${totalPages}]` : '';

  lines.push(divider);
  lines.push(`【 이노비즈(INNO-BIZ) 자가진단 항목별 실무 명세서 】${pageHeader}`);
  lines.push(divider);
  lines.push(`■ 대상 기업명 : ${company?.companyName || '(주)더한농'} (대표자: ${company?.ceoName || '대표이사'})`);
  lines.push(`■ 평가 대분야 : ${item.partName} (배점: ${item.points}점)`);
  lines.push(`■ 평가 중분류 : ${item.majorCategory}`);
  lines.push(`■ 지표 코드명 : [${item.evalItemCode}] ${item.evalItemName}`);
  lines.push(subDivider);
  lines.push('');

  // ★ 필요서류 목록 (1. [질문 개요 및 평가 목적] 바로 앞에 배치)
  lines.push('★ 필요서류 목록');
  if (item.requiredDocs && item.requiredDocs.length > 0) {
    item.requiredDocs.forEach((doc, idx) => {
      lines.push(`   - [필수 ${idx + 1}] ${doc}`);
    });
  } else {
    lines.push('   - 별도 제출 증빙 없음 (현장 실사 인터뷰 및 현물 점검)');
  }
  if (item.optionalDocs && item.optionalDocs.length > 0) {
    item.optionalDocs.forEach((doc, idx) => {
      lines.push(`   - [보조 ${idx + 1}] ${doc}`);
    });
  }
  lines.push(subDivider);
  lines.push('');

  // 1. 질문 개요 및 평가 목적
  lines.push('1. [질문 개요 및 평가 목적]');
  lines.push(`   Q. ${item.question}`);
  if (item.portalDescription) {
    lines.push('');
    lines.push(`   ※ 심사 개요 (공식 포털 해설):`);
    lines.push(`      ${item.portalDescription}`);
  }
  lines.push('');

  // 2. 포털 세부 체크항목 (다중 체크박스 문항인 경우)
  if (item.subChecklistItems && item.subChecklistItems.length > 0) {
    lines.push('2. [온라인 자가진단 세부 체크항목 (중복체크 기준)]');
    if (item.isNegativeChecklist) {
      lines.push('   * 주의: 결격/부정 항목 체크리스트 (0건 충족 시 최고 만점 부여)');
    }
    item.subChecklistItems.forEach((checkItem) => {
      lines.push(`   [  ] ${checkItem}`);
    });
    lines.push('');
  }

  // 3. 자가진단 채점 등급 및 배점 기준표 (A~E 등급)
  lines.push('3. [평가 등급 및 배점 기준 (모의 채점 기준표)]');
  item.options.forEach((opt) => {
    const isRecommended = opt.isRecommended ? ' ★[당사 권장]' : '';
    lines.push(`   - [${opt.grade}등급] (${opt.points}점 / ${opt.scoreRate}%): ${opt.optionLabel} ${opt.text}${isRecommended}`);
  });
  lines.push('');

  // 4. 현장실사 핵심 평가 기준 (Requirements)
  lines.push('4. [현장실사 핵심 평가 기준 (심사원 실사 착안사항)]');
  if (item.requirements && item.requirements.length > 0) {
    item.requirements.forEach((req, idx) => {
      lines.push(`   (${idx + 1}) ${req}`);
    });
  } else {
    lines.push('   - 별도 세부 요건 없음');
  }
  lines.push('');

  // 5. 전문가 실무 대응 및 가점 확보 전략 (Strategy)
  lines.push('5. [전문가 실무 대응 및 가점 확보 전략]');
  if (item.strategy && item.strategy.length > 0) {
    item.strategy.forEach((strat, idx) => {
      lines.push(`   • [전략 ${idx + 1}] ${strat}`);
    });
  } else {
    lines.push('   - 기본 규정 및 현장 상태 점검 필요');
  }
  lines.push('');

  // 6. 현장실사 필수 준비 서류철 (Required Docs)
  lines.push('6. [현장실사 필수 준비 서류철 및 구비 목록]');
  if (item.requiredDocs && item.requiredDocs.length > 0) {
    item.requiredDocs.forEach((doc, idx) => {
      lines.push(`   [필수 ${idx + 1}] ${doc}`);
    });
  }
  if (item.optionalDocs && item.optionalDocs.length > 0) {
    item.optionalDocs.forEach((doc, idx) => {
      lines.push(`   [보조/가점 ${idx + 1}] ${doc}`);
    });
  }
  lines.push('');

  // 7. 실무 팁 및 평가지침 상세
  if (item.practicalTip) {
    lines.push('7. [전문가 실무 팁 (현장 인터뷰 착안사항)]');
    lines.push(`   💡 ${item.practicalTip}`);
    lines.push('');
  }

  if (item.evaluationGuideline) {
    lines.push('8. [공식 평가지침 및 산출기준 (기술보증기금 매뉴얼 원문)]');
    lines.push(
      item.evaluationGuideline
        .split('\n')
        .map((l) => `   ${l}`)
        .join('\n')
    );
    lines.push('');
  }

  if (item.considerations) {
    lines.push('9. [평가 시 고려사항]');
    lines.push(
      item.considerations
        .split('\n')
        .map((l) => `   ${l}`)
        .join('\n')
    );
    lines.push('');
  }

  // 기업 현황 메모
  if (item.currentStatusNote) {
    lines.push('10. [기업 현황 및 대응 현황 메모]');
    lines.push(`   📌 ${item.currentStatusNote}`);
    lines.push('');
  }

  lines.push(divider);
  lines.push(`[작성 완료] ${company?.companyName || '기술혁신형 중소기업(Inno-Biz) 컨설팅'} | 생성일: ${new Date().toISOString().split('T')[0]}`);
  lines.push(divider);
  lines.push('');

  return lines.join('\n');
}

/**
 * Downloads a single text file in the browser
 */
export function triggerTextDownload(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Packages all 62 items into 62 individual .txt files and an index/combined summary file,
 * then triggers a single .zip download.
 */
export async function downloadAll62ItemsAsZip(
  company?: CompanyProfile,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const items = SELF_AUDIT_GUIDE_ITEMS;
  const total = items.length;

  // Folder structure by PART
  const partFolders: Record<string, JSZip> = {
    part1: zip.folder('1_기술혁신능력_15문항')!,
    part2: zip.folder('2_기술사업화능력_19문항')!,
    part3: zip.folder('3_기술혁신경영능력_15문항')!,
    part4: zip.folder('4_기술혁신성과_13문항')!,
  };

  const combinedAllPages: string[] = [];

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const pageNum = i + 1;
    const pageStr = String(pageNum).padStart(2, '0');

    // Individual item text
    const textContent = formatSingleItemText(item, company, pageNum, total);
    combinedAllPages.push(textContent);

    // Clean file name: "01_1.1-(1)_R&D_투자현황.txt"
    const safeCode = item.evalItemCode.replace(/[/\\?%*:|"<>]/g, '-');
    const safeName = item.evalItemName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    const fileName = `${pageStr}_${safeCode}_${safeName}.txt`;

    const targetFolder = partFolders[item.partId] || zip;
    targetFolder.file(fileName, '\uFEFF' + textContent);

    if (onProgress) {
      onProgress(pageNum, total);
    }
  }

  // Also add a full combined master file (모든 62개 페이지 통합본)
  const masterTitle = `【 이노비즈 기술평가 62개 전체 자가진단 항목 총괄 전문 】\n대상기업: ${company?.companyName || '(주)더한농'}\n생성일자: ${new Date().toISOString().split('T')[0]}\n\n` +
    '='.repeat(78) + '\n\n' +
    combinedAllPages.join('\n\n\n' + '='.repeat(78) + '\n\n\n');

  zip.file('00_이노비즈_자가진단_62개항목_전체통합본.txt', '\uFEFF' + masterTitle);

  // Readme/Index file
  const indexLines: string[] = [
    '==============================================================================',
    '       이노비즈(INNO-BIZ) 기술혁신인증 62개 자가진단 항목 개별 텍스트 문서집',
    '==============================================================================',
    `대상기업: ${company?.companyName || '(주)더한농'} (대표자: ${company?.ceoName || '대표이사'})`,
    `발행일시: ${new Date().toLocaleString('ko-KR')}`,
    `총 문항수: 62문항 (1,000점 만점)`,
    `※ 중요: 모든 개별 파일 상단 [질문 개요 및 평가 목적] 바로 앞에 [★ 필요서류 목록]이 명시되어 있어 실사 준비 서류를 즉시 대조 점검할 수 있습니다.`,
    '',
    '[폴더 구성 안내]',
    '1. 1_기술혁신능력_15문항 : R&D 투자현황, 연구인력, 연구조직 및 지식재산권 (300점)',
    '2. 2_기술사업화능력_19문항 : 신제품기획, 개발공정, 품질관리, 판로 및 마케팅 (300점)',
    '3. 3_기술혁신경영능력_15문항 : 대표자 리더십, 조직관리, 윤리/ESG, 재무투명성 (200점)',
    '4. 4_기술혁신성과_13문항 : 기술 및 시장경쟁력, 매출성장성, 일자리 창출 (200점)',
    '5. 00_이노비즈_자가진단_62개항목_전체통합본.txt : 62개 전체 항목 1권 통합본',
    '',
    '[항목별 파일 목록 (총 62개)]',
    ...items.map((item, idx) => `${String(idx + 1).padStart(2, '0')}. [${item.evalItemCode}] ${item.evalItemName} (${item.points}점) - ${item.partName}`),
  ];
  zip.file('README_이노비즈_62개항목_안내.txt', '\uFEFF' + indexLines.join('\n'));

  // Generate zip
  const blob = await zip.generateAsync({ type: 'blob' });
  const companyNameSafe = (company?.companyName || '더한농').replace(/[/\\?%*:|"<>]/g, '');
  const zipFileName = `이노비즈_자가진단_62개항목_개별문서집_${companyNameSafe}_${new Date().toISOString().split('T')[0]}.zip`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
