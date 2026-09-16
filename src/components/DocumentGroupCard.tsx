import React from 'react';
import { DocumentGroup, DocumentStatus } from '../types';
import { 
  Folder, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Paperclip, 
  ChevronRight, 
  Plus, 
  Trash2,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface DocumentGroupCardProps {
  group: DocumentGroup;
  onOpenDetail: (group: DocumentGroup) => void;
  onQuickAddDoc: (group: DocumentGroup) => void;
  onDeleteGroup?: (groupId: string) => void;
  isRecentlyCreated?: boolean;
  onOpenAutoDoc?: (groupId: string) => void;
}

export const DocumentGroupCard: React.FC<DocumentGroupCardProps> = ({
  group,
  onOpenDetail,
  onQuickAddDoc,
  onDeleteGroup,
  isRecentlyCreated = false,
  onOpenAutoDoc,
}) => {
  const total = group.documents.length;
  const completed = group.documents.filter((d) => d.status === 'completed').length;
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'tech_innovation':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tech_commercialize':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'tech_management':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'tech_performance':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> 완료
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            <Clock className="w-3 h-3" /> 검토중
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
            작성중
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            대기
          </span>
        );
    }
  };

  return (
    <div
      id={`group-card-${group.id}`}
      className={`bg-white border rounded-xl p-5 transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
        isRecentlyCreated
          ? 'border-blue-500 ring-2 ring-blue-100'
          : 'border-slate-200 shadow-2xs'
      }`}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(
                group.category
              )}`}
            >
              {group.categoryName}
            </span>
            {group.majorCategory && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                {group.majorCategory}
              </span>
            )}
            {Boolean(group.totalPoints && group.totalPoints > 0) && (
              <span className="text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">
                배점 {group.totalPoints}점
              </span>
            )}
            {group.isCustom && (
              <span className="text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded-md">
                사용자 생성
              </span>
            )}
            {isRecentlyCreated && (
              <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.2 rounded-md animate-pulse">
                방금 생성됨 ⭐
              </span>
            )}
          </div>

          {group.isCustom && onDeleteGroup && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`'${group.title}' 문서 그룹을 삭제하시겠습니까?`)) {
                  onDeleteGroup(group.id);
                }
              }}
              title="그룹 삭제"
              className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <h3 
          onClick={() => onOpenDetail(group)}
          className="text-base font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-1 flex items-center gap-2"
        >
          <Folder className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{group.title}</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {group.description || '이노비즈 인증 심사용 필수 서류 관리 그룹입니다.'}
        </p>

        {/* Manager & Target Date */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{group.department} ({group.manager})</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>목표: {group.targetDate}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-700">문서 준비 현황</span>
            <span className="font-bold text-blue-600">
              {completed} / {total}건 ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                progressPercent === 100
                  ? 'bg-emerald-500'
                  : progressPercent > 50
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Preview of Documents */}
        <div className="mt-3.5 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            포함된 주요 증빙 서류 ({total}건)
          </div>
          {group.documents.slice(0, 3).map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50/70 border border-slate-100 hover:bg-slate-100/70 text-slate-700"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-semibold text-slate-800">{doc.evalItem || doc.title}</span>
                  {doc.points && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded shrink-0">
                      {doc.points}점
                    </span>
                  )}
                  {doc.attachments && doc.attachments.length > 0 && (
                    <Paperclip className="w-3 h-3 text-blue-500 shrink-0" />
                  )}
                </div>
                {doc.currentStatus && (
                  <span className="text-[11px] text-slate-500 truncate pl-5">
                    현황: <strong className="text-slate-700 font-medium">{doc.currentStatus}</strong>
                  </span>
                )}
              </div>
              <div className="shrink-0 self-center">{getStatusBadge(doc.status)}</div>
            </div>
          ))}

          {total > 3 && (
            <div className="text-[11px] text-slate-400 pl-2">
              + 외 {total - 3}개 서류 더보기...
            </div>
          )}

          {total === 0 && (
            <div className="text-xs text-slate-400 italic py-2 text-center">
              아직 등록된 증빙 서류가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQuickAddDoc(group)}
            className="text-xs font-medium text-slate-600 hover:text-blue-700 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>서류 추가</span>
          </button>

          {onOpenAutoDoc && (
            <button
              type="button"
              onClick={() => onOpenAutoDoc(group.id)}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 py-1.5 px-2 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="기업 정보가 반영된 규정/서류 자동작성"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>자동 작성</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenDetail(group)}
          className="text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>서류철 열기</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
