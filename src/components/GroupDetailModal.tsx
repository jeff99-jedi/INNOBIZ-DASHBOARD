import React, { useState, useRef } from 'react';
import { DocumentGroup, DocumentItem, DocumentStatus, DocumentAttachment } from '../types';
import { 
  X, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Paperclip, 
  UploadCloud, 
  Trash2, 
  User, 
  Calendar, 
  Folder,
  Download,
  Check,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
  Loader2,
  FileCheck2
} from 'lucide-react';
import { 
  saveAttachmentBlob, 
  deleteAttachmentBlob, 
  downloadAttachmentFile, 
  getFileCategory 
} from '../utils/fileStorage';

interface GroupDetailModalProps {
  isOpen: boolean;
  group: DocumentGroup | null;
  onClose: () => void;
  onUpdateGroup: (updatedGroup: DocumentGroup) => void;
  onOpenAutoDoc?: (groupId: string) => void;
  onOpenExcelAi?: () => void;
  companyName?: string;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  isOpen,
  group,
  onClose,
  onUpdateGroup,
  onOpenAutoDoc,
  onOpenExcelAi,
  companyName = '(주)더한농',
}) => {
  const [activeTab, setActiveTab] = useState<'all' | DocumentStatus>('all');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocGuide, setNewDocGuide] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeDocForUpload, setActiveDocForUpload] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const total = group ? group.documents.length : 0;
  const completedCount = group ? group.documents.filter((d) => d.status === 'completed').length : 0;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const filteredDocs = group ? group.documents.filter((doc) => {
    if (activeTab === 'all') return true;
    return doc.status === activeTab;
  }) : [];

  const handleStatusChange = (docId: string, newStatus: DocumentStatus) => {
    if (!group) return;
    const updatedDocs = group.documents.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          status: newStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return doc;
    });

    onUpdateGroup({
      ...group,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: newDocTitle.trim(),
      isRequired: true,
      status: 'pending',
      formatGuide: newDocGuide.trim() || '이노비즈 현장실사 제출용 증빙 규격',
      updatedAt: new Date().toISOString().split('T')[0],
      attachments: [],
    };

    onUpdateGroup({
      ...group,
      documents: [...group.documents, newDoc],
      updatedAt: new Date().toISOString(),
    });

    setNewDocTitle('');
    setNewDocGuide('');
    setShowAddForm(false);
  };

  const handleDeleteDocument = (docId: string) => {
    if (!window.confirm('이 서류 항목을 삭제하시겠습니까?')) return;
    const updatedDocs = group.documents.filter((d) => d.id !== docId);
    onUpdateGroup({
      ...group,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFileUpload = async (docId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    const newAttachments: DocumentAttachment[] = [];
    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      const attId = `att-${Date.now()}-${idx}`;
      await saveAttachmentBlob(attId, file);
      newAttachments.push({
        id: attId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileType: file.type || 'application/octet-stream',
      });
    }

    const updatedDocs = group.documents.map((doc) => {
      if (doc.id === docId) {
        const existing = doc.attachments || [];
        return {
          ...doc,
          attachments: [...existing, ...newAttachments],
          status: doc.status === 'pending' ? ('review' as DocumentStatus) : doc.status,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return doc;
    });

    onUpdateGroup({
      ...group,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });

    setActiveDocForUpload(null);
    setDownloadToast(`${newAttachments.length}개 파일이 정상 첨부되었습니다.`);
    setTimeout(() => setDownloadToast(null), 3000);
  };

  const handleDeleteAttachment = async (docId: string, attId: string) => {
    await deleteAttachmentBlob(attId);
    const updatedDocs = group.documents.map((doc) => {
      if (doc.id === docId) {
        return {
          ...doc,
          attachments: (doc.attachments || []).filter((a) => a.id !== attId),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      }
      return doc;
    });

    onUpdateGroup({
      ...group,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDownloadAttachment = async (e: React.MouseEvent, att: DocumentAttachment) => {
    e.stopPropagation();
    try {
      setDownloadingId(att.id);
      await downloadAttachmentFile(att, companyName);
      setDownloadToast(`'${att.name}' 파일 다운로드를 시작했습니다.`);
      setTimeout(() => setDownloadToast(null), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadToast('다운로드 처리 중 오류가 발생했습니다.');
      setTimeout(() => setDownloadToast(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleQuickAttachWordAndExcel = async (docId: string, docTitle: string) => {
    const today = new Date().toISOString().split('T')[0];
    const cleanDocTitle = docTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 20);

    const wordAttId = `sample-word-${Date.now()}`;
    const excelAttId = `sample-excel-${Date.now()}`;

    // Sample Word (.docx) content
    const sampleWordBlob = new Blob([
      `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${docTitle}</title></head><body><h1>${companyName} - 이노비즈 증빙 기안문</h1><p>항목: ${docTitle}</p><p>작성일: ${today}</p></body></html>`
    ], { type: 'application/msword' });

    // Sample Excel (.xlsx) CSV/XML content
    const sampleExcelBlob = new Blob([
      `\uFEFF연번,증빙항목,관리부서,검증수치,적합여부\n1,${docTitle},기술연구소/생산본부,${companyName} 자체검증,적합\n`
    ], { type: 'application/vnd.ms-excel;charset=utf-8' });

    await saveAttachmentBlob(wordAttId, sampleWordBlob);
    await saveAttachmentBlob(excelAttId, sampleExcelBlob);

    const newAttachments: DocumentAttachment[] = [
      {
        id: wordAttId,
        name: `[증빙서식]_${cleanDocTitle}_기안문.docx`,
        size: 18450,
        uploadedAt: today,
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      {
        id: excelAttId,
        name: `[데이터대장]_${cleanDocTitle}_실적집계표.xlsx`,
        size: 26800,
        uploadedAt: today,
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    ];

    const updatedDocs = group.documents.map((doc) => {
      if (doc.id === docId) {
        const existing = doc.attachments || [];
        return {
          ...doc,
          attachments: [...existing, ...newAttachments],
          status: doc.status === 'pending' ? ('review' as DocumentStatus) : doc.status,
          updatedAt: today,
        };
      }
      return doc;
    });

    onUpdateGroup({
      ...group,
      documents: updatedDocs,
      updatedAt: new Date().toISOString(),
    });

    setActiveDocForUpload(null);
    setDownloadToast('테스트용 Word(.docx) 및 Excel(.xlsx) 파일이 첨부되었습니다. 즉시 다운로드해 보세요!');
    setTimeout(() => setDownloadToast(null), 3500);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {group.categoryName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ID: {group.id}
              </span>
              {group.isCustom && (
                <span className="text-[11px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                  사용자 맞춤 그룹
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-600" />
              <span>{group.title}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {group.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata & Progress Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 border-b border-slate-100 bg-slate-50/70 -mx-5 sm:-mx-7 px-5 sm:px-7">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">담당 부서/자</span>
              <span className="font-semibold text-slate-800">{group.department} · {group.manager}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">목표 기한</span>
              <span className="font-semibold text-slate-800">{group.targetDate}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 font-medium">준비 진행률</span>
              <span className="font-bold text-blue-600">{completedCount}/{total}건 ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Bar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-4 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'completed', 'review', 'in_progress', 'pending'] as const).map((statusKey) => {
              const count = statusKey === 'all' 
                ? group.documents.length 
                : group.documents.filter((d) => d.status === statusKey).length;
              
              const labelMap = {
                all: '전체',
                completed: '완료',
                review: '검토중',
                in_progress: '작성중',
                pending: '대기',
              };

              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => setActiveTab(statusKey)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeTab === statusKey
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{labelMap[statusKey]}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === statusKey ? 'bg-slate-700 text-slate-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenExcelAi && (
              <button
                type="button"
                onClick={onOpenExcelAi}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="엑셀 파일을 올리면 AI가 이노비즈 보고서로 변환하여 이 그룹에 바로 등록합니다"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>엑셀 AI 자동 변환·등록</span>
              </button>
            )}

            {onOpenAutoDoc && (
              <button
                type="button"
                onClick={() => onOpenAutoDoc(group.id)}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="기업 정보와 로고가 반영된 실무 표준 서류 즉시 작성"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>표준 서식 자동생성</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 증빙 서류 추가</span>
            </button>
          </div>
        </div>

        {/* Add Document Inline Form */}
        {showAddForm && (
          <form onSubmit={handleAddDocument} className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl mb-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">이 그룹에 새 증빙 서류 등록</span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                required
                placeholder="서류명 (예: 소프트웨어 사업자 등록증)"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="규격/편철 가이드 (예: 원본 대조필 날인 후 편철)"
                value={newDocGuide}
                onChange={(e) => setNewDocGuide(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                서류 등록
              </button>
            </div>
          </form>
        )}

        {/* Documents Scrollable List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-1">
          {filteredDocs.map((doc, index) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 transition-all hover:border-slate-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {doc.evalItem || doc.title}
                      </h4>
                      {doc.points && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md">
                          배점 {doc.points}점
                        </span>
                      )}
                      {doc.isRequired && (
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-sm">
                          필수
                        </span>
                      )}
                      {doc.code && (
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-sm">
                          {doc.code}
                        </span>
                      )}
                    </div>

                    {/* Company Current Status from Sheet */}
                    {doc.currentStatus && (
                      <div className="mt-1.5 p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-1.5">
                        <span className="font-bold shrink-0">📊 기업 자가진단 현황:</span>
                        <span className="font-semibold text-blue-800">{doc.currentStatus}</span>
                      </div>
                    )}

                    {/* Evidence Documents Checklist */}
                    {doc.evidenceDocNames && doc.evidenceDocNames.length > 0 && (
                      <div className="mt-2">
                        <span className="text-[11px] font-bold text-slate-600 block mb-1">
                          📋 제출 필요 증빙 서류 ({doc.evidenceDocNames.length}종):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {doc.evidenceDocNames.map((evDoc, evIdx) => (
                            <span
                              key={evIdx}
                              className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-md font-medium"
                            >
                              • {evDoc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      <strong>편철 규격 및 심사 가이드:</strong> {doc.formatGuide}
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded-sm border border-slate-200">
                        💬 <strong>비고:</strong> {doc.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Selector Dropdown */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value as DocumentStatus)}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                      doc.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : doc.status === 'review'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : doc.status === 'in_progress'
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    <option value="pending">대기 (미작성)</option>
                    <option value="in_progress">작성중</option>
                    <option value="review">검토요청</option>
                    <option value="completed">승인완료 ✓</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDeleteDocument(doc.id)}
                    title="서류 삭제"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    첨부된 증빙 서류 ({doc.attachments?.length || 0}건)
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveDocForUpload(activeDocForUpload === doc.id ? null : doc.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>증빙 파일 올리기</span>
                  </button>
                </div>

                {/* Upload Zone (Drag-and-Drop + Manual Click) */}
                {activeDocForUpload === doc.id && (
                  <div className="mt-1 flex flex-col gap-2">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFileUpload(doc.id, e.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.hwp,.hwpx,.png,.jpg,.jpeg,.zip"
                        className="hidden"
                        onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                      />
                      <UploadCloud className="w-6 h-6 text-blue-600 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-800">
                        MS Word(.docx, .doc), Excel(.xlsx, .xls), 한글(HWP), PDF 파일 첨부
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        파일을 여기로 드래그하거나 클릭하여 선택하세요 · 첨부 후 언제든 원본 파일로 [다운로드] 가능합니다
                      </p>
                    </div>

                    {/* Quick test files button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleQuickAttachWordAndExcel(doc.id, doc.title)}
                        className="text-[11px] text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                        title="테스트를 위한 실제 Word(.docx) 및 Excel(.xlsx) 첨부파일을 바로 생성하여 추가합니다"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>테스트용 Word · Excel 파일 즉시 첨부해보기</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Attachment list */}
                {doc.attachments && doc.attachments.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1.5">
                    {doc.attachments.map((att) => {
                      const category = getFileCategory(att.name, att.fileType);
                      const isDownloading = downloadingId === att.id;

                      const categoryBadgeColor = 
                        category === 'excel' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        category === 'word' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        category === 'pdf' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        category === 'hwp' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        'bg-slate-100 text-slate-700 border-slate-200';

                      const categoryTagColor = 
                        category === 'excel' ? 'bg-emerald-100 text-emerald-800' :
                        category === 'word' ? 'bg-blue-100 text-blue-800' :
                        category === 'pdf' ? 'bg-rose-100 text-rose-800' :
                        category === 'hwp' ? 'bg-purple-100 text-purple-800' :
                        'bg-slate-200 text-slate-700';

                      const labelText = 
                        category === 'excel' ? 'Excel' :
                        category === 'word' ? 'Word' :
                        category === 'pdf' ? 'PDF' :
                        category === 'hwp' ? 'HWP' : '파일';

                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-2 bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200 px-3 py-2 rounded-xl text-xs text-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`p-1.5 rounded-lg border shrink-0 ${categoryBadgeColor}`}>
                              {category === 'excel' ? (
                                <FileSpreadsheet className="w-4 h-4" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 truncate max-w-[180px] sm:max-w-[320px]" title={att.name}>
                                  {att.name}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${categoryTagColor}`}>
                                  {labelText}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {formatFileSize(att.size)} · 등록일: {att.uploadedAt}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Prominent Download Button */}
                            <button
                              type="button"
                              onClick={(e) => handleDownloadAttachment(e, att)}
                              disabled={isDownloading}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-white hover:bg-blue-600 active:bg-blue-700 border border-blue-200 hover:border-blue-600 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                              title={`${att.name} 파일 다운로드`}
                            >
                              {isDownloading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              <span>다운로드</span>
                            </button>

                            {/* Delete Attachment Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(doc.id, att.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="첨부 파일 삭제"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">
                선택된 조건에 해당하는 서류가 없습니다.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                상단의 '+ 새 증빙 서류 추가' 버튼을 눌러 서류를 등록해보세요.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            마지막 업데이트: {group.updatedAt.slice(0, 10)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

        {/* Download Toast Notification */}
        {downloadToast && (
          <div className="fixed bottom-6 right-6 z-60 bg-slate-900/95 backdrop-blur-xs text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium border border-slate-700 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{downloadToast}</span>
          </div>
        )}
      </div>
    </div>
  );
};
