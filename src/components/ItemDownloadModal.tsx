import React, { useState, useEffect } from 'react';
import { CompanyProfile, DocumentAttachment, SelfAuditGuideItem } from '../types';
import { GeneratedDocTemplate } from '../data/generatedDocTemplates';
import { getAttachmentBlob, downloadAttachmentFile } from '../utils/fileStorage';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';
import { convertMarkdownToRichHtml } from './AutoDocGeneratorModal';
import {
  X,
  Download,
  FileText,
  FileDown,
  Paperclip,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  FolderArchive,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export interface ItemDownloadFile {
  id: string;
  name: string;
  type: 'word_generated' | 'template' | 'uploaded';
  extension: string;
  size?: number;
  uploadedAt?: string;
  description: string;
  attachmentData?: DocumentAttachment;
  templateData?: GeneratedDocTemplate;
}

interface ItemDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SelfAuditGuideItem | null;
  company: CompanyProfile;
  selectedOptionNumber?: number;
  template: GeneratedDocTemplate | null;
  uploadedAttachments: DocumentAttachment[];
  onUploadNewFile?: () => void;
}

export const ItemDownloadModal: React.FC<ItemDownloadModalProps> = ({
  isOpen,
  onClose,
  item,
  company,
  selectedOptionNumber,
  template,
  uploadedAttachments,
  onUploadNewFile,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Selected option details
  const selectedOption = selectedOptionNumber
    ? item.options.find((o) => o.optionNumber === selectedOptionNumber)
    : null;

  // Build the list of all downloadable files registered or available for this item
  const fileList: ItemDownloadFile[] = [];

  // 1. If standard template exists, include official tailored Word doc
  if (template) {
    fileList.push({
      id: `tmpl-${template.id}`,
      name: `[${company.companyName}]_${template.title}_표준서식.doc`,
      type: 'template',
      extension: 'doc',
      description: `사내 표준 규정/서식 (문서번호: ${template.docCode})`,
      templateData: template,
    });
  }

  // 2. Official Evaluation Criteria Guidance / Response Plan Word Doc
  fileList.push({
    id: `eval-doc-${item.id}`,
    name: `[${company.companyName}]_${item.evalItemCode}_${item.evalItemName.replace(/[\/\\:*?"<>|]/g, '_')}_대응계획서.doc`,
    type: 'word_generated',
    extension: 'doc',
    description: `평가항목 종합 소명서 및 실사 대응계획서 (배점 ${item.points}점 기준)`,
  });

  // 3. User-uploaded or linked evidence attachments
  uploadedAttachments.forEach((att) => {
    fileList.push({
      id: att.id,
      name: att.name,
      type: 'uploaded',
      extension: att.fileType || att.name.split('.').pop() || 'dat',
      size: att.size,
      uploadedAt: att.uploadedAt,
      description: att.dataUrl ? 'Supabase 클라우드 등록 파일' : '로컬 보관 증빙 파일',
      attachmentData: att,
    });
  });

  // Download official generated Word doc
  const handleDownloadGeneratedDoc = async () => {
    const fileId = `eval-doc-${item.id}`;
    setDownloadingId(fileId);

    try {
      const title = `${item.evalItemName} 증빙 대응서류`;
      const docCode = `DOC-${item.evalItemCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const rawContent = `
# [사내 표준 증빙] ${item.evalItemName} 구비서류

**문서번호:** ${docCode}  
**기업명:** ${company.companyName}  
**대표자:** ${company.ceoName}  
**평가항목:** [${item.evalItemCode}] ${item.evalItemName} (배점: ${item.points}점)  
**작성일자:** ${new Date().toISOString().split('T')[0]}  

---

### 1. 개요 및 평가 목적
본 문서는 기술혁신형 중소기업(INNO-BIZ) 인증 현장실사 및 평가에 대응하기 위하여, 
${company.companyName}의 **'${item.evalItemName}'** 관련 사내 규정 및 증빙 자료를 종합한 공식 표준 문서입니다.

### 2. 세부 지표 및 기업 자가진단 현황
- **문항 내용:** ${item.question}
- **자가진단 현황:** ${
        selectedOption
          ? `${selectedOption.grade}등급 (${selectedOption.scoreRate}%, ${selectedOption.points}점) - ${selectedOption.optionLabel} ${selectedOption.text}`
          : item.currentStatusNote || '자가진단 미선택'
      }

### 3. 필수 제출 및 구비서류 목록
${item.requiredDocs.map((doc, idx) => `${idx + 1}. **${doc}**`).join('\n')}

${item.optionalDocs && item.optionalDocs.length > 0 ? `\n### 4. 보조 및 가점 증빙자료\n${item.optionalDocs.map((doc, idx) => `${idx + 1}. ${doc}`).join('\n')}` : ''}

### 5. 실사위원 현장 대응 전략 및 실무 팁
- **핵심 소명 포인트:** ${item.strategy.join(' ')}
- **현장실사 착안사항:** ${item.practicalTip || '관련 계정별 원장 및 사내 표준 절차서를 함께 구비하여 현장 대조에 대비하십시오.'}

---

**${company.companyName} 대표이사 ${company.ceoName}**
      `.trim();

      const formattedBodyHtml = convertMarkdownToRichHtml(rawContent);
      const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 280, 95) : '';
      const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';

      const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 21.0cm 29.7cm;
            margin: 20mm 15mm 20mm 15mm;
            mso-page-orientation: portrait;
          }
          body {
            width: 100% !important;
            font-family: "Malgun Gothic", "맑은 고딕", "Dotum", "돋움", sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #0f172a;
          }
          table.data-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 10pt 0;
            font-size: 9pt;
          }
          table.data-table th, table.data-table td {
            border: 1pt solid #94a3b8;
            padding: 4pt 5pt;
          }
          table.data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          h1 { font-size: 16pt; font-weight: bold; border-bottom: 2pt solid #0f172a; padding-bottom: 5pt; margin-top: 10pt; color: #0f172a; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt; }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 12pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 8pt;">
          ${base64Logo ? `<img src="${base64Logo}" alt="Logo" style="max-height: 40pt; display: block; margin-bottom: 6pt;" />` : `<div style="font-size: 14pt; font-weight: bold; color: #1e3a8a;">${company.companyName}</div>`}
          <div style="font-size: 9pt; color: #64748b;">문서번호: ${docCode} | 규격: A4 표준 서식</div>
        </div>
        <div>
          ${formattedBodyHtml}
        </div>
        <div style="margin-top: 30pt; padding-top: 15pt; border-top: 1.5pt solid #cbd5e1; text-align: right; font-size: 12pt; font-weight: bold;">
          ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
          ${base64Seal ? `&nbsp; <img src="${base64Seal}" alt="직인" style="width: 40pt; height: 40pt; vertical-align: middle; display: inline-block; margin-left: 6pt;" />` : `&nbsp; <span style="color: #b91c1c; font-size: 10pt;">(직인생략)</span>`}
        </div>
      </body>
      </html>
      `;

      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `[${company.companyName}]_${item.evalItemCode}_${item.evalItemName.replace(/[\/\\:*?"<>|]/g, '_')}_대응계획서.doc`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('대응계획서 다운로드가 완료되었습니다.');
    } catch (e) {
      showToast('대응계획서 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download template document
  const handleDownloadTemplateDoc = async (tmpl: GeneratedDocTemplate) => {
    const fileId = `tmpl-${tmpl.id}`;
    setDownloadingId(fileId);

    try {
      const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 280, 95) : '';
      const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';
      const formattedBodyHtml = convertMarkdownToRichHtml(tmpl.content);

      const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${tmpl.title}</title>
        <style>
          @page {
            size: 21.0cm 29.7cm;
            margin: 20mm 15mm 20mm 15mm;
            mso-page-orientation: portrait;
          }
          body {
            width: 100% !important;
            font-family: "Malgun Gothic", "맑은 고딕", "Dotum", "돋움", sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #0f172a;
          }
          table.data-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 10pt 0;
            font-size: 9pt;
          }
          table.data-table th, table.data-table td {
            border: 1pt solid #94a3b8;
            padding: 4pt 5pt;
          }
          table.data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          h1 { font-size: 16pt; font-weight: bold; border-bottom: 2pt solid #0f172a; padding-bottom: 5pt; margin-top: 10pt; color: #0f172a; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt; }
        </style>
      </head>
      <body>
        <div style="margin-bottom: 12pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 8pt;">
          ${base64Logo ? `<img src="${base64Logo}" alt="Logo" style="max-height: 40pt; display: block; margin-bottom: 6pt;" />` : `<div style="font-size: 14pt; font-weight: bold; color: #1e3a8a;">${company.companyName}</div>`}
          <div style="font-size: 9pt; color: #64748b;">문서번호: ${tmpl.docCode} | 규격: A4 표준 서식</div>
        </div>
        <div>
          ${formattedBodyHtml}
        </div>
        <div style="margin-top: 30pt; padding-top: 15pt; border-top: 1.5pt solid #cbd5e1; text-align: right; font-size: 12pt; font-weight: bold;">
          ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
          ${base64Seal ? `&nbsp; <img src="${base64Seal}" alt="직인" style="width: 40pt; height: 40pt; vertical-align: middle; display: inline-block; margin-left: 6pt;" />` : `&nbsp; <span style="color: #b91c1c; font-size: 10pt;">(직인생략)</span>`}
        </div>
      </body>
      </html>
      `;

      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `[${company.companyName}]_${tmpl.title}.doc`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast(`'${tmpl.title}' 표준서식 다운로드가 완료되었습니다.`);
    } catch (e) {
      showToast('표준서식 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download custom attachment file
  const handleDownloadAttachmentFile = async (att: DocumentAttachment) => {
    setDownloadingId(att.id);
    try {
      await downloadAttachmentFile(att, company.companyName);
      showToast(`'${att.name}' 다운로드를 완료했습니다.`);
    } catch (e) {
      showToast('파일 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Dispatch appropriate download for each row
  const handleDownloadFile = async (file: ItemDownloadFile) => {
    if (file.type === 'word_generated') {
      await handleDownloadGeneratedDoc();
    } else if (file.type === 'template' && file.templateData) {
      await handleDownloadTemplateDoc(file.templateData);
    } else if (file.type === 'uploaded' && file.attachmentData) {
      await handleDownloadAttachmentFile(file.attachmentData);
    }
  };

  // Download all files at once sequentially
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    showToast(`${fileList.length}개 파일 일괄 다운로드를 시작합니다...`);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      await handleDownloadFile(file);
      // Brief pause between browser downloads to prevent browser blocking
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setIsDownloadingAll(false);
    showToast('모든 파일의 다운로드가 완료되었습니다.');
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-mono">
                {item.evalItemCode}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {item.points}점
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {item.majorCategory}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-blue-600" />
              <span>{item.evalItemName} 증빙 서류 목록</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Evaluation Summary Banner */}
        <div className="px-5 py-3 bg-blue-50/50 border-b border-blue-100 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900">자가진단 현황:</span>
            {selectedOption ? (
              <span className="font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded">
                {selectedOption.grade}등급 ({selectedOption.scoreRate}%, {selectedOption.points}점) - {selectedOption.optionLabel} {selectedOption.text}
              </span>
            ) : (
              <span className="text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                진단 전 기본 대응
              </span>
            )}
          </div>
          <div className="text-slate-500">
            총 <strong className="text-blue-700">{fileList.length}건</strong>의 다운로드 가능 서류
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-5 mt-3 p-2.5 bg-slate-900 text-white text-xs rounded-xl shadow-md flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* File List Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>등록된 증빙 및 생성 서식 목록</span>
            <span className="text-[11px] text-slate-400">항목별 개별 다운로드 또는 전체 다운로드 가능</span>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            {fileList.map((file, idx) => {
              const isCurrentDownloading = downloadingId === file.id;

              return (
                <div
                  key={file.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      file.type === 'template' 
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : file.type === 'uploaded'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {file.type === 'template' ? (
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      ) : file.type === 'uploaded' ? (
                        <Paperclip className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-600" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {file.name}
                        </span>
                        {file.type === 'template' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded">
                            표준서식
                          </span>
                        )}
                        {file.type === 'word_generated' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                            대응계획서
                          </span>
                        )}
                        {file.type === 'uploaded' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                            업로드증빙
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {file.description}
                      </div>

                      {file.uploadedAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          등록일: {new Date(file.uploadedAt).toLocaleDateString('ko-KR')}
                          {file.size && ` · ${(file.size / 1024).toFixed(1)} KB`}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(file)}
                      disabled={isCurrentDownloading || isDownloadingAll}
                      className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      title={`${file.name} 다운로드`}
                    >
                      {isCurrentDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                      ) : (
                        <Download className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{isCurrentDownloading ? '받는 중...' : '다운로드'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reference: Required Docs Checklist reminder */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>심사원 현장 실사 필수 구비 서류 목록</span>
            </div>
            <ul className="space-y-1 pl-1">
              {item.requiredDocs.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer with Batch Download Action */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {uploadedAttachments.length > 0 ? (
              <span className="text-emerald-700 font-medium">
                총 {uploadedAttachments.length}개의 실제 증빙 파일이 등록되어 있습니다.
              </span>
            ) : (
              <span className="text-slate-400">
                기본 표준서식 및 대응계획서가 제공됩니다.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || fileList.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloadingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FolderArchive className="w-4 h-4" />
              )}
              <span>등록 파일 전체 다운로드 ({fileList.length}건)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
