import React, { useState, useMemo, useEffect } from 'react';
import { CompanyProfile, DocumentAttachment, DocumentGroup, SelfAuditGuideItem, SelfAuditOption } from '../types';
import { SELF_AUDIT_PARTS, SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';
import { generateDocumentsForCompany, GeneratedDocTemplate } from '../data/generatedDocTemplates';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';
import { convertMarkdownToRichHtml } from './AutoDocGeneratorModal';
import { getAttachmentBlob, getSavedAttachmentsForItem } from '../utils/fileStorage';
import { ItemDownloadModal } from './ItemDownloadModal';
import { RowDocumentUploadModal } from './RowDocumentUploadModal';
import { SheetRowItem } from '../data/sheetData';
import {
  X,
  Download,
  FolderDown,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  SlidersHorizontal,
  Check,
  FileDown,
  Paperclip,
  CheckCircle2,
  Loader2,
  FolderArchive,
  Upload,
  Sparkles
} from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: DocumentGroup[];
  company: CompanyProfile;
}

const OPTIONS_STORAGE_KEY = 'innobiz_self_audit_selected_options_v2';

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  groups,
  company,
}) => {
  // Selected options state (scores & grades)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load selected options:', e);
    }
    return {};
  });

  // Active filter by Part & Search query (includes 'common' for 8 standardized core docs)
  const [activePartFilter, setActivePartFilter] = useState<'all' | 'common' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [selectedItemForDownload, setSelectedItemForDownload] = useState<SelfAuditGuideItem | null>(null);
  const [selectedItemForUpload, setSelectedItemForUpload] = useState<SelfAuditGuideItem | null>(null);
  const [attachmentRefreshKey, setAttachmentRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setAttachmentRefreshKey((k) => k + 1);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('innobiz-attachments-updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('innobiz-attachments-updated', handleUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setDownloadToast(msg);
    setTimeout(() => {
      setDownloadToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Pre-generate standardized templates for the company
  const generatedTemplates = useMemo(() => {
    return generateDocumentsForCompany(company);
  }, [company]);

  // Map templates by target item or linked groupId or id
  const templateByDocId = useMemo(() => {
    const map = new Map<string, GeneratedDocTemplate>();
    generatedTemplates.forEach((tpl) => {
      map.set(tpl.id, tpl);
    });
    return map;
  }, [generatedTemplates]);

  // Find user-uploaded files for an item (from groups or universal storage lookup)
  const getItemAttachments = (item: SelfAuditGuideItem): DocumentAttachment[] => {
    // 1. Search in groups by targetEvalItem matching or linkedDocTemplateId
    for (const grp of groups) {
      for (const doc of grp.documents) {
        const isMatch =
          (item.linkedDocTemplateId && doc.id === item.linkedDocTemplateId) ||
          doc.title.includes(item.evalItemName) ||
          item.evalItemName.includes(doc.title) ||
          (doc.targetEvalItem && doc.targetEvalItem.includes(item.evalItemName));
        if (isMatch && doc.attachments && doc.attachments.length > 0) {
          return doc.attachments;
        }
      }
    }
    // 2. Search using universal storage lookup across all key variations
    const saved = getSavedAttachmentsForItem({
      id: item.id,
      evalItemCode: item.evalItemCode,
      evalItemName: item.evalItemName,
      evalItem: `${item.evalItemCode} ${item.evalItemName}`,
    });
    if (saved && saved.length > 0) return saved;

    return [];
  };

  // Download custom user-uploaded attachment file directly
  const handleDownloadAttachment = async (attach: DocumentAttachment) => {
    try {
      setDownloadingId(attach.id);
      const blob = await getAttachmentBlob(attach.id);
      let downloadUrl = '';
      if (blob) {
        downloadUrl = URL.createObjectURL(blob);
      } else if (attach.dataUrl) {
        downloadUrl = attach.dataUrl;
      } else {
        showToast(`'${attach.name}' 파일을 찾을 수 없습니다.`);
        setDownloadingId(null);
        return;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attach.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (blob) URL.revokeObjectURL(downloadUrl);
      showToast(`'${attach.name}' 다운로드를 완료했습니다.`);
    } catch (e) {
      showToast('다운로드 처리 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download a single document as Word (.doc)
  const handleDownloadSingleDoc = async (item: SelfAuditGuideItem) => {
    setDownloadingId(item.id);
    try {
      const template = item.linkedDocTemplateId ? templateByDocId.get(item.linkedDocTemplateId) : null;
      const title = template?.title || `${item.evalItemName} 증빙 대응서류`;
      const docCode = template?.docCode || `DOC-${item.evalItemCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const rawContent = template?.content || `
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
      selectedOptions[item.id]
        ? (() => {
            const opt = item.options.find((o) => o.optionNumber === selectedOptions[item.id]);
            return opt ? `${opt.optionLabel} ${opt.text} (${opt.grade}등급 · ${opt.points}점)` : '-';
          })()
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
      link.download = `[${company.companyName}]_${item.evalItemCode}_${item.evalItemName.replace(/[\/\\:*?"<>|]/g, '_')}_구비서류.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`'${item.evalItemName}' 공식 워드(.doc) 서류를 다운로드했습니다.`);
    } catch (e) {
      showToast('문서 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Download Standardized 8 Auto-Generated Common Documents as Official Word (.doc)
  const handleDownloadTemplateWord = async (tpl: GeneratedDocTemplate) => {
    setDownloadingId(tpl.id);
    try {
      const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 280, 95) : '';
      const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';
      const formattedBodyHtml = convertMarkdownToRichHtml(tpl.content);

      const steps = ['작성', '검토', '승인', '대표이사'];
      const thStepsHtml = steps.map((s) => `<th style="border: 1pt solid #475569; background: #f1f5f9; padding: 3pt 5pt; font-size: 8.5pt; text-align: center; font-weight: bold;">${s}</th>`).join('');
      const tdStepsHtml = steps.map((_, idx) => {
        const isLast = idx === steps.length - 1;
        return `<td style="border: 1pt solid #475569; height: 38pt; width: 46pt; text-align: center; vertical-align: middle; font-size: 8.5pt;">${
          isLast && base64Seal 
            ? `<img src="${base64Seal}" alt="직인" style="width: 32pt; height: 32pt; object-fit: contain; vertical-align: middle; display: inline-block;" />`
            : isLast 
            ? '(인)' 
            : ''
        }</td>`;
      }).join('');

      const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${tpl.title}</title>
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
            max-width: 100% !important;
            font-family: "Malgun Gothic", "맑은 고딕", "Dotum", "돋움", sans-serif;
            font-size: 10.5pt;
            line-height: 1.6;
            color: #0f172a;
            margin: 0;
            padding: 0;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
            box-sizing: border-box !important;
          }
          th, td {
            word-break: break-all !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            white-space: normal !important;
          }
          h1 { font-size: 16pt; font-weight: bold; border-bottom: 2pt solid #0f172a; padding-bottom: 5pt; margin-top: 10pt; color: #0f172a; }
          h3 { font-size: 12pt; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; color: #1e3a8a; border-left: 3pt solid #2563eb; padding-left: 6pt; }
          h4 { font-size: 10.5pt; font-weight: bold; margin-top: 8pt; margin-bottom: 3pt; color: #334155; }
          table.data-table {
            width: 100% !important;
            table-layout: fixed !important;
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
            color: #1e293b;
          }
        </style>
      </head>
      <body>
        <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; margin-bottom: 12pt;">
          <tr>
            <td style="width: 55%; border: none !important; vertical-align: top; text-align: left; padding: 0;">
              ${
                base64Logo
                  ? `<div style="margin-bottom: 5pt;"><img src="${base64Logo}" alt="${company.companyName} Logo" style="max-height: 48pt; max-width: 175pt; object-fit: contain; display: block;" /></div>`
                  : `<div style="font-size: 16pt; font-weight: bold; color: #1e3a8a; margin-bottom: 4pt;">${company.companyName}</div>`
              }
              <div style="font-size: 9pt; color: #475569; font-weight: bold;">문서번호: ${tpl.docCode}</div>
              <div style="font-size: 8.5pt; color: #64748b;">서식규격: A4 (297㎜ × 210㎜) | 사내 표준 규정집</div>
            </td>
            <td style="width: 45%; border: none !important; vertical-align: top; text-align: right; padding: 0;">
              <table align="right" style="margin-left: auto; margin-right: 0; width: 175pt !important; border-collapse: collapse !important; text-align: center; font-size: 8.5pt;">
                <tr>
                  <th rowspan="2" style="border: 1pt solid #475569; width: 18pt; font-size: 8.5pt; background: #f1f5f9; text-align: center; vertical-align: middle; font-weight: bold; padding: 2pt;">결<br/>재</th>
                  ${thStepsHtml}
                </tr>
                <tr>
                  ${tdStepsHtml}
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div style="clear: both;"></div>

        <div style="width: 100% !important;">
          ${formattedBodyHtml}
        </div>

        <div style="margin-top: 28pt; padding-top: 14pt; border-top: 1.5pt solid #cbd5e1; text-align: right; font-size: 12pt; font-weight: bold; line-height: 2;">
          ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
          ${
            base64Seal
              ? `&nbsp; <img src="${base64Seal}" alt="직인" style="width: 44pt; height: 44pt; vertical-align: middle; display: inline-block; margin-left: 6pt;" />`
              : `&nbsp; <span style="font-size: 10pt; color: #b91c1c; font-weight: bold; margin-left: 4pt;">(직인생략)</span>`
          }
        </div>
      </body>
      </html>
    `;

      const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `[${company.companyName}]_${tpl.docCode}_${tpl.title.replace(/[\/\\:*?"<>|]/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(`'${tpl.title}' 공식 워드(.doc) 서류를 다운로드했습니다.`);
    } catch (e) {
      showToast('문서 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered Common Documents (8 items)
  const filteredCommonDocs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return generatedTemplates;
    return generatedTemplates.filter(
      (tpl) =>
        tpl.title.toLowerCase().includes(q) ||
        tpl.docCode.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.targetEvalItem.toLowerCase().includes(q) ||
        tpl.summary.toLowerCase().includes(q)
    );
  }, [generatedTemplates, searchQuery]);

  // Filter items by Part and Search term
  const filteredParts = useMemo(() => {
    if (activePartFilter === 'common') {
      return [];
    }
    return SELF_AUDIT_PARTS.filter((part) => {
      if (activePartFilter !== 'all' && part.partId !== activePartFilter) {
        return false;
      }
      return true;
    });
  }, [activePartFilter]);

  const itemsByPart = useMemo(() => {
    const map = new Map<string, SelfAuditGuideItem[]>();
    SELF_AUDIT_PARTS.forEach((p) => map.set(p.partId, []));

    const q = searchQuery.toLowerCase().trim();

    SELF_AUDIT_GUIDE_ITEMS.forEach((item) => {
      if (q) {
        const matchCode = item.evalItemCode.toLowerCase().includes(q);
        const matchName = item.evalItemName.toLowerCase().includes(q);
        const matchDocs = item.requiredDocs.some((d) => d.toLowerCase().includes(q));
        const matchQ = item.question.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchDocs && !matchQ) {
          return;
        }
      }

      const list = map.get(item.partId);
      if (list) {
        list.push(item);
      }
    });

    return map;
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-6xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-4 max-h-[94vh] flex flex-col">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  {company.companyName}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  총 {SELF_AUDIT_GUIDE_ITEMS.length}개 평가항목 구비서류
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                자가진단 항목별 대응서류 자료실
              </h2>
            </div>
          </div>

          {/* Right Action: Close button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download Toast Notification */}
        {downloadToast && (
          <div className="mb-3 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-between shadow-lg animate-fade-in border border-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{downloadToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadToast(null)}
              className="text-slate-400 hover:text-white p-0.5 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filters Bar: Part Tabs + Search Box */}
        <div className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActivePartFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activePartFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 파트 ({SELF_AUDIT_GUIDE_ITEMS.length})
            </button>

            {/* NEW: 기본공통서류 (8종) 전용 탭 */}
            <button
              type="button"
              onClick={() => setActivePartFilter('common')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activePartFilter === 'common'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>기본공통서류</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                activePartFilter === 'common' ? 'bg-indigo-800 text-white' : 'bg-indigo-200 text-indigo-900'
              }`}>
                {filteredCommonDocs.length}종
              </span>
            </button>

            {SELF_AUDIT_PARTS.map((p) => {
              const count = itemsByPart.get(p.partId)?.length || 0;
              const isActive = activePartFilter === p.partId;
              return (
                <button
                  key={p.partId}
                  type="button"
                  onClick={() => setActivePartFilter(p.partId)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{p.shortName}</span>
                  <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="평가항목명, 지표코드, 서류 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        {/* Content Table by Part & Common Documents */}
        <div className="flex-1 overflow-y-auto py-3 space-y-6">
          {/* =========================================================================
              COMMON DOCUMENTS SECTION (8 Auto-Generated Documents with Download-only buttons)
             ========================================================================= */}
          {(activePartFilter === 'common' || (activePartFilter === 'all' && filteredCommonDocs.length > 0)) && (
            <div className="border-2 border-indigo-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              {/* Common Section Header */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 px-4 py-3.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        즉시 출력 가능
                      </span>
                      <span className="text-xs text-indigo-200 font-medium">
                        이노비즈 실무 서류 자동 생성기 ({filteredCommonDocs.length}종)
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                      기본 공통 서류 (사내 표준 규정집 및 핵심 보고서)
                    </h3>
                  </div>
                </div>
                <div className="text-xs text-indigo-200 flex items-center gap-2">
                  <span className="bg-white/10 px-2 py-1 rounded text-[11px] font-medium border border-white/10">
                    {company.companyName} 맞춤형 표준 서식
                  </span>
                  <span className="hidden md:inline text-[11px] text-indigo-300">
                    사내 결재선 · 직인 · A4 규격 자동 탑재
                  </span>
                </div>
              </div>

              {/* Common Documents Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                  <thead>
                    <tr className="bg-indigo-50/70 text-indigo-950 font-bold border-b border-indigo-100">
                      <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                      <th className="py-2.5 px-3 w-44 text-center whitespace-nowrap">구분 / 문서코드</th>
                      <th className="py-2.5 px-3 w-72 whitespace-nowrap">서류명 (공식 규정 및 보고서)</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">연계 평가지표 및 세부 설명</th>
                      <th className="py-2.5 px-3 w-32 min-w-[110px] text-center whitespace-nowrap">다운로드</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {filteredCommonDocs.map((tpl, idx) => (
                      <tr key={tpl.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {tpl.category}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 whitespace-nowrap">
                              {tpl.docCode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
                            {tpl.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px] border border-slate-200">
                              A4 표준 규정
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600">워드(.doc) 양식</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-emerald-600 font-medium">기업정보 자동반영</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-xs font-semibold text-blue-700 bg-blue-50/70 border border-blue-100 px-2 py-0.5 rounded inline-block mb-1">
                            🎯 {tpl.targetEvalItem}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                            {tpl.summary}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDownloadTemplateWord(tpl)}
                            disabled={downloadingId === tpl.id}
                            className="w-full max-w-[105px] px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50 whitespace-nowrap"
                            title={`${tpl.title} 공식 워드(.doc) 서식 다운로드`}
                          >
                            {downloadingId === tpl.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>생성중...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5 shrink-0" />
                                <span>다운로드</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredCommonDocs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          검색어에 일치하는 기본 공통 서류가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {filteredParts.map((part) => {
            const items = itemsByPart.get(part.partId) || [];
            if (items.length === 0) return null;

            return (
              <div key={part.partId} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Part Header */}
                <div className="bg-slate-50/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-slate-800 text-white text-xs font-bold px-2 py-0.5 rounded">
                      PART {part.partNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {part.partName}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      (총 {part.totalPoints}점 배점 · {items.length}개 지표)
                    </span>
                  </div>
                  <span className="text-xs text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    대응서류 {items.length}건 완비
                  </span>
                </div>

                {/* Exact Table Schema Required: No / 평가항목(세부지표) / 자가진단현황 / 구비서류 / 다운로드버튼 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                    <thead>
                      <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-12 text-center whitespace-nowrap">No</th>
                        <th className="py-2.5 px-3 w-64 text-center whitespace-nowrap">평가항목 (세부지표)</th>
                        <th className="py-2.5 px-3 w-52 text-center whitespace-nowrap">자가진단현황</th>
                        <th className="py-2.5 px-3 text-center whitespace-nowrap">구비서류</th>
                        <th className="py-2.5 px-3 w-44 min-w-[140px] text-center whitespace-nowrap">다운로드 / 업로드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => {
                        const selectedNum = selectedOptions[item.id];
                        const selectedOption = selectedNum ? item.options.find((o) => o.optionNumber === selectedNum) : null;
                        const hasTemplate = !!item.linkedDocTemplateId && templateByDocId.has(item.linkedDocTemplateId);

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* 1. No */}
                            <td className="py-3 px-3 text-center text-slate-500 font-medium">
                              {idx + 1}
                            </td>

                            {/* 2. 평가항목 (세부지표) */}
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded font-mono">
                                  {item.evalItemCode}
                                </span>
                                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  {item.points}점
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 text-xs leading-snug">
                                {item.evalItemName}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2" title={item.question}>
                                {item.question}
                              </div>
                            </td>

                            {/* 3. 자가진단현황 */}
                            <td className="py-3 px-3">
                              {selectedOption ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                                      {selectedOption.grade}등급 ({selectedOption.points}점)
                                    </span>
                                    <span className="text-[11px] text-slate-500">
                                      {selectedOption.scoreRate}%
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-800 leading-tight line-clamp-2">
                                    {selectedOption.optionLabel} {selectedOption.text}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-block text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    진단 전 (기본값 대응)
                                  </span>
                                  {item.currentStatusNote && (
                                    <div className="text-[11px] text-slate-600 line-clamp-2 font-medium">
                                      {item.currentStatusNote}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* 4. 구비서류 */}
                            <td className="py-3 px-3">
                              <ul className="space-y-1">
                                {item.requiredDocs.map((docName, dIdx) => (
                                  <li key={dIdx} className="flex items-start gap-1.5 text-[11px] text-slate-800 font-medium">
                                    <span className="text-blue-500 font-bold shrink-0 mt-0.5">•</span>
                                    <span>{docName}</span>
                                  </li>
                                ))}
                                {item.optionalDocs && item.optionalDocs.length > 0 && (
                                  <li className="pt-0.5">
                                    <span className="text-[10px] text-slate-500 font-normal">
                                      [보조/가점] {item.optionalDocs.join(', ')}
                                    </span>
                                  </li>
                                )}
                              </ul>
                            </td>

                            {/* 5. 다운로드 및 업로드 버튼 */}
                            <td className="py-3 px-3 text-center w-44 min-w-[140px]">
                              {(() => {
                                const attachments = getItemAttachments(item);

                                return (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <div className="flex items-center gap-1.5 w-full justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedItemForDownload(item)}
                                        className="flex-1 max-w-[80px] px-2 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                                        title="등록된 모든 대응서류 및 증빙 파일 목록 보기 / 다운로드"
                                      >
                                        <Download className="w-3 h-3 shrink-0" />
                                        <span>다운로드</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => setSelectedItemForUpload(item)}
                                        className="flex-1 max-w-[75px] px-2 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-lg inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                                        title="대응 증빙서류 업로드 및 파일 관리"
                                      >
                                        <Upload className="w-3 h-3 shrink-0" />
                                        <span>업로드</span>
                                      </button>
                                    </div>

                                    {attachments.length > 0 && (
                                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded whitespace-nowrap">
                                        첨부 {attachments.length}건
                                      </span>
                                    )}

                                    {hasTemplate && (
                                      <span className="text-[10px] text-blue-600 font-semibold whitespace-nowrap">
                                        표준서식
                                      </span>
                                    )}
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
              </div>
            );
          })}
        </div>

        {/* Bottom Footer */}
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>기술혁신형 중소기업(INNO-BIZ) 모의 인증 현장실사 대응 공식 편철 기준</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              창 닫기
            </button>
          </div>
        </div>
      </div>

      {/* Item Download Popup Modal for All Registered Files */}
      {selectedItemForDownload && (
        <ItemDownloadModal
          isOpen={!!selectedItemForDownload}
          onClose={() => setSelectedItemForDownload(null)}
          item={selectedItemForDownload}
          company={company}
          selectedOptionNumber={selectedOptions[selectedItemForDownload.id]}
          template={
            selectedItemForDownload.linkedDocTemplateId
              ? templateByDocId.get(selectedItemForDownload.linkedDocTemplateId) || null
              : null
          }
          uploadedAttachments={getItemAttachments(selectedItemForDownload)}
        />
      )}

      {/* Item Upload Modal for Evidence Files */}
      {selectedItemForUpload && (
        <RowDocumentUploadModal
          isOpen={!!selectedItemForUpload}
          onClose={() => setSelectedItemForUpload(null)}
          row={{
            section: selectedItemForUpload.partName,
            majorCategory: selectedItemForUpload.majorCategory,
            evalItem: `${selectedItemForUpload.evalItemCode} ${selectedItemForUpload.evalItemName}`,
            points: selectedItemForUpload.points,
            currentStatus: selectedItemForUpload.currentStatusNote || selectedItemForUpload.options[0]?.text || '',
            evidenceDocs: selectedItemForUpload.requiredDocs.join(', '),
          }}
          matchedGroup={null}
          matchedDoc={null}
          companyName={company.companyName}
          ceoName={company.ceoName}
          onAttachmentsUpdated={() => {
            setAttachmentRefreshKey((k) => k + 1);
            showToast(`${selectedItemForUpload.evalItemName} 증빙 파일이 저장되었습니다.`);
          }}
        />
      )}
    </div>
  );
};
