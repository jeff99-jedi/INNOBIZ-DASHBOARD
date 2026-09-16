import React from 'react';
import { DocumentGroup, InnoBizCategory } from '../types';
import { CheckCircle2, Clock, FileText, FolderKanban, AlertCircle } from 'lucide-react';

interface MetricsOverviewProps {
  groups: DocumentGroup[];
  selectedCategory: InnoBizCategory | 'all';
  onSelectCategory: (cat: InnoBizCategory | 'all') => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  groups,
  selectedCategory,
  onSelectCategory,
}) => {
  const allDocs = groups.flatMap((g) => g.documents);
  const totalDocs = allDocs.length;
  const completedDocs = allDocs.filter((d) => d.status === 'completed').length;
  const reviewDocs = allDocs.filter((d) => d.status === 'review').length;
  const inProgressDocs = allDocs.filter((d) => d.status === 'in_progress').length;
  const pendingDocs = allDocs.filter((d) => d.status === 'pending').length;

  const overallProgress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

  const categories: { id: InnoBizCategory | 'all'; label: string; count: number }[] = [
    { id: 'all', label: '전체 그룹', count: groups.length },
    {
      id: 'tech_innovation',
      label: '1. 기술혁신능력',
      count: groups.filter((g) => g.category === 'tech_innovation').length,
    },
    {
      id: 'tech_commercialize',
      label: '2. 기술사업화능력',
      count: groups.filter((g) => g.category === 'tech_commercialize').length,
    },
    {
      id: 'tech_management',
      label: '3. 기술혁신경영능력',
      count: groups.filter((g) => g.category === 'tech_management').length,
    },
    {
      id: 'tech_performance',
      label: '4. 기술혁신성과',
      count: groups.filter((g) => g.category === 'tech_performance').length,
    },
    {
      id: 'custom',
      label: '사용자 맞춤 그룹',
      count: groups.filter((g) => g.category === 'custom').length,
    },
  ];

  return (
    <section className="mb-6" id="metrics-overview-section">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">전체 준비 진행률</span>
            <span className="text-xs font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completedDocs}</span>
            <span className="text-xs text-slate-500">/ {totalDocs}건 완료</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">검토 및 보완 대기</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{reviewDocs + inProgressDocs}</span>
            <span className="text-xs text-slate-500">건 (검토 {reviewDocs} / 작성 {inProgressDocs})</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            담당자 서류 검토 및 날인 필요
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">미착수 필수 서류</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{pendingDocs}</span>
            <span className="text-xs text-slate-500">건 미작성</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            현장실사 전 우선 확보 권장
          </p>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`filter-cat-${cat.id}`}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isSelected ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
