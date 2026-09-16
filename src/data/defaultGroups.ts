import { DocumentGroup } from '../types';
import { generateGroupsFromSheet, RAW_SHEET_ROWS } from './sheetData';

export const INITIAL_INNOBIZ_GROUPS: DocumentGroup[] = generateGroupsFromSheet();

export const INNOBIZ_DOCUMENT_TEMPLATES = [
  {
    category: 'tech_innovation',
    categoryName: '1. 기술혁신 능력',
    suggestions: [
      '재무제표(손익계산서/제조원가명세서), 연구개발비 명세서',
      '4대 보험 가입자 명단, 연구원 명부(학위증/경력증명서)',
      '기업부설연구소 인정서(KOITA), 연구소 평면도 및 사진',
      '취업규칙, 교육훈련 일지, 회의록, 포상 규정',
      '직무발명보상규정, 성과급 지급 명세서, 인사평가 규정',
      '산학협력 MOU, 공동연구 기획안, 전문가 자문 의뢰서',
      '프로젝트 관리 매뉴얼(PMS), Gantt Chart, 연구노트',
      '연구 기자재 관리 대장, 장비 구입/임대 계약서',
      '특허 등록증, 기술 상용화 성공 사례 보고서',
      '중장기 기술개발 로드맵(TRM), 사업 계획서'
    ]
  },
  {
    category: 'tech_commercialize',
    categoryName: '2. 기술사업화 능력',
    suggestions: [
      '제품개발 매뉴얼(절차서), 개발 소요 예산서',
      '제품 기능 분석 보고서, 벤치마킹 분석서',
      '사내 기술 표준 관리 규정, 연간 기술 표준화 계획서',
      '품질 관리 규정, 공정별 작업 지침서, QA 결과 보고서',
      '외주업체 관리 규정 및 평가표, 구매 계약서',
      '마케팅 전략 기획서, 시장 규모 분석 보고서',
      '제품 생애주기 분석 보고서, 경쟁 기술 비교 분석표',
      '지식재산권 관리 대장, 외부 네트워크 리스트'
    ]
  },
  {
    category: 'tech_management',
    categoryName: '3. 기술혁신 경영능력',
    suggestions: [
      '경영방침 선언서, 기술혁신 회의록',
      '경영자 경력증명서, 건강보험 자격득실확인서 (동업종 15년)',
      '4대 보험 가입자 명부, 복리후생 규정',
      '신기술 TF팀 운영 기록, 경쟁사 동향 분석 보고서',
      '중장기 사업 계획서, 산업/특허 정보 분석 결과물',
      '국세/지방세 완납 증명서, 표준재무제표증명'
    ]
  },
  {
    category: 'tech_performance',
    categoryName: '4. 기술혁신 성과',
    suggestions: [
      '기술 경쟁력 비교표, 원가 절감 실적 보고서',
      '현금흐름표, 금융권 신용평가서',
      '최근 3개년 결산 재무제표 (2024년 매출 133.5억 / 순이익 6.7억)',
      '특허 등록증 및 공보, 기술 상용화 기대효과 분석서 (수입대체 30%)'
    ]
  }
];
