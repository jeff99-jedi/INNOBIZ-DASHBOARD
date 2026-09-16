/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DocumentGroup, InnoBizCategory, CompanyProfile } from './types';
import { INITIAL_INNOBIZ_GROUPS } from './data/defaultGroups';
import { DEFAULT_COMPANY_PROFILE } from './data/defaultCompany';
import { RAW_SHEET_ROWS } from './data/sheetData';
import { Header } from './components/Header';
import { MetricsOverview } from './components/MetricsOverview';
import { DocumentGroupCard } from './components/DocumentGroupCard';
import { CreateGroupModal } from './components/CreateGroupModal';
import { GroupDetailModal } from './components/GroupDetailModal';
import { ExportReportModal } from './components/ExportReportModal';
import { SheetMatrixView } from './components/SheetMatrixView';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { AutoDocGeneratorModal } from './components/AutoDocGeneratorModal';
import { ExcelAiConverterModal } from './components/ExcelAiConverterModal';
import { InnoBizApplicationModal } from './components/InnoBizApplicationModal';
import { SelfAuditGuidePage } from './components/SelfAuditGuidePage';
import { AuditStatisticsPage } from './components/AuditStatisticsPage';
import { PortalSelectionPage } from './components/PortalSelectionPage';
import { 
  FolderPlus, 
  Search, 
  Info, 
  ExternalLink, 
  CheckCircle, 
  BookOpen, 
  ShieldCheck,
  Building2,
  FileCheck2,
  LayoutGrid,
  FileSpreadsheet,
  Layers,
  Sparkles,
  FileText,
  BarChart3
} from 'lucide-react';

const STORAGE_KEY = 'innobiz_document_groups_v2_sheet';
const COMPANY_STORAGE_KEY = 'innobiz_company_profile_v1';

export default function App() {
  const [groups, setGroups] = useState<DocumentGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved groups:', e);
    }
    return INITIAL_INNOBIZ_GROUPS;
  });

  const [company, setCompany] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(COMPANY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If placeholder or previous draft was saved earlier, upgrade to the verified (주)더한농 profile
        if (
          parsed.companyName === '(주)한국기술혁신' || 
          !parsed.bizNumber || 
          parsed.bizNumber === '123-86-45678' ||
          parsed.rndCenterRegNo?.includes('2022113890') ||
          parsed.salesRevenue === '133.5억원'
        ) {
          localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(DEFAULT_COMPANY_PROFILE));
          return DEFAULT_COMPANY_PROFILE;
        }
        return { ...DEFAULT_COMPANY_PROFILE, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load company profile:', e);
    }
    return DEFAULT_COMPANY_PROFILE;
  });

  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [currentView, setCurrentView] = useState<'portal' | 'dashboard' | 'guide' | 'stats'>('portal');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<InnoBizCategory | 'all'>('all');
  const [activeDetailGroup, setActiveDetailGroup] = useState<DocumentGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAutoDocModalOpen, setIsAutoDocModalOpen] = useState(false);
  const [isExcelAiModalOpen, setIsExcelAiModalOpen] = useState(false);
  const [isInnoBizAppModalOpen, setIsInnoBizAppModalOpen] = useState(false);
  const [autoDocInitialId, setAutoDocInitialId] = useState<string | undefined>(undefined);
  const [recentlyCreatedId, setRecentlyCreatedId] = useState<string | null>(null);
  const [showLocationGuide, setShowLocationGuide] = useState(true);

  // Sync groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
    } catch (e) {
      console.error('Failed to persist groups:', e);
    }
  }, [groups]);

  // Sync company to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(company));
    } catch (e) {
      console.error('Failed to persist company profile:', e);
    }
  }, [company]);

  const handleCreateGroup = (newGroup: DocumentGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setRecentlyCreatedId(newGroup.id);
    setSelectedCategory('all');
    
    setTimeout(() => {
      setRecentlyCreatedId(null);
    }, 6000);
  };

  const handleUpdateGroup = (updatedGroup: DocumentGroup) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g))
    );
    setActiveDetailGroup(updatedGroup);
  };

  const handleDeleteGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    if (activeDetailGroup?.id === groupId) {
      setActiveDetailGroup(null);
    }
  };

  const handleResetData = () => {
    if (window.confirm('첨부해주신 시트 원본 기준 10개 실무 문서 그룹으로 다시 동기화하시겠습니까?')) {
      setGroups(INITIAL_INNOBIZ_GROUPS);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleQuickAddDoc = (group: DocumentGroup) => {
    setActiveDetailGroup(group);
  };

  const handleOpenAutoDocForGroup = (groupId: string) => {
    const map: Record<string, string> = {
      'innobiz-grp-2': 'doc-job-invention',
      'innobiz-grp-4': 'doc-trm-roadmap',
      'innobiz-grp-5': 'doc-dev-process',
      'innobiz-grp-6': 'doc-facility-ledger',
      'innobiz-grp-8': 'doc-ceo-policy',
      'innobiz-grp-10': 'doc-economic-impact',
      // Dynamic sheetData group IDs:
      'grp-rd-indicators': 'doc-sop-manual',
      'grp-tech-system': 'doc-job-invention',
      'grp-tech-accumulate': 'doc-facility-ledger',
      'grp-tech-analysis': 'doc-trm-roadmap',
      'grp-prod-commercial': 'doc-dev-process',
      'grp-prod-manufacture': 'doc-facility-ledger',
      'grp-prod-marketing': 'doc-trm-roadmap',
      'grp-mgmt-leadership': 'doc-ceo-policy',
      'grp-mgmt-governance': 'doc-ceo-policy',
      'grp-perf-results': 'doc-economic-impact',
    };
    setAutoDocInitialId(map[groupId] || undefined);
    setIsAutoDocModalOpen(true);
  };

  const handleOpenGroupFromGuide = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    if (target) {
      setActiveDetailGroup(target);
      setCurrentView('dashboard');
    } else {
      // Fallback: switch to dashboard
      setCurrentView('dashboard');
    }
  };

  // Filter groups
  const filteredGroups = groups.filter((group) => {
    // Category filter
    if (selectedCategory !== 'all' && group.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = group.title.toLowerCase().includes(q);
      const matchDesc = group.description.toLowerCase().includes(q);
      const matchDept = group.department.toLowerCase().includes(q);
      const matchDoc = group.documents.some((d) =>
        d.title.toLowerCase().includes(q) || 
        d.evalItem?.toLowerCase().includes(q) ||
        d.currentStatus?.toLowerCase().includes(q) ||
        (d.notes && d.notes.toLowerCase().includes(q))
      );
      return matchTitle || matchDesc || matchDept || matchDoc;
    }

    return true;
  });

  if (currentView === 'portal') {
    return (
      <PortalSelectionPage
        company={company}
        onSelectAdmin={() => setCurrentView('dashboard')}
        onSelectEvaluation={() => setCurrentView('guide')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 antialiased font-sans">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
        showLocationGuide={showLocationGuide}
        onToggleLocationGuide={() => setShowLocationGuide(!showLocationGuide)}
        company={company}
        onOpenCompanyModal={() => setIsCompanyModalOpen(true)}
        onOpenAutoDocModal={() => {
          setAutoDocInitialId(undefined);
          setIsAutoDocModalOpen(true);
        }}
        onOpenExcelAiModal={() => setIsExcelAiModalOpen(true)}
        onOpenInnoBizAppModal={() => setIsInnoBizAppModalOpen(true)}
      />

      {/* Main Container / View Switching: Dashboard vs Guide vs Stats */}
      {currentView === 'guide' ? (
        <SelfAuditGuidePage
          company={company}
          groups={groups}
          onOpenGroupDetail={handleOpenGroupFromGuide}
          onOpenAutoDocModal={(initialDocId) => {
            setAutoDocInitialId(initialDocId);
            setIsAutoDocModalOpen(true);
          }}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onBackToPortal={() => setCurrentView('portal')}
          onOpenStats={() => setCurrentView('stats')}
        />
      ) : currentView === 'stats' ? (
        <AuditStatisticsPage
          company={company}
          groups={groups}
          onNavigateToGuide={() => setCurrentView('guide')}
          onNavigateToDashboard={() => setCurrentView('dashboard')}
          onOpenGroupDetail={handleOpenGroupFromGuide}
          onOpenAutoDocModal={(initialDocId) => {
            setAutoDocInitialId(initialDocId);
            setIsAutoDocModalOpen(true);
          }}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Prominent "Where to see & Sheet Mapping" Callout Card */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap mb-2.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 backdrop-blur-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>컨설팅 기업 맞춤형 자동화 시스템 가동 중</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 rounded-full text-xs font-semibold text-white border border-blue-400/30">
                  <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>대상: {company.companyName} (대표: {company.ceoName})</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 rounded-full text-xs font-semibold text-emerald-200 border border-emerald-400/30">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                  <span>AI 엑셀 문서 분석 및 구글 독스 변환 지원</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                기업 정보와 로고를 넣으면 평가지표와 실무 서류가 즉시 자동 작성됩니다.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed">
                사내 엑셀 문서(.xlsx, .csv)를 올리면 <strong>AI가 데이터를 분석하여 구글 독스 규격의 서술 보고서로 자동 변환하고 알맞은 평가지표 문서그룹에 원클릭 등록</strong>합니다.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentView('guide')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ring-2 ring-blue-400/40"
                >
                  <BookOpen className="w-4 h-4 text-amber-300" />
                  <span>📘 자가진단 파트별 실무안내서</span>
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400 text-slate-950 font-black">
                    초안
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInnoBizAppModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ring-2 ring-red-400/40"
                >
                  <Building2 className="w-4 h-4 text-white" />
                  <span>📝 기업현황·재무사항 입력 (공식 서식)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExcelAiModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/30"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>📊 엑셀 → 구글 독스/이노비즈 AI 자동 변환</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAutoDocInitialId(undefined);
                    setIsAutoDocModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ring-2 ring-indigo-400/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>✨ 실무 서류 자동생성 (회사명·로고 삽입)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'cards' ? 'matrix' : 'cards')}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {viewMode === 'cards' ? (
                    <>
                      <FileSpreadsheet className="w-4 h-4 text-slate-300" />
                      <span>시트 표 보기</span>
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="w-4 h-4 text-slate-300" />
                      <span>카드 뷰 보기</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-slate-300" />
                  <span>실사 점검표</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Metrics & Category Filter Tabs */}
        <MetricsOverview
          groups={groups}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* View Mode Switcher & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              {viewMode === 'cards' ? (
                <>
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>
                    {selectedCategory === 'all'
                      ? '시트 기반 실무 문서 그룹 목록'
                      : `${
                          selectedCategory === 'tech_innovation'
                            ? '1. 기술혁신 능력'
                            : selectedCategory === 'tech_commercialize'
                            ? '2. 기술사업화 능력'
                            : selectedCategory === 'tech_management'
                            ? '3. 기술혁신 경영능력'
                            : selectedCategory === 'tech_performance'
                            ? '4. 기술혁신 성과'
                            : '사용자 맞춤'
                        } 문서 그룹`}
                  </span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span>첨부 시트 기준 평가지표 종합 매트릭스</span>
                </>
              )}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
              {viewMode === 'cards' ? `${filteredGroups.length}개 그룹` : '36개 평가항목 (1,000점 만점)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switch Buttons */}
            <div className="bg-slate-200 p-1 rounded-xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>문서 그룹 뷰</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === 'matrix'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>시트 표 뷰</span>
              </button>
            </div>

            {viewMode === 'cards' && (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer ml-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>그룹 추가</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic View: Cards vs Sheet Matrix */}
        {viewMode === 'matrix' ? (
          <SheetMatrixView
            groups={groups}
            onOpenGroupDetail={(grp) => setActiveDetailGroup(grp)}
          />
        ) : (
          <>
            {/* Groups Grid */}
            {filteredGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-5">
                {filteredGroups.map((group) => (
                  <DocumentGroupCard
                    key={group.id}
                    group={group}
                    onOpenDetail={(grp) => setActiveDetailGroup(grp)}
                    onQuickAddDoc={handleQuickAddDoc}
                    onDeleteGroup={handleDeleteGroup}
                    isRecentlyCreated={group.id === recentlyCreatedId}
                    onOpenAutoDoc={handleOpenAutoDocForGroup}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
                <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">검색 조건과 일치하는 문서 그룹이 없습니다.</h3>
                <p className="text-xs text-slate-400 mt-1">
                  검색어를 변경하시거나, 새로운 이노비즈 문서 그룹을 생성해보세요.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer mr-2"
                  >
                    필터 초기화
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    새 문서 그룹 만들기
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* InnoBiz Practical Tips Section */}
        <section className="mt-10 p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">
              이노비즈(InnoBiz) 인증 심사 및 현장실사 대응 가이드 (제공해주신 지표 기준)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            중소벤처기업부 기술혁신형 중소기업(InnoBiz) 평가는 온라인 자가진단(650점 이상) 후 기술보증기금 평가원의 현장실사(700점 이상 및 개별기술 70점 이상)를 통해 최종 확정됩니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">1. 기술혁신능력 (300점)</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                R&D 투자비율(2.08%), 기술인력 비율(28.57%), 공인부설연구소(3년미만), 특허 2건 보유 및 PMS 프로젝트 관리 증빙.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">2. 기술사업화능력 (300점)</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                생산 및 품질관리(배점 113점 집중관리), 신제품 개발매뉴얼, 핵심기술 보완 100%, 외주업체 평가 및 마케팅 기획서.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">3. 기술혁신경영 (166점)</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                대표자 동업종 경력 15년(자격득실확인서), 기술혁신 리더십, 복리후생 규정, 국세/지방세 완납증명 및 투명 재정.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-900 block mb-1">4. 기술혁신성과 (200점)</span>
              <p className="text-slate-500 text-xs leading-relaxed">
                2024년 매출 133.5억 / 순이익 6.7억 결산 재무제표(배점 91점), 원가절감 실적서, 수입대체 30% 기대효과 분석서.
              </p>
            </div>
          </div>
        </section>
      </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            이노비즈(INNO-BIZ) 기술혁신인증 준비 및 서류철 관리 시스템 · 첨부 시트 데이터 연동됨
          </div>
          <div className="flex items-center gap-3">
            <span>기술보증기금 평가지표 36개 항목 완벽 연계</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="text-blue-600 hover:underline cursor-pointer font-medium"
            >
              실사 종합대비표 인쇄
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      <GroupDetailModal
        isOpen={!!activeDetailGroup}
        group={activeDetailGroup}
        onClose={() => setActiveDetailGroup(null)}
        onUpdateGroup={handleUpdateGroup}
        onOpenAutoDoc={handleOpenAutoDocForGroup}
        onOpenExcelAi={() => setIsExcelAiModalOpen(true)}
        companyName={company.companyName}
      />

      <ExportReportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        groups={groups}
        company={company}
      />

      <CompanyProfileModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={company}
        onSave={(updated) => setCompany(updated)}
        onOpenInnoBizAppModal={() => setIsInnoBizAppModalOpen(true)}
      />

      <AutoDocGeneratorModal
        isOpen={isAutoDocModalOpen}
        onClose={() => setIsAutoDocModalOpen(false)}
        company={company}
        initialDocId={autoDocInitialId}
        onOpenCompanySettings={() => {
          setIsAutoDocModalOpen(false);
          setIsCompanyModalOpen(true);
        }}
      />

      <ExcelAiConverterModal
        isOpen={isExcelAiModalOpen}
        onClose={() => setIsExcelAiModalOpen(false)}
        groups={groups}
        company={company}
        onUpdateGroup={handleUpdateGroup}
        onOpenGroupDetail={(groupId) => {
          const target = groups.find((g) => g.id === groupId);
          if (target) {
            setActiveDetailGroup(target);
          }
        }}
      />

      <InnoBizApplicationModal
        isOpen={isInnoBizAppModalOpen}
        onClose={() => setIsInnoBizAppModalOpen(false)}
        company={company}
        onUpdateCompany={(updated) => setCompany(updated)}
      />
    </div>
  );
}
