export type InnoBizCategory = 
  | 'tech_innovation'      // 1. 기술혁신 능력
  | 'tech_commercialize'   // 2. 기술사업화 능력
  | 'tech_management'      // 3. 기술혁신 경영능력
  | 'tech_performance'     // 4. 기술혁신 성과
  | 'custom';              // 맞춤/신규 생성 그룹

export type DocumentStatus = 'pending' | 'in_progress' | 'review' | 'completed';

export interface DocumentAttachment {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  fileType: string;
  dataUrl?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  code?: string; // e.g. "1.1-(1)", "2.1~2.3"
  sectionNumber?: string; // "1", "2", "3", "4"
  majorCategory?: string; // 대항목 (예: "1. R&D 활동지표")
  evalItem?: string; // 평가항목 (예: "1.1 R&D 투자현황 (1) R&D(기술개발) 투자비율")
  points?: number; // 배점 (예: 30, 113)
  currentStatus?: string; // 현황 (예: "2.08%", "2024년 매출 133.5억 / 순이익 6.7억")
  evidenceDocNames?: string[]; // 주요 증빙 자료 목록
  isRequired: boolean;
  status: DocumentStatus;
  formatGuide: string;
  attachments?: DocumentAttachment[];
  notes?: string;
  updatedAt: string;
}

export interface CompanyProfile {
  companyName: string; // 회사명
  ceoName: string; // 대표자명
  bizNumber: string; // 사업자등록번호
  corpNumber?: string; // 법인등록번호
  establishedDate: string; // 설립연월일
  address: string; // 사업장 소재지
  industry: string; // 업종 (예: 제조업 / 정밀 전자기기)
  mainProduct: string; // 주력 제품명
  coreTechnology: string; // 핵심 기술명
  targetMarket: string; // 주요 목표 시장 / 거래처
  rndCenterName: string; // 기업부설연구소(전담부서) 명칭
  rndCenterRegNo: string; // 연구소 인정번호
  email?: string; // 전자우편주소
  taxOffice?: string; // 관할 세무서
  
  // 지표 연계 수치
  salesRevenue: string; // 최근년도 매출액 (예: 133.5억원)
  netIncome: string; // 당기순이익 (예: 6.7억원)
  rndRatio: string; // R&D 투자비율 (예: 2.08%)
  rndAmount: string; // 연구개발비 (예: 2.78억원)
  techPersonnelRatio: string; // 기술인력 비율 (예: 28.57%)
  techPersonnelCount: string; // 기술인력 수 (예: 8명 / 전체 28명)
  ceoIndustryExperience: string; // 대표자 동업종 경력 (예: 15년)
  patentCount: string; // 보유 특허 수 (예: 등록 2건, 출원 1건)
  importSubstitutionRatio: string; // 수입대체 효과 (예: 30%)

  // 브랜딩 및 서명
  logoUrl?: string; // 회사 로고 이미지 (Base64)
  sealUrl?: string; // 직인/도장 이미지 (Base64)
}

export interface InnoBizFactoryItem {
  id: string;
  type: 'domestic' | 'overseas';
  name: string;
  postcode: string;
  address: string;
  detailAddress: string;
}

export interface InnoBizProductItem {
  id: string;
  name: string;
  summary: string;
  exportCountry: string;
  exportAmount: string;
}

export interface FinancialYearData {
  year: string;
  salesRevenue: number;
  currentAssets: number;
  inventoryAssets: number;
  currentLiabilities: number;
  totalAssets: number;
  netIncome: number;
  operatingIncome: number;
  borrowings: number;
  tradeReceivables: number;
  developmentCostIncrease: number;
  rdExpensesIncomeStmt: number;
  developmentAmortization: number;
  rdExpensesMfgCost: number;
  totalEmployees: number;
  rndEmployees: number;
}

export interface InnoBizApplicationData {
  factories: InnoBizFactoryItem[];
  products: InnoBizProductItem[];
  currentYear: FinancialYearData;
  previousYear: FinancialYearData;
}

export interface DocumentGroup {
  id: string;
  title: string;
  category: InnoBizCategory;
  categoryName: string;
  majorCategory?: string; // 대항목
  totalPoints?: number; // 그룹 배점 합계
  description: string;
  department: string;
  manager: string;
  targetDate: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  documents: DocumentItem[];
}

export interface SelfAuditOption {
  optionNumber: number; // 1, 2, 3, 4, 5
  optionLabel: string; // '①', '②', '③', '④', '⑤'
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  points: number;
  scoreRate: number; // 100, 80, 60, 40, 20
  isRecommended?: boolean;
}

export interface SelfAuditGuideItem {
  id: string;
  partId: 'part1' | 'part2' | 'part3' | 'part4';
  partNumber: number; // 1, 2, 3, 4
  partName: string; // "1. 기술혁신 능력"
  majorCategory: string; // "1. R&D 활동지표"
  evalItemCode: string; // "1.1-(1)"
  evalItemName: string; // "R&D(기술개발) 투자비율"
  points: number; // 30
  question: string; // 질문 (자가진단 질문 및 심사원 체크 포인트)
  questionType?: 'single_choice' | 'multi_checkbox' | 'numeric_input'; // 포털 문항 유형
  subChecklistItems?: string[]; // 포털 내 세부 체크박스 항목 (중복체크 시 ①~⑦ 등)
  portalDescription?: string; // [설명] 버튼 팝업 안내 내용
  evaluationGuideline?: string; // [평가지침] (PDF 원문 평가방법 및 산출기준)
  considerations?: string; // [고려사항] (PDF 원문 고려사항)
  options: SelfAuditOption[]; // 온라인 자가진단 객관식 1~5번 보기항목
  defaultSelectedOptionNumber?: number; // 당사 권장/선택 보기 번호 (1~5)
  requirements: string[]; // 요구사항 (심사 기준, 평가 기준, 필수 요건)
  strategy: string[]; // 대응방안 (실무 팁, 소명 전략, 고득점 방법)
  requiredDocs: string[]; // 준비서류 (필수 제출 및 편철 증빙 목록)
  optionalDocs?: string[]; // 보조/가점 증빙 서류
  practicalTip?: string; // 실사위원 현장 방문 시 핵심 착안사항
  linkedGroupId?: string; // 대시보드 내 매핑되는 문서 그룹 ID
  linkedDocTemplateId?: string; // 자동생성 연계 문서 서식 ID (예: 'doc-job-invention')
  currentStatusNote?: string; // 기업 현황 메모
}
