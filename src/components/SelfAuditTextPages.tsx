import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Copy,
  Check,
  Building2,
  ArrowLeft,
  Sparkles,
  Layers,
  FolderDown,
  Loader2,
  FileCheck,
  FileSpreadsheet
} from 'lucide-react';
import { CompanyProfile, SelfAuditGuideItem } from '../types';
import { SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';
import {
  formatSingleItemText,
  triggerTextDownload,
  downloadAll62ItemsAsZip,
  downloadSelfAuditExcelFile
} from '../utils/selfAuditTextExport';

interface SelfAuditTextPagesProps {
  company: CompanyProfile;
  initialItemId?: string;
  onBackToGuide?: () => void;
  onBackToDashboard?: () => void;
  onBackToPortal?: () => void;
}

export const SelfAuditTextPages: React.FC<SelfAuditTextPagesProps> = ({
  company,
  initialItemId,
  onBackToGuide,
  onBackToDashboard,
  onBackToPortal,
}) => {
  const items = SELF_AUDIT_GUIDE_ITEMS;
  const totalCount = items.length; // 62

  // Current page index (0 to 61)
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(() => {
    if (initialItemId) {
      const idx = items.findIndex((it) => it.id === initialItemId);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const [partFilter, setPartFilter] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number } | null>(null);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const currentItem = items[currentPageIndex] || items[0];

  // Filtered list for sidebar navigation
  const filteredNavItems = useMemo(() => {
    return items
      .map((item, originalIndex) => ({ item, originalIndex }))
      .filter(({ item }) => {
        if (partFilter !== 'all' && item.partId !== partFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            item.evalItemCode.toLowerCase().includes(q) ||
            item.evalItemName.toLowerCase().includes(q) ||
            item.majorCategory.toLowerCase().includes(q) ||
            item.question.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [items, partFilter, searchQuery]);

  // Current formatted text for page
  const currentText = useMemo(() => {
    return formatSingleItemText(currentItem, company, currentPageIndex + 1, totalCount);
  }, [currentItem, company, currentPageIndex, totalCount]);

  // Handle Copy
  const handleCopyText = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download single item as .txt
  const handleDownloadSingle = () => {
    const pageNum = String(currentPageIndex + 1).padStart(2, '0');
    const safeCode = currentItem.evalItemCode.replace(/[/\\?%*:|"<>]/g, '-');
    const safeName = currentItem.evalItemName.replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${pageNum}_${safeCode}_${safeName}.txt`;
    triggerTextDownload(currentText, filename);
  };

  // Download all 62 items as ZIP
  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      setZipProgress({ current: 0, total: totalCount });
      await downloadAll62ItemsAsZip(company, (curr, tot) => {
        setZipProgress({ current: curr, total: tot });
      });
    } catch (err) {
      console.error('ZIP download error:', err);
      alert('전체 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  // Download complete Excel spreadsheet with all 62 items required docs + common docs
  const handleDownloadExcel = () => {
    try {
      setIsDownloadingExcel(true);
      downloadSelfAuditExcelFile(company);
    } catch (err) {
      console.error('Excel download error:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setTimeout(() => setIsDownloadingExcel(false), 800);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalCount - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-2.5">
            {onBackToDashboard ? (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>관리자 대시보드</span>
              </button>
            ) : onBackToGuide ? (
              <button
                type="button"
                onClick={onBackToGuide}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>자가진단 안내서</span>
              </button>
            ) : null}

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  자가진단 62개 항목 개별 텍스트 명세서
                </h1>
                <span className="text-[11px] text-slate-500">
                  {company.companyName} | 1페이지당 1항목 (총 {totalCount}개 페이지)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Single download & Batch ZIP download) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="현재 페이지 텍스트 전체 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '복사 완료' : '텍스트 복사'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSingle}
              className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="현재 페이지 TXT 파일 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">현재 페이지 저장(.txt)</span>
              <span className="sm:hidden">TXT</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadExcel}
              disabled={isDownloadingExcel}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="자가진단 62개 항목별 필요서류 및 이노비즈 공통서류 엑셀(.xlsx) 다운로드"
            >
              {isDownloadingExcel ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  <span>엑셀 생성 중...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">서류목록 엑셀(.xlsx)</span>
                  <span className="sm:hidden">엑셀</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
              title="62개 개별 파일 및 전체 통합본 일괄 압축 다운로드"
            >
              {isZipping ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>압축 생성 중 ({zipProgress?.current || 0}/{zipProgress?.total || 62})</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4 text-amber-300" />
                  <span>62개 전체 한번에 다운로드(.zip)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-5">
        {/* Left Sidebar: 62 Pages Navigation List (30% width on desktop) */}
        <aside className="w-full lg:w-80 shrink-0 bg-white border border-slate-200 rounded-2xl shadow-xs p-4 flex flex-col max-h-[calc(100vh-6.5rem)] lg:sticky lg:top-16">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>항목 페이지 목차 ({totalCount}개)</span>
            </h2>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              {currentPageIndex + 1} / {totalCount}
            </span>
          </div>

          {/* Part Filter Tabs */}
          <div className="grid grid-cols-5 gap-1 mb-2.5 text-[11px] font-semibold">
            {[
              { id: 'all', label: '전체' },
              { id: 'part1', label: 'PART1' },
              { id: 'part2', label: 'PART2' },
              { id: 'part3', label: 'PART3' },
              { id: 'part4', label: 'PART4' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPartFilter(tab.id as any)}
                className={`py-1 rounded-md text-center transition-colors cursor-pointer ${
                  partFilter === tab.id
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="문항 코드/항목명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Items Scroll List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {filteredNavItems.map(({ item, originalIndex }) => {
              const isActive = originalIndex === currentPageIndex;
              const pageStr = String(originalIndex + 1).padStart(2, '0');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentPageIndex(originalIndex)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all cursor-pointer flex items-start gap-2 border ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500/30 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    p.{pageStr}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-blue-700 shrink-0">{item.evalItemCode}</span>
                      <span className="truncate">{item.evalItemName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {item.majorCategory} · {item.points}점 · 서류 {item.requiredDocs.length}건
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Total Download Button in Sidebar */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <FolderDown className="w-3.5 h-3.5 text-amber-300" />
              <span>전체 62개 .ZIP 일괄 다운로드</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content: Individual Text Document Reader (70% width) */}
        <main className="flex-1 min-w-0 flex flex-col space-y-3">
          {/* Top Pagination & Info Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {currentItem.partName}
                  </span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {currentItem.majorCategory}
                  </span>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    배점: {currentItem.points}점
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  [{currentItem.evalItemCode}] {currentItem.evalItemName}
                </h2>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={currentPageIndex === 0}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-colors cursor-pointer"
                  title="이전 페이지 (이전 항목)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  <span>{currentPageIndex + 1}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-500">{totalCount}</span>
                </div>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={currentPageIndex === totalCount - 1}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 transition-colors cursor-pointer"
                  title="다음 페이지 (다음 항목)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ★ 필요서류 목록 (빠른 확인 배너) */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-black text-sm">★</span>
                <span className="text-xs font-bold text-slate-800">
                  필요서류 목록
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  (필수 {currentItem.requiredDocs.length}건
                  {currentItem.optionalDocs && currentItem.optionalDocs.length > 0
                    ? ` / 보조·가점 ${currentItem.optionalDocs.length}건`
                    : ''}
                  )
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentItem.requiredDocs.length > 0 ? (
                  currentItem.requiredDocs.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50/80 text-amber-950 border border-amber-200 shadow-2xs"
                    >
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-1 rounded">
                        필수 {idx + 1}
                      </span>
                      <span>{doc}</span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">별도 제출 서류 없음 (현장 실사 인터뷰 확인)</span>
                )}
                {currentItem.optionalDocs?.map((doc, idx) => (
                  <span
                    key={`opt-${idx}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1 rounded">
                      보조 {idx + 1}
                    </span>
                    <span>{doc}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Text Page Sheet (Monospace Paper Feel) */}
          <div className="bg-white border-2 border-slate-300/80 rounded-2xl shadow-md overflow-hidden flex flex-col flex-1">
            {/* Sheet Bar */}
            <div className="bg-slate-800 text-slate-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span className="font-bold text-white">
                  PAGE_{String(currentPageIndex + 1).padStart(2, '0')}_{currentItem.evalItemCode}.txt
                </span>
                <span className="text-slate-400 hidden sm:inline">
                  (순수 텍스트 명세서)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-sans font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-300" />}
                  <span>{copied ? '복사됨' : '복사'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSingle}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>다운로드</span>
                </button>
              </div>
            </div>

            {/* Pure Monospace Text Area */}
            <div className="p-5 sm:p-7 flex-1 bg-slate-50/50 overflow-x-auto">
              <pre className="font-mono text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                {currentText}
              </pre>
            </div>

            {/* Bottom Footer in Sheet */}
            <div className="bg-slate-100/90 border-t border-slate-200 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>기업명: <strong>{company.companyName}</strong> (대표: {company.ceoName})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span>페이지: <strong>{currentPageIndex + 1} / {totalCount}</strong></span>
                <span>•</span>
                <span>파일형식: UTF-8 텍스트(.txt)</span>
              </div>
            </div>
          </div>

          {/* Bottom Large Next / Prev Navigation Card */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPageIndex === 0}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-start gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <div className="text-left min-w-0">
                <span className="text-[11px] text-slate-400 block font-normal">이전 항목</span>
                <span className="truncate block">
                  {currentPageIndex > 0 ? items[currentPageIndex - 1].evalItemName : '첫 번째 항목입니다'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPageIndex === totalCount - 1}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-end gap-2 transition-colors cursor-pointer shadow-2xs text-right"
            >
              <div className="text-right min-w-0">
                <span className="text-[11px] text-slate-400 block font-normal">다음 항목</span>
                <span className="truncate block">
                  {currentPageIndex < totalCount - 1 ? items[currentPageIndex + 1].evalItemName : '마지막 항목입니다'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
