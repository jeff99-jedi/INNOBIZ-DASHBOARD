import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderPlus,
  Sparkles,
  Printer,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  FileCheck,
  ArrowRight,
  RotateCcw,
  Award,
  TrendingUp,
  SlidersHorizontal,
  CheckSquare,
  ListChecks,
  BarChart3,
  ExternalLink,
  Target,
} from 'lucide-react';
import { CompanyProfile, DocumentGroup, SelfAuditGuideItem, SelfAuditOption } from '../types';
import { SELF_AUDIT_PARTS, SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';

interface SelfAuditGuidePageProps {
  company: CompanyProfile;
  groups: DocumentGroup[];
  onOpenGroupDetail: (groupId: string) => void;
  onOpenAutoDocModal: (initialDocId?: string) => void;
  onBackToDashboard: () => void;
  onBackToPortal?: () => void;
  onOpenStats?: () => void;
}

const CHECK_STORAGE_KEY = 'innobiz_self_audit_checklist_v2';
const OPTIONS_STORAGE_KEY = 'innobiz_self_audit_selected_options_v2';

export const SelfAuditGuidePage: React.FC<SelfAuditGuidePageProps> = ({
  company,
  groups,
  onOpenGroupDetail,
  onOpenAutoDocModal,
  onBackToDashboard,
  onBackToPortal,
  onOpenStats,
}) => {
  const [selectedPartId, setSelectedPartId] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track expanded cards
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    SELF_AUDIT_GUIDE_ITEMS.forEach((item, idx) => {
      // First 3 items expanded initially for quick preview
      init[item.id] = idx < 3;
    });
    return init;
  });

  // Track checklist completion
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECK_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load checklist:', e);
    }
    return {};
  });

  // Track selected option (1~5) for each question - Initially empty (0 / 1,000 points)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load selected options:', e);
    }
    return {};
  });

  // Track active item for right column inspection (defaults to first item)
  const [activeItemId, setActiveItemId] = useState<string>(() => {
    return SELF_AUDIT_GUIDE_ITEMS[0]?.id || 'part1_1_1';
  });

  const [filterCompletedOnly, setFilterCompletedOnly] = useState<'all' | 'completed' | 'pending'>('all');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist checklist
  useEffect(() => {
    try {
      localStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(completedItems));
    } catch (e) {
      console.error('Failed to persist checklist:', e);
    }
  }, [completedItems]);

  // Persist selected options
  useEffect(() => {
    try {
      localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(selectedOptions));
    } catch (e) {
      console.error('Failed to persist options:', e);
    }
  }, [selectedOptions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      all[item.id] = true;
    });
    setExpandedItems(all);
  };

  const handleCollapseAll = () => {
    setExpandedItems({});
  };

  const toggleComplete = (id: string) => {
    setCompletedItems((prev) => {
      const nextVal = !prev[id];
      if (nextVal) {
        showToast('해당 항목의 실무 점검이 완료로 체크되었습니다.');
      }
      return { ...prev, [id]: nextVal };
    });
  };

  // Option selection handler
  const handleSelectOption = (itemId: string, optionNumber: number) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [itemId]: optionNumber,
    }));
  };

  // Quick Action 1: Fill all items with recommended maximum points (1,000점)
  const handleApplyRecommendedAll = () => {
    const recMap: Record<string, number> = {};
    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      recMap[item.id] = item.defaultSelectedOptionNumber || 1;
    });
    setSelectedOptions(recMap);
    showToast(`전체 ${SELF_AUDIT_GUIDE_ITEMS.length}개 평가지표에 최적 권장 옵션이 적용되어 모의 총점 1,000점이 계산되었습니다.`);
  };

  // Quick Action 2: Reset options to initial 0 points
  const handleResetOptions = () => {
    if (window.confirm('모의 채점 선택 내역을 모두 초기화(0점)하시겠습니까?')) {
      setSelectedOptions({});
      localStorage.removeItem(OPTIONS_STORAGE_KEY);
      showToast('모의 채점 선택이 0점으로 초기화되었습니다.');
    }
  };

  // Quick Action 3: Checklist all complete
  const handleCheckAll = () => {
    const all: Record<string, boolean> = {};
    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      all[item.id] = true;
    });
    setCompletedItems(all);
    showToast(`전체 ${totalCount}개 지표의 실무 서류 준비 상태가 완료로 표시되었습니다.`);
  };

  // Quick Action 4: Reset checklist
  const handleResetChecklist = () => {
    if (window.confirm('서류 점검 체크 상태를 모두 초기화하시겠습니까?')) {
      setCompletedItems({});
      localStorage.removeItem(CHECK_STORAGE_KEY);
      showToast('체크리스트가 초기화되었습니다.');
    }
  };

  // Score calculations
  const scoreCalculations = useMemo(() => {
    let totalScore = 0;
    const maxScore = 1000;
    const partScores: Record<string, { scored: number; max: number; itemsCount: number }> = {
      part1: { scored: 0, max: 300, itemsCount: 0 },
      part2: { scored: 0, max: 300, itemsCount: 0 },
      part3: { scored: 0, max: 200, itemsCount: 0 },
      part4: { scored: 0, max: 200, itemsCount: 0 },
    };

    let answeredCount = 0;

    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      const selectedNum = selectedOptions[item.id];
      if (selectedNum !== undefined) {
        answeredCount += 1;
        const chosenOpt = item.options.find((o) => o.optionNumber === selectedNum) || item.options[0];
        const optPoints = chosenOpt ? chosenOpt.points : 0;

        totalScore += optPoints;
        if (partScores[item.partId]) {
          partScores[item.partId].scored += optPoints;
          partScores[item.partId].itemsCount += 1;
        }
      }
    });

    Object.keys(partScores).forEach((k) => {
      partScores[k].scored = Math.round(partScores[k].scored * 10) / 10;
    });

    const isPassed = totalScore >= 700;
    const passMargin = totalScore - 700;

    return {
      totalScore: Math.round(totalScore * 10) / 10,
      maxScore,
      isPassed,
      passMargin: Math.round(passMargin * 10) / 10,
      partScores,
      percentage: Math.round((totalScore / maxScore) * 100),
      answeredCount,
    };
  }, [selectedOptions]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return SELF_AUDIT_GUIDE_ITEMS.filter((item) => {
      // Part filter
      if (selectedPartId !== 'all' && item.partId !== selectedPartId) {
        return false;
      }

      // Completion filter
      const isDone = !!completedItems[item.id];
      if (filterCompletedOnly === 'completed' && !isDone) return false;
      if (filterCompletedOnly === 'pending' && isDone) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.evalItemName.toLowerCase().includes(q);
        const matchCat = item.majorCategory.toLowerCase().includes(q);
        const matchQ = item.question.toLowerCase().includes(q);
        const matchReq = item.requirements.some((r) => r.toLowerCase().includes(q));
        const matchStrat = item.strategy.some((s) => s.toLowerCase().includes(q));
        const matchDocs = item.requiredDocs.some((d) => d.toLowerCase().includes(q));
        const matchTip = item.practicalTip?.toLowerCase().includes(q) || false;
        const matchOptions = item.options.some((o) => o.text.toLowerCase().includes(q));
        return (
          matchTitle ||
          matchCat ||
          matchQ ||
          matchReq ||
          matchStrat ||
          matchDocs ||
          matchTip ||
          matchOptions
        );
      }

      return true;
    });
  }, [selectedPartId, searchQuery, filterCompletedOnly, completedItems]);

  // Active item for right strategy rail
  const activeItem = useMemo(() => {
    return (
      SELF_AUDIT_GUIDE_ITEMS.find((item) => item.id === activeItemId) ||
      filteredItems[0] ||
      SELF_AUDIT_GUIDE_ITEMS[0]
    );
  }, [activeItemId, filteredItems]);

  const navigateItem = (direction: -1 | 1) => {
    const list = filteredItems.length > 0 ? filteredItems : SELF_AUDIT_GUIDE_ITEMS;
    const currentIdx = list.findIndex((item) => item.id === activeItem.id);
    if (currentIdx === -1) return;
    const nextIdx = (currentIdx + direction + list.length) % list.length;
    const targetItem = list[nextIdx];
    if (targetItem) {
      setActiveItemId(targetItem.id);
      const el = document.getElementById(`guide-item-${targetItem.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Checklist counts
  const totalCount = SELF_AUDIT_GUIDE_ITEMS.length;
  const completedCount = useMemo(() => {
    return SELF_AUDIT_GUIDE_ITEMS.filter((item) => !!completedItems[item.id]).length;
  }, [completedItems]);

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Copy complete simulated audit report to clipboard
  const handleCopyAuditReport = async () => {
    const text =
      `[이노비즈 온라인 자가진단 모의 평가표 및 실무 대응표]\n` +
      `============================================================\n` +
      `■ 대상기업: ${company.companyName} (대표자: ${company.ceoName})\n` +
      `■ 진단일시: ${new Date().toLocaleDateString('ko-KR')}\n` +
      `■ 모의 자가진단 종합점수: ${scoreCalculations.totalScore}점 / 1,000점 (${scoreCalculations.percentage}%)\n` +
      `■ 판정 결과: ${scoreCalculations.isPassed ? '★ 통과 (700점 이상 현장실사 신청 가능)' : '▲ 보완 필요 (700점 미만)'}\n` +
      `■ 파트별 취득점수 현황:\n` +
      `   - Part 1. 기술혁신 능력: ${scoreCalculations.partScores.part1.scored}점 / 300점\n` +
      `   - Part 2. 기술사업화 능력: ${scoreCalculations.partScores.part2.scored}점 / 300점\n` +
      `   - Part 3. 기술혁신 경영능력: ${scoreCalculations.partScores.part3.scored}점 / 200점\n` +
      `   - Part 4. 기술혁신 성과: ${scoreCalculations.partScores.part4.scored}점 / 200점\n` +
      `============================================================\n\n` +
      SELF_AUDIT_PARTS.map((part) => {
        const items = SELF_AUDIT_GUIDE_ITEMS.filter((i) => i.partId === part.partId);
        return (
          `【 ${part.partName} 】\n` +
          `------------------------------------------------------------\n` +
          items
            .map((item, idx) => {
              const selectedNum = selectedOptions[item.id] ?? (item.defaultSelectedOptionNumber || 1);
              const chosen = item.options.find((o) => o.optionNumber === selectedNum) || item.options[0];
              const isChecked = completedItems[item.id] ? '[점검완료]' : '[대응중]';

              return (
                `${idx + 1}. [${item.evalItemCode}] ${item.evalItemName} (배점: ${item.points}점) ${isChecked}\n` +
                `   - 질문: ${item.question}\n` +
                `   - [선택 보기]: ${chosen.optionLabel} ${chosen.text} => ${chosen.points}점 (${chosen.scoreRate}%)\n` +
                `   - 전체 보기항목:\n` +
                item.options
                  .map(
                    (opt) =>
                      `     ${opt.optionNumber === selectedNum ? '▶' : ' '} ${opt.optionLabel} [${opt.grade}등급/${opt.points}점] ${opt.text}${
                        opt.isRecommended ? ' (권장)' : ''
                      }`
                  )
                  .join('\n') +
                `\n   - 필수 준비서류: ${item.requiredDocs.join(', ')}\n` +
                `   - 실무 대응방안: ${item.strategy[0]}\n`
              );
            })
            .join('\n')
        );
      }).join('\n\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      showToast('자가진단 평가표 전문이 클립보드에 복사되었습니다.');
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (e) {
      console.error('Clipboard copy error:', e);
    }
  };

  const handlePrint = () => {
    const allExpanded: Record<string, boolean> = {};
    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      allExpanded[item.id] = true;
    });
    setExpandedItems(allExpanded);

    showToast('전체 문항의 세부 평가내역을 펼쳐 인쇄 및 PDF 저장 창을 호출합니다.');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-xs animate-fade-in print:hidden border border-slate-700">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container: 1440px / 3단 구성 (좌측 20%, 가운데 60%, 우측 20%) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-4 py-5">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          
          {/* =========================================================================
              LEFT COLUMN (20%): 자가진단 모의 종합점수 & 4개 PART 점수 카드 (Image 1)
             ========================================================================= */}
          <div className="w-full lg:w-[20%] xl:w-[20%] shrink-0 space-y-3 lg:sticky lg:top-16 max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-thin print:hidden">
            
            {/* Top Score Card (matching Image 1) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${scoreCalculations.totalScore > 0 ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span className="font-semibold text-blue-200">자가진단 모의 종합점수</span>
                </div>
                <span className="text-slate-400 text-xs shrink-0">
                  {scoreCalculations.answeredCount}/{totalCount}
                </span>
              </div>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {scoreCalculations.totalScore}
                </span>
                <span className="text-xs text-slate-400 font-semibold">/ 1,000점</span>
              </div>

              {/* Status Badge (matching Image 1) */}
              <div className="mt-2">
                {scoreCalculations.totalScore === 0 ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-xl text-xs font-semibold text-slate-300 w-full">
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">진단 대기 (보기 선택)</span>
                  </div>
                ) : scoreCalculations.isPassed ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-xs font-bold text-emerald-300 w-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">합격 기준 통과 (+{scoreCalculations.passMargin}점)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs font-bold text-rose-300 w-full">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">미달 (-{(700 - scoreCalculations.totalScore).toFixed(1).replace(/\.0$/, '')}점 보완)</span>
                  </div>
                )}
              </div>

              {/* 700-Point Target Gauge (matching Image 1) */}
              <div className="mt-3">
                <div className="flex justify-between items-center text-xs text-slate-300 mb-1 font-medium">
                  <span>진척률 {scoreCalculations.percentage}%</span>
                  <span className="text-amber-300 font-semibold">합격선 700점 (70%)</span>
                </div>
                <div className="relative w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      scoreCalculations.isPassed ? 'bg-emerald-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(100, scoreCalculations.percentage)}%` }}
                  />
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-10"
                    style={{ left: '70%' }}
                    title="현장실사 합격선: 700점"
                  />
                </div>
              </div>

              {/* Two Action Buttons (matching Image 1) */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplyRecommendedAll}
                  className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="모든 문항에 1,000점 만점 권장 옵션 일괄 적용"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>1,000점 적용</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetOptions}
                  className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                  title="0점으로 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>초기화</span>
                </button>
              </div>
            </div>

            {/* 4 PART Cards (matching Image 1) */}
            <div className="space-y-2">
              {SELF_AUDIT_PARTS.map((part) => {
                const pScore = scoreCalculations.partScores[part.partId];
                const rawScored = pScore ? pScore.scored : 0;
                const scored = Math.round(rawScored * 10) / 10;
                const percent = Math.round((scored / part.totalPoints) * 100);
                const isSelected = selectedPartId === part.partId;

                return (
                  <button
                    key={part.partId}
                    type="button"
                    onClick={() => setSelectedPartId(selectedPartId === part.partId ? 'all' : (part.partId as any))}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 truncate">{part.partName}</span>
                        <span className="text-slate-400 text-xs shrink-0">{part.totalPoints}점</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 leading-snug">
                        {part.description}
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-black text-slate-900 text-sm">
                          {scored}
                          <span className="font-normal text-slate-400 text-xs"> / {part.totalPoints}점</span>
                        </span>
                        <span className={`font-bold ${percent >= 70 ? 'text-emerald-600' : 'text-blue-600'}`}>
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percent >= 70 ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* =========================================================================
              CENTER COLUMN (60%): 상단 헤더, 검색/필터, 62개 평가지표 문항 & 1~5등급 모의선택
             ========================================================================= */}
          <div className="w-full lg:w-[60%] xl:w-[60%] min-w-0 flex-1 space-y-4">
            
              {/* Status Filter & Toggle Controls */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-xl text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setFilterCompletedOnly('all')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        filterCompletedOnly === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      전체 ({totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterCompletedOnly('pending')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        filterCompletedOnly === 'pending' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      미완료 ({totalCount - completedCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterCompletedOnly('completed')}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        filterCompletedOnly === 'completed' ? 'bg-emerald-600 text-white font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      완료 ({completedCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      모두 펼치기
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      모두 접기
                    </button>
                  </div>
                </div>
              </div>

        {/* =========================================================================
            QUESTION ITEMS LIST (원래의 쾌적하고 상세한 카드형 아코디언 레이아웃)
           ========================================================================= */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">일치하는 평가지표 문항이 없습니다</h3>
              <p className="text-xs text-slate-500 mt-1">검색어나 필터 조건을 변경하여 다시 확인해주세요.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPartId('all');
                  setSearchQuery('');
                  setFilterCompletedOnly('all');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                전체 지표 보기
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isExpanded = !!expandedItems[item.id];
              const isChecked = !!completedItems[item.id];
              const selectedOptionNum = selectedOptions[item.id];
              const chosenOption = item.options.find((o) => o.optionNumber === selectedOptionNum);
              const part = SELF_AUDIT_PARTS.find((p) => p.partId === item.partId);
              const isActive = item.id === activeItem.id;

              return (
                <div
                  key={item.id}
                  id={`guide-item-${item.id}`}
                  onClick={() => setActiveItemId(item.id)}
                  className={`bg-white border rounded-2xl transition-all overflow-hidden cursor-pointer ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                      : isChecked
                      ? 'border-emerald-200 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Card Header (Click to toggle expand) */}
                  <div className="p-5 sm:p-6 select-none" onClick={() => toggleExpand(item.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox for Checklist Completion */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleComplete(item.id);
                          }}
                          className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            isChecked
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-300 hover:text-slate-400 bg-slate-50'
                          }`}
                          title={isChecked ? '점검 완료 해제' : '실무 서류 점검 완료로 표시'}
                        >
                          {isChecked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Badges Row */}
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-black bg-slate-900 text-white tracking-wide">
                              PART {item.partNumber}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {item.majorCategory}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              배점 {item.points}점
                            </span>

                            {chosenOption && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                선택: {chosenOption.grade}등급 ({chosenOption.points}점 / {chosenOption.scoreRate}%)
                              </span>
                            )}

                            {isActive && (
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-600 text-white shadow-2xs">
                                우측 전략 연동 중
                              </span>
                            )}
                          </div>

                          {/* Title with evalItemCode in front */}
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug flex items-start sm:items-baseline gap-2 flex-wrap">
                            <span className="text-blue-600 font-extrabold tracking-tight shrink-0">
                              {item.evalItemCode}
                            </span>
                            <span className="text-slate-900 font-bold">
                              {item.evalItemName}
                            </span>
                          </h3>

                          {/* Question snippet */}
                          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                            {item.question}
                          </p>
                        </div>
                      </div>

                      {/* Expand / Collapse Icon */}
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400 ml-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Options Selection Radio Grid (Always visible for immediate simulation) */}
                  <div className="px-5 sm:px-6 pb-4 pt-1 bg-slate-50/60 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                        <span>모의 채점 보기 선택 (1~5등급)</span>
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        클릭하여 해당 등급을 선택하면 점수와 우측 전략이 실시간 갱신됩니다.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {item.options.map((opt) => {
                        const isSelected = selectedOptionNum === opt.optionNumber;
                        const isRecommended = !!opt.isRecommended;

                        return (
                          <button
                            key={opt.optionNumber}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOption(item.id, opt.optionNumber);
                              setActiveItemId(item.id);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold flex items-center gap-1">
                                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-600' : 'bg-slate-300'}`} />
                                <span className={isSelected ? 'text-blue-900' : 'text-slate-800'}>{opt.optionLabel}</span>
                              </span>
                              {isRecommended && (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                                  권장
                                </span>
                              )}
                            </div>

                            <div className="my-1 text-xs text-slate-600 leading-snug line-clamp-3">
                              {opt.text}
                            </div>

                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-blue-700">{opt.points}점</span>
                              <span className="text-slate-400 font-medium">{opt.scoreRate}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expandable Deep Guidance Details */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-white border-t border-slate-200 space-y-4 animate-fadeIn">
                      
                      {/* Section 1: 실사 평가 기준 (Requirements) */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span>현장실사 핵심 평가 기준</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-600 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80">
                          {item.requirements.map((req, rIdx) => (
                            <li key={rIdx} className="flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Section 2: 현장실사 가점 확보 전략 (Strategy) */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                          <span>전문가 실무 대응 및 가점 확보 전략</span>
                        </h4>
                        <div className="space-y-2 text-xs text-slate-700 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
                          {item.strategy.map((strat, sIdx) => (
                            <p key={sIdx} className="leading-relaxed">
                              • {strat}
                            </p>
                          ))}
                        </div>
                      </div>

                      {/* Section 3: 필수 증빙 서류 목록 (Required Docs) */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>현장실사 필수 준비 서류철</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {item.requiredDocs.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
                            >
                              <FileCheck className="w-3 h-3 text-indigo-600" />
                              <span>{doc}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Practical Tip note if available */}
                      {item.practicalTip && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>실무 팁: </strong>
                            <span>{item.practicalTip}</span>
                          </div>
                        </div>
                      )}

                      {/* Action Links Bar: AutoDoc & Document Groups */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">
                          연계 실무 문서그룹: <strong>{item.matchedGroupIds?.join(', ') || '전체 그룹 연동'}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.recommendedDocTemplateId && (
                            <button
                              type="button"
                              onClick={() => onOpenAutoDocModal(item.recommendedDocTemplateId)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>실무 서류 즉시 자동생성</span>
                            </button>
                          )}

                          {item.matchedGroupIds && item.matchedGroupIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => onOpenGroupDetail(item.matchedGroupIds[0])}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
                              <span>관련 문서철 확인</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN (20%): 전문가 실무 대응 및 가점 확보 전략 & 현장실사 준비서류철 (Image 2)
           ========================================================================= */}
        <div className="w-full lg:w-[20%] xl:w-[20%] shrink-0 space-y-3 lg:sticky lg:top-16 max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-thin print:hidden">
          
          {/* Active Item Title & Navigation Header Card */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                PART {activeItem.partNumber} · {activeItem.evalItemCode}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigateItem(-1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  title="이전 문항"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigateItem(1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                  title="다음 문항"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
              {activeItem.evalItemName}
            </h3>
            <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
              <span className="truncate">{activeItem.majorCategory}</span>
              <span className="font-semibold text-amber-600 shrink-0">배점 {activeItem.points}점</span>
            </div>
          </div>

          {/* Image 2 Section 1: 💡 전문가 실무 대응 및 가점 확보 전략 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💡</span>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                전문가 실무 대응 및 가점 확보 전략
              </h4>
            </div>

            {/* Amber Box with bullet points (matching Image 2) */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-2 text-xs text-slate-800 leading-relaxed shadow-2xs">
              {activeItem.strategy.map((strat, sIdx) => (
                <div key={sIdx} className="flex items-start gap-1.5">
                  <span className="text-amber-800 font-bold shrink-0">•</span>
                  <span className="leading-relaxed">{strat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Downward indicator / transition */}
          <div className="flex justify-center -my-1">
            <div className="w-6 h-1 rounded-full bg-slate-200" />
          </div>

          {/* Image 2 Section 2: 📑 현장실사 필수 준비 서류철 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">📑</span>
              <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                현장실사 필수 준비 서류철
              </h4>
            </div>

            {/* Required Docs in light blue/indigo rounded items (matching Image 2) */}
            <div className="space-y-1.5">
              {activeItem.requiredDocs.map((doc, dIdx) => (
                <div
                  key={dIdx}
                  className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs font-medium text-blue-900 flex items-start gap-2 shadow-2xs"
                >
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="leading-snug">{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Tip note if present */}
          {activeItem.practicalTip && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                실무 팁
              </span>
              <p className="text-slate-600 leading-relaxed">{activeItem.practicalTip}</p>
            </div>
          )}

          {/* Quick Action: Auto-Doc Generation & Group link */}
          <div className="space-y-1.5 pt-1">
            {activeItem.recommendedDocTemplateId && (
              <button
                type="button"
                onClick={() => onOpenAutoDocModal(activeItem.recommendedDocTemplateId)}
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>실무 서류 즉시 자동생성</span>
              </button>
            )}

            {activeItem.matchedGroupIds && activeItem.matchedGroupIds.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenGroupDetail(activeItem.matchedGroupIds[0])}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5 text-slate-600" />
                <span>관련 문서철 확인</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </main>
    </div>
  );
};
