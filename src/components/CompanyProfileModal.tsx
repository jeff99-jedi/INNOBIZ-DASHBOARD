import React, { useState, useRef } from 'react';
import { CompanyProfile } from '../types';
import { DEFAULT_COMPANY_PROFILE } from '../data/defaultCompany';
import { 
  Building2, 
  X, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  Check, 
  UserCheck, 
  TrendingUp, 
  Lightbulb, 
  FileBadge
} from 'lucide-react';

interface CompanyProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
  onOpenInnoBizAppModal?: () => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  onClose,
  company,
  onSave,
  onOpenInnoBizAppModal,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(company);
  const [activeTab, setActiveTab] = useState<'basic' | 'tech' | 'metrics' | 'branding'>('basic');
  const [savedNotice, setSavedNotice] = useState(false);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        handleChange('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        handleChange('sealUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm('기본 시트 예시 데이터로 초기화하시겠습니까?')) {
      setFormData(DEFAULT_COMPANY_PROFILE);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl my-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  컨설팅 대상 기업 정보 및 자동 서식 설정
                </h2>
                <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                  자동 문서 연동
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                기업 정보를 입력하시면 평가지표 현황 및 모든 사내 규정/증빙 서류에 회사명과 로고가 자동 삽입됩니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 sm:px-6 gap-2 text-xs font-semibold overflow-x-auto no-scrollbar">
          {[
            { id: 'basic', label: '1. 기본 및 조직 정보', icon: Building2 },
            { id: 'tech', label: '2. 주력 제품 및 기술', icon: Lightbulb },
            { id: 'metrics', label: '3. 이노비즈 정량 지표', icon: TrendingUp },
            { id: 'branding', label: '4. 로고 및 직인 등록', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          {onOpenInnoBizAppModal && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#d32f2f] text-white flex items-center justify-center font-bold text-[10px]">
                  공식
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    이노비즈 신규신청 공식 서식(공장·주생산품 및 2개년 재무사항 입력)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    실제 이노비즈 공식 사이트와 동일한 공장 등록 및 당기/전기 재무제표 표 입력 양식입니다.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInnoBizAppModal();
                }}
                className="px-3 py-1.5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                공식 서식 열기 &gt;
              </button>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    회사명 (상호) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: (주)한국기술혁신"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">서류 표지 및 조항 전반에 반영됩니다.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    대표자 성명 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 홍길동"
                    value={formData.ceoName}
                    onChange={(e) => handleChange('ceoName', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    사업자등록번호
                  </label>
                  <input
                    type="text"
                    placeholder="예: 423-88-01952"
                    value={formData.bizNumber}
                    onChange={(e) => handleChange('bizNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    법인등록번호
                  </label>
                  <input
                    type="text"
                    placeholder="예: 151111-0081235"
                    value={formData.corpNumber || ''}
                    onChange={(e) => handleChange('corpNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    개업(설립)연월일
                  </label>
                  <input
                    type="date"
                    value={formData.establishedDate}
                    onChange={(e) => handleChange('establishedDate', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    전자세금계산서 전용 이메일
                  </label>
                  <input
                    type="email"
                    placeholder="예: sae-mi@saemigroup.com"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    사업장 소재지 (본사 / 공장)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 충청북도 충주시 주덕읍 상전1길 17"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    관할 세무서
                  </label>
                  <input
                    type="text"
                    placeholder="예: 충주세무서"
                    value={formData.taxOffice || ''}
                    onChange={(e) => handleChange('taxOffice', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    기업부설연구소(전담부서) 명칭
                  </label>
                  <input
                    type="text"
                    placeholder="예: (주)한국기술혁신 기술연구소"
                    value={formData.rndCenterName}
                    onChange={(e) => handleChange('rndCenterName', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    연구소 인정번호 (KOITA 인가)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 제 2021114521호"
                    value={formData.rndCenterRegNo}
                    onChange={(e) => handleChange('rndCenterRegNo', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECH & PRODUCT */}
          {activeTab === 'tech' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주요 업종 및 품목 분류
                </label>
                <input
                  type="text"
                  placeholder="예: 제조업 / 정밀 전자·광학 부품 제조"
                  value={formData.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  대표 주력 제품명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 스마트 산업용 고신뢰성 센서 및 제어 모듈"
                  value={formData.mainProduct}
                  onChange={(e) => handleChange('mainProduct', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">신제품 개발 절차서, 품질작업표준서에 자동 기재됩니다.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  핵심 기술명 및 특징
                </label>
                <input
                  type="text"
                  placeholder="예: 초미세 광전 센싱 및 실시간 노이즈 필터링 제어 기술"
                  value={formData.coreTechnology}
                  onChange={(e) => handleChange('coreTechnology', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">중장기 기술 로드맵(TRM) 및 특허 직무발명 규정에 반영됩니다.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  주요 타겟 시장 및 고객사 / 경쟁 현황
                </label>
                <textarea
                  rows={3}
                  placeholder="예: 국내외 스마트팩토리 자동화 설비 제조사 및 반도체 검사 장비 업체"
                  value={formData.targetMarket}
                  onChange={(e) => handleChange('targetMarket', e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: INNOBIZ QUANTITATIVE METRICS */}
          {activeTab === 'metrics' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                💡 <strong>안내:</strong> 첨부해주셨던 이노비즈 자가진단표의 실제 수치들입니다. 컨설팅 대상 회사의 최근 결산 재무제표 및 인력 현황에 맞춰 수정하시면 문서에 즉시 계산 반영됩니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    최근 결산 연간 매출액
                  </label>
                  <input
                    type="text"
                    placeholder="예: 133.5억원"
                    value={formData.salesRevenue}
                    onChange={(e) => handleChange('salesRevenue', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    당기 순이익
                  </label>
                  <input
                    type="text"
                    placeholder="예: 6.7억원"
                    value={formData.netIncome}
                    onChange={(e) => handleChange('netIncome', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    R&D(연구개발비) 투자비율
                  </label>
                  <input
                    type="text"
                    placeholder="예: 2.08%"
                    value={formData.rndRatio}
                    onChange={(e) => handleChange('rndRatio', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    연간 연구개발비 총액
                  </label>
                  <input
                    type="text"
                    placeholder="예: 2.78억원"
                    value={formData.rndAmount}
                    onChange={(e) => handleChange('rndAmount', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    기술인력 비율 및 인원
                  </label>
                  <input
                    type="text"
                    placeholder="예: 28.57% (연구원 8명 / 총 28명)"
                    value={formData.techPersonnelRatio}
                    onChange={(e) => handleChange('techPersonnelRatio', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    대표자 동업종 종사 경력
                  </label>
                  <input
                    type="text"
                    placeholder="예: 15년"
                    value={formData.ceoIndustryExperience}
                    onChange={(e) => handleChange('ceoIndustryExperience', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    보유 특허권 건수
                  </label>
                  <input
                    type="text"
                    placeholder="예: 등록 2건, 출원 1건"
                    value={formData.patentCount}
                    onChange={(e) => handleChange('patentCount', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    수입대체 또는 원가절감 효과
                  </label>
                  <input
                    type="text"
                    placeholder="예: 수입대체 30%"
                    value={formData.importSubstitutionRatio}
                    onChange={(e) => handleChange('importSubstitutionRatio', e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING (LOGO & SEAL) */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                회사 로고와 직인 이미지를 등록하시면, 자동으로 생성되는 <strong>모든 사내 규정집 상단 헤더와 하단 대표이사 날인란에 실제 이미지로 삽입</strong>되어 인쇄/출력할 수 있습니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">회사 CI / 로고 이미지</span>
                  
                  <div className="w-48 h-24 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2 bg-slate-50 relative overflow-hidden mb-3">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Company Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                        <span className="text-[11px]">로고 미등록 (기본 텍스트 사용)</span>
                      </div>
                    )}
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>로고 이미지 업로드</span>
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('logoUrl', '')}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>

                {/* Seal Upload */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-slate-800 mb-2">대표이사 직인 (도장)</span>

                  <div className="w-28 h-28 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center p-2 bg-slate-50 relative overflow-hidden mb-3">
                    {formData.sealUrl ? (
                      <img
                        src={formData.sealUrl}
                        alt="Company Seal Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-rose-400/50 bg-rose-50/50 flex items-center justify-center text-rose-700 text-xs font-black rotate-[-12deg]">
                        직인생략
                      </div>
                    )}
                  </div>

                  <input
                    ref={sealInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSealUpload}
                    className="hidden"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => sealInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>도장/직인 이미지 업로드</span>
                    </button>
                    {formData.sealUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('sealUrl', '')}
                        className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer self-start sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>기본 시트 예시값으로 채우기</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>저장 완료!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>회사 정보 저장 및 서류 일괄 동기화</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
