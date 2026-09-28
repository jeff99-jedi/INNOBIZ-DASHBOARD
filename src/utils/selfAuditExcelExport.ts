import * as XLSX from 'xlsx';
import { CompanyProfile, SelfAuditGuideItem } from '../types';
import { SELF_AUDIT_PARTS, SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';

/**
 * Interface for Common Document Item
 */
export interface CommonDocumentItem {
  no: number;
  category: string;
  docName: string;
  isRequired: '필수' | '선택' | '해당시 필수' | '선택 (가점)' | string;
  issuer: string;
  validPeriod: string;
  purpose: string;
  note: string;
}

/**
 * Standard InnoBiz Common Documents List (기본 공통서류 총 32종)
 */
export const INNOBIZ_COMMON_DOCUMENTS: CommonDocumentItem[] = [
  // 1. 기업 기본 및 법적 자격 (6종)
  {
    no: 1,
    category: '1. 기업 기본 및 자격',
    docName: '사업자등록증명원 (최근 1개월 이내 발급본)',
    isRequired: '필수',
    issuer: '국세청 홈택스',
    validPeriod: '발급일로부터 1개월 이내',
    purpose: '사업자등록 유효성, 법인명, 대표자, 업태·종목, 본점 및 공장 소재지 일치 여부 확인',
    note: '공동대표인 경우 모든 대표자 성명 확인 필요',
  },
  {
    no: 2,
    category: '1. 기업 기본 및 자격',
    docName: '법인등기부등본 (말소사항 포함 전부사항증명서)',
    isRequired: '필수',
    issuer: '대법원 인터넷등기소',
    validPeriod: '발급일로부터 3개월 이내',
    purpose: '법인 존속성, 목적사업, 임원 현황, 자본금 변동, 본점·지점 주소 확인',
    note: '말소사항이 반드시 포함되어야 함',
  },
  {
    no: 3,
    category: '1. 기업 기본 및 자격',
    docName: '주주명부확인원 (대표자 및 법인인감 날인)',
    isRequired: '필수',
    issuer: '회사 자체 발급 (공인회계사/세무사 확인)',
    validPeriod: '최근 결산기 기준일',
    purpose: '최대주주 및 특수관계인 지분율, 경영권 안정성, 지배구조 확인',
    note: '법인인감 및 명판 날인 필수',
  },
  {
    no: 4,
    category: '1. 기업 기본 및 자격',
    docName: '법인인감증명서 및 사용인감계',
    isRequired: '필수',
    issuer: '등기소 (사용인감계: 회사 자체)',
    validPeriod: '발급일로부터 3개월 이내',
    purpose: '현장실사 계약서류 및 평가확인서 서명·날인 대조 확인',
    note: '원인감과 사용인감 대조 날인',
  },
  {
    no: 5,
    category: '1. 기업 기본 및 자격',
    docName: '대표자 이력서 및 신분증 사본 (동종업종 경력 증빙 포함)',
    isRequired: '필수',
    issuer: '대표자 본인 / 회사',
    validPeriod: '현장실사일 기준',
    purpose: '경영자 역량, 동종업종 기술·경영 경력(10~15년 이상 가점), 전문성 심사',
    note: '전 직장 경력증명서 또는 건강보험 자격득실확인서 첨부',
  },
  {
    no: 6,
    category: '1. 기업 기본 및 자격',
    docName: '회사소개서 및 기업 조직도 (부서별 직무분장표)',
    isRequired: '필수',
    issuer: '회사 자체',
    validPeriod: '최신 개정본',
    purpose: '기업 비전, 주력제품 소개, 연구/생산/영업/관리 조직 구조 및 담당 업무 파악',
    note: '직책별 실무자 및 연구원 구분 명시',
  },

  // 2. 재무·세무 및 신용평가 (5종)
  {
    no: 7,
    category: '2. 재무·세무 및 신용',
    docName: '최근 3개년 표준재무제표증명원 (재무상태표, 손익계산서, 제조원가명세서, 이익잉여금처분계산서)',
    isRequired: '필수',
    issuer: '국세청 홈택스 (세무대리인)',
    validPeriod: '최근 3개 사업연도 (2022~2024 결산)',
    purpose: '매출성장성, 영업이익률, 부채비율, R&D 투자비율 산출 및 재무 건전성 평가',
    note: '국세청 바코드 인쇄본 (세무조정계산서 부속명세서 포함)',
  },
  {
    no: 8,
    category: '2. 재무·세무 및 신용',
    docName: '부가가치세 과세표준증명원 (최근 1개년 또는 3개년 분기별)',
    isRequired: '필수',
    issuer: '국세청 홈택스',
    validPeriod: '직전 분기까지',
    purpose: '신청일 현재 최신 매출 실적 및 매출 누락 여부 검증',
    note: '분기별 매출 추이 확인용',
  },
  {
    no: 9,
    category: '2. 재무·세무 및 신용',
    docName: '국세 완납증명서 (납세증명서)',
    isRequired: '필수',
    issuer: '국세청 홈택스',
    validPeriod: '유효기간 내 (통상 30일)',
    purpose: '법인세, 부가세 등 국세 체납 여부 확인 (체납 시 인증 불가)',
    note: '현장실사일 기준으로 유효기간 확인 필수',
  },
  {
    no: 10,
    category: '2. 재무·세무 및 신용',
    docName: '지방세 완납증명서 (지방세 납세증명서)',
    isRequired: '필수',
    issuer: '위택스 / 정부24 / 주민센터',
    validPeriod: '유효기간 내 (통상 30일)',
    purpose: '취득세, 주민세 등 지방세 체납 여부 확인',
    note: '유효기간 준수',
  },
  {
    no: 11,
    category: '2. 재무·세무 및 신용',
    docName: '기업신용평가등급 확인서 (공공기관/금융권 제출용)',
    isRequired: '필수',
    issuer: 'NICE평가정보, 한국평가데이터, SCI 등',
    validPeriod: '유효기간 내 (보통 1년)',
    purpose: '기업 재무위험 및 현금흐름(CR 등급) 평가, 부실위험 심사 (BBB 이상 우수)',
    note: '자가진단 PART 4 신용평가 배점 항목 필수 매핑',
  },

  // 3. 연구개발 조직 및 전담인력 (6종)
  {
    no: 12,
    category: '3. R&D 조직 및 인력',
    docName: '기업부설연구소 (또는 연구개발전담부서) 인정서 사본',
    isRequired: '필수',
    issuer: '한국산업기술진흥협회 (KOITA)',
    validPeriod: '최신 변경사항 반영본',
    purpose: '연구조직 공식 인가 여부, 연구소 소재지 및 설립 연월일 확인',
    note: '변경신고(연구원, 면적) 누락 여부 사전 점검 필수',
  },
  {
    no: 13,
    category: '3. R&D 조직 및 인력',
    docName: '연구전담요원 명부 및 4대 사회보험 사업장 가입자 명부',
    isRequired: '필수',
    issuer: '4대사회보험정보연계센터 / KOITA 등록명부',
    validPeriod: '현장실사 신청 당월 발급본',
    purpose: '연구전담요원 정규직 상시근무 확인 및 전체 직원 대비 연구원 비율(%) 산출',
    note: 'KOITA 등록 연구원과 4대보험 가입자 명부 성명 대조',
  },
  {
    no: 14,
    category: '3. R&D 조직 및 인력',
    docName: '연구원 최종 학위증명서(졸업증명서) 및 경력증명서',
    isRequired: '필수',
    issuer: '각 대학 / 출신 연구기관',
    validPeriod: '상시 유효',
    purpose: '연구인력 학력 구성(석·박사 및 학사 비율)과 기술분야 연구경력(년수) 평가',
    note: '외국 학위의 경우 아포스티유 또는 공증본',
  },
  {
    no: 15,
    category: '3. R&D 조직 및 인력',
    docName: '연구소 평면도 및 연구전담구역 현장 사진',
    isRequired: '필수',
    issuer: '회사 자체 / KOITA 신고 도면',
    validPeriod: '현재 상태',
    purpose: '연구소 독립공간(사방 벽체 및 출입문 분리), 연구현판, 연구기자재 배치 실사 확인',
    note: '출입통제 보안장치(지문/도어락) 설치 사진 구비',
  },
  {
    no: 16,
    category: '3. R&D 조직 및 인력',
    docName: '연구개발비 비목별 집계표 및 계정별 회계원장',
    isRequired: '필수',
    issuer: '회사 재무팀 / 세무대리인',
    validPeriod: '최근 3개년 결산기',
    purpose: '인건비, 재료비, 위탁연구비, 시험검사비 등 R&D 회계 처리의 적격성 입증',
    note: '국세청 연구·인력개발비 세액공제 사전심사 증빙과 일치 요망',
  },
  {
    no: 17,
    category: '3. R&D 조직 및 인력',
    docName: '연구원 연구노트 및 연간 연구개발 계획서/완료보고서',
    isRequired: '필수',
    issuer: '기업부설연구소',
    validPeriod: '프로젝트별 상시',
    purpose: '기술개발 연구의 지속성, 기술 축적도 및 개발 프로세스 준수 여부 심사',
    note: '서명 및 작성일자가 기재된 연구노트 2권 이상 실물 비치',
  },

  // 4. 지식재산권 및 기술자료 (5종)
  {
    no: 18,
    category: '4. 지식재산권 및 기술보호',
    docName: '법인명의 특허·실용신안·디자인 등록원부 및 등록증 사본',
    isRequired: '필수',
    issuer: '특허청 (키프리스 발급)',
    validPeriod: '최근 1개월 이내 발급 등록원부',
    purpose: '권리자(법인) 유효성, 권리 소멸 여부, 실시권 설정 여부 및 최근 등록건수 산정',
    note: '대표자 개인명의 특허인 경우 법인 전용실시권 계약서 첨부 필수',
  },
  {
    no: 19,
    category: '4. 지식재산권 및 기술보호',
    docName: '특허 공보 전문 및 핵심 청구항 요약서 (주력제품 매핑표)',
    isRequired: '필수',
    issuer: '특허청 공보 / 특허법률사무소',
    validPeriod: '등록시점',
    purpose: '보유 특허 기술이 실제 양산 판매 중인 주력제품에 직접 적용되었는지 검증',
    note: '특허-제품 매핑 실적 분석표 작성 권장',
  },
  {
    no: 20,
    category: '4. 지식재산권 및 기술보호',
    docName: '지식재산권 총괄 관리대장 및 연차등록료 납부 영수증',
    isRequired: '필수',
    issuer: '회사 자체 / 특허청',
    validPeriod: '현재 기준',
    purpose: '사내 IP 자산 관리 체계성 및 등록료 미납에 따른 권리소멸 방지 체계 확인',
    note: '출원중, 등록, 거절 이력 총괄 관리',
  },
  {
    no: 21,
    category: '4. 지식재산권 및 기술보호',
    docName: '기술자료 임치증(TDB) 사본 또는 핵심 영업비밀 보호 서약서',
    isRequired: '선택 (가점)',
    issuer: '대중소기업농어업협력재단 / 사내 보안규정',
    validPeriod: '임치 계약 유효기간 내',
    purpose: '핵심 제조 레시피, 공정 기술, 소스코드의 안전한 기술유출 방지 체계 심사',
    note: '협력재단 기술임치 시 보안성 가점 획득',
  },
  {
    no: 22,
    category: '4. 지식재산권 및 기술보호',
    docName: '산학연 공동연구개발 협약서(MOU) 및 정부 R&D 과제 성공 판정 공문',
    isRequired: '선택 (가점)',
    issuer: '대학, 정부출연연구기관, 전문연구기관, 중기부',
    validPeriod: '협약 기간 및 판정 후',
    purpose: '오픈 이노베이션(외부 협력체계) 및 정부 기술개발 사업 수행 역량 평가',
    note: '공동 특허 출원 또는 위탁연구 계약서 포함',
  },

  // 5. 생산시설 및 품질·인증 (5종)
  {
    no: 23,
    category: '5. 생산시설 및 품질인증',
    docName: '공장등록증명원 (또는 임대차계약서 및 건축물관리대장)',
    isRequired: '필수',
    issuer: '지자체 (시·군·구청 산업단지공단) / 정부24',
    validPeriod: '최근 1개월 이내 발급본',
    purpose: '제조시설 유효성, 자가공장 여부, 제조설비 면적 및 환경 인허가 확인',
    note: '제조업 특화 평가 항목의 필수 확인 서류',
  },
  {
    no: 24,
    category: '5. 생산시설 및 품질인증',
    docName: '주요 생산설비 및 연구·시험 계측기 관리대장',
    isRequired: '필수',
    issuer: '생산팀 / 공장 품질관리부서',
    validPeriod: '현재 보유 설비 기준',
    purpose: '주요 제조장비명, 제조사, 취득일, 취득가액, 설비 가동률 및 유지보수 이력 점검',
    note: '설비 사진 및 현물 라벨 부착 점검',
  },
  {
    no: 25,
    category: '5. 생산시설 및 품질인증',
    docName: '정밀 계측기 및 검사장비 검·교정 성적서 (공인기관 발급)',
    isRequired: '필수',
    issuer: '한국표준과학연구원(KRISS), 공인 교정기관',
    validPeriod: '교정 유효기간 내 (통상 1년)',
    purpose: '측정 신뢰성, 품질 오차 관리, 계측기 교정주기 준수 여부 심사',
    note: '만료 예정 장비는 사전 재교정 필수',
  },
  {
    no: 26,
    category: '5. 생산시설 및 품질인증',
    docName: '주력제품 시험성적서 및 공인인증서 (KOLAS 또는 국가공인기관)',
    isRequired: '필수',
    issuer: 'KTR, KCL, FITI, 농촌진흥청 등 공인시험기관',
    validPeriod: '최근 1~2년 이내',
    purpose: '제품 품질 기준(성분, 약효, 약해, 안전성, 규격) 부합성 실증',
    note: '주력 제품별 1건 이상 구비 권장',
  },
  {
    no: 27,
    category: '5. 생산시설 및 품질인증',
    docName: '경영시스템 및 품질인증서 (ISO 9001, ISO 14001, 친환경농자재인증, HACCP 등)',
    isRequired: '선택 (가점)',
    issuer: '공인 인증기관',
    validPeriod: '인증 유효기간 내',
    purpose: '품질경영시스템 준수 및 환경경영 이행 수준 평가 (인증별 3~5점 가점)',
    note: '사후 심사 이력 확인서 구비',
  },

  // 6. 사내 표준 규정집 (당사 시스템 탑재 8종) (5종)
  {
    no: 28,
    category: '6. 사내 표준 규정집',
    docName: '[STD-HR-001] 직무발명보상규정 및 보상금 지급 지침',
    isRequired: '필수',
    issuer: '사내 표준 (인사/연구소 제정)',
    validPeriod: '제정 및 최근 개정본',
    purpose: '발명진흥법 제15조 준수, 출원/등록/실시 보상금 지급 기준 및 심의위원회 운영 확인',
    note: '이노비즈 평가 1.2 지표 만점 획득 필수 서류',
  },
  {
    no: 29,
    category: '6. 사내 표준 규정집',
    docName: '[STD-RD-002] 중장기 기술개발 로드맵 (TRM 2025~2028)',
    isRequired: '필수',
    issuer: '사내 표준 (기업부설연구소)',
    validPeriod: '3~5개년 로드맵',
    purpose: '목표 시장 분석, 제품별 R&D 개발 일정, 소요예산 및 연차별 마일스톤 체계 심사',
    note: '이노비즈 평가 1.1 지표 핵심 심사 서류',
  },
  {
    no: 30,
    category: '6. 사내 표준 규정집',
    docName: '[STD-QA-003] 신제품 개발 표준 프로세스 규정 (Gate-Stage 개발 매뉴얼)',
    isRequired: '필수',
    issuer: '사내 표준 (연구기획 / 품질관리)',
    validPeriod: '사내 표준',
    purpose: '기획-타당성검토-연구개발-시험생산-양산-출시 단계별 검토 및 의사결정 체계 입증',
    note: '이노비즈 평가 PART 2 만점 획득 필수 서류',
  },
  {
    no: 31,
    category: '6. 사내 표준 규정집',
    docName: '[STD-MG-005] 대표이사 기술혁신 경영철학 및 연간 경영방침 선언서',
    isRequired: '필수',
    issuer: '사내 표준 (대표이사 주관)',
    validPeriod: '당해연도 선언서',
    purpose: '경영자의 R&D 혁신의지, 전사 공유체계, 기술개발 중시 조직문화 심사',
    note: '이노비즈 평가 PART 3 리더십 핵심 심사 서류',
  },
  {
    no: 32,
    category: '6. 사내 표준 규정집',
    docName: '[STD-SOP-007] 기술연구소 표준작업지침서 (작물보호제 생물검정 SOP 매뉴얼)',
    isRequired: '필수',
    issuer: '사내 표준 (기업부설연구소)',
    validPeriod: '개정 관리본',
    purpose: '시험검사 절차 표준화, 실험 데이터 신뢰성 확보, 표준 프로세스 준수 입증',
    note: '이노비즈 평가 1.3 지표 현장 실사 대조 서류',
  },
];

/**
 * Builds the complete Excel workbook data structures
 */
export function buildInnoBizSelfAuditWorkbook(company?: CompanyProfile): XLSX.WorkBook {
  const companyName = company?.companyName || '(주)더한농';
  const ceoName = company?.ceoName || '대표이사';
  const currentDate = new Date().toISOString().split('T')[0];

  const wb = XLSX.utils.book_new();

  // =========================================================================
  // SHEET 1: 자가진단 62개 항목별 필요서류 목록
  // =========================================================================
  const sheet1Data: any[][] = [];

  // Title & Header info
  sheet1Data.push([`【 기술혁신형 중소기업(INNO-BIZ) 자가진단 62개 항목별 필요서류 명세표 】`]);
  sheet1Data.push([
    `대상기업: ${companyName}`,
    `대표자: ${ceoName}`,
    `생성일자: ${currentDate}`,
    `총 문항: 62개 문항 (총점: 1,000점)`,
  ]);
  sheet1Data.push([]); // blank line

  // Column Headers
  sheet1Data.push([
    '순번',
    '대분류 (PART)',
    '중분류',
    '지표코드',
    '평가 항목명',
    '배점 (점)',
    '★ 필수 준비서류 목록 (현장제출 필수)',
    '★ 보조 및 가점 증빙서류',
    '필수 서류수',
    '보조 서류수',
    '총 서류수',
    '자가진단 질문 개요 (질문 내용)',
    '현장실사 심사원 핵심 착안사항',
    '전문가 가점 확보 전략',
    '권장 등급',
    '권장 점수',
  ]);

  SELF_AUDIT_GUIDE_ITEMS.forEach((item, index) => {
    const requiredDocsText =
      item.requiredDocs && item.requiredDocs.length > 0
        ? item.requiredDocs.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n')
        : '별도 제출서류 없음 (현장 면담/상태 점검)';

    const optionalDocsText =
      item.optionalDocs && item.optionalDocs.length > 0
        ? item.optionalDocs.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n')
        : '-';

    const reqCount = item.requiredDocs ? item.requiredDocs.length : 0;
    const optCount = item.optionalDocs ? item.optionalDocs.length : 0;
    const totalCount = reqCount + optCount;

    const reqsText =
      item.requirements && item.requirements.length > 0
        ? item.requirements.map((r, idx) => `(${idx + 1}) ${r}`).join('\n')
        : '-';

    const stratText =
      item.strategy && item.strategy.length > 0
        ? item.strategy.map((s, idx) => `• ${s}`).join('\n')
        : '-';

    const recOpt = item.options.find((o) => o.isRecommended) || item.options[0];
    const recGrade = recOpt ? `${recOpt.grade}등급` : 'A등급';
    const recPoints = recOpt ? `${recOpt.points}점` : `${item.points}점`;

    sheet1Data.push([
      index + 1,
      item.partName,
      item.majorCategory,
      item.evalItemCode,
      item.evalItemName,
      item.points,
      requiredDocsText,
      optionalDocsText,
      reqCount,
      optCount,
      totalCount,
      item.question,
      reqsText,
      stratText,
      recGrade,
      recPoints,
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Column widths for Sheet 1
  ws1['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 22 }, // 대분류
    { wch: 20 }, // 중분류
    { wch: 10 }, // 지표코드
    { wch: 28 }, // 평가 항목명
    { wch: 10 }, // 배점
    { wch: 48 }, // 필수 준비서류
    { wch: 38 }, // 보조/가점 서류
    { wch: 11 }, // 필수 서류수
    { wch: 11 }, // 보조 서류수
    { wch: 11 }, // 총 서류수
    { wch: 46 }, // 질문 개요
    { wch: 46 }, // 심사원 착안사항
    { wch: 46 }, // 전략
    { wch: 11 }, // 권장등급
    { wch: 11 }, // 권장점수
  ];

  XLSX.utils.book_append_sheet(wb, ws1, '항목별_필요서류_62개');

  // =========================================================================
  // SHEET 2: 이노비즈 공통구비서류 목록
  // =========================================================================
  const sheet2Data: any[][] = [];

  sheet2Data.push([`【 기술혁신형 중소기업(INNO-BIZ) 인증 신청 필수 공통서류 총괄 목록 】`]);
  sheet2Data.push([
    `대상기업: ${companyName}`,
    `대표자: ${ceoName}`,
    `생성일자: ${currentDate}`,
    `공통서류 총 ${INNOBIZ_COMMON_DOCUMENTS.length}종 (기업기본·재무·R&D·지식재산·생산인증·사내표준규정)`,
  ]);
  sheet2Data.push([]);

  sheet2Data.push([
    '순번',
    '서류 대분류',
    '구비 서류명',
    '필수 여부',
    '발급처 / 작성주체',
    '유효기간 및 기준일',
    '주요 용도 및 심사원 확인 포인트',
    '실무 준비 팁 및 비고',
  ]);

  INNOBIZ_COMMON_DOCUMENTS.forEach((doc) => {
    sheet2Data.push([
      doc.no,
      doc.category,
      doc.docName,
      doc.isRequired,
      doc.issuer,
      doc.validPeriod,
      doc.purpose,
      doc.note,
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);

  ws2['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 22 }, // 서류 대분류
    { wch: 42 }, // 구비 서류명
    { wch: 12 }, // 필수 여부
    { wch: 24 }, // 발급처
    { wch: 24 }, // 유효기간
    { wch: 55 }, // 주요 용도
    { wch: 38 }, // 실무 팁
  ];

  XLSX.utils.book_append_sheet(wb, ws2, '이노비즈_공통구비서류_목록');

  // =========================================================================
  // SHEET 3: 서류별 역추적 매트릭스 (어떤 서류가 몇 개 항목에 쓰이는가?)
  // =========================================================================
  // Extract all unique docs from the 62 items and count occurrences
  const docMap = new Map<string, { codes: string[]; names: string[]; parts: Set<string> }>();

  SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
    const allDocs = [...item.requiredDocs, ...(item.optionalDocs || [])];
    allDocs.forEach((doc) => {
      const cleanDoc = doc.trim();
      if (!cleanDoc) return;
      if (!docMap.has(cleanDoc)) {
        docMap.set(cleanDoc, { codes: [], names: [], parts: new Set() });
      }
      const entry = docMap.get(cleanDoc)!;
      entry.codes.push(item.evalItemCode);
      entry.names.push(item.evalItemName);
      entry.parts.add(item.partName);
    });
  });

  const sortedUniqueDocs = Array.from(docMap.entries()).sort(
    (a, b) => b[1].codes.length - a[1].codes.length
  );

  const sheet3Data: any[][] = [];
  sheet3Data.push([`【 자가진단 항목별 구비서류 역추적 매트릭스 (서류 중심 매핑) 】`]);
  sheet3Data.push([
    `대상기업: ${companyName}`,
    `생성일자: ${currentDate}`,
    `※ 62개 자가진단 문항에서 요구되는 고유 서류 ${sortedUniqueDocs.length}종의 활용 빈도 및 대응 매핑표입니다.`,
  ]);
  sheet3Data.push([]);

  sheet3Data.push([
    '순번',
    '증빙 서류명',
    '요구 항목 수 (빈도)',
    '해당 평가 부문',
    '관련 지표 코드 목록',
    '관련 평가 항목명 목록',
    '주관 부서 (권장)',
    '실사 보관 바인더 번호 (추천)',
  ]);

  sortedUniqueDocs.forEach(([docName, info], idx) => {
    // Recommend department based on doc keywords
    let dept = '인사총무팀';
    if (docName.includes('연구') || docName.includes('R&D') || docName.includes('특허') || docName.includes('도면') || docName.includes('실험') || docName.includes('생물검정') || docName.includes('TRM')) {
      dept = '기업부설연구소 / 연구개발팀';
    } else if (docName.includes('재무') || docName.includes('손익') || docName.includes('세무') || docName.includes('원장') || docName.includes('결산') || docName.includes('자산')) {
      dept = '재무회계팀';
    } else if (docName.includes('공장') || docName.includes('생산') || docName.includes('설비') || docName.includes('교정') || docName.includes('작업') || docName.includes('품질') || docName.includes('검사')) {
      dept = '생산공장 / 품질관리팀';
    } else if (docName.includes('매출') || docName.includes('고객') || docName.includes('시장') || docName.includes('마케팅') || docName.includes('수출') || docName.includes('계약')) {
      dept = '영업마케팅팀';
    }

    sheet3Data.push([
      idx + 1,
      docName,
      `${info.codes.length}개 항목`,
      Array.from(info.parts).join(', '),
      info.codes.join(', '),
      info.names.join(' / '),
      dept,
      `바인더 [${dept.split(' ')[0]}]`,
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);

  ws3['!cols'] = [
    { wch: 6 },  // 순번
    { wch: 38 }, // 증빙 서류명
    { wch: 16 }, // 요구 항목 수
    { wch: 28 }, // 해당 평가 부문
    { wch: 28 }, // 관련 지표 코드 목록
    { wch: 48 }, // 관련 항목명
    { wch: 24 }, // 주관 부서
    { wch: 20 }, // 보관 바인더
  ];

  XLSX.utils.book_append_sheet(wb, ws3, '서류별_역추적_매트릭스');

  // =========================================================================
  // SHEET 4: 4대부문 총괄 요약표
  // =========================================================================
  const sheet4Data: any[][] = [];

  sheet4Data.push([`【 기술혁신형 중소기업(INNO-BIZ) 4대 평가부문 총괄 요약표 】`]);
  sheet4Data.push([
    `대상기업: ${companyName}`,
    `대표자: ${ceoName}`,
    `생성일자: ${currentDate}`,
  ]);
  sheet4Data.push([]);

  sheet4Data.push([
    '부문 번호',
    '평가 부문명',
    '항목 수 (문항)',
    '총 배점 (점)',
    '배점 비중 (%)',
    '필수 서류 건수',
    '보조 서류 건수',
    '합격 기준선 (최소요구점수)',
    '당사 권장 목표점수',
    '평가 핵심 초점',
  ]);

  let totalItemsCount = 0;
  let totalPointsCount = 0;
  let totalReqDocsCount = 0;
  let totalOptDocsCount = 0;
  let totalTargetScore = 0;

  SELF_AUDIT_PARTS.forEach((part) => {
    const partItems = SELF_AUDIT_GUIDE_ITEMS.filter((it) => it.partId === part.partId);
    const itemCount = partItems.length;
    const points = part.totalPoints;
    const reqCount = partItems.reduce((acc, it) => acc + (it.requiredDocs?.length || 0), 0);
    const optCount = partItems.reduce((acc, it) => acc + (it.optionalDocs?.length || 0), 0);

    // Calculate target recommended points
    const targetPoints = partItems.reduce((acc, it) => {
      const rec = it.options.find((o) => o.isRecommended) || it.options[0];
      return acc + (rec?.points || it.points);
    }, 0);

    totalItemsCount += itemCount;
    totalPointsCount += points;
    totalReqDocsCount += reqCount;
    totalOptDocsCount += optCount;
    totalTargetScore += targetPoints;

    sheet4Data.push([
      `PART ${part.partNumber}`,
      part.partName,
      itemCount,
      points,
      `${((points / 1000) * 100).toFixed(0)}%`,
      reqCount,
      optCount,
      `${Math.round(points * 0.7)}점 (70%)`,
      `${targetPoints}점 (${Math.round((targetPoints / points) * 100)}%)`,
      part.description,
    ]);
  });

  // Summary Row
  sheet4Data.push([
    '합계 (총괄)',
    '4대 부문 종합',
    totalItemsCount,
    totalPointsCount,
    '100%',
    totalReqDocsCount,
    totalOptDocsCount,
    '700점 (현장실사 통과 기준)',
    `${totalTargetScore}점 (A등급 확보 목표)`,
    '종합 평점 700점 이상 및 개별기술평가 B등급 이상 시 최종 인증 획득',
  ]);

  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);

  ws4['!cols'] = [
    { wch: 12 }, // 부문 번호
    { wch: 26 }, // 평가 부문명
    { wch: 14 }, // 항목 수
    { wch: 14 }, // 총 배점
    { wch: 12 }, // 배점 비중
    { wch: 14 }, // 필수 서류 건수
    { wch: 14 }, // 보조 서류 건수
    { wch: 22 }, // 합격 기준선
    { wch: 22 }, // 당사 권장 목표점수
    { wch: 45 }, // 평가 핵심 초점
  ];

  XLSX.utils.book_append_sheet(wb, ws4, '4대부문_총괄요약');

  return wb;
}

/**
 * Generates an Excel Blob for client-side download or saving
 */
export function generateSelfAuditExcelBlob(company?: CompanyProfile): Blob {
  const wb = buildInnoBizSelfAuditWorkbook(company);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Triggers direct browser download of the complete Excel file
 */
export function downloadSelfAuditExcelFile(company?: CompanyProfile): string {
  const companyNameSafe = (company?.companyName || '더한농').replace(/[/\\?%*:|"<>]/g, '');
  const fileName = `이노비즈_자가진단_항목별_필요서류_및_공통서류_목록_${companyNameSafe}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const blob = generateSelfAuditExcelBlob(company);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}
