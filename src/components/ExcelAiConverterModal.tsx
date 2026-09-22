import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  ExternalLink,
  Copy,
  Download,
  X,
  FileText,
  Loader2,
  HelpCircle,
  Building2,
  Info,
  Check,
  ChevronRight,
  Layers,
  Table
} from 'lucide-react';
import { CompanyProfile, DocumentGroup } from '../types';
import {
  parseExcelFile,
  createSampleExcelFile,
  convertExcelToInnoBiz,
  insertConvertedDocIntoGroup,
  openAndCopyToGoogleDocs,
  createWordDocBlob,
  generateHtmlTableFromRows,
  ParsedExcelData,
  ExcelAnalysisResult
} from '../services/excelAiService';

interface ExcelAiConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: DocumentGroup[];
  company: CompanyProfile;
  onUpdateGroup: (updatedGroup: DocumentGroup) => void;
  onOpenGroupDetail?: (groupId: string) => void;
}

export const ExcelAiConverterModal: React.FC<ExcelAiConverterModalProps> = ({
  isOpen,
  onClose,
  groups,
  company,
  onUpdateGroup,
  onOpenGroupDetail,
}) => {
  const [parsedData, setParsedData] = useState<ParsedExcelData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ExcelAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isInserted, setIsInserted] = useState(false);
  const [insertedGroupId, setInsertedGroupId] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'gdocs' | 'raw'>('report');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    try {
      setIsParsing(true);
      setErrorMsg(null);
      setIsInserted(false);
      setAnalysisResult(null);

      const parsed = await parseExcelFile(file);
      setParsedData(parsed);
      setIsParsing(false);

      // Auto start AI analysis
      await triggerAiAnalysis(parsed);
    } catch (err: any) {
      console.error('Failed to parse file:', err);
      setErrorMsg('엑셀 파일을 읽는 중 오류가 발생했습니다. 올바른 .xlsx, .xls 또는 .csv 파일인지 확인해 주세요.');
      setIsParsing(false);
      setIsAnalyzing(false);
    }
  };

  const handleLoadSample = async (type: 'rnd' | 'production' | 'performance') => {
    const sampleFile = createSampleExcelFile(type);
    await handleFileProcess(sampleFile);
  };

  const triggerAiAnalysis = async (parsed: ParsedExcelData) => {
    try {
      setIsAnalyzing(true);
      setErrorMsg(null);
      const result = await convertExcelToInnoBiz(parsed, company, groups);
      setAnalysisResult(result);
    } catch (err: any) {
      console.error('AI conversion error:', err);
      setErrorMsg('AI 문서 변환 중 지연이 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInsertToGroup = async () => {
    if (!analysisResult || !parsedData) return;
    try {
      // Find matched group
      let targetGroup = groups.find((g) => g.id === analysisResult.matchedGroupId);
      if (!targetGroup) {
        // Fallback to first group if not found
        targetGroup = groups[0];
      }

      const updatedGroup = await insertConvertedDocIntoGroup(
        analysisResult,
        parsedData,
        targetGroup,
        company
      );

      onUpdateGroup(updatedGroup);
      setIsInserted(true);
      setInsertedGroupId(targetGroup.id);
    } catch (err) {
      console.error('Insert to group failed:', err);
      setErrorMsg('문서 그룹 등록 중 오류가 발생했습니다.');
    }
  };

  const handleCopyGoogleDocsText = async () => {
    if (!analysisResult) return;
    try {
      const plainText = analysisResult.googleDocsFormattedText;
      let tableHtml = analysisResult.tableSummaryHtml;
      if (!tableHtml && parsedData?.sampleRows) {
        tableHtml = generateHtmlTableFromRows(parsedData.sampleRows);
      }
      const fullHtml = `
      <div>
        <h1 style="font-size: 18pt; font-weight: bold; color: #1e3a8a;">${analysisResult.docTitle}</h1>
        <p><strong>문서번호:</strong> ${analysisResult.docCode} | <strong>작성일:</strong> ${new Date().toISOString().split('T')[0]} | <strong>기업명:</strong> ${company.companyName}</p>
        <p><strong>평가지표:</strong> ${analysisResult.innoBizDomain} - ${analysisResult.evalCriteriaCode}</p>
        <hr/>
        <h2 style="font-size: 13pt; color: #1e3a8a;">1. 핵심 요약</h2>
        <ul>
          ${analysisResult.executiveSummary.map((s) => `<li>${s}</li>`).join('')}
        </ul>
        <h2 style="font-size: 13pt; color: #1e3a8a;">2. 이노비즈 심사원 소명 보고</h2>
        <div style="white-space: pre-wrap;">${analysisResult.narrativeReport}</div>
        ${tableHtml ? `<h2 style="font-size: 13pt; color: #1e3a8a;">3. 원본 엑셀 데이터 실적 집계표 (Table)</h2>${tableHtml}` : ''}
        <p style="margin-top: 30pt; text-align: right; font-weight: bold;">${company.companyName} 대표이사 ${company.ceoName} (인)</p>
      </div>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const htmlBlob = new Blob([fullHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(plainText);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.warn('Copy error', err);
    }
  };

  const handleLaunchGoogleDocs = async () => {
    if (!analysisResult) return;
    await openAndCopyToGoogleDocs(analysisResult, company, parsedData || undefined);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3500);
  };

  const handleDownloadWordDoc = async () => {
    if (!analysisResult) return;
    try {
      setIsDownloadingWord(true);
      const blob = await createWordDocBlob(analysisResult, company, parsedData || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `[이노비즈보고서]_${analysisResult.docTitle.replace(/[\\/:*?"<>|]/g, '_')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Word download error:', err);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setAnalysisResult(null);
    setIsInserted(false);
    setErrorMsg(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-4 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-blue-50/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  AI 엑셀 문서 분석 및 이노비즈 문서 그룹 자동 변환기
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Gemini AI 지원
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                엑셀 데이터를 분석하여 이노비즈 심사 서술형 보고서 및 구글 독스(Google Docs) 문서를 생성하고, 평가지표 그룹에 1-클릭으로 바로 꽂아줍니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* Step 1: Upload or Choose Sample if no file is uploaded yet */}
          {!parsedData && (
            <div className="max-w-2xl mx-auto py-4 flex flex-col gap-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileProcess(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-white shadow-xs ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  분석할 엑셀 파일(.xlsx, .xls, .csv)을 드래그하거나 클릭하여 선택
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  연구개발비 집행내역, 공장 설비 가동목록, 3개년 매출실적, 지재권 목록 등 사내 엑셀 문서를 올려주시면 AI가 이노비즈 평가지표에 맞추어 자동 변환합니다.
                </p>

                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>MS Excel & CSV 자동 파싱 및 구글 독스 호환 규격 변환</span>
                </div>
              </div>

              {/* Sample test options */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">
                      즉시 테스트용 샘플 엑셀 데이터로 체험하기
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">클릭 즉시 AI 분석 시작</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('rnd')}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 group-hover:text-indigo-600">
                      <span>R&D 개발비 집행표</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      투자비율 4.01% / 1.58억원 집행
                    </div>
                    <div className="text-xs font-semibold text-blue-600 mt-2">
                      → I. 기술혁신능력 매핑
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('production')}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 group-hover:text-indigo-600">
                      <span>충주공장 설비품질대장</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      4대 라인 19종 설비 가동률 94%
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 mt-2">
                      → II. 기술상용화능력 매핑
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadSample('performance')}
                    className="p-3 text-left rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 group-hover:text-indigo-600">
                      <span>3개년 매출·수입대체표</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      매출 39.4억 / 수입대체 40%
                    </div>
                    <div className="text-xs font-semibold text-purple-600 mt-2">
                      → IV. 기술혁신성과 매핑
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading States */}
          {(isParsing || isAnalyzing) && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin absolute -top-1 -right-1" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {isParsing ? '엑셀 워크북 데이터를 읽어오는 중...' : 'Gemini AI가 이노비즈 평가지표 분석 중...'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                사내 데이터의 정량 수치를 집계하고, 이노비즈 4대 평가지표 적합도 판정 및 심사위원용 서술 보고서를 생성하고 있습니다.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 hover:underline font-semibold"
              >
                닫기
              </button>
            </div>
          )}

          {/* Step 2: Analysis Results View */}
          {parsedData && analysisResult && !isAnalyzing && (
            <div className="flex flex-col gap-4">
              {/* File Info Bar */}
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-xs sm:max-w-md">
                        {parsedData.fileName}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {(parsedData.fileSize / 1024).toFixed(1)} KB · {parsedData.totalRows}행
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      분석 시트: <strong className="text-slate-700">{parsedData.activeSheetName}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    다른 엑셀 올리기
                  </button>
                </div>
              </div>

              {/* Matched Group Recommendation Box */}
              <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <FolderPlus className="w-5 h-5 text-indigo-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                          AI 자동 매핑 추천
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {analysisResult.innoBizDomain}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {analysisResult.matchedGroupTitle}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        평가기준: <span className="font-semibold text-indigo-900">{analysisResult.evalCriteriaCode}</span>
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Insert Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isInserted ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          문서 그룹에 등록 완료!
                        </span>
                        {onOpenGroupDetail && insertedGroupId && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenGroupDetail(insertedGroupId);
                            }}
                            className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 rounded-xl transition-colors"
                          >
                            해당 그룹 바로가기 →
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleInsertToGroup}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer transform active:scale-95"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>이노비즈 문서 그룹에 즉시 등록 (원클릭)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Executive Summary Bullets */}
                <div className="mt-4 pt-3 border-t border-indigo-200/60">
                  <div className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>AI 핵심 데이터 요약 및 심사원 소명 포인트</span>
                  </div>
                  <ul className="space-y-1">
                    {analysisResult.executiveSummary.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* View Tabs & Action Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('report')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'report'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      심사용 서술형 보고서
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gdocs')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === 'gdocs'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>구글 독스 (Google Docs) 양식</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('raw')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === 'raw'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      엑셀 원본 데이터
                    </button>
                  </div>

                  {/* Export & Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLaunchGoogleDocs}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                      title="클립보드에 내용을 복사하고 구글 독스(docs.new) 새 문서를 바로 엽니다"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>구글 독스 바로 열기</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadWordDoc}
                      disabled={isDownloadingWord}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="MS Word 및 구글 독스에서 열 수 있는 정규 .doc 파일로 다운로드합니다 (회사 로고/직인 포함)"
                    >
                      {isDownloadingWord ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>로고 삽입 중...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>워드 양식 (.doc) 다운로드</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyGoogleDocsText}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedText ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">복사됨!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>텍스트 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Tab 1: Narrative Report */}
                {activeTab === 'report' && (
                  <div className="p-5 sm:p-6 text-xs sm:text-sm text-slate-800 leading-relaxed font-sans max-h-[50vh] overflow-y-auto bg-white">
                    <div className="max-w-3xl mx-auto space-y-4">
                      {/* Top Header: Tag & Right-aligned Approval Box */}
                      <div className="flex justify-between items-end pb-1 border-b border-slate-200">
                        <div className="text-xs font-semibold text-slate-500 border-l-3 border-indigo-600 pl-2">
                          이노비즈 기술혁신 심사 공식 증빙철
                        </div>
                        <div className="border border-slate-700 bg-white text-xs shadow-2xs">
                          <table className="border-collapse text-center">
                            <tbody>
                              <tr>
                                <th rowSpan={2} className="w-6 bg-slate-100 border border-slate-700 font-bold p-1 text-xs text-slate-800">결<br/>재</th>
                                <th className="w-14 bg-slate-50 border border-slate-700 font-semibold p-1 text-xs text-slate-700">기 안</th>
                                <th className="w-14 bg-slate-50 border border-slate-700 font-semibold p-1 text-xs text-slate-700">검 토</th>
                                <th className="w-14 bg-slate-50 border border-slate-700 font-semibold p-1 text-xs text-slate-700">승 인</th>
                              </tr>
                              <tr className="h-9">
                                <td className="border border-slate-700 p-1 align-bottom text-xs text-slate-500">기안자</td>
                                <td className="border border-slate-700 p-1 align-bottom text-xs text-slate-500">연구소장</td>
                                <td className="border border-slate-700 p-1 align-bottom text-xs text-slate-500">대표이사</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Document Meta Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                        <table className="w-full text-xs table-fixed">
                          <tbody>
                            <tr className="border-b border-slate-200">
                              <th className="w-1/5 bg-slate-100 p-2.5 text-left font-semibold text-slate-600">문서제목</th>
                              <td className="p-2.5 font-bold text-slate-900" colSpan={3}>{analysisResult.docTitle}</td>
                            </tr>
                            <tr className="border-b border-slate-200">
                              <th className="w-1/5 bg-slate-100 p-2.5 text-left font-semibold text-slate-600">문서번호</th>
                              <td className="w-[30%] p-2.5 font-mono">{analysisResult.docCode}</td>
                              <th className="w-1/5 bg-slate-100 p-2.5 text-left font-semibold text-slate-600">대상기업</th>
                              <td className="w-[30%] p-2.5 font-semibold">{company.companyName} (대표: {company.ceoName})</td>
                            </tr>
                            <tr>
                              <th className="bg-slate-100 p-2.5 text-left font-semibold text-slate-600">해당 평가지표</th>
                              <td className="p-2.5 text-indigo-700 font-semibold" colSpan={3}>
                                {analysisResult.innoBizDomain} &gt; {analysisResult.evalCriteriaCode}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Main Report Body */}
                      <div className="whitespace-pre-wrap font-sans text-slate-800 bg-white p-4 border border-slate-100 rounded-xl shadow-2xs leading-relaxed text-xs sm:text-sm">
                        {analysisResult.narrativeReport}
                      </div>

                      {/* Structured Table Section inside Report */}
                      <div className="mt-4 bg-slate-50/80 p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <h4 className="font-bold text-xs text-slate-800">
                              3. 원본 엑셀 데이터 정량 실적 집계표 (페이지 좌우폭 고정 자동 정렬)
                            </h4>
                          </div>
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Word & Google Docs 폭 맞춤 완료
                          </span>
                        </div>
                        <div
                          className="w-full max-w-full overflow-hidden bg-white rounded-lg border border-slate-200 p-2 text-xs shadow-2xs [&>table]:w-full [&>table]:table-fixed [&>table]:border-collapse"
                          dangerouslySetInnerHTML={{
                            __html:
                              analysisResult.tableSummaryHtml ||
                              (parsedData ? generateHtmlTableFromRows(parsedData.sampleRows) : ''),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Google Docs Formatted View */}
                {activeTab === 'gdocs' && (
                  <div className="p-5 sm:p-6 max-h-[50vh] overflow-y-auto bg-slate-50/50">
                    <div className="max-w-3xl mx-auto space-y-4">
                      {/* Notice Banner */}
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-800 shadow-2xs">
                        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold text-blue-900">구글 독스 표(Table) 정규 규격 지원:</strong>
                          <span className="ml-1 text-blue-700">
                            상단 <strong>[구글 독스 바로 열기]</strong> 또는 아래 <strong>[표 서식 포함 복사]</strong> 버튼을 누르면, 엑셀의 데이터가 표 테두리와 셀 간격이 완벽히 유지된 <strong>정규 테이블</strong>로 복사됩니다. Docs 문서에서 <code>Ctrl + V</code> 로 붙여넣으시면 됩니다.
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                        <div className="mb-4 pb-3 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-800">구글 독스 서식 전문 미리보기</span>
                          </div>
                          <button
                            onClick={handleCopyGoogleDocsText}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                          >
                            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedText ? '표 서식 포함 복사 완료!' : '표 서식 포함 복사'}
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 select-all mb-4">
                          {analysisResult.googleDocsFormattedText}
                        </pre>

                        {/* Real Table Preview */}
                        <div className="border-t border-slate-200 pt-4">
                          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Table className="w-3.5 h-3.5 text-indigo-600" />
                              <span>연계 임베딩 표 (구글 독스 붙여넣기 시 적용되는 실제 테이블)</span>
                            </div>
                            <span className="text-xs text-slate-500">HTML 표준 표 규격</span>
                          </div>
                          <div
                            className="w-full max-w-full overflow-hidden bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs shadow-2xs [&>table]:w-full [&>table]:table-fixed [&>table]:border-collapse"
                            dangerouslySetInnerHTML={{
                              __html:
                                analysisResult.tableSummaryHtml ||
                                (parsedData ? generateHtmlTableFromRows(parsedData.sampleRows) : ''),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Raw Excel Data Preview */}
                {activeTab === 'raw' && (
                  <div className="p-4 max-h-[50vh] overflow-y-auto bg-white">
                    <div className="text-xs font-bold text-slate-700 mb-2">
                      원본 엑셀 데이터 샘플 ({parsedData.activeSheetName} - 상위 {parsedData.sampleRows.length}개 행)
                    </div>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="min-w-full text-xs divide-y divide-slate-200">
                        <tbody className="divide-y divide-slate-100">
                          {parsedData.sampleRows.map((row: any, rIdx: number) => {
                            const isHeader = rIdx === 0 || rIdx === 3;
                            return (
                              <tr key={rIdx} className={isHeader ? 'bg-slate-100 font-bold text-slate-800' : 'hover:bg-slate-50'}>
                                {Array.isArray(row) ? (
                                  row.map((cell: any, cIdx: number) => (
                                    <td key={cIdx} className="px-3 py-1.5 whitespace-nowrap text-slate-700 border-r border-slate-100 last:border-r-0">
                                      {String(cell ?? '')}
                                    </td>
                                  ))
                                ) : (
                                  <td className="px-3 py-1.5 text-slate-700">
                                    {JSON.stringify(row)}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>생성된 보고서와 원본 엑셀 파일은 브라우저 로컬 저장소(IndexedDB)에 함께 보관됩니다.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
