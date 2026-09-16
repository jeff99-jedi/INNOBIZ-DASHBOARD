import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  Building2, 
  Sparkles, 
  ArrowRight, 
  FileSpreadsheet, 
  Layers, 
  Award, 
  CheckCircle2, 
  HelpCircle,
  FileCheck2,
  FolderLock
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { AdminPasswordModal } from './AdminPasswordModal';

interface PortalSelectionPageProps {
  company: CompanyProfile;
  onSelectAdmin: () => void;
  onSelectEvaluation: () => void;
}

export const PortalSelectionPage: React.FC<PortalSelectionPageProps> = ({
  company,
  onSelectAdmin,
  onSelectEvaluation,
}) => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const handleAdminClick = () => {
    setIsAdminModalOpen(true);
  };

  const handleAdminSuccess = () => {
    setIsAdminModalOpen(false);
    onSelectAdmin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-blue-50/40 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Subtle Bar */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                INNO-BIZ
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500 font-medium">
                기술혁신형 중소기업 모의 인증 시스템
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{company.companyName}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero & 2 Big Box Menus */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 flex flex-col items-center justify-center">
        
        {/* Title Section with 3D Embossed Font Shadow */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-2xs mb-4 animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>기술보증기금 4대 분야 62개 평가지표 통합 플랫폼</span>
          </div>

          {/* 3D Embossed Title with customized multi-layered text shadow */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight select-none"
            style={{
              textShadow: '0 1px 0 #cbd5e1, 0 2px 0 #94a3b8, 0 3px 0 #64748b, 0 4px 6px rgba(15, 23, 42, 0.2), 0 10px 25px rgba(30, 58, 138, 0.15)'
            }}
          >
            이노비즈 관리 프로그램
          </h1>

          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            인증 컨설턴트 및 수임 기업 담당자를 위한 2대 포털 환경을 제공합니다.<br className="hidden sm:inline" />
            원하시는 메뉴를 선택하여 문서 구축 또는 모의 평가를 진행해 주세요.
          </p>
        </div>

        {/* 2 Big Box Menus */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl">
          
          {/* =========================================================
              BOX 1: 관리자 페이지 (Admin Portal)
             ========================================================= */}
          <div 
            onClick={handleAdminClick}
            className="group relative bg-white border-2 border-slate-200 hover:border-indigo-500 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 overflow-hidden"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-slate-800 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                  <FolderLock className="w-7 h-7 text-indigo-300" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1 shadow-2xs">
                    <Lock className="w-3 h-3 text-indigo-600" />
                    <span>보안 인증 필요</span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    컨설턴트 · 마스터 전용
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                관리자 페이지
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                컨설턴트 전용 종합 관리자 공간으로, 36개 세부 서류철 관리, 사내 엑셀 AI 서술 보고서 변환, 맞춤 서식 자동생성 및 기업체 프로필을 관리합니다.
              </p>

              {/* Included Modules Checklist */}
              <div className="mt-5 space-y-2 text-xs text-slate-700 bg-slate-50/80 group-hover:bg-indigo-50/40 p-4 rounded-2xl border border-slate-100 transition-colors">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>문서 대시보드</strong> (36개 서류철 그룹 구축 및 첨부 관리)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>사내 엑셀 AI 변환</strong> (독스 보고서 및 지표 자동등록)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>기업 정보 및 직인 설정</strong> (신청서 및 재무정보)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span><strong>실사 종합 점검표</strong> 인쇄 및 보고서 내보내기</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>비밀번호 4자리 인증</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors">
                <span>관리자 로그인</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* =========================================================
              BOX 2: 이노비즈 모의평가 (Evaluation Portal)
             ========================================================= */}
          <div 
            onClick={onSelectEvaluation}
            className="group relative bg-white border-2 border-slate-200 hover:border-blue-500 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 overflow-hidden ring-1 ring-blue-500/20"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 opacity-90 group-hover:opacity-100 transition-opacity" />

            <div>
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-700 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                  <Award className="w-7 h-7 text-amber-300" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>기업 담당자 추천</span>
                  </span>
                  <span className="text-xs text-emerald-600 font-bold">
                    즉시 열람 가능 (비밀번호 없음)
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
                이노비즈 모의평가
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                수임 기업 담당자가 온라인에서 자가진단 4대 분야 62개 세부 평가지표를 1,000점 만점으로 직접 모의 채점하고, 현장실사 가점 전략과 필수 서류철을 확인합니다.
              </p>

              {/* Included Modules Checklist */}
              <div className="mt-5 space-y-2 text-xs text-slate-700 bg-blue-50/50 group-hover:bg-blue-50/80 p-4 rounded-2xl border border-blue-100/70 transition-colors">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>자가진단 파트별 실무안내서</strong> (62개 전 지표 완벽 수록)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>실시간 1,000점 모의채점</strong> (700점 합격선 실시간 판정)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>💡 전문가 실무 대응 및 가점 확보 전략</strong> (문항별 연동)</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>📑 현장실사 필수 준비 서류철 안내</strong> (기보 심사관 제시용)</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>기업 실무자 자율 진단 모드</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors">
                <span>모의평가 시작하기</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Trust/Company Info */}
        <div className="mt-10 sm:mt-12 text-center text-xs text-slate-500">
          <p>
            본 시스템은 <strong>{company.companyName}</strong>의 기술보증기금 이노비즈(InnoBiz) 기술혁신 인증 획득을 위해 구축되었습니다.
          </p>
          <p className="mt-1 text-slate-400">
            관리자 모드는 서류철 편집 권한을 보호하기 위해 4자리 비밀번호로 보호됩니다.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 text-center text-xs text-slate-400">
        이노비즈(InnoBiz) 기술혁신형 중소기업 인증 실무 포털 시스템
      </footer>

      {/* Password Modal */}
      <AdminPasswordModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />
    </div>
  );
};
