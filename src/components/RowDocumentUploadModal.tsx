import React, { useState, useRef, useEffect } from 'react';
import { SheetRowItem, parseEvidenceDocs } from '../data/sheetData';
import { DocumentAttachment, DocumentGroup, DocumentItem } from '../types';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  Database, 
  Github, 
  ExternalLink, 
  AlertCircle,
  FileCheck,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveCustomSupabaseConfig, 
  uploadToSupabaseStorage, 
  convertClaudeMarkdownToWordDoc, 
  BUCKET_NAME 
} from '../services/supabaseService';
import { 
  saveAttachmentBlob, 
  deleteAttachmentBlob, 
  getAttachmentBlob, 
  downloadAttachmentFile,
  getSavedAttachmentsForItem,
  saveAttachmentsForItem
} from '../utils/fileStorage';

interface RowDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  row: SheetRowItem | null;
  matchedGroup: DocumentGroup | null;
  matchedDoc: DocumentItem | null;
  companyName?: string;
  ceoName?: string;
  onAttachmentsUpdated: (updatedAttachments: DocumentAttachment[], newStatus?: 'completed' | 'review' | 'in_progress') => void;
}

export const RowDocumentUploadModal: React.FC<RowDocumentUploadModalProps> = ({
  isOpen,
  onClose,
  row,
  matchedGroup,
  matchedDoc,
  companyName = '주식회사 이노테크',
  ceoName = '대표이사',
  onAttachmentsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'claude' | 'cloudConfig'>('upload');
  const [attachments, setAttachments] = useState<DocumentAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [claudeText, setClaudeText] = useState('');
  const [claudeDocTitle, setClaudeDocTitle] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase Config states
  const [supabaseConfig, setSupabaseConfig] = useState(getSupabaseConfig());
  const [inputUrl, setInputUrl] = useState(supabaseConfig.url || '');
  const [inputKey, setInputKey] = useState(supabaseConfig.anonKey || '');
  const [showConfigSaved, setShowConfigSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && row) {
      // Load existing attachments from matchedDoc or universal storage lookup
      let existing: DocumentAttachment[] = [];
      if (matchedDoc?.attachments && matchedDoc.attachments.length > 0) {
        existing = matchedDoc.attachments;
      } else {
        existing = getSavedAttachmentsForItem({ evalItem: row.evalItem });
      }
      setAttachments(existing);
      setClaudeDocTitle(`${row.evalItem.split(' ').slice(0, 3).join(' ')} 대응계획서`);
      setSupabaseConfig(getSupabaseConfig());
    }
  }, [isOpen, row, matchedDoc]);

  if (!isOpen || !row) return null;

  const evidenceList = parseEvidenceDocs(row.evidenceDocs);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newAttachments: DocumentAttachment[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const attachId = `attach-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'dat';

      // 1. Save to IndexedDB binary store for immediate offline/local reliability
      await saveAttachmentBlob(attachId, file);

      // 2. If Supabase is configured, upload to Supabase Storage
      let publicUrl: string | undefined = undefined;
      if (supabaseConfig.isConfigured) {
        const sanitizedItem = row.evalItem.replace(/[/\\?%*:|"<>]/g, '_');
        const storagePath = `${row.section.split('.')[0] || 'part'}/${sanitizedItem}/${file.name}`;
        const uploadRes = await uploadToSupabaseStorage(storagePath, file);
        if (uploadRes.success) {
          publicUrl = uploadRes.publicUrl;
        }
      }

      const item: DocumentAttachment = {
        id: attachId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        fileType: fileExtension,
        dataUrl: publicUrl,
      };

      newAttachments.push(item);
    }

    setAttachments(newAttachments);
    saveAttachmentsState(newAttachments);
    setIsUploading(false);
    showToast(`${files.length}개 파일이 성공적으로 등록되었습니다.`);
  };

  const saveAttachmentsState = (items: DocumentAttachment[]) => {
    if (!row) return;
    saveAttachmentsForItem({ evalItem: row.evalItem }, items);
    onAttachmentsUpdated(items, items.length > 0 ? 'completed' : 'in_progress');
  };

  const handleDeleteAttachment = async (attachId: string) => {
    await deleteAttachmentBlob(attachId);
    const filtered = attachments.filter((a) => a.id !== attachId);
    setAttachments(filtered);
    saveAttachmentsState(filtered);
    showToast('첨부 파일이 삭제되었습니다.');
  };

  const handleDownloadAttachment = async (attach: DocumentAttachment) => {
    try {
      await downloadAttachmentFile(attach, companyName || '(주)더한농');
      showToast(`'${attach.name}' 다운로드를 시작했습니다.`);
    } catch (e) {
      showToast('다운로드 처리 중 오류가 발생했습니다.');
    }
  };

  // Claude Prompt Copy
  const handleCopyClaudePrompt = () => {
    const promptText = `[이노비즈 기술혁신시스템 평가 대응서류 작성 요청]
회사명: ${companyName}
대표자: ${ceoName}
심사 부문: ${row.section}
대항목: ${row.majorCategory}
평가항목(세부): ${row.evalItem} (배점: ${row.points}점)
기업 현황(자가진단): ${row.currentStatus}
필수 증빙자료: ${row.evidenceDocs}

[요청 사항]
중소벤처기업부 및 기술보증기금(KIBO) 이노비즈 현장평가관의 1,000점 만점 심사 기준에 통과할 수 있도록, 위 평가항목에 부합하는 완성도 높은 공식 사내 규정/계획서/실적보고서를 작성해주세요.
- 표준 문서 서식(문서번호, 목적, 추진 조직 및 역할, 세부 운영 절차, 최근 성과지표, 사후관리)을 체계적인 마크다운(#, ##, ###)과 불릿 항목으로 구성해주세요.
- 실무 현장에서 즉시 결재 및 보관할 수 있는 수준의 구체적이고 전문적인 비즈니스 문체로 작성해주세요.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
    showToast('클로드(Claude) 최적화 프롬프트가 복사되었습니다!');
  };

  // Claude Text -> Word Doc Upload
  const handleConvertClaudeToDoc = async () => {
    if (!claudeText.trim()) {
      showToast('클로드에서 생성한 답변 텍스트를 입력창에 붙여넣어주세요.');
      return;
    }

    setIsUploading(true);
    const title = claudeDocTitle.trim() || `${row.evalItem} 공식대응서류`;
    const docBlob = convertClaudeMarkdownToWordDoc(
      title,
      row.majorCategory,
      claudeText,
      companyName,
      ceoName
    );

    const fileName = `${title.replace(/[/\\?%*:|"<>]/g, '_')}_${new Date().toISOString().split('T')[0]}.doc`;
    const attachId = `claude-doc-${Date.now()}`;

    await saveAttachmentBlob(attachId, docBlob);

    let publicUrl: string | undefined = undefined;
    if (supabaseConfig.isConfigured) {
      const sanitizedItem = row.evalItem.replace(/[/\\?%*:|"<>]/g, '_');
      const storagePath = `${row.section.split('.')[0] || 'part'}/${sanitizedItem}/${fileName}`;
      const uploadRes = await uploadToSupabaseStorage(storagePath, docBlob, 'application/msword');
      if (uploadRes.success) publicUrl = uploadRes.publicUrl;
    }

    const newAttach: DocumentAttachment = {
      id: attachId,
      name: fileName,
      size: docBlob.size,
      uploadedAt: new Date().toISOString(),
      fileType: 'doc',
      dataUrl: publicUrl,
    };

    const updated = [newAttach, ...attachments];
    setAttachments(updated);
    saveAttachmentsState(updated);
    setClaudeText('');
    setIsUploading(false);
    setActiveTab('upload');
    showToast('클로드 산출물이 이노비즈 공식 Word(.doc) 문서로 자동 변환되어 업로드되었습니다!');
  };

  const handleSaveSupabaseConfig = () => {
    saveCustomSupabaseConfig(inputUrl, inputKey);
    const updated = getSupabaseConfig();
    setSupabaseConfig(updated);
    setShowConfigSaved(true);
    setTimeout(() => setShowConfigSaved(false), 3000);
    showToast('Supabase 연동 정보가 안전하게 저장되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                {row.section}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {row.majorCategory}
              </span>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                배점 {row.points}점
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {row.evalItem}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              현황: <strong className="text-slate-700">{row.currentStatus}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Required Evidence Badge Bar */}
        <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="font-bold text-blue-900 shrink-0 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" /> 필수 증빙자료:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {evidenceList.map((doc, dIdx) => (
              <span
                key={dIdx}
                className="bg-white text-slate-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium shadow-2xs"
              >
                {doc}
              </span>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'upload'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>파일 업로드 및 보관함 ({attachments.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('claude')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'claude'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>클로드(Claude) 작업 문서 연계</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloudConfig')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'cloudConfig'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Supabase · GitHub · Vercel 연동</span>
            {supabaseConfig.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-xs">
          {/* Toast Notice */}
          {toastMessage && (
            <div className="mb-4 p-2.5 bg-slate-900 text-white rounded-lg text-xs flex items-center justify-between animate-in fade-in duration-150 shadow-md">
              <span className="font-medium">{toastMessage}</span>
            </div>
          )}

          {/* TAB 1: Direct File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".doc,.docx,.xls,.xlsx,.pdf,.hwp,.hwpx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                  }}
                />
                <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="font-bold text-slate-800 text-sm">
                  이노비즈 대응 문서를 여기로 드래그하거나 클릭하여 업로드
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  지원 포맷: MS Word(.docx, .doc), 엑셀(.xlsx), PDF, 한글(.hwp), 이미지 등
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium">
                    {supabaseConfig.isConfigured
                      ? '☁️ Supabase Cloud Storage 실시간 연동 활성화'
                      : '🔒 브라우저 IndexedDB 로컬 안전 보관 중 (Supabase 연동 가능)'}
                  </span>
                </div>
              </div>

              {/* Uploaded Files List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span>등록된 서류 목록 ({attachments.length}건)</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    {attachments.length > 1 && (
                      <button
                        type="button"
                        onClick={async () => {
                          showToast(`총 ${attachments.length}개 파일 일괄 다운로드를 시작합니다...`);
                          for (let i = 0; i < attachments.length; i++) {
                            await handleDownloadAttachment(attachments[i]);
                            await new Promise((r) => setTimeout(r, 600));
                          }
                          showToast('모든 파일의 다운로드가 완료되었습니다.');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="등록된 파일 전체 다운로드"
                      >
                        <Download className="w-3 h-3" />
                        <span>전체 다운로드</span>
                      </button>
                    )}
                    {attachments.length > 0 && (
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        ✓ 실사 대응 준비 완료
                      </span>
                    )}
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                    아직 등록된 대응 서류가 없습니다. 파일을 드래그하여 업로드하거나 클로드 연계 기능을 활용해 보세요.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                    {attachments.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                            <FileText className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-800 truncate text-xs">
                              {file.name}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{(file.size / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span>{new Date(file.uploadedAt).toLocaleDateString('ko-KR')} 등록</span>
                              {file.dataUrl && (
                                <span className="text-blue-600 font-medium">Supabase 클라우드</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(file)}
                            className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center gap-1 transition-colors cursor-pointer"
                            title="파일 다운로드"
                          >
                            <Download className="w-3 h-3" />
                            <span>다운로드</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(file.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="파일 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Claude AI Integration */}
          {activeTab === 'claude' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  클로드(Claude) 산출물 원클릭 워드 문서화 워크플로우
                </div>
                <p className="text-[11px] text-purple-700 leading-relaxed">
                  1. 아래 [클로드용 프롬프트 복사]를 눌러 클로드에 붙여넣습니다. ➔ 2. 클로드가 생성한 본문 내용을 복사하여 아래에 붙여넣고 [워드(.doc) 변환 및 등록]을 클릭하면, 이노비즈 공식 결재선과 로고가 포함된 정규 Word 문서로 즉시 생성되어 보관함에 등록됩니다.
                </p>
              </div>

              {/* Step 1: Copy Prompt */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-slate-800 text-xs">
                    [1단계] 이노비즈 평가기준 맞춤 프롬프트
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    평가항목명, 1,000점 배점, 기업현황, 필수 증빙 규격이 자동으로 세팅된 프롬프트입니다.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyClaudePrompt}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
                >
                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPrompt ? '복사 완료!' : '프롬프트 복사'}</span>
                </button>
              </div>

              {/* Step 2: Paste Output & Convert */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs">
                    [2단계] 클로드 생성 결과 붙여넣기 (마크다운 또는 텍스트)
                  </label>
                  <input
                    type="text"
                    value={claudeDocTitle}
                    onChange={(e) => setClaudeDocTitle(e.target.value)}
                    placeholder="생성될 문서 제목"
                    className="px-2 py-1 text-xs border border-slate-300 rounded-md w-60 text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <textarea
                  rows={8}
                  value={claudeText}
                  onChange={(e) => setClaudeText(e.target.value)}
                  placeholder="Claude 채팅창의 답변을 전체 복사하여 여기에 붙여넣으세요 (예: # 1. 개요, ## 2. 기술개발 추진계획 등)..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleConvertClaudeToDoc}
                    disabled={isUploading || !claudeText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>공식 Word (.doc) 문서로 자동 변환하여 업로드</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Cloud Architecture (Supabase · GitHub · Vercel) */}
          {activeTab === 'cloudConfig' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900 text-white rounded-xl">
                <div className="font-bold text-sm mb-1 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  클라우드 자료실 아키텍처 (Supabase · GitHub · Vercel)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  본 애플리케이션은 <strong>Vercel</strong>을 통한 프론트엔드 호스팅, <strong>GitHub</strong>를 통한 소스 및 서식 버전 관리, <strong>Supabase Storage</strong>를 통한 대용량 증빙 서류 영구 보관 구조로 완벽히 설계되어 있습니다.
                </p>
              </div>

              {/* Supabase Storage Setup Panel */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800 text-xs">Supabase 연동 상태</span>
                  </div>
                  {supabaseConfig.isConfigured ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> 연결됨 (버킷: {BUCKET_NAME})
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      미연결 (로컬 IndexedDB 안전 모드로 동작 중)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Supabase Project URL (또는 .env의 VITE_SUPABASE_URL)
                    </label>
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Supabase anon / public key (또는 .env의 VITE_SUPABASE_ANON_KEY)
                    </label>
                    <input
                      type="password"
                      value={inputKey}
                      onChange={(e) => setInputKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    * 설정값을 입력하시면 Vercel 배포 전에도 브라우저에서 Supabase 스토리지로 즉시 파일이 전송됩니다.
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveSupabaseConfig}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs"
                  >
                    {showConfigSaved ? '저장되었습니다!' : '연동 설정 저장'}
                  </button>
                </div>
              </div>

              {/* GitHub & Vercel Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1 text-xs">
                    <Github className="w-4 h-4 text-slate-700" />
                    GitHub 저장소 연동
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    프로젝트 코드를 GitHub에 푸시하여 팀원들과 공동 작업하고, 이노비즈 평가지표 변경 이력을 안전하게 형상 관리할 수 있습니다.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1 text-xs">
                    <ExternalLink className="w-4 h-4 text-slate-700" />
                    Vercel 원클릭 배포
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Vercel 대시보드의 Environment Variables에 <code>VITE_SUPABASE_URL</code>과 <code>VITE_SUPABASE_ANON_KEY</code>를 등록하면 즉시 상용 서비스가 개시됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {attachments.length > 0 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 총 {attachments.length}개 서류가 보관되어 있습니다.
              </span>
            ) : (
              <span>서류를 업로드하면 이노비즈 자가진단표에 즉시 반영됩니다.</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
