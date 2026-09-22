import React, { useState, useEffect } from 'react';
import {
  X,
  Home,
  Check,
  Building2,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import {
  InnoBizApplicationData,
  InnoBizFactoryItem,
  InnoBizProductItem,
  FinancialYearData,
  CompanyProfile,
} from '../types';
import {
  loadInnoBizApplicationData,
  saveInnoBizApplicationData,
  DEFAULT_INNOBIZ_APPLICATION,
} from '../data/defaultInnoBizApplication';

interface InnoBizApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  onUpdateCompany: (updated: CompanyProfile) => void;
}

export const InnoBizApplicationModal: React.FC<InnoBizApplicationModalProps> = ({
  isOpen,
  onClose,
  company,
  onUpdateCompany,
}) => {
  const [activeSubStep, setActiveSubStep] = useState<'factory' | 'finance'>('factory');
  const [formData, setFormData] = useState<InnoBizApplicationData>(() => loadInnoBizApplicationData());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(loadInnoBizApplicationData());
      setSaveSuccessMsg(null);
    }
  }, [isOpen]);

  // --- Factory Handlers ---
  const handleAddFactory = () => {
    if (formData.factories.length >= 3) {
      alert('공장 정보는 최대 3개까지 입력 가능합니다.');
      return;
    }
    const newFactory: InnoBizFactoryItem = {
      id: `factory-${Date.now()}`,
      type: 'domestic',
      name: '',
      postcode: '',
      address: '',
      detailAddress: '',
    };
    setFormData((prev) => ({
      ...prev,
      factories: [...prev.factories, newFactory],
    }));
  };

  const handleRemoveFactory = (index: number) => {
    if (formData.factories.length <= 1) {
      alert('최소 1개 이상의 공장 정보 항목이 유지되어야 합니다. (미보유 시 공장명을 미기재하거나 공란으로 둘 수 있습니다)');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      factories: prev.factories.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateFactory = (index: number, field: keyof InnoBizFactoryItem, value: any) => {
    setFormData((prev) => {
      const next = [...prev.factories];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, factories: next };
    });
  };

  // --- Product Handlers ---
  const handleAddProduct = () => {
    if (formData.products.length >= 3) {
      alert('주생산품 정보는 최대 3개까지 입력 가능합니다.');
      return;
    }
    const newProd: InnoBizProductItem = {
      id: `prod-${Date.now()}`,
      name: '',
      summary: '',
      exportCountry: '',
      exportAmount: '0',
    };
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProd],
    }));
  };

  const handleRemoveProduct = (index: number) => {
    if (formData.products.length <= 1) {
      alert('1개 이상의 주생산품은 필히 작성하여야 합니다.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, idx) => idx !== index),
    }));
  };

  const handleUpdateProduct = (index: number, field: keyof InnoBizProductItem, value: any) => {
    setFormData((prev) => {
      const next = [...prev.products];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, products: next };
    });
  };

  // --- Financial Handlers ---
  const handleFinancialChange = (
    yearTarget: 'currentYear' | 'previousYear',
    field: keyof FinancialYearData,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [yearTarget]: {
        ...prev[yearTarget],
        [field]: value,
      },
    }));
  };

  // Synchronize with CompanyProfile
  const syncToCompanyProfile = (appData: InnoBizApplicationData) => {
    const cy = appData.currentYear;
    const py = appData.previousYear;

    const totalRdCurr = cy.rdExpensesIncomeStmt + cy.rdExpensesMfgCost + cy.developmentCostIncrease;
    const rdRatio = cy.salesRevenue > 0 ? ((totalRdCurr / cy.salesRevenue) * 100).toFixed(2) : '0.00';
    const techPersonnelRatio = cy.totalEmployees > 0 ? (((cy.rndEmployees) / cy.totalEmployees) * 100).toFixed(2) : '0.00';

    const salesRevText = `${(cy.salesRevenue / 100000000).toFixed(1)}억원 (${cy.year}년 결산 ${cy.salesRevenue.toLocaleString()}원)`;
    const netIncomeText = `${(cy.netIncome / 100000000).toFixed(2)}억원 (영업이익 ${(cy.operatingIncome / 100000000).toFixed(2)}억원)`;
    const rndAmountText = `${(totalRdCurr / 100000000).toFixed(2)}억원 (R&D투자비율 ${rdRatio}%)`;
    const techCountText = `${cy.rndEmployees}명 (총 종업원 ${cy.totalEmployees}명 중 ${techPersonnelRatio}%)`;

    // Main product info
    const primaryProd = appData.products[0];
    const mainProdText = primaryProd?.name ? primaryProd.name : company.mainProduct;

    const updatedProfile: CompanyProfile = {
      ...company,
      salesRevenue: salesRevText,
      netIncome: netIncomeText,
      rndRatio: `${rdRatio}%`,
      rndAmount: rndAmountText,
      techPersonnelRatio: `${techPersonnelRatio}%`,
      techPersonnelCount: techCountText,
      mainProduct: mainProdText,
    };

    onUpdateCompany(updatedProfile);
  };

  const handleSave = (silent = false) => {
    saveInnoBizApplicationData(formData);
    syncToCompanyProfile(formData);
    if (!silent) {
      setSaveSuccessMsg('기업현황 및 재무사항이 성공적으로 저장되었습니다.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    }
  };

  const handleNextStep = () => {
    handleSave(true);
    if (activeSubStep === 'factory') {
      setActiveSubStep('finance');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSaveSuccessMsg('전체 등록 데이터가 저장되고, 이노비즈 평가지표에 최신 수치가 자동 동기화되었습니다!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        onClose();
      }, 1200);
    }
  };

  const handlePrevStep = () => {
    if (activeSubStep === 'finance') {
      setActiveSubStep('factory');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onClose();
    }
  };

  // Reset to original Thehannong demo data
  const handleResetToDemo = () => {
    if (window.confirm('(주)더한농의 공식 결산 재무제표 및 공장 현황 데이터로 초기화하시겠습니까?')) {
      setFormData(DEFAULT_INNOBIZ_APPLICATION);
      saveInnoBizApplicationData(DEFAULT_INNOBIZ_APPLICATION);
      syncToCompanyProfile(DEFAULT_INNOBIZ_APPLICATION);
      setSaveSuccessMsg('(주)더한농 기본 결산 데이터가 적용되었습니다.');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 w-full max-w-5xl my-4 flex flex-col max-h-[94vh] overflow-hidden font-sans">
        
        {/* Top Control Bar with Close */}
        <div className="px-5 py-2.5 bg-slate-800 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">이노비즈(InnoBiz) 기술혁신형 중소기업 온라인 신청 시스템 시뮬레이션</span>
            <span className="text-slate-400">|</span>
            <span className="text-emerald-300 font-medium">대상기업: {company.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToDemo}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded text-[11px] flex items-center gap-1 transition-colors"
              title="더한농 결산 기본값 복원"
            >
              <RotateCcw className="w-3 h-3" />
              <span>더한농 기본값 불러오기</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white">
          
          {/* Breadcrumb and Top Title */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-300 mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              신규신청
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Home className="w-3.5 h-3.5 text-slate-600" />
              <span>&gt;</span>
              <span>이노비즈 신청</span>
              <span>&gt;</span>
              <span>신규신청</span>
              <span>&gt;</span>
              <span className="font-semibold text-slate-800">신규신청</span>
            </div>
          </div>

          {/* Step 1 to 4 Main Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            {/* Step 1 Active */}
            <div className="relative bg-[#d32f2f] text-white p-3.5 rounded-sm shadow-xs flex flex-col justify-center items-center text-center">
              <div className="text-[11px] font-medium tracking-wide opacity-90">Step.01</div>
              <div className="text-sm sm:text-base font-bold mt-0.5">기업등록</div>
              {/* Triangle down pointer */}
              <div className="hidden sm:block absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[8px] border-x-transparent border-t-[8px] border-t-[#d32f2f]" />
            </div>

            {/* Step 2 Inactive */}
            <div className="bg-white border border-slate-300 text-slate-600 p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
              <div className="text-[11px] text-slate-400 font-medium">Step.02</div>
              <div className="text-sm sm:text-base font-medium text-slate-700 mt-0.5">자가진단 입력</div>
            </div>

            {/* Step 3 Inactive */}
            <div className="bg-white border border-slate-300 text-slate-600 p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
              <div className="text-[11px] text-slate-400 font-medium">Step.03</div>
              <div className="text-sm sm:text-base font-medium text-slate-700 mt-0.5">기술사업계획서 입력</div>
            </div>

            {/* Step 4 Inactive */}
            <div className="bg-white border border-slate-300 text-slate-600 p-3.5 rounded-sm flex flex-col justify-center items-center text-center">
              <div className="text-[11px] text-slate-400 font-medium">Step.04</div>
              <div className="text-sm sm:text-base font-medium text-slate-700 mt-0.5">현장평가 대상업체 선정</div>
            </div>
          </div>

          {/* Sub Process Chevron Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mb-6 text-xs sm:text-sm font-semibold">
            {/* 약관동의 */}
            <div className="bg-[#e9ecef] text-slate-600 py-2.5 px-3 text-center rounded-sm flex items-center justify-center gap-1">
              <span>약관동의</span>
            </div>

            {/* 기업등록 */}
            <div className="bg-[#e9ecef] text-slate-600 py-2.5 px-3 text-center rounded-sm flex items-center justify-center gap-1">
              <span>기업등록</span>
            </div>

            {/* 공장 및 주생산품 입력 */}
            <button
              type="button"
              onClick={() => setActiveSubStep('factory')}
              className={`py-2.5 px-3 text-center rounded-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubStep === 'factory'
                  ? 'bg-[#424242] text-white shadow-xs font-bold'
                  : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>공장 및 주생산품 입력</span>
              {activeSubStep === 'factory' && <span className="text-[11px] opacity-90">(현재 단계)</span>}
            </button>

            {/* 재무사항 입력 */}
            <button
              type="button"
              onClick={() => setActiveSubStep('finance')}
              className={`py-2.5 px-3 text-center rounded-sm transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeSubStep === 'finance'
                  ? 'bg-[#424242] text-white shadow-xs font-bold'
                  : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>재무사항 입력</span>
              {activeSubStep === 'finance' && <span className="text-[11px] opacity-90">(현재 단계)</span>}
            </button>
          </div>

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div className="mb-5 p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: 공장 및 주생산품 입력 (Image 3) */}
          {/* ========================================================================= */}
          {activeSubStep === 'factory' && (
            <div className="space-y-6">
              
              {/* Notice Box */}
              <div className="border-t-2 border-slate-300 pt-4 pb-4 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#d32f2f] text-[#d32f2f] flex flex-col items-center justify-center shrink-0 font-bold text-xs leading-tight">
                  <span>주의</span>
                  <span>사항</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 space-y-1 pt-1.5 leading-relaxed">
                  <p>1. <strong className="text-[#d32f2f]">공장</strong> 정보가 있으신 경우 작성하여 주세요. (최대 3개 입력 가능)</p>
                  <p>2. 1개 이상의 <strong className="text-[#d32f2f]">주생산품</strong>을 필히 작성하여 주세요. (최대 3개 입력 가능)</p>
                </div>
              </div>

              {/* SECTION 1: 공장 등록 */}
              <div>
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-t border-slate-300">
                  공장 등록
                </div>

                <div className="space-y-4 mt-2">
                  {formData.factories.map((factory, fIdx) => (
                    <div key={factory.id} className="border border-slate-300 bg-white">
                      
                      {/* Item sub-header with add/delete buttons */}
                      <div className="bg-[#f8f9fa] px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>공장정보({fIdx + 1})</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleAddFactory}
                            className="px-2.5 py-1 bg-[#8b2323] hover:bg-[#731c1c] text-white rounded-xs text-[11px] font-medium transition-colors"
                          >
                            추가
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveFactory(fIdx)}
                            className="px-2.5 py-1 bg-[#5a6268] hover:bg-[#494f54] text-white rounded-xs text-[11px] font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* Factory Table Form */}
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <tbody>
                          {/* 공장분류 */}
                          <tr className="border-b border-slate-200">
                            <th className="w-28 sm:w-36 bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                              공장분류
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <div className="flex items-center gap-4 flex-wrap">
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`factory-type-${fIdx}`}
                                    checked={factory.type === 'domestic'}
                                    onChange={() => handleUpdateFactory(fIdx, 'type', 'domestic')}
                                    className="text-[#d32f2f] focus:ring-0"
                                  />
                                  <span>국내공장</span>
                                </label>
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`factory-type-${fIdx}`}
                                    checked={factory.type === 'overseas'}
                                    onChange={() => handleUpdateFactory(fIdx, 'type', 'overseas')}
                                    className="text-[#d32f2f] focus:ring-0"
                                  />
                                  <span>해외공장</span>
                                </label>
                                <span className="text-[11px] text-[#d32f2f]">
                                  ※ 해외공장인 경우에는 우편번호를 작성하지 않으셔도 됩니다.
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* 공장명 */}
                          <tr className="border-b border-slate-200">
                            <th className="bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                              공장명
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <input
                                type="text"
                                value={factory.name}
                                onChange={(e) => handleUpdateFactory(fIdx, 'name', e.target.value)}
                                placeholder="예: (주)더한농 충주공장"
                                className="w-full sm:w-96 px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                              />
                            </td>
                          </tr>

                          {/* 공장주소 */}
                          <tr>
                            <th className="bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200 align-top pt-3">
                              공장주소
                            </th>
                            <td className="p-2.5 sm:p-3 space-y-1.5">
                              {/* Postcode Row */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={factory.postcode}
                                  onChange={(e) => handleUpdateFactory(fIdx, 'postcode', e.target.value)}
                                  placeholder="우편번호"
                                  className="w-32 px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Notice: Zipcode external API is skipped as requested
                                    if (!factory.postcode) {
                                      handleUpdateFactory(fIdx, 'postcode', '27438');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-[#5a6268] hover:bg-[#494f54] text-white rounded-xs text-xs font-medium transition-colors"
                                >
                                  우편번호 검색
                                </button>
                                <span className="text-[11px] text-slate-400">
                                  (직접 입력 또는 충주공장 기본값)
                                </span>
                              </div>

                              {/* Base Address */}
                              <div>
                                <input
                                  type="text"
                                  value={factory.address}
                                  onChange={(e) => handleUpdateFactory(fIdx, 'address', e.target.value)}
                                  placeholder="기본주소 (예: 충청북도 충주시 주덕읍 상전1길 17)"
                                  className="w-full sm:w-[540px] px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                                />
                              </div>

                              {/* Detail Address */}
                              <div>
                                <input
                                  type="text"
                                  value={factory.detailAddress}
                                  onChange={(e) => handleUpdateFactory(fIdx, 'detailAddress', e.target.value)}
                                  placeholder="상세주소 (예: 제1제조동 및 연구소)"
                                  className="w-full sm:w-[540px] px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: 주생산품/주서비스 등록 */}
              <div>
                <div className="bg-[#e9ecef] px-3 py-2 flex items-center justify-between flex-wrap gap-1 border-t border-slate-300">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    주생산품/주서비스 등록
                  </span>
                  <span className="text-[11px] text-[#d32f2f]">
                    ※ 본 정보는 제품/서비스 검색에 활용되므로 일반적 용어와 브랜드명 등을 동시 게재바랍니다
                  </span>
                </div>

                <div className="space-y-4 mt-2">
                  {formData.products.map((prod, pIdx) => (
                    <div key={prod.id} className="border border-slate-300 bg-white">
                      {/* Item sub-header */}
                      <div className="bg-[#f8f9fa] px-3 py-1.5 border-b border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>주생산품 정보 ({pIdx + 1})</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handleAddProduct}
                            className="px-2.5 py-1 bg-[#8b2323] hover:bg-[#731c1c] text-white rounded-xs text-[11px] font-medium transition-colors"
                          >
                            추가
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(pIdx)}
                            className="px-2.5 py-1 bg-[#5a6268] hover:bg-[#494f54] text-white rounded-xs text-[11px] font-medium transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {/* Product Table */}
                      <table className="w-full text-xs sm:text-sm border-collapse">
                        <tbody>
                          {/* 상품명 */}
                          <tr className="border-b border-slate-200">
                            <th className="w-28 sm:w-36 bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                              상품명
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <input
                                type="text"
                                value={prod.name}
                                onChange={(e) => handleUpdateProduct(pIdx, 'name', e.target.value)}
                                placeholder="예: 비선택성 제초제(쌔미탄, 더한뉴글라신), 원예살균제(야망초)"
                                className="w-full sm:w-96 px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                              />
                            </td>
                          </tr>

                          {/* 상품개요 */}
                          <tr className="border-b border-slate-200">
                            <th className="bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200 align-top pt-3">
                              상품개요
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <textarea
                                rows={4}
                                value={prod.summary}
                                onChange={(e) => handleUpdateProduct(pIdx, 'summary', e.target.value)}
                                placeholder="제품/서비스의 핵심 특징, 기술 사양, 타깃 시장, 제조 공정 및 특장점을 기술하세요."
                                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500 leading-relaxed"
                              />
                            </td>
                          </tr>

                          {/* 수출국 */}
                          <tr className="border-b border-slate-200">
                            <th className="bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                              수출국
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <input
                                type="text"
                                value={prod.exportCountry}
                                onChange={(e) => handleUpdateProduct(pIdx, 'exportCountry', e.target.value)}
                                placeholder="예: 베트남, 캄보디아, 몽골 등 (없으면 공란)"
                                className="w-full sm:w-96 px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs focus:outline-none focus:border-slate-500"
                              />
                            </td>
                          </tr>

                          {/* 수출액 */}
                          <tr>
                            <th className="bg-[#f8f9fa] p-2.5 sm:p-3 text-left font-medium text-slate-700 border-r border-slate-200">
                              수출액
                            </th>
                            <td className="p-2.5 sm:p-3">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={prod.exportAmount}
                                  onChange={(e) => handleUpdateProduct(pIdx, 'exportAmount', e.target.value.replace(/[^0-9]/g, ''))}
                                  className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-xs text-xs text-right focus:outline-none focus:border-slate-500 font-mono"
                                />
                                <span className="text-xs text-slate-600">백만원</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: 재무사항 입력 (Images 1 & 2) */}
          {/* ========================================================================= */}
          {activeSubStep === 'finance' && (
            <div className="space-y-6">
              
              {/* Notice Box */}
              <div className="border-t-2 border-slate-300 pt-4 pb-4 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full border-2 border-[#d32f2f] text-[#d32f2f] flex flex-col items-center justify-center shrink-0 font-bold text-xs leading-tight">
                  <span>주의</span>
                  <span>사항</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-700 space-y-1 pt-1.5 leading-relaxed">
                  <p>1. 모두 <strong className="text-[#d32f2f]">숫자로만</strong> 입력하여 주세요.</p>
                  <p>2. 단위 : <strong className="text-[#d32f2f]">원</strong></p>
                </div>
              </div>

              {/* Hometax Auto Connect Notice Box (Screenshot layout) */}
              <div className="border border-slate-200 bg-[#fdfdfd] p-4 text-xs text-slate-700 space-y-2 rounded-xs">
                <div className="text-[#d32f2f] font-bold text-xs">
                  홈택스 재무데이터 자동 연계
                </div>
                <div className="text-slate-600 space-y-0.5 text-[11px] sm:text-xs leading-relaxed">
                  <p>- 홈택스에 결산 신고된 재무 데이터를 간편하고 정확하게 불러옵니다.</p>
                  <p>- 직접 입력하는 번거로움 없이 이노비즈 확인 신청에 필요한 정보를 자동으로 채워보세요.</p>
                  <p className="text-slate-500">※ 불러온 재무 정보 중 실제와 다르거나 변경이 필요한 부분은 직접 수정이 가능합니다.</p>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Hometax direct connection module is replaced by company 결산 auto fill
                      setFormData(DEFAULT_INNOBIZ_APPLICATION);
                      setSaveSuccessMsg('사내 공인 결산 재무제표(2024~2025) 데이터가 안전하게 연계 반영되었습니다.');
                      setTimeout(() => setSaveSuccessMsg(null), 3000);
                    }}
                    className="px-3 py-1.5 bg-[#8b2323] hover:bg-[#731c1c] text-white rounded-xs text-xs font-semibold transition-colors"
                  >
                    홈택스 재무데이터 연계하기
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoticeModalOpen(true)}
                    className="px-3 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xs text-xs font-semibold transition-colors"
                  >
                    공지사항 바로가기
                  </button>
                </div>
              </div>

              {/* Financial Year Inputs Table */}
              <div className="border border-slate-300 bg-white">
                
                {/* 1. 재무제표 사항 */}
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-b border-slate-300">
                  재무제표 사항
                </div>

                {/* Table Header: 항목 | 당기 2025 | 전기 2024 */}
                <div className="grid grid-cols-12 bg-[#f8f9fa] border-b border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 py-2 px-3">
                  <div className="col-span-4 sm:col-span-4 flex items-center">
                    항목
                  </div>
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-1.5 pl-2">
                    <span>당기</span>
                    <input
                      type="text"
                      value={formData.currentYear.year}
                      onChange={(e) => handleFinancialChange('currentYear', 'year', e.target.value as any)}
                      className="w-16 px-1.5 py-0.5 border border-slate-300 text-center font-bold bg-white text-xs"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-1.5 pl-2">
                    <span>전기</span>
                    <input
                      type="text"
                      value={formData.previousYear.year}
                      onChange={(e) => handleFinancialChange('previousYear', 'year', e.target.value as any)}
                      className="w-16 px-1.5 py-0.5 border border-slate-300 text-center font-bold bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Rows for 재무제표 사항 */}
                <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                  {[
                    { label: '매출액', field: 'salesRevenue', unit: '원' },
                    { label: '유동자산', field: 'currentAssets', unit: '원' },
                    { label: '재고자산', field: 'inventoryAssets', unit: '원' },
                    { label: '유동부채', field: 'currentLiabilities', unit: '원' },
                    { label: '총자산', field: 'totalAssets', unit: '원' },
                    { label: '당기 순이익', field: 'netIncome', unit: '원' },
                    { label: '영업이익', field: 'operatingIncome', unit: '원' },
                    { label: '차입금 (차입금+회사채)', field: 'borrowings', unit: '원' },
                    { label: '매출채권 (받을어음+외상매출금)', field: 'tradeReceivables', unit: '원' },
                  ].map((row) => (
                    <FinancialRow
                      key={row.field}
                      label={row.label}
                      unit={row.unit}
                      currentVal={formData.currentYear[row.field as keyof FinancialYearData] as number}
                      previousVal={formData.previousYear[row.field as keyof FinancialYearData] as number}
                      onCurrentChange={(val) => handleFinancialChange('currentYear', row.field as keyof FinancialYearData, val)}
                      onPreviousChange={(val) => handleFinancialChange('previousYear', row.field as keyof FinancialYearData, val)}
                    />
                  ))}
                </div>

                {/* 2. 대차대조표 사항 */}
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-t border-b border-slate-300">
                  대차대조표 사항
                </div>
                <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                  <FinancialRow
                    label="개발비 증가액&#10;(당해년 개발비-전년 개발비)"
                    unit="원"
                    currentVal={formData.currentYear.developmentCostIncrease}
                    previousVal={formData.previousYear.developmentCostIncrease}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'developmentCostIncrease', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'developmentCostIncrease', val)}
                  />
                </div>

                {/* 3. 손익계산서 사항 */}
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-t border-b border-slate-300">
                  손익계산서 사항
                </div>
                <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                  <FinancialRow
                    label="경상개발비.연구비"
                    unit="원"
                    currentVal={formData.currentYear.rdExpensesIncomeStmt}
                    previousVal={formData.previousYear.rdExpensesIncomeStmt}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'rdExpensesIncomeStmt', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'rdExpensesIncomeStmt', val)}
                  />
                  <FinancialRow
                    label="개발비 상각액"
                    unit="원"
                    currentVal={formData.currentYear.developmentAmortization}
                    previousVal={formData.previousYear.developmentAmortization}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'developmentAmortization', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'developmentAmortization', val)}
                  />
                </div>

                {/* 4. 제조원가명세서 사항 */}
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-t border-b border-slate-300">
                  제조원가명세서 사항
                </div>
                <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                  <FinancialRow
                    label="경상개발비"
                    unit="원"
                    currentVal={formData.currentYear.rdExpensesMfgCost}
                    previousVal={formData.previousYear.rdExpensesMfgCost}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'rdExpensesMfgCost', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'rdExpensesMfgCost', val)}
                  />
                </div>

                {/* 5. 일반사항 */}
                <div className="bg-[#e9ecef] px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 border-t border-b border-slate-300">
                  일반사항
                </div>
                <div className="divide-y divide-slate-200 text-xs sm:text-sm">
                  <FinancialRow
                    label="총 종업원수"
                    unit="명"
                    currentVal={formData.currentYear.totalEmployees}
                    previousVal={formData.previousYear.totalEmployees}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'totalEmployees', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'totalEmployees', val)}
                  />
                  <FinancialRow
                    label="연구인력"
                    unit="명"
                    currentVal={formData.currentYear.rndEmployees}
                    previousVal={formData.previousYear.rndEmployees}
                    onCurrentChange={(val) => handleFinancialChange('currentYear', 'rndEmployees', val)}
                    onPreviousChange={(val) => handleFinancialChange('previousYear', 'rndEmployees', val)}
                  />
                </div>

              </div>

              {/* R&D Ratio Preview Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">이노비즈 실시간 평가지표 계산 요약</span>
                </div>
                <div className="flex items-center gap-4 flex-wrap text-slate-600 font-medium">
                  <span>
                    총 R&D 투자액: <strong className="text-indigo-700">
                      {((formData.currentYear.rdExpensesIncomeStmt + formData.currentYear.rdExpensesMfgCost + formData.currentYear.developmentCostIncrease) / 100000000).toFixed(2)}억원
                    </strong>
                  </span>
                  <span>
                    R&D 투자비율: <strong className="text-emerald-700">
                      {formData.currentYear.salesRevenue > 0
                        ? (((formData.currentYear.rdExpensesIncomeStmt + formData.currentYear.rdExpensesMfgCost + formData.currentYear.developmentCostIncrease) / formData.currentYear.salesRevenue) * 100).toFixed(2)
                        : '0.00'}%
                    </strong>
                  </span>
                  <span>
                    연구인력 비율: <strong className="text-blue-700">
                      {formData.currentYear.totalEmployees > 0
                        ? (((formData.currentYear.rndEmployees) / formData.currentYear.totalEmployees) * 100).toFixed(1)
                        : '0.0'}%
                    </strong>
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* Bottom Action Navigation Buttons (Screenshot Style) */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-2.5 bg-[#5f6368] hover:bg-[#4d5156] text-white text-xs sm:text-sm font-bold rounded-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>이전단계로 가기</span>
              <span className="text-[10px]">▶</span>
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-[#e0382b] hover:bg-[#c62828] text-white text-xs sm:text-sm font-bold rounded-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>{activeSubStep === 'factory' ? '저장하고 다음으로 넘어가기' : '저장 및 평가지표 반영 완료'}</span>
              <span className="text-[10px]">▶</span>
            </button>
          </div>

        </div>

      </div>

      {/* Notice Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg p-5 max-w-md w-full shadow-2xl border border-slate-200 text-xs text-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">이노비즈 재무사항 입력 지침 안내</h3>
              <button onClick={() => setNoticeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p>• 재무제표는 국세청에 최종 확정 신고된 <strong>표준재무제표증명원</strong> 기준을 원칙으로 합니다.</p>
            <p>• 연구개발비는 손익계산서의 경상개발비·연구비와 제조원가명세서의 경상개발비의 합산액으로 산정됩니다.</p>
            <p>• 종업원수 및 연구인력은 결산월 기준 4대 사회보험 사업장가입자 명부 및 연구전담요원 신고 현황과 일치하여야 합니다.</p>
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setNoticeModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for individual table row with formatting
interface FinancialRowProps {
  label: string;
  unit: string;
  currentVal: number;
  previousVal: number;
  onCurrentChange: (val: number) => void;
  onPreviousChange: (val: number) => void;
}

const FinancialRow: React.FC<FinancialRowProps> = ({
  label,
  unit,
  currentVal,
  previousVal,
  onCurrentChange,
  onPreviousChange,
}) => {
  return (
    <div className="grid grid-cols-12 py-1.5 px-3 items-center hover:bg-slate-50/80 transition-colors">
      <div className="col-span-4 sm:col-span-4 font-medium text-slate-700 whitespace-pre-line leading-tight pr-2">
        {label}
      </div>
      <div className="col-span-4 sm:col-span-4 pl-2">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={currentVal === 0 ? '0' : currentVal.toLocaleString()}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9-]/g, '');
              const num = parseInt(raw, 10);
              onCurrentChange(isNaN(num) ? 0 : num);
            }}
            className="w-full sm:w-48 px-2 py-1 border border-slate-300 rounded-xs text-right text-xs font-mono focus:outline-none focus:border-slate-500 bg-white"
          />
          <span className="text-xs text-slate-500 shrink-0">{unit}</span>
        </div>
      </div>
      <div className="col-span-4 sm:col-span-4 pl-2">
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={previousVal === 0 ? '0' : previousVal.toLocaleString()}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9-]/g, '');
              const num = parseInt(raw, 10);
              onPreviousChange(isNaN(num) ? 0 : num);
            }}
            className="w-full sm:w-48 px-2 py-1 border border-slate-300 rounded-xs text-right text-xs font-mono focus:outline-none focus:border-slate-500 bg-white"
          />
          <span className="text-xs text-slate-500 shrink-0">{unit}</span>
        </div>
      </div>
    </div>
  );
};
