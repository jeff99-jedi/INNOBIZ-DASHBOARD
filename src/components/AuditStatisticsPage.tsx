import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  CompanyProfile, 
  DocumentGroup 
} from '../types';
import { 
  SELF_AUDIT_PARTS, 
  SELF_AUDIT_GUIDE_ITEMS 
} from '../data/selfAuditGuideData';
import { 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  Printer, 
  Award, 
  ChevronRight, 
  Building2, 
  ShieldCheck, 
} from 'lucide-react';

interface AuditStatisticsPageProps {
  company: CompanyProfile;
  groups: DocumentGroup[];
  onNavigateToGuide: () => void;
  onNavigateToDashboard: () => void;
  onOpenGroupDetail?: (groupId: string) => void;
  onOpenAutoDocModal?: (initialDocId?: string) => void;
}

const OPTIONS_STORAGE_KEY = 'innobiz_self_audit_selected_options_v2';
const CHECK_STORAGE_KEY = 'innobiz_self_audit_checklist_v2';

export const AuditStatisticsPage: React.FC<AuditStatisticsPageProps> = ({
  company,
  groups,
  onNavigateToGuide,
  onNavigateToDashboard,
  onOpenGroupDetail,
  onOpenAutoDocModal,
}) => {
  // Load selected options from localStorage (starts empty 0/1000 until evaluated)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load selected options in stats page:', e);
    }
    return {};
  });

  // Load checklist
  const [completedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(CHECK_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load checklist in stats page:', e);
    }
    return {};
  });

  const [tableFilterPart, setTableFilterPart] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [chartViewMode, setChartViewMode] = useState<'points' | 'rates'>('points');

  // Sync any updates from external storage changes
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
        if (saved) setSelectedOptions(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to sync options:', e);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Compute comprehensive metrics & analytics
  const analytics = useMemo(() => {
    let totalScored = 0;
    const maxTotal = 1000;

    const partMap = {
      part1: {
        name: 'Part 1. 기술혁신능력',
        shortName: '기술혁신',
        scored: 0,
        max: 300,
        color: '#2563eb', // blue
        itemsCount: 0,
        completedCount: 0,
      },
      part2: {
        name: 'Part 2. 기술사업화능력',
        shortName: '기술사업화',
        scored: 0,
        max: 300,
        color: '#059669', // emerald
        itemsCount: 0,
        completedCount: 0,
      },
      part3: {
        name: 'Part 3. 기술혁신경영',
        shortName: '혁신경영',
        scored: 0,
        max: 200,
        color: '#4f46e5', // indigo
        itemsCount: 0,
        completedCount: 0,
      },
      part4: {
        name: 'Part 4. 기술혁신성과',
        shortName: '혁신성과',
        scored: 0,
        max: 200,
        color: '#d97706', // amber
        itemsCount: 0,
        completedCount: 0,
      },
    };

    // Item-level details
    const itemDetails = SELF_AUDIT_GUIDE_ITEMS.map((item) => {
      const selectedOptionNumber = selectedOptions[item.id] || 0;
      const chosenOption = item.options.find((o) => o.optionNumber === selectedOptionNumber);
      const scored = chosenOption ? chosenOption.points : 0;
      const rate = chosenOption ? chosenOption.scoreRate : 0;
      const grade = chosenOption ? chosenOption.grade : '-';
      const isCompleted = !!completedItems[item.id];

      // Tally
      totalScored += scored;
      if (partMap[item.partId as keyof typeof partMap]) {
        partMap[item.partId as keyof typeof partMap].scored += scored;
        partMap[item.partId as keyof typeof partMap].itemsCount += 1;
        if (isCompleted) {
          partMap[item.partId as keyof typeof partMap].completedCount += 1;
        }
      }

      return {
        item,
        selectedOptionNumber,
        chosenOption,
        scored,
        maxPossible: item.points,
        rate,
        grade,
        isCompleted,
      };
    });

    // Round part scores to 1 decimal place to prevent floating point inaccuracies
    Object.keys(partMap).forEach((k) => {
      const p = partMap[k as keyof typeof partMap];
      p.scored = Math.round(p.scored * 10) / 10;
    });

    const roundedTotal = Math.round(totalScored * 10) / 10;
    const isPassed = roundedTotal >= 700;
    const passMargin = Math.round((roundedTotal - 700) * 10) / 10;

    // Bar chart dataset
    const partChartData = [
      {
        name: 'PART 1. 기술혁신',
        fullName: 'PART 1. 기술혁신능력',
        배점: partMap.part1.max,
        모의득점: Math.round(partMap.part1.scored * 10) / 10,
        달성률: Math.round((partMap.part1.scored / partMap.part1.max) * 100),
        미달점수: Math.max(0, Math.round((partMap.part1.max - partMap.part1.scored) * 10) / 10),
        fill: '#2563eb',
      },
      {
        name: 'PART 2. 기술사업화',
        fullName: 'PART 2. 기술사업화능력',
        배점: partMap.part2.max,
        모의득점: Math.round(partMap.part2.scored * 10) / 10,
        달성률: Math.round((partMap.part2.scored / partMap.part2.max) * 100),
        미달점수: Math.max(0, Math.round((partMap.part2.max - partMap.part2.scored) * 10) / 10),
        fill: '#059669',
      },
      {
        name: 'PART 3. 혁신경영',
        fullName: 'PART 3. 기술혁신경영',
        배점: partMap.part3.max,
        모의득점: Math.round(partMap.part3.scored * 10) / 10,
        달성률: Math.round((partMap.part3.scored / partMap.part3.max) * 100),
        미달점수: Math.max(0, Math.round((partMap.part3.max - partMap.part3.scored) * 10) / 10),
        fill: '#4f46e5',
      },
      {
        name: 'PART 4. 혁신성과',
        fullName: 'PART 4. 기술혁신성과',
        배점: partMap.part4.max,
        모의득점: Math.round(partMap.part4.scored * 10) / 10,
        달성률: Math.round((partMap.part4.scored / partMap.part4.max) * 100),
        미달점수: Math.max(0, Math.round((partMap.part4.max - partMap.part4.scored) * 10) / 10),
        fill: '#d97706',
      },
    ];

    // Radar chart dataset
    const radarData = [
      {
        subject: 'PART 1 (300)',
        달성률: Math.round((partMap.part1.scored / partMap.part1.max) * 100),
        기준선: 70,
        fullMark: 100,
      },
      {
        subject: 'PART 2 (300)',
        달성률: Math.round((partMap.part2.scored / partMap.part2.max) * 100),
        기준선: 70,
        fullMark: 100,
      },
      {
        subject: 'PART 3 (200)',
        달성률: Math.round((partMap.part3.scored / partMap.part3.max) * 100),
        기준선: 70,
        fullMark: 100,
      },
      {
        subject: 'PART 4 (200)',
        달성률: Math.round((partMap.part4.scored / partMap.part4.max) * 100),
        기준선: 70,
        fullMark: 100,
      },
    ];

    // Pie chart dataset
    const pieData = [
      { name: 'PART 1. 기술혁신', value: partMap.part1.scored, color: '#2563eb' },
      { name: 'PART 2. 기술사업화', value: partMap.part2.scored, color: '#059669' },
      { name: 'PART 3. 혁신경영', value: partMap.part3.scored, color: '#4f46e5' },
      { name: 'PART 4. 혁신성과', value: partMap.part4.scored, color: '#d97706' },
    ];

    // Grade distribution counts
    const gradeCounts = {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      none: 0,
    };

    itemDetails.forEach((d) => {
      if (d.grade === 'A') gradeCounts.A += 1;
      else if (d.grade === 'B') gradeCounts.B += 1;
      else if (d.grade === 'C') gradeCounts.C += 1;
      else if (d.grade === 'D') gradeCounts.D += 1;
      else if (d.grade === 'E') gradeCounts.E += 1;
      else gradeCounts.none += 1;
    });

    // Potential score improvement opportunities
    const improvementOpportunities = itemDetails
      .filter((d) => d.rate < 100)
      .map((d) => {
        const potentialGain = Math.round((d.maxPossible - d.scored) * 10) / 10;
        return {
          ...d,
          potentialGain,
        };
      })
      .sort((a, b) => b.potentialGain - a.potentialGain);

    // Find best & lowest performing parts
    const sortedParts = [...Object.values(partMap)].sort(
      (a, b) => b.scored / b.max - a.scored / a.max
    );
    const strongestPart = sortedParts[0];
    const weakestPart = sortedParts[sortedParts.length - 1];

    return {
      totalScored: roundedTotal,
      maxTotal,
      isPassed,
      passMargin,
      totalRate: Math.round((roundedTotal / maxTotal) * 100),
      partMap,
      partChartData,
      radarData,
      pieData,
      gradeCounts,
      itemDetails,
      improvementOpportunities,
      strongestPart,
      weakestPart,
    };
  }, [selectedOptions, completedItems]);

  // Filtered table rows
  const filteredTableItems = useMemo(() => {
    return analytics.itemDetails.filter((d) => {
      if (tableFilterPart !== 'all' && d.item.partId !== tableFilterPart) {
        return false;
      }
      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase();
        const m1 = d.item.evalItemName.toLowerCase().includes(q);
        const m2 = d.item.evalItemCode.toLowerCase().includes(q);
        const m3 = d.item.partName.toLowerCase().includes(q);
        return m1 || m2 || m3;
      }
      return true;
    });
  }, [analytics.itemDetails, tableFilterPart, tableSearch]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen pb-20 antialiased font-sans print:bg-white print:pb-0">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md px-5 sm:px-8 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 z-20 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              {company.companyName} 통계 분석 엔진
            </span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight mt-1">
            이노비즈 모의채점 통계 및 심사분야별 역량 분석
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToGuide}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="자가진단 문항 화면으로 이동"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>자가진단 문항</span>
          </button>
        </div>
      </header>

      {/* Main Analysis Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
          {/* Total Score KPI */}
          <div className="sm:col-span-2 lg:col-span-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center font-black text-white shrink-0 shadow-xs ${
                  analytics.totalScored === 0
                    ? 'bg-slate-500'
                    : analytics.isPassed
                    ? 'bg-emerald-600'
                    : 'bg-rose-600'
                }`}
              >
                <span className="text-xl leading-none">{analytics.totalScored}</span>
                <span className="text-[10px] mt-0.5 opacity-80">/ 1,000점</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-500">모의 종합 진단 점수</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      analytics.totalScored > 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
                    }`}
                  />
                </div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {analytics.totalScored === 0 ? (
                    <span className="text-slate-500">진단 대기 (기준: 700점)</span>
                  ) : analytics.isPassed ? (
                    <span className="text-emerald-700">현장실사 적격 (+{analytics.passMargin}점)</span>
                  ) : (
                    <span className="text-rose-600">합격선 미달 (-{700 - analytics.totalScored}점)</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  기준: 700점 // 달성률: {analytics.totalRate}%
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="block text-[11px] text-slate-400 font-medium">추가 확보 가능</span>
              <div className="text-base font-bold text-blue-600">
                +{Math.round((analytics.maxTotal - analytics.totalScored) * 10) / 10}점
              </div>
            </div>
          </div>

          {/* Part 1 Quick Pill */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-blue-600">PART 1. 기술혁신</span>
              <span className="text-slate-400 text-[11px]">300점</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {analytics.partMap.part1.scored}
                <span className="text-xs font-normal text-slate-500"> 점</span>
              </span>
              <span className="text-xs font-bold text-blue-600">
                {Math.round((analytics.partMap.part1.scored / 300) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (analytics.partMap.part1.scored / 300) * 100)}%` }}
              />
            </div>
          </div>

          {/* Part 2 Quick Pill */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-emerald-700">PART 2. 기술사업화</span>
              <span className="text-slate-400 text-[11px]">300점</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {analytics.partMap.part2.scored}
                <span className="text-xs font-normal text-slate-500"> 점</span>
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {Math.round((analytics.partMap.part2.scored / 300) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (analytics.partMap.part2.scored / 300) * 100)}%` }}
              />
            </div>
          </div>

          {/* Part 3 Quick Pill */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-indigo-700">PART 3. 혁신경영</span>
              <span className="text-slate-400 text-[11px]">200점</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {analytics.partMap.part3.scored}
                <span className="text-xs font-normal text-slate-500"> 점</span>
              </span>
              <span className="text-xs font-bold text-indigo-700">
                {Math.round((analytics.partMap.part3.scored / 200) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (analytics.partMap.part3.scored / 200) * 100)}%` }}
              />
            </div>
          </div>

          {/* Part 4 Quick Pill */}
          <div className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-amber-700">PART 4. 혁신성과</span>
              <span className="text-slate-400 text-[11px]">200점</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-lg font-black text-slate-900">
                {analytics.partMap.part4.scored}
                <span className="text-xs font-normal text-slate-500"> 점</span>
              </span>
              <span className="text-xs font-bold text-amber-700">
                {Math.round((analytics.partMap.part4.scored / 200) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-amber-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (analytics.partMap.part4.scored / 200) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Row 1: Grouped Bar Chart & Radar Balance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 1: 4대 심사분야 배점 대비 득점 비교 (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-blue-600">분야별 배점 비교</span>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  4대 심사분야별 배점 대비 모의 득점 현황
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  분야별 공시 기준 배점과 귀사의 현재 선택 보기 환산 득점을 직접 비교합니다.
                </p>
              </div>

              {/* Toggle Points vs Rate */}
              <div className="inline-flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setChartViewMode('points')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'points'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  점수 (점)
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('rates')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartViewMode === 'rates'
                      ? 'bg-white text-slate-900 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  달성률 (%)
                </button>
              </div>
            </div>

            {/* Bar Chart Container */}
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'points' ? (
                  <BarChart data={analytics.partChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 600, fontFamily: 'Pretendard' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Pretendard' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs">
                              <div className="font-bold text-sm text-blue-300 mb-1.5">{data.fullName}</div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">공시 배점:</span>
                                  <span className="font-semibold">{data.배점}점</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">모의 득점:</span>
                                  <span className="font-bold text-emerald-400">{data.모의득점}점</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span className="text-slate-400">달성률:</span>
                                  <span className="font-bold text-blue-400">{data.달성률}%</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1 text-slate-400">
                                  <span>추가 확보 가능:</span>
                                  <span className="text-amber-300 font-semibold">+{data.미달점수}점</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: 'Pretendard' }}
                      formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                    />
                    <Bar dataKey="배점" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="공시 기준 배점" />
                    <Bar dataKey="모의득점" fill="#2563eb" radius={[4, 4, 0, 0]} name="현재 모의 득점">
                      {analytics.partChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <BarChart data={analytics.partChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#475569', fontSize: 11, fontWeight: 600, fontFamily: 'Pretendard' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Pretendard' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      unit="%"
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, '달성률']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'Pretendard' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 10, fontSize: 11, fontFamily: 'Pretendard' }}
                      formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                    />
                    <Bar dataKey="달성률" fill="#2563eb" radius={[4, 4, 0, 0]} name="분야별 득점 달성률(%)">
                      {analytics.partChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Part KPI mini summary footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {analytics.partChartData.map((p) => (
                <div key={p.name} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 font-semibold">{p.name}</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {p.모의득점} / {p.배점}점
                  </div>
                  <div className="text-[10px] text-blue-600 font-semibold">{p.달성률}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: 방사형 레이더 역량 밸런스 차트 (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600">역량 밸런스</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                4대 역량 방사형 밸런스 진단
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                기술·사업화·경영·성과의 균형 상태를 시각화합니다 (점선: 합격 기준선 70%).
              </p>
            </div>

            <div className="w-full h-64 sm:h-72 my-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analytics.radarData} margin={{ top: 10, right: 25, bottom: 10, left: 25 }}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#334155', fontSize: 11, fontWeight: 600, fontFamily: 'Pretendard' }}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ fill: '#94a3b8', fontSize: 9, fontFamily: 'Pretendard' }}
                  />
                  <Radar
                    name="합격 기준선 (70%)"
                    dataKey="기준선"
                    stroke="#94a3b8"
                    fill="transparent"
                    strokeDasharray="4 4"
                  />
                  <Radar
                    name="현재 달성률"
                    dataKey="달성률"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'Pretendard' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, paddingTop: 6, fontFamily: 'Pretendard' }}
                    formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnostic Insight Note */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Award className="w-3.5 h-3.5" />
                  강점 영역
                </span>
                <span>{analytics.strongestPart.shortName} ({Math.round((analytics.strongestPart.scored / analytics.strongestPart.max) * 100)}%)</span>
              </div>
              <div className="flex items-center justify-between font-semibold text-slate-800 pt-1.5 border-t border-slate-200/80">
                <span className="flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5" />
                  보완 우선 영역
                </span>
                <span>{analytics.weakestPart.shortName} ({Math.round((analytics.weakestPart.scored / analytics.weakestPart.max) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Contribution Pie Chart & Grade Distribution Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 3: 총 득점 기여 비중 (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-blue-600">포트폴리오 비중</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                총 모의 득점 기여 비중
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                현재 득점({analytics.totalScored}점) 중 각 심사분야가 차지하는 포트폴리오 비율입니다.
              </p>
            </div>

            <div className="w-full h-56 sm:h-64 my-2 flex items-center justify-center relative">
              {analytics.totalScored === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center">
                  <span className="text-xs font-bold text-slate-400">진단 미실시 상태</span>
                  <span className="text-[11px] text-slate-400">0 / 1,000점</span>
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.totalScored > 0 ? analytics.pieData : [{ name: '진단 대기', value: 1, color: '#e2e8f0' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={analytics.totalScored > 0 ? 3 : 0}
                    dataKey="value"
                  >
                    {analytics.totalScored > 0 ? (
                      analytics.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))
                    ) : (
                      <Cell fill="#e2e8f0" />
                    )}
                  </Pie>
                  {analytics.totalScored > 0 && (
                    <Tooltip
                      formatter={(val: any) => [`${val}점`, '득점 기여']}
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px', fontFamily: 'Pretendard' }}
                    />
                  )}
                  <Legend 
                    wrapperStyle={{ fontSize: 11, fontFamily: 'Pretendard' }}
                    formatter={(val) => <span className="text-slate-700 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {analytics.pieData.map((item) => {
                const percent = Math.round((item.value / analytics.totalScored) * 100) || 0;
                return (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.name}
                    </span>
                    <span className="font-bold text-slate-800">{percent}% ({item.value}점)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 4: 19개 지표 선택 등급 분포 & 즉시 가점 확보 기회 (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-600">등급 분포 스펙트럼</span>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    {analytics.itemDetails.length}개 지표 등급 분포 및 고득점 보완 우선순위
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onNavigateToGuide}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>자가진단 수정</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                현재 선택된 보기의 등급별 문항 수와 1등급 상향 시 득점 가능한 최우선 보완 지표입니다.
              </p>
            </div>

            {/* Grade Badges Strip */}
            <div className="grid grid-cols-5 gap-2 my-4">
              <div className="p-2.5 border border-emerald-200 bg-emerald-50/50 rounded-xl text-center">
                <div className="text-[11px] font-bold text-emerald-700">A (100%)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{analytics.gradeCounts.A}</div>
                <div className="text-[10px] text-emerald-600 font-semibold">최적</div>
              </div>
              <div className="p-2.5 border border-blue-200 bg-blue-50/50 rounded-xl text-center">
                <div className="text-[11px] font-bold text-blue-700">B (80%)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{analytics.gradeCounts.B}</div>
                <div className="text-[10px] text-blue-600 font-semibold">양호</div>
              </div>
              <div className="p-2.5 border border-amber-200 bg-amber-50/50 rounded-xl text-center">
                <div className="text-[11px] font-bold text-amber-700">C (60%)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{analytics.gradeCounts.C}</div>
                <div className="text-[10px] text-amber-600 font-semibold">보통</div>
              </div>
              <div className="p-2.5 border border-orange-200 bg-orange-50/50 rounded-xl text-center">
                <div className="text-[11px] font-bold text-orange-700">D (40%)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{analytics.gradeCounts.D}</div>
                <div className="text-[10px] text-orange-600 font-semibold">미흡</div>
              </div>
              <div className="p-2.5 border border-rose-200 bg-rose-50/50 rounded-xl text-center">
                <div className="text-[11px] font-bold text-rose-700">E (20%)</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{analytics.gradeCounts.E}</div>
                <div className="text-[10px] text-rose-600 font-semibold">보완필수</div>
              </div>
            </div>

            {/* Targeted Gap Opportunities */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>실무 서류 보강 시 고득점 확보 추천 TOP 3</span>
                <span className="text-[11px] text-slate-400 font-normal">증빙 서류 보강 시</span>
              </div>

              {analytics.improvementOpportunities.length > 0 ? (
                analytics.improvementOpportunities.slice(0, 3).map((opp, idx) => (
                  <div
                    key={opp.item.id}
                    className="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                          <span className="text-blue-600 font-extrabold">{opp.item.evalItemCode}</span>
                          <span>{opp.item.evalItemName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>
                            현재: {opp.selectedOptionNumber > 0 ? `${opp.selectedOptionNumber}번 (${opp.rate}%, ${opp.scored}점)` : '미선택 (0점)'}
                          </span>
                          <span className="text-blue-700 font-bold">
                            → ①번 보완 시 +{opp.potentialGain}점 상승
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onNavigateToGuide}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold hover:bg-slate-50 transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      대응방안
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold">
                  전체 {analytics.itemDetails.length}개 지표가 최적 등급(1,000점)으로 설정되어 있습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Detailed Evaluation Indicators Score Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-blue-600">세부 지표 명세</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {analytics.itemDetails.length}개 세부 평가항목별 모의 득점 및 서류 점검 명세표
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                각 지표의 배점, 선택된 보기 등급, 환산 득점 및 실무 서류 준비 상태를 대조합니다.
              </p>
            </div>

            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Part Filter Tabs */}
              <div className="inline-flex border border-slate-200 bg-white rounded-xl p-0.5 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTableFilterPart('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    tableFilterPart === 'all'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 ({analytics.itemDetails.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilterPart('part1')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    tableFilterPart === 'part1'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PART 1 ({analytics.partMap.part1.itemsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilterPart('part2')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    tableFilterPart === 'part2'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PART 2 ({analytics.partMap.part2.itemsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilterPart('part3')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    tableFilterPart === 'part3'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PART 3 ({analytics.partMap.part3.itemsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setTableFilterPart('part4')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    tableFilterPart === 'part4'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PART 4 ({analytics.partMap.part4.itemsCount})
                </button>
              </div>

              {/* Search input */}
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="코드/항목 검색..."
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-44"
              />
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3.5 text-center w-[76px] sm:w-[76.1px]" style={{ width: '76.1094px' }}>코드</th>
                  <th className="py-2.5 px-3.5 w-28">심사분야</th>
                  <th className="py-2.5 px-3.5 min-w-[320px]" style={{ width: '492.578px' }}>평가지표 문항명</th>
                  <th className="py-2.5 px-3 text-center w-16">배점</th>
                  <th className="py-2.5 px-3.5 text-center" style={{ width: '120.172px' }}>선택 보기 (등급)</th>
                  <th className="py-2.5 px-3 text-center w-20">모의 득점</th>
                  <th className="py-2.5 px-3 text-center w-20">달성률</th>
                  <th className="py-2.5 px-3 text-center w-24">서류 점검</th>
                  <th className="py-2.5 px-3 text-center w-16 print:hidden">링크</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTableItems.map((detail) => {
                  const partBadge = {
                    part1: 'text-blue-700 bg-blue-50 border-blue-200',
                    part2: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    part3: 'text-indigo-700 bg-indigo-50 border-indigo-200',
                    part4: 'text-amber-700 bg-amber-50 border-amber-200',
                  }[detail.item.partId];

                  return (
                    <tr key={detail.item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3.5 text-center font-bold text-slate-800">
                        {detail.item.evalItemCode}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${partBadge}`}>
                          PART {detail.item.partNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span className="text-blue-600 font-extrabold">{detail.item.evalItemCode}</span>
                          <span>{detail.item.evalItemName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{detail.item.question}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {detail.maxPossible}점
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {detail.selectedOptionNumber > 0 ? (
                          <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded border border-slate-200 bg-white">
                            {detail.selectedOptionNumber}번 ({detail.grade}등급)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 text-[11px] text-slate-400 bg-slate-100 rounded">
                            미선택
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-600">
                        {detail.scored}점
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${detail.rate}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-600 font-semibold">{detail.rate}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {detail.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            준비완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            대응중
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center print:hidden">
                        {detail.item.linkedGroupId && onOpenGroupDetail ? (
                          <button
                            type="button"
                            onClick={() => onOpenGroupDetail(detail.item.linkedGroupId!)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="연계 문서 그룹 열기"
                          >
                            <Layers className="w-4 h-4 inline" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              표시 중: <strong>{filteredTableItems.length}</strong> / 19 문항
            </div>
            <div className="flex items-center gap-4">
              <span>총 배점: <strong>1,000점</strong></span>
              <span>모의 득점: <strong className="text-blue-600 font-bold">{analytics.totalScored}점</strong></span>
              <span>합격 기준: <strong className="text-emerald-700 font-bold">700점</strong></span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
