import { DocumentGroup, DocumentItem, InnoBizCategory } from '../types';
import { SELF_AUDIT_GUIDE_ITEMS } from './selfAuditGuideData';

export interface SheetRowItem {
  section: string; // 부문
  majorCategory: string; // 대항목
  evalItem: string; // 평가항목
  points: number; // 배점
  currentStatus: string; // 현황
  evidenceDocs: string; // 주요 증빙 자료
}

export const RAW_SHEET_ROWS: SheetRowItem[] = SELF_AUDIT_GUIDE_ITEMS.map((item) => ({
  section: item.partName,
  majorCategory: item.majorCategory,
  evalItem: `${item.evalItemCode} ${item.evalItemName}`,
  points: item.points,
  currentStatus: item.currentStatusNote || item.options[0]?.text || '',
  evidenceDocs: item.requiredDocs.join(', '),
}));

export function parseEvidenceDocs(evidenceDocsStr: string): string[] {
  if (!evidenceDocsStr) return [];
  return evidenceDocsStr
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Convert RAW_SHEET_ROWS to structured InnoBiz Document Groups (16 Major Binder Groups covering all 60 items)
export function generateGroupsFromSheet(): DocumentGroup[] {
  const groupConfigs: Array<{
    id: string;
    title: string;
    category: InnoBizCategory;
    categoryName: string;
    majorCategory: string;
    department: string;
    manager: string;
    targetDate: string;
    description: string;
    partPrefix: string;
  }> = [
    // Part 1: 기술혁신능력 (300점)
    {
      id: 'grp-1-1',
      title: 'R&D 투자 및 기술개발인력 증빙철',
      category: 'tech_innovation',
      categoryName: '1. 기술혁신 능력',
      majorCategory: '1. R&D 활동지표',
      department: '기업부설연구소 / 재무회계팀',
      manager: '연구소장 / 회계팀장',
      targetDate: '2026-10-15',
      description: 'R&D 투자비율, 연구개발 전담인력 및 석박사 인력, 시험설비, 중장기 R&D 로드맵(TRM) 증빙철입니다.',
      partPrefix: '1.',
    },
    {
      id: 'grp-1-2',
      title: '기술축적 및 지식재산권(특허) 증빙철',
      category: 'tech_innovation',
      categoryName: '1. 기술혁신 능력',
      majorCategory: '2. 기술축적 및 지식재산권',
      department: '기업부설연구소 / 지식재산팀',
      manager: '특허법무 수석',
      targetDate: '2026-10-16',
      description: '법인명의 등록특허, 특허제품 사업화 매출실적, 연구노트 및 직무발명보상제도 운영 증빙철입니다.',
      partPrefix: '1.',
    },
    {
      id: 'grp-1-3',
      title: '기술협력 및 산학연 오픈이노베이션 증빙철',
      category: 'tech_innovation',
      categoryName: '1. 기술혁신 능력',
      majorCategory: '3. 기술협력 및 오픈이노베이션',
      department: '연구기획팀 / 대외협력실',
      manager: '연구기획팀장',
      targetDate: '2026-10-18',
      description: '산학연 공동연구개발 협약, 정부 R&D 과제 성공 판정 공문, 외부 자문위원 위촉 및 기술전시회 참관철입니다.',
      partPrefix: '1.',
    },
    {
      id: 'grp-1-4',
      title: '기술개발 환경 및 영업비밀 보호 증빙철',
      category: 'tech_innovation',
      categoryName: '1. 기술혁신 능력',
      majorCategory: '4. 기술개발 환경 및 지원체계',
      department: '기업부설연구소 / 인사총무팀',
      manager: '총무팀장',
      targetDate: '2026-10-19',
      description: '연구소 독립 출입보안 시설, 연구원 직무교육 수료증, 대중소기업협력재단 기술자료 임치증 증빙철입니다.',
      partPrefix: '1.',
    },

    // Part 2: 기술사업화능력 (300점)
    {
      id: 'grp-2-1',
      title: '신제품 개발 프로세스(Gate-Stage) 증빙철',
      category: 'tech_commercialize',
      categoryName: '2. 기술사업화 능력',
      majorCategory: '1. 기술사업화 기획 및 프로세스',
      department: '제품개발팀 / 상품기획팀',
      manager: '개발PM',
      targetDate: '2026-10-20',
      description: 'Gate-Stage 신제품 개발 마스터 바인더, 사전 시장분석/타당성 보고서, FMEA 리스크 관리 증빙철입니다.',
      partPrefix: '2.',
    },
    {
      id: 'grp-2-2',
      title: '생산설비·공정관리(SOP) 및 안전환경 증빙철',
      category: 'tech_commercialize',
      categoryName: '2. 기술사업화 능력',
      majorCategory: '2. 생산 및 공정 혁신능력',
      department: '생산본부 / 공정기술팀',
      manager: '생산본부장',
      targetDate: '2026-10-21',
      description: '양산 설비대장, 전 공정 작업표준서(SOP), 5S 개선활동 실적 및 위험성평가 인정서 증빙철입니다.',
      partPrefix: '2.',
    },
    {
      id: 'grp-2-3',
      title: '품질경영(ISO9001) 및 부적합품(CAPA) 관리 증빙철',
      category: 'tech_commercialize',
      categoryName: '2. 기술사업화 능력',
      majorCategory: '3. 품질보증 및 신뢰성 관리',
      department: '품질보증부 / 품질관리팀',
      manager: '품질경영실장',
      targetDate: '2026-10-22',
      description: 'ISO 9001 내부품질감사 보고서, 부적합품 격리 및 시정조치(CAR), 계측기 KOLAS 교정성적서 증빙철입니다.',
      partPrefix: '2.',
    },
    {
      id: 'grp-2-4',
      title: '시장점유율 및 해외수출·글로벌인증 증빙철',
      category: 'tech_commercialize',
      categoryName: '2. 기술사업화 능력',
      majorCategory: '4. 시장진입 및 마케팅·판매 역량',
      department: '국내영업본부 / 해외사업팀',
      manager: '영업총괄이사',
      targetDate: '2026-10-23',
      description: '시장점유율 입증자료, 주요 거래처 장기공급계약서, 고객만족도 조사 및 해외규격인증(CE/UL) 증빙철입니다.',
      partPrefix: '2.',
    },

    // Part 3: 기술혁신 경영능력 (200점)
    {
      id: 'grp-3-1',
      title: '경영자 기술경력 및 미래비전 증빙철',
      category: 'tech_management',
      categoryName: '3. 기술혁신 경영능력',
      majorCategory: '1. 경영주의 기술역량 및 리더십',
      department: '경영전략실 / 비서실',
      manager: '대표이사 / 기획실장',
      targetDate: '2026-10-24',
      description: '대표이사 기술경력 및 특허 발명자 등록증, 2030 미래비전 선포 자료, 내일채움공제 가입증명철입니다.',
      partPrefix: '3.',
    },
    {
      id: 'grp-3-2',
      title: '조직운영·직무분장 및 복리후생 증빙철',
      category: 'tech_management',
      categoryName: '3. 기술혁신 경영능력',
      majorCategory: '2. 조직운영 및 인적자원 관리',
      department: '인사총무팀 / 경영지원부',
      manager: '인사부서장',
      targetDate: '2026-10-25',
      description: '전사 조직도 및 위임전결규정, 사내 복리후생 지원실적, KPI 인사평가표, 4대 법정의무교육 수료증철입니다.',
      partPrefix: '3.',
    },
    {
      id: 'grp-3-3',
      title: '재무 투명성·취업규칙 및 세금완납 증빙철',
      category: 'tech_management',
      categoryName: '3. 기술혁신 경영능력',
      majorCategory: '3. 경영 투명성 및 규제준수',
      department: '재무회계팀 / 법무인사팀',
      manager: '재무팀장',
      targetDate: '2026-10-26',
      description: '외부 회계감사보고서(적정), 노동청 신고 취업규칙, 국세·지방세·4대보험 완납증명서철입니다.',
      partPrefix: '3.',
    },
    {
      id: 'grp-3-4',
      title: '비상대응(BCP)·ESG 실천 및 디지털 전환 증빙철',
      category: 'tech_management',
      categoryName: '3. 기술혁신 경영능력',
      majorCategory: '4. 리스크 관리 및 지속가능경영',
      department: '경영지원본부 / 전산팀',
      manager: '정보보안팀장',
      targetDate: '2026-10-27',
      description: '재산종합(화재)보험 증권, 기부금 영수증 등 ESG 실적, 전사 ERP/전자결재 도입 화면 증빙철입니다.',
      partPrefix: '3.',
    },

    // Part 4: 기술혁신 성과 (200점)
    {
      id: 'grp-4-1',
      title: '기술 차별성(KTL공인성적서) 및 국산화 증빙철',
      category: 'tech_performance',
      categoryName: '4. 기술혁신 성과',
      majorCategory: '1. 기술적 성과',
      department: '기업부설연구소 / 품질보증부',
      manager: '연구소장',
      targetDate: '2026-10-28',
      description: 'KTL 공인시험성적서, 수입대체 국산화 성과 보고서, 벤처기업 확인서 및 TRL 9단계 양산승인 증빙철입니다.',
      partPrefix: '4.',
    },
    {
      id: 'grp-4-2',
      title: '3개년 재무성과(성장률·영업이익률) 증빙철',
      category: 'tech_performance',
      categoryName: '4. 기술혁신 성과',
      majorCategory: '2. 경제적 성과 (재무 및 시장)',
      department: '재무회계팀',
      manager: 'CFO',
      targetDate: '2026-10-29',
      description: '최근 3개년 표준재무제표증명원(CAGR 24.6%), 신기술제품 매출비중(78.4%), 건전한 부채비율 증빙철입니다.',
      partPrefix: '4.',
    },
    {
      id: 'grp-4-3',
      title: '신규 고용창출 및 무역수지 기여 증빙철',
      category: 'tech_performance',
      categoryName: '4. 기술혁신 성과',
      majorCategory: '3. 파급효과 및 사회적 성과',
      department: '인사총무팀 / 해외영업팀',
      manager: '총괄본부장',
      targetDate: '2026-10-30',
      description: '4대보험 가입자명부(신규 정규직 6명 채용), 전후방 밸류체인 기여도, 수입대체 및 수출실적 증명원입니다.',
      partPrefix: '4.',
    },
    {
      id: 'grp-4-4',
      title: '차세대 R&D 파이프라인 및 글로벌 비전 증빙철',
      category: 'tech_performance',
      categoryName: '4. 기술혁신 성과',
      majorCategory: '4. 미래성장 잠재력',
      department: '전략기획실 / 기술연구소',
      manager: '기획조정실장',
      targetDate: '2026-10-31',
      description: '차세대 미래 신수종 R&D 파이프라인 2건, 국가 12대 전략기술 부합성 소명서, 2030 스케일업 로드맵입니다.',
      partPrefix: '4.',
    },
  ];

  return groupConfigs.map((cfg, gIdx) => {
    const matchedRows = RAW_SHEET_ROWS.filter((row) =>
      row.section.startsWith(cfg.partPrefix) && row.majorCategory === cfg.majorCategory
    );
    const totalGroupPoints = matchedRows.reduce((sum, r) => sum + r.points, 0);

    const documents: DocumentItem[] = matchedRows.map((row, rIdx) => {
      const parsedDocs = parseEvidenceDocs(row.evidenceDocs);
      const isCompletedSample = rIdx % 2 === 0;
      const isReviewSample = rIdx % 3 === 1;

      return {
        id: `doc-${cfg.id}-${rIdx + 1}`,
        title: `${row.evalItem} 증빙`,
        code: row.evalItem.split(' ')[0] || `Item-${rIdx + 1}`,
        sectionNumber: cfg.partPrefix.replace('.', ''),
        majorCategory: row.majorCategory,
        evalItem: row.evalItem,
        points: row.points,
        currentStatus: row.currentStatus,
        evidenceDocNames: parsedDocs,
        isRequired: true,
        status: isCompletedSample ? 'completed' : isReviewSample ? 'review' : 'in_progress',
        formatGuide: `[필수 제출] ${row.evidenceDocs} (평가배점 ${row.points}점, 자가진단: ${row.currentStatus})`,
        attachments: isCompletedSample
          ? [
              {
                id: `att-${cfg.id}-${rIdx}-1`,
                name: `${parsedDocs[0] || '증빙서류'}_확인본.pdf`,
                size: 1850000 + rIdx * 120000,
                uploadedAt: '2026-09-08',
                fileType: 'application/pdf',
              },
            ]
          : [],
        notes: `자가진단 현황: "${row.currentStatus}"에 대한 명확한 객관적 입증 자료 편철 필요`,
        updatedAt: '2026-09-08',
      };
    });

    return {
      id: cfg.id,
      title: cfg.title,
      category: cfg.category,
      categoryName: cfg.categoryName,
      majorCategory: cfg.majorCategory,
      totalPoints: totalGroupPoints,
      description: cfg.description,
      department: cfg.department,
      manager: cfg.manager,
      targetDate: cfg.targetDate,
      isCustom: false,
      createdAt: '2026-09-01T09:00:00Z',
      updatedAt: '2026-09-08T16:00:00Z',
      documents,
    };
  });
}
