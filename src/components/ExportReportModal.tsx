import React, { useState, useMemo, useEffect } from 'react';
import { CompanyProfile, DocumentGroup, SelfAuditGuideItem, SelfAuditOption } from '../types';
import { SELF_AUDIT_PARTS, SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';
import { generateDocumentsForCompany, GeneratedDocTemplate } from '../data/generatedDocTemplates';
import { convertImageUrlToBase64Png } from '../utils/imageUtils';
import { convertMarkdownToRichHtml } from './AutoDocGeneratorModal';
import { getSupabaseClient, getStoredSupabaseConfig, saveStoredSupabaseConfig } from '../lib/supabaseClient';
import {
  X,
  Download,
  FolderDown,
  Database,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  ExternalLink,
  ShieldCheck,
  Building2,
  RefreshCw,
  SlidersHorizontal,
  Check,
  FileDown,
  Save,
  KeyRound
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

  // Supabase connection & settings modal state
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  // Active filter by Part & Search query
  const [activePartFilter, setActivePartFilter] = useState<'all' | 'part1' | 'part2' | 'part3' | 'part4'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Load existing Supabase config if any
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg) {
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
    }
  }, []);

  // Handle saving Supabase config and testing connection
  const handleSaveSupabaseConfig = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      setSupabaseStatusMsg('URL과 Anon Key를 모두 입력해주세요.');
      return;
    }

    try {
      saveStoredSupabaseConfig({
        url: supabaseUrlInput.trim(),
        anonKey: supabaseKeyInput.trim(),
      });
      const client = getSupabaseClient();
      if (!client) {
        setSupabaseStatusMsg('클라이언트 초기화에 실패했습니다.');
        return;
      }

      setSupabaseStatusMsg('연결 테스트 중...');
      // Simple ping to Supabase Auth or standard API
      const { data, error } = await client.auth.getSession();
      if (error && error.message && !error.message.includes('Auth session missing')) {
        setSupabaseStatusMsg(`연결 확인 (경고: ${error.message})`);
      } else {
        setSupabaseStatusMsg('✅ Supabase 연결 설정이 성공적으로 저장되었습니다!');
      }

      setTimeout(() => {
        setIsSupabaseModalOpen(false);
        setSupabaseStatusMsg(null);
      }, 1200);
    } catch (err: any) {
      setSupabaseStatusMsg(`오류 발생: ${err?.message || '연결 실패'}`);
    }
  };

  // Sync data to Supabase (documents & self-audit summary)
  const handleSyncToSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setIsSupabaseModalOpen(true);
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const payload = {
        company_name: company.companyName,
        biz_number: company.bizNumber,
        synced_at: new Date().toISOString(),
        items_count: SELF_AUDIT_GUIDE_ITEMS.length,
        selected_options: selectedOptions,
        groups_data: groups,
      };

      // Try upserting into 'innobiz_self_audit_records' table
      const { error } = await client
        .from('innobiz_self_audit_records')
        .upsert(
          [
            {
              biz_number: company.bizNumber,
              company_name: company.companyName,
              data: payload,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: 'biz_number' }
        );

      if (error) {
        // If table does not exist, provide helpful feedback
        if (error.code === '42P01' || error.message.includes('relation "innobiz_self_audit_records" does not exist')) {
          setSyncResult({
            success: false,
            message: 'Supabase에 "innobiz_self_audit_records" 테이블이 없습니다. SQL 편집기에서 테이블 생성 후 다시 시도해주세요.',
          });
        } else {
          setSyncResult({
            success: false,
            message: `동기화 오류: ${error.message}`,
          });
        }
      } else {
        setSyncResult({
          success: true,
          message: 'Supabase에 자가진단 및 대응서류 데이터가 성공적으로 동기화되었습니다.',
        });
      }
    } catch (e: any) {
      setSyncResult({
        success: false,
        message: `클라우드 동기화 실패: ${e?.message || '네트워크 오류'}`,
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncResult(null);
      }, 6000);
    }
  };

  // Download a single document as Word (.doc)
  const handleDownloadSingleDoc = async (item: SelfAuditGuideItem) => {
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

  const isConfiguredSupabase = !!getStoredSupabaseConfig();

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

          {/* Right Action: Supabase cloud sync & Close button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              title="Supabase 클라우드 데이터 연동 및 백업"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                isConfiguredSupabase
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSyncing ? '동기화 중...' : isConfiguredSupabase ? 'Supabase 연동' : 'Supabase 설정'}</span>
            </button>

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

        {/* Sync Result Alert Banner */}
        {syncResult && (
          <div
            className={`mt-3 p-3 rounded-lg text-xs font-medium flex items-center justify-between border ${
              syncResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
              <span>{syncResult.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncResult(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
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
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 text-slate-700 font-semibold border-b border-slate-200">
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 w-64">평가항목 (세부지표)</th>
                        <th className="py-2.5 px-3 w-48">자가진단현황</th>
                        <th className="py-2.5 px-3">구비서류</th>
                        <th className="py-2.5 px-3 w-28 text-center">다운로드</th>
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
                            <td className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDownloadSingleDoc(item)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="표준 대응서류 다운로드 (Word/Doc)"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>다운로드</span>
                              </button>
                              {hasTemplate && (
                                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                                  정규서식 연계
                                </div>
                              )}
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

      {/* Supabase Connection Setup Modal */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Supabase 데이터 연동 설정</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                Supabase 프로젝트의 <strong>Project URL</strong>과 <strong>Anon Public Key</strong>를 설정하여 
                자가진단 현황 및 자료실 서류 데이터를 클라우드에 영구 백업·연동할 수 있습니다.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJh..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              {supabaseStatusMsg && (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                  {supabaseStatusMsg}
                </div>
              )}

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-900">
                <div className="font-bold flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>연동 테이블 자동 매핑</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Supabase의 <code>innobiz_self_audit_records</code> 테이블과 실시간으로 매핑되어 자가진단 변경사항 및 문서 편철 상태를 안전하게 저장합니다.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveSupabaseConfig}
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>설정 저장 및 연결</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
