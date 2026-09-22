import React, { useState, useMemo } from 'react';
import { CompanyProfile } from '../types';
import { generateDocumentsForCompany, GeneratedDocTemplate } from '../data/generatedDocTemplates';
import { 
  FileText, 
  X, 
  Printer, 
  Copy, 
  Download, 
  Check, 
  Building2, 
  Sparkles, 
  Edit3, 
  Eye, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  FileDown,
  Loader2
} from 'lucide-react';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';

interface AutoDocGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  initialDocId?: string;
  onOpenCompanySettings: () => void;
}

function formatInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 10px;">$1</code>');
}

export function convertMarkdownToRichHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const result: string[] = [];
  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      let tableHtml = '<div style="overflow-x: auto; margin: 12px 0;"><table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left;">';
      let headerPassed = false;
      tableRows.forEach((rowStr) => {
        const cells = rowStr
          .split('|')
          .slice(1, -1)
          .map(c => c.trim());
        
        // Skip markdown separator row like |:---|:---|
        if (cells.every(c => /^:?-+:?$/.test(c))) {
          headerPassed = true;
          return;
        }

        if (!headerPassed) {
          tableHtml += '<thead><tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">';
          cells.forEach(c => {
            tableHtml += `<th style="border: 1px solid #cbd5e1; padding: 7px 8px; font-weight: bold; color: #1e293b; background-color: #f8fafc; font-size: 10.5px; white-space: nowrap;">${formatInlineMarkdown(c)}</th>`;
          });
          tableHtml += '</tr></thead><tbody>';
          headerPassed = true;
        } else {
          tableHtml += '<tr style="border-bottom: 1px solid #e2e8f0;">';
          cells.forEach((c, cellIdx) => {
            const align = cellIdx === 0 || cellIdx === 1 ? 'text-align: center;' : '';
            tableHtml += `<td style="border: 1px solid #e2e8f0; padding: 6px 8px; color: #334155; font-size: 10.5px; ${align}">${formatInlineMarkdown(c)}</td>`;
          });
          tableHtml += '</tr>';
        }
      });
      tableHtml += '</tbody></table></div>';
      result.push(tableHtml);
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if table row
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed === '') {
      result.push('<div style="height: 8px;"></div>');
      continue;
    }

    if (trimmed.startsWith('# ')) {
      result.push(`<h1 style="font-size: 18px; font-weight: bold; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin: 14px 0 8px; color: #0f172a;">${formatInlineMarkdown(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith('### ')) {
      result.push(`<h3 style="font-size: 13.5px; font-weight: bold; margin: 16px 0 6px; color: #1e293b; border-left: 3px solid #2563eb; padding-left: 8px;">${formatInlineMarkdown(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      result.push(`<h4 style="font-size: 12.5px; font-weight: bold; margin: 10px 0 4px; color: #334155;">${formatInlineMarkdown(trimmed.slice(5))}</h4>`);
      continue;
    }
    if (trimmed === '---') {
      result.push('<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 14px 0;" />');
      continue;
    }
    if (trimmed.startsWith('- ')) {
      result.push(`<div style="margin-left: 14px; margin-bottom: 3px; color: #334155; font-size: 11.5px;">• ${formatInlineMarkdown(trimmed.slice(2))}</div>`);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      result.push(`<div style="margin-left: 4px; margin-bottom: 4px; color: #334155; font-size: 11.5px;">${formatInlineMarkdown(trimmed)}</div>`);
      continue;
    }

    result.push(`<p style="margin-bottom: 5px; line-height: 1.6; color: #334155; font-size: 11.5px;">${formatInlineMarkdown(trimmed)}</p>`);
  }

  if (inTable) {
    flushTable();
  }

  return result.join('\n');
}

export const APPROVAL_PRESETS = [
  { id: '3step_standard', label: '3인 결재 (담당 - 검토 - 대표이사)', steps: ['담당', '검토', '대표이사'] },
  { id: '3step_draft', label: '3인 결재 (기안 - 심사 - 승인)', steps: ['기안', '심사', '승인'] },
  { id: '2step_simple', label: '2인 결재 (담당 - 대표이사)', steps: ['담당', '대표이사'] },
  { id: '4step_full', label: '4인 결재 (담당 - 검토 - 승인 - 대표이사)', steps: ['담당', '검토', '승인', '대표이사'] },
];

export const AutoDocGeneratorModal: React.FC<AutoDocGeneratorModalProps> = ({
  isOpen,
  onClose,
  company,
  initialDocId,
  onOpenCompanySettings,
}) => {
  const generatedDocs = useMemo(() => generateDocumentsForCompany(company), [company]);

  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocId || generatedDocs[0]?.id || ''
  );
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [editedContents, setEditedContents] = useState<{ [id: string]: string }>({});
  const [approvalPresetId, setApprovalPresetId] = useState<string>('3step_standard');

  const currentDoc = generatedDocs.find((d) => d.id === selectedDocId) || generatedDocs[0];
  const activeContent = editedContents[currentDoc.id] ?? currentDoc.content;
  const currentApprovalPreset = APPROVAL_PRESETS.find((p) => p.id === approvalPresetId) || APPROVAL_PRESETS[0];

  const handlePrint = async () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Convert logo and seal to base64 for instant, offline-safe print rendering
    const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 260, 90) : '';
    const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';

    const logoHtml = base64Logo
      ? `<img src="${base64Logo}" style="max-height: 48px; max-width: 190px; object-fit: contain; margin-bottom: 8px; display: block;" alt="${company.companyName} Logo" />`
      : `<div style="font-size: 18px; font-weight: bold; color: #1e3a8a; margin-bottom: 8px;">${company.companyName}</div>`;

    const sealHtml = base64Seal
      ? `<img src="${base64Seal}" style="width: 48px; height: 48px; object-fit: contain; vertical-align: middle; display: inline-block;" alt="직인" />`
      : `<span style="display: inline-block; width: 38px; height: 38px; border: 2px solid #b91c1c; border-radius: 50%; color: #b91c1c; font-size: 10px; font-weight: bold; text-align: center; line-height: 34px; vertical-align: middle; transform: rotate(-10deg);">직인생략</span>`;

    const steps = currentApprovalPreset.steps;
    const thStepsHtml = steps.map((s) => `<th>${s}</th>`).join('');
    const tdStepsHtml = steps.map((_, idx) => {
      const isLast = idx === steps.length - 1;
      return `<td style="position: relative; height: 45px; width: 55px; text-align: center; vertical-align: middle;">${isLast ? sealHtml : ''}</td>`;
    }).join('');

    const formattedHtml = convertMarkdownToRichHtml(activeContent);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${company.companyName} - ${currentDoc.title}</title>
        <style>
          @page { size: A4 portrait; margin: 18mm 14mm 18mm 14mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Malgun Gothic", "맑은 고딕", sans-serif; font-size: 11px; line-height: 1.5; color: #111; padding: 15px; }
          table.approval-box { border-collapse: collapse; float: right; margin-bottom: 16px; }
          table.approval-box th, table.approval-box td { border: 1px solid #555; padding: 4px 6px; text-align: center; font-size: 10px; }
          table.approval-box td { height: 42px; width: 52px; }
          table.data-table { width: 100%; table-layout: fixed; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
          table.data-table th, table.data-table td { border: 1px solid #94a3b8; padding: 5px 6px; word-break: break-all; }
          table.data-table th { background-color: #f1f5f9; font-weight: bold; text-align: center; }
          .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
          .doc-footer { margin-top: 30px; text-align: right; font-size: 13px; font-weight: bold; padding-top: 15px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header-top">
          <div>
            ${logoHtml}
            <div style="font-size: 11px; color: #64748b;">문서번호: <strong>${currentDoc.docCode}</strong></div>
          </div>
          <table class="approval-box">
            <tr>
              <th rowspan="2" style="width: 20px; writing-mode: vertical-rl; letter-spacing: 4px;">결재</th>
              ${thStepsHtml}
            </tr>
            <tr>
              ${tdStepsHtml}
            </tr>
          </table>
        </div>
        <div style="clear: both;"></div>
        <div>
          ${formattedHtml}
        </div>
        <div class="doc-footer">
          ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
          &nbsp; ${sealHtml}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownloadWord = async () => {
    setIsDownloadingWord(true);
    try {
      // 1. Convert logo and seal into self-contained Base64 PNGs for 100% offline Word fidelity
      const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 280, 95) : '';
      const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';

      const formattedBodyHtml = convertMarkdownToRichHtml(activeContent);
      const steps = currentApprovalPreset.steps;
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
          <title>${currentDoc.title}</title>
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
          <!-- Top Header: Left Logo & Document Info, Right Approval Stamp Box -->
          <table style="width: 100% !important; border: none !important; border-collapse: collapse !important; margin-bottom: 12pt;">
            <tr>
              <td style="width: 55%; border: none !important; vertical-align: top; text-align: left; padding: 0;">
                ${
                  base64Logo
                    ? `<div style="margin-bottom: 5pt;"><img src="${base64Logo}" alt="${company.companyName} Logo" style="max-height: 48pt; max-width: 175pt; object-fit: contain; display: block;" /></div>`
                    : `<div style="font-size: 16pt; font-weight: bold; color: #1e3a8a; margin-bottom: 4pt;">${company.companyName}</div>`
                }
                <div style="font-size: 9pt; color: #475569; font-weight: bold;">문서번호: ${currentDoc.docCode}</div>
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
      const safeTitle = currentDoc.title.replace(/[\\/:*?"<>|]/g, '_');
      link.download = `[워드양식]_${safeTitle}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleCopy = async () => {
    try {
      // Also include rich header with logo and seal when copying to clipboard for pasting into Word/Hancom
      const base64Logo = company.logoUrl ? await convertImageUrlToBase64Png(company.logoUrl, 260, 90) : '';
      const base64Seal = company.sealUrl ? await convertImageUrlToBase64Png(company.sealUrl, 90, 90) : '';

      const richHtml = convertMarkdownToRichHtml(activeContent);
      const steps = currentApprovalPreset.steps;
      const thSteps = steps.map((s) => `<th style="border: 1px solid #555; background: #f1f5f9; padding: 3px 6px; font-size: 9pt;">${s}</th>`).join('');
      const tdSteps = steps.map((_, idx) => {
        const isLast = idx === steps.length - 1;
        return `<td style="border: 1px solid #555; height: 38px; width: 48px; text-align: center; vertical-align: middle;">${
          isLast && base64Seal ? `<img src="${base64Seal}" style="width: 32px; height: 32px; vertical-align: middle;" />` : ''
        }</td>`;
      }).join('');

      const fullClipboardHtml = `
        <div style="font-family: 'Malgun Gothic', Dotum, sans-serif; font-size: 10.5pt; color: #111;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
            <tr>
              <td style="vertical-align: top;">
                ${
                  base64Logo
                    ? `<img src="${base64Logo}" style="max-height: 48px; max-width: 180px; object-fit: contain; margin-bottom: 6px; display: block;" />`
                    : `<div style="font-size: 16pt; font-weight: bold; color: #1e3a8a;">${company.companyName}</div>`
                }
                <div style="font-size: 9pt; color: #64748b;">문서번호: <strong>${currentDoc.docCode}</strong></div>
              </td>
              <td style="text-align: right; vertical-align: top;">
                <table align="right" style="border-collapse: collapse; text-align: center; font-size: 9pt;">
                  <tr>
                    <th rowspan="2" style="border: 1px solid #555; width: 20px; background: #f1f5f9;">결<br/>재</th>
                    ${thSteps}
                  </tr>
                  <tr>
                    ${tdSteps}
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0;" />
          <div>${richHtml}</div>
          <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #cbd5e1; text-align: right; font-weight: bold;">
            ${company.companyName} &nbsp; 대표이사 &nbsp; ${company.ceoName}
            ${base64Seal ? `&nbsp; <img src="${base64Seal}" style="width: 40px; height: 40px; vertical-align: middle;" />` : ' (직인생략)'}
          </div>
        </div>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([activeContent], { type: 'text/plain' });
        const htmlBlob = new Blob([fullClipboardHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(activeContent);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(activeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([activeContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `[${company.companyName}]_${currentDoc.title}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleContentChange = (val: string) => {
    setEditedContents((prev) => ({ ...prev, [currentDoc.id]: val }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl my-4 flex flex-col h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  이노비즈 실무 서류 자동 생성기
                </h2>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold">
                  <Building2 className="w-3 h-3 text-blue-600" />
                  <span className="font-bold">{company.companyName}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                기업 정보(로고, 대표자, 주력제품, 매출 및 특허 수치)가 반영된 표준 공문서 규정 및 절차서입니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenCompanySettings}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>기업 정보 변경</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Document List */}
          <div className="w-full md:w-80 border-r border-slate-200 bg-slate-50/50 p-3 overflow-y-auto flex flex-col gap-1.5 shrink-0">
            <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>자동 작성 서류 목록 ({generatedDocs.length}종)</span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                즉시 출력 가능
              </span>
            </div>

            {generatedDocs.map((doc, idx) => {
              const isSelected = doc.id === currentDoc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setIsEditing(false);
                  }}
                  className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      {doc.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {doc.docCode}
                    </span>
                  </div>
                  <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${
                    isSelected ? 'text-blue-900' : 'text-slate-800'
                  }`}>
                    {doc.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {doc.targetEvalItem}
                  </p>
                </button>
              );
            })}

            <div className="mt-auto pt-3 p-2 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              💡 <strong>팁:</strong> 서류를 선택한 후 <strong>[인쇄 / PDF 저장]</strong>을 누르시면 결재란과 회사 로고가 정돈된 상태로 바로 출력됩니다.
            </div>
          </div>

          {/* Right Area: Document Preview & Editor */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Action Bar */}
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">
                  {currentDoc.title}
                </span>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {currentDoc.docCode}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Approval Line Preset Selector */}
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
                  <span className="text-slate-500 font-medium">결재란:</span>
                  <select
                    id="select-approval-preset"
                    value={approvalPresetId}
                    onChange={(e) => setApprovalPresetId(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                    title="결재란 인원 구성 변경"
                  >
                    {APPROVAL_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                    isEditing
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>미리보기 모드</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>내용 직접 편집</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="클립보드에 복사하여 워드나 한글에 붙여넣기"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">복사됨!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>한글/워드 복사</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWord}
                  disabled={isDownloadingWord}
                  className="px-3 py-1.5 text-xs font-semibold bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                  title="MS Word에서 서식·결재선·회사로고·직인이 그대로 유지된 상태로 열리는 워드 문서 다운로드"
                >
                  {isDownloadingWord ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                      <span>로고 삽입 중...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5 text-blue-600" />
                      <span>워드 양식 (.doc)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="텍스트 파일로 저장"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">TXT</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>인쇄 / PDF 저장</span>
                </button>
              </div>
            </div>

            {/* Document Content Workspace */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100/60">
              <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-md rounded-xl p-8 sm:p-10 relative">
                {/* Official Approval & Header Box */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200 mb-6">
                  <div>
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={`${company.companyName} 로고`}
                        className="max-h-12 object-contain mb-2"
                      />
                    ) : (
                      <div className="text-lg font-black text-blue-900 tracking-tight mb-1">
                        {company.companyName}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 font-medium">
                      문서코드: <strong className="text-slate-800 font-mono">{currentDoc.docCode}</strong>
                    </div>
                  </div>

                  {/* Dynamic Approval Stamp Table (Default: 3-step) */}
                  <div className="border border-slate-300 rounded overflow-hidden text-center text-xs shadow-2xs">
                    <table className="border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 border-b border-slate-300 text-xs">
                          <th className="p-1 px-1.5 border-r border-slate-300 font-bold" rowSpan={2}>
                            결<br />재
                          </th>
                          {currentApprovalPreset.steps.map((step, idx) => (
                            <th
                              key={idx}
                              className={`p-1 px-3 font-semibold ${
                                idx < currentApprovalPreset.steps.length - 1 ? 'border-r border-slate-300' : ''
                              }`}
                            >
                              {step}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="h-12 text-slate-400">
                          {currentApprovalPreset.steps.map((_, idx) => {
                            const isLast = idx === currentApprovalPreset.steps.length - 1;
                            return (
                              <td
                                key={idx}
                                className={`p-1 w-14 align-middle text-center ${
                                  idx < currentApprovalPreset.steps.length - 1 ? 'border-r border-slate-300' : ''
                                }`}
                              >
                                {isLast ? (
                                  company.sealUrl ? (
                                    <img
                                      src={company.sealUrl}
                                      alt="직인"
                                      className="w-10 h-10 object-contain mx-auto"
                                    />
                                  ) : (
                                    <span className="inline-block w-8 h-8 rounded-full border border-rose-300 text-rose-600 text-xs font-bold leading-7">
                                      직인
                                    </span>
                                  )
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Content Editor vs Formatted View */}
                {isEditing ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      본문 텍스트 직접 편집:
                    </label>
                    <textarea
                      rows={25}
                      value={activeContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>
                ) : (
                  <div 
                    className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 font-sans"
                    dangerouslySetInnerHTML={{ __html: convertMarkdownToRichHtml(activeContent) }}
                  />
                )}

                {/* Official Sign Off at bottom */}
                <div className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-end gap-3 text-sm font-bold text-slate-900">
                  <span>{company.companyName}</span>
                  <span>대표이사 {company.ceoName}</span>
                  {company.sealUrl ? (
                    <img
                      src={company.sealUrl}
                      alt="직인"
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-full border border-rose-400 text-rose-600 text-xs font-bold flex items-center justify-center rotate-[-12deg]">
                      직인
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
