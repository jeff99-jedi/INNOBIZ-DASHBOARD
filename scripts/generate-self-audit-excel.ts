import fs from 'fs';
import path from 'path';
import { buildInnoBizSelfAuditWorkbook } from '../src/utils/selfAuditExcelExport';
import * as XLSX from 'xlsx';

const defaultCompany = {
  companyName: '(주)더한농',
  ceoName: '전희 / 김병호',
  businessNumber: '123-86-00000',
  corporateNumber: '110111-0000000',
  address: '충청북도 충주시 주덕읍 상전1길 17',
  industry: '제조업 (농약 및 작물보호제, 친환경 기능성 비료)',
  mainProduct: '작물보호제(쌔미탄, 더한뉴글라신), 친환경 기능성 농자재',
  coreTechnology: '농약 약효·약해 생물검정 평가 및 고효율 유화·액상수화 제형화 공정 기술',
  establishedDate: '2020-03-15',
  rndCenterName: '(주)더한농 부설 기술연구소 (충주)',
};

const wb = buildInnoBizSelfAuditWorkbook(defaultCompany as any);

const targetDir = path.resolve(process.cwd(), 'public', 'downloads');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const outputPath = path.join(targetDir, '이노비즈_자가진단_항목별_필요서류_및_공통서류_목록.xlsx');
XLSX.writeFile(wb, outputPath);

console.log(`Successfully generated Excel file at: ${outputPath}`);
