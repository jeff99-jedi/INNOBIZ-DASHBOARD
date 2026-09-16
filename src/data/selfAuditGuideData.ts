import { SelfAuditGuideItem } from '../types';
import { PART1_ITEMS } from './selfAudit/part1Items';
import { PART2_ITEMS } from './selfAudit/part2Items';
import { PART3_ITEMS } from './selfAudit/part3Items';
import { PART4_ITEMS } from './selfAudit/part4Items';

export interface SelfAuditPartMeta {
  partId: 'part1' | 'part2' | 'part3' | 'part4';
  partNumber: number;
  partName: string;
  shortName: string;
  totalPoints: number;
  description: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    iconBg: string;
  };
}

export const SELF_AUDIT_PARTS: SelfAuditPartMeta[] = [
  {
    partId: 'part1',
    partNumber: 1,
    partName: 'PART 1. 기술혁신 능력',
    shortName: 'PART 1. 기술혁신',
    totalPoints: 300,
    description: 'R&D 활동지표, 연구 전담조직 및 인력, 연구장비 및 시험시설, 지식재산권 축적과 산학연 협력체계를 평가합니다.',
    color: {
      bg: 'bg-blue-50/60',
      border: 'border-blue-200',
      text: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
    },
  },
  {
    partId: 'part2',
    partNumber: 2,
    partName: 'PART 2. 기술사업화 능력',
    shortName: 'PART 2. 기술사업화',
    totalPoints: 300,
    description: '신제품 개발 프로세스(Gate-Stage), 생산설비 및 공정관리(SOP), 품질경영(ISO9001/CAPA), 거래처 다변화 및 해외인증을 평가합니다.',
    color: {
      bg: 'bg-emerald-50/60',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
    },
  },
  {
    partId: 'part3',
    partNumber: 3,
    partName: 'PART 3. 기술혁신 경영능력',
    shortName: 'PART 3. 기술혁신경영',
    totalPoints: 200,
    description: '대표자의 동업종 기술경력과 리더십, 조직운영 및 복리후생, 세금완납 및 회계투명성, BCP 재난대응과 ESG 활동을 평가합니다.',
    color: {
      bg: 'bg-purple-50/60',
      border: 'border-purple-200',
      text: 'text-purple-900',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      iconBg: 'bg-purple-600 text-white',
    },
  },
  {
    partId: 'part4',
    partNumber: 4,
    partName: 'PART 4. 기술혁신 성과',
    shortName: 'PART 4. 기술혁신성과',
    totalPoints: 200,
    description: '개발기술의 독창성 및 국산화율, 3개년 매출성장률 및 영업이익률, 신규 일자리 창출 및 수입대체 효과, 미래성장 파이프라인을 평가합니다.',
    color: {
      bg: 'bg-amber-50/60',
      border: 'border-amber-200',
      text: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
    },
  },
];

export const SELF_AUDIT_GUIDE_ITEMS: SelfAuditGuideItem[] = [
  ...PART1_ITEMS,
  ...PART2_ITEMS,
  ...PART3_ITEMS,
  ...PART4_ITEMS,
];
