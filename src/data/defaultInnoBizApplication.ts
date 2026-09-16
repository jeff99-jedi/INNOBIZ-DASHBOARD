import { InnoBizApplicationData } from '../types';

export const DEFAULT_INNOBIZ_APPLICATION: InnoBizApplicationData = {
  factories: [
    {
      id: 'factory-1',
      type: 'domestic',
      name: '(주)더한농 충주공장 (4대 제조라인)',
      postcode: '27438',
      address: '충청북도 충주시 주덕읍 상전1길 17',
      detailAddress: '제1제조동(유제/액상수화/입제), 부설 기술연구소',
    },
  ],
  products: [
    {
      id: 'prod-1',
      name: '비선택성 제초제(쌔미탄, 더한뉴글라신), 원예용 살균·살충제(야망초, 해결탄)',
      summary: '농약 약효·약해 생물검정 평가 및 고효율 유화·액상수화(비드밀)·조립 제형화 공정 기술을 적용한 작물보호제 및 친환경 기능성 농자재',
      exportCountry: '베트남, 캄보디아, 몽골 (동남아시아 타깃)',
      exportAmount: '120',
    },
  ],
  currentYear: {
    year: '2025',
    salesRevenue: 3939931000,
    currentAssets: 1850000000,
    inventoryAssets: 420000000,
    currentLiabilities: 980000000,
    totalAssets: 3420000000,
    netIncome: 9887000,
    operatingIncome: 79007000,
    borrowings: 1120000000,
    tradeReceivables: 850000000,
    developmentCostIncrease: 0,
    rdExpensesIncomeStmt: 85000000,
    developmentAmortization: 0,
    rdExpensesMfgCost: 73000000,
    totalEmployees: 9,
    rndEmployees: 3,
  },
  previousYear: {
    year: '2024',
    salesRevenue: 1096500000,
    currentAssets: 650000000,
    inventoryAssets: 180000000,
    currentLiabilities: 520000000,
    totalAssets: 1850000000,
    netIncome: -42000000,
    operatingIncome: -38000000,
    borrowings: 650000000,
    tradeReceivables: 210000000,
    developmentCostIncrease: 0,
    rdExpensesIncomeStmt: 25000000,
    developmentAmortization: 0,
    rdExpensesMfgCost: 20000000,
    totalEmployees: 6,
    rndEmployees: 2,
  },
};

const STORAGE_KEY = 'thehannong_innobiz_application_data_v1';

export function loadInnoBizApplicationData(): InnoBizApplicationData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to load InnoBiz application data from storage:', err);
  }
  return DEFAULT_INNOBIZ_APPLICATION;
}

export function saveInnoBizApplicationData(data: InnoBizApplicationData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save InnoBiz application data to storage:', err);
  }
}
