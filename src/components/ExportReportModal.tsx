import React, { useState, useMemo } from 'react';
import { CompanyProfile, DocumentAttachment, DocumentGroup, SelfAuditGuideItem, SelfAuditOption } from '../types';
import { SELF_AUDIT_PARTS, SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';
import { generateDocumentsForCompany, GeneratedDocTemplate } from '../data/generatedDocTemplates';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';
import { convertMarkdownToRichHtml } from './AutoDocGeneratorModal';
import { getAttachmentBlob } from '../utils/fileStorage';
import { ItemDownloadModal } from './ItemDownloadModal';
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
  FolderArchive
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
  if (!isOpen) return null;

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

  // Active filter by Part & Search query
  const [activePartFilter, setActivePartFilter] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [selectedItemForDownload, setSelectedItemForDownload] = useState<SelfAuditGuideItem | null>(null);

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

  // Find user-uploaded files for an item (from groups or localStorage)
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
    // 2. Search in localStorage by row key
    try {
      const localKey = `row_attach_${item.evalItemName}`;
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
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

  // Filter items by Part and Search term
  const filteredParts = useMemo(() => {
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

        {/* Content Table by Part */}
        <div className="flex-1 overflow-y-auto py-3 space-y-6">
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
                        <th className="py-2.5 px-3 w-32 min-w-[110px] text-center whitespace-nowrap">다운로드</th>
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

                            {/* 5. 다운로드버튼 */}
                            <td className="py-3 px-3 text-center w-36 min-w-[120px]">
                              {(() => {
                                const attachments = getItemAttachments(item);

                                return (
                                  <div className="flex flex-col items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedItemForDownload(item)}
                                      className="w-full max-w-[110px] px-2.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
                                      title="등록된 모든 대응서류 및 증빙 파일 목록 보기 / 다운로드"
                                    >
                                      <Download className="w-3.5 h-3.5 shrink-0" />
                                      <span className="whitespace-nowrap">다운로드</span>
                                    </button>

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
    </div>
  );
};
