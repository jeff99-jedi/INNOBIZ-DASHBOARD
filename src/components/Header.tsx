import React from 'react';
import { Plus, FolderDown, RotateCcw, Search, ShieldCheck, HelpCircle, Building2, Sparkles, FileSpreadsheet, BookOpen, Layers, BarChart3, Home, Database } from 'lucide-react';
import { CompanyProfile } from '../types';

interface HeaderProps {
  currentView?: 'portal' | 'dashboard' | 'guide' | 'stats';
  onViewChange?: (view: 'portal' | 'dashboard' | 'guide' | 'stats') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreateModal: () => void;
  onOpenExportModal: () => void;
  onResetData: () => void;
  showLocationGuide: boolean;
  onToggleLocationGuide: () => void;
  company: CompanyProfile;
  onOpenCompanyModal: () => void;
  onOpenAutoDocModal: () => void;
  onOpenExcelAiModal?: () => void;
  onOpenInnoBizAppModal?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView = 'dashboard',
  onViewChange,
  searchQuery,
  onSearchChange,
  onOpenCreateModal,
  onOpenExportModal,
  onResetData,
  showLocationGuide,
  onToggleLocationGuide,
  company,
  onOpenCompanyModal,
  onOpenAutoDocModal,
  onOpenExcelAiModal,
  onOpenInnoBizAppModal,
  onOpenSupabaseModal,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Title & Company Badge */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onViewChange && onViewChange('portal')}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 transition-colors text-white flex items-center justify-center font-bold shadow-xs shrink-0 cursor-pointer"
              title="이노비즈 관리 프로그램 메인 포털로 이동"
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  이노비즈(InnoBiz) 인증 관리 시스템
                </span>
                <button
                  type="button"
                  onClick={onOpenCompanyModal}
                  className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="컨설팅 대상 기업 정보 및 로고/직인 설정"
                >
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Logo" className="w-3.5 h-3.5 object-contain" />
                  ) : (
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>{company.companyName}</span>
                  <span className="text-xs text-blue-600 underline ml-0.5">설정</span>
                </button>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                이노비즈 실무 문서 그룹 및 평가지표 관리기
              </h1>
            </div>
          </div>

          {/* Navigation View Switcher (Portal vs Guide Page vs Stats Page) */}
          {onViewChange && (
            <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => onViewChange('portal')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'portal'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="메인 포털 선택 화면으로 이동"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" />
                <span>메인 포털</span>
              </button>
              <button
                type="button"
                onClick={() => onViewChange('guide')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'guide'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>자가진단 안내서</span>
              </button>
              <button
                type="button"
                onClick={() => onViewChange('stats')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'stats'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>모의채점 통계</span>
                <span className="px-1.5 py-0.5 text-xs bg-amber-400 text-slate-950 font-bold rounded-full">
                  NEW
                </span>
              </button>
            </div>
          )}

          {/* Search & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {currentView === 'dashboard' && (
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="search-groups-input"
                  type="text"
                  placeholder="문서 그룹 검색..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            )}

            {onOpenSupabaseModal && (
              <button
                id="btn-supabase-admin-header"
                type="button"
                onClick={onOpenSupabaseModal}
                title="Supabase 클라우드 데이터베이스 연동 및 동기화"
                className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Supabase 연동</span>
              </button>
            )}

            <button
              id="btn-export-report"
              type="button"
              onClick={onOpenExportModal}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <FolderDown className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">자료실</span>
            </button>

            <button
              id="btn-reset-data"
              type="button"
              onClick={onResetData}
              title="기본 이노비즈 문서 서식으로 초기화"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
