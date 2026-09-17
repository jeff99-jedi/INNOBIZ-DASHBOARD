import React, { useState } from 'react';
import { DocumentAttachment, DocumentGroup, DocumentItem } from '../types';
import { RAW_SHEET_ROWS, SheetRowItem, parseEvidenceDocs } from '../data/sheetData';
import { 
  FileSpreadsheet, 
  Search, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  Download, 
  ArrowUpRight,
  Filter,
  Upload,
  Database,
  Sparkles
} from 'lucide-react';
import { RowDocumentUploadModal } from './RowDocumentUploadModal';

interface SheetMatrixViewProps {
  groups: DocumentGroup[];
  onOpenGroupDetail: (group: DocumentGroup) => void;
  onUpdateGroup?: (group: DocumentGroup) => void;
  companyName?: string;
  ceoName?: string;
}

export const SheetMatrixView: React.FC<SheetMatrixViewProps> = ({
  groups,
  onOpenGroupDetail,
  onUpdateGroup,
  companyName,
  ceoName,
}) => {
  const [filterSection, setFilterSection] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeUploadRow, setActiveUploadRow] = useState<SheetRowItem | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Find document status for each sheet row
  const getDocAndGroupForRow = (row: SheetRowItem) => {
    for (const grp of groups) {
      const foundDoc = grp.documents.find(
        (d) => d.evalItem === row.evalItem || d.title.includes(row.evalItem)
      );
      if (foundDoc) {
        return { group: grp, document: foundDoc };
      }
    }
    return { group: null, document: null };
  };

  const getRowAttachments = (row: SheetRowItem, document: DocumentItem | null) => {
    if (document?.attachments && document.attachments.length > 0) {
      return document.attachments;
    }
    try {
      const saved = localStorage.getItem(`row_attach_${row.evalItem}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [];
  };

  const handleAttachmentsUpdated = (
    row: SheetRowItem,
    updatedAttachments: DocumentAttachment[],
    newStatus: 'completed' | 'review' | 'in_progress' = 'completed'
  ) => {
    // 1. Update matching group and document
    const { group, document } = getDocAndGroupForRow(row);
    if (group && document && onUpdateGroup) {
      const updatedDocs = group.documents.map((d) => {
        if (d.id === document.id) {
          return {
            ...d,
            status: newStatus,
            attachments: updatedAttachments,
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      });
      onUpdateGroup({
        ...group,
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
      });
    }
    // 2. Force re-render
    setRefreshTick((t) => t + 1);
  };

  const filteredRows = RAW_SHEET_ROWS.filter((row) => {
    if (filterSection !== 'all' && !row.section.includes(filterSection)) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchMajor = row.majorCategory.toLowerCase().includes(q);
      const matchEval = row.evalItem.toLowerCase().includes(q);
      const matchStatus = row.currentStatus.toLowerCase().includes(q);
      const matchDocs = row.evidenceDocs.toLowerCase().includes(q);
      return matchMajor || matchEval || matchStatus || matchDocs;
    }
    return true;
  });

  const totalPoints = RAW_SHEET_ROWS.reduce((sum, r) => sum + r.points, 0);

  const handleDownloadCSV = () => {
    const headers = ['부문', '대항목', '평가항목', '배점', '기업 현황', '주요 증빙 자료', '배치된 문서 그룹', '준비상태'];
    const rows = RAW_SHEET_ROWS.map((r) => {
      const { group, document } = getDocAndGroupForRow(r);
      return [
        `"${r.section}"`,
        `"${r.majorCategory}"`,
        `"${r.evalItem}"`,
        r.points,
        `"${r.currentStatus}"`,
        `"${r.evidenceDocs}"`,
        `"${group?.title || '미배치'}"`,
        `"${document?.status === 'completed' ? '완료' : document?.status === 'review' ? '검토중' : '작성중'}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `이노비즈_평가지표_문서배치표_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden" id="sheet-matrix-view">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              첨부 시트 기준 이노비즈 평가지표 및 서류 배치 매트릭스
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            제공해주신 4대 부문, 36개 세부 평가항목 (총 {totalPoints}점 배점 체계) 및 기업 현황이 각 문서 그룹에 1:1로 완벽히 배치되었습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="평가항목, 현황, 서류 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV 엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 pr-1">
          <Filter className="w-3 h-3" /> 부문 필터:
        </span>
        {[
          { id: 'all', label: '전체 부문 (36항목)' },
          { id: '1. 기술혁신', label: '1. 기술혁신 능력 (300점)' },
          { id: '2. 기술사업화', label: '2. 기술사업화 능력 (300점)' },
          { id: '3. 기술혁신 경영', label: '3. 기술혁신 경영능력' },
          { id: '4. 기술혁신 성과', label: '4. 기술혁신 성과 (200점)' },
        ].map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setFilterSection(sec.id)}
            className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
              filterSection === sec.id
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 shadow-2xs">
            <tr className="border-b border-slate-300">
              <th className="py-2.5 px-3 w-10 text-center">No</th>
              <th className="py-2.5 px-3 w-28">부문</th>
              <th className="py-2.5 px-3 w-36">대항목</th>
              <th className="py-2.5 px-3">평가항목 (자가진단 세부)</th>
              <th className="py-2.5 px-3 w-16 text-center">배점</th>
              <th className="py-2.5 px-3 w-44">기업 현황 (시트 기재값)</th>
              <th className="py-2.5 px-3 min-w-[220px]">주요 증빙 자료 (필수 서류)</th>
              <th className="py-2.5 px-3 w-48">배치된 문서 그룹</th>
              <th className="py-2.5 px-3 w-36 text-center whitespace-nowrap">서류 업로드 / 현황</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredRows.map((row, idx) => {
              const { group, document } = getDocAndGroupForRow(row);
              const evidenceList = parseEvidenceDocs(row.evidenceDocs);

              return (
                <tr key={`${idx}-${refreshTick}`} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3 px-3 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700">
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 whitespace-nowrap">
                      {row.section.split('. ')[1] || row.section}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {row.majorCategory}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900 block leading-snug">
                      {row.evalItem}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-block font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      {row.points}점
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="bg-blue-50/80 border border-blue-200 text-blue-900 font-semibold px-2 py-1 rounded-md text-[11px] leading-snug">
                      {row.currentStatus}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      {evidenceList.map((docName, dIdx) => (
                        <div
                          key={dIdx}
                          className="text-[11px] text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                          <span className="font-medium">{docName}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    {group ? (
                      <button
                        type="button"
                        onClick={() => onOpenGroupDetail(group)}
                        className="text-left group/btn hover:text-blue-700 transition-colors cursor-pointer block"
                      >
                        <span className="font-bold text-slate-800 group-hover/btn:text-blue-600 block line-clamp-2">
                          📁 {group.title}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                          서류철 열기 <ArrowUpRight className="w-3 h-3 text-blue-500" />
                        </span>
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">미배치</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {(() => {
                      const rowAttachs = getRowAttachments(row, document);
                      const hasAttachments = rowAttachs.length > 0;
                      const effectiveStatus = hasAttachments ? 'completed' : (document?.status || 'in_progress');

                      return (
                        <div className="flex flex-col items-center gap-1.5 min-w-[105px]">
                          <button
                            type="button"
                            onClick={() => setActiveUploadRow(row)}
                            className="w-full px-2.5 py-1 text-xs font-bold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                            title="대응서류 업로드 (Supabase Storage / Claude / 로컬)"
                          >
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            <span>업로드</span>
                          </button>

                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            {effectiveStatus === 'completed' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" /> 완료
                              </span>
                            )}
                            {effectiveStatus === 'review' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                <Clock className="w-3 h-3" /> 검토중
                              </span>
                            )}
                            {effectiveStatus === 'in_progress' && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                대응중
                              </span>
                            )}
                            {rowAttachs.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveUploadRow(row)}
                                className="text-[10px] text-blue-700 font-semibold bg-blue-50/90 border border-blue-200 hover:bg-blue-100 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                                title="등록된 서류 목록 확인"
                              >
                                📎 {rowAttachs.length}건
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          총 <strong>{filteredRows.length}</strong>개 평가항목 표시 중 (총 배점: <strong>{filteredRows.reduce((acc, r) => acc + r.points, 0)}점</strong>)
        </div>
        <div className="text-slate-400 text-[11px] flex items-center gap-2">
          <span>각 행의 [업로드]를 통해 Supabase 클라우드 또는 클로드(Claude) 작업 서류를 즉시 등록할 수 있습니다.</span>
        </div>
      </div>

      {/* Document Upload Modal */}
      {activeUploadRow && (
        <RowDocumentUploadModal
          isOpen={!!activeUploadRow}
          onClose={() => setActiveUploadRow(null)}
          row={activeUploadRow}
          matchedGroup={getDocAndGroupForRow(activeUploadRow).group}
          matchedDoc={getDocAndGroupForRow(activeUploadRow).document}
          companyName={companyName}
          ceoName={ceoName}
          onAttachmentsUpdated={(updatedAttachments, newStatus) =>
            handleAttachmentsUpdated(activeUploadRow, updatedAttachments, newStatus)
          }
        />
      )}
    </div>
  );
};
