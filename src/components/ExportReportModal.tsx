import React from 'react';
import { DocumentGroup, CompanyProfile } from '../types';
import { X, Printer, Download, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: DocumentGroup[];
  company: CompanyProfile;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  groups,
  company,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const backupData = {
      company,
      exportedAt: new Date().toISOString(),
      groups,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `[${company.companyName}]_innobiz_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const allDocs = groups.flatMap((g) => g.documents);
  const completedCount = allDocs.filter((d) => d.status === 'completed').length;
  const progressPercent = allDocs.length > 0 ? Math.round((completedCount / allDocs.length) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-6 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:my-0">
        {/* Controls - Hidden in print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">
              [{company.companyName}] 이노비즈 현장실사 문서철 종합 점검표
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>백업 데이터 다운로드</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄 / PDF 저장</span>
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

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto py-5 print:overflow-visible">
          {/* Official Style Header */}
          <div className="pb-6 border-b-2 border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  INNO-BIZ 기술혁신형 중소기업 인증 평가 제출용
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  이노비즈 인증 심사 증빙 문서철 종합 점검표
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  출력일시: {new Date().toLocaleString('ko-KR')} | 총 {groups.length}개 문서 그룹 (총 {allDocs.length}건 중 {completedCount}건 완료 · 진행률 {progressPercent}%)
                </p>
              </div>

              {/* Company Box in Print */}
              <div className="text-right border border-slate-300 rounded p-2.5 bg-slate-50 text-xs">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Logo" className="max-h-8 ml-auto mb-1 object-contain" />
                ) : (
                  <div className="font-bold text-sm text-slate-900">{company.companyName}</div>
                )}
                <div className="text-[11px] text-slate-600">대표자: <strong>{company.ceoName}</strong></div>
                <div className="text-[11px] text-slate-500">사업자번호: {company.bizNumber}</div>
                <div className="text-[11px] text-slate-500">주력제품: {company.mainProduct}</div>
              </div>
            </div>
          </div>

          {/* Groups Breakdown */}
          <div className="mt-6 space-y-6">
            {groups.map((group, gIdx) => (
              <div key={group.id} className="border border-slate-300 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                      그룹 {gIdx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {group.title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600">
                    부서: {group.department} | 담당: {group.manager} | 목표: {group.targetDate}
                  </div>
                </div>

                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-semibold border-y border-slate-200">
                      <th className="py-2 px-2 w-8 text-center">No</th>
                      <th className="py-2 px-2 w-48">평가항목 (세부 지표)</th>
                      <th className="py-2 px-2 w-14 text-center">배점</th>
                      <th className="py-2 px-2 w-36">기업 자가진단 현황</th>
                      <th className="py-2 px-2">필요 제출 증빙 서류</th>
                      <th className="py-2 px-2 w-16 text-center">상태</th>
                      <th className="py-2 px-2 w-16 text-center">첨부</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {group.documents.map((doc, dIdx) => (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center text-slate-500 font-medium">
                          {dIdx + 1}
                        </td>
                        <td className="py-2 px-2 font-bold text-slate-900">
                          {doc.evalItem || doc.title}
                          {doc.notes && (
                            <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                              비고: {doc.notes}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-amber-800">
                          {doc.points ? `${doc.points}점` : '-'}
                        </td>
                        <td className="py-2 px-2 text-blue-900 font-semibold text-[11px]">
                          {doc.currentStatus || '-'}
                        </td>
                        <td className="py-2 px-2 text-slate-700">
                          {doc.evidenceDocNames && doc.evidenceDocNames.length > 0 ? (
                            <ul className="list-disc list-inside space-y-0.5">
                              {doc.evidenceDocNames.map((eDoc, eIdx) => (
                                <li key={eIdx}>{eDoc}</li>
                              ))}
                            </ul>
                          ) : (
                            doc.formatGuide
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-semibold">
                          {doc.status === 'completed' && <span className="text-emerald-700">완료 ✓</span>}
                          {doc.status === 'review' && <span className="text-amber-700">검토중</span>}
                          {doc.status === 'in_progress' && <span className="text-blue-700">작성중</span>}
                          {doc.status === 'pending' && <span className="text-slate-400">미작성</span>}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600">
                          {doc.attachments && doc.attachments.length > 0 ? (
                            <span className="font-semibold text-blue-600">{doc.attachments.length}건</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* Signoff block */}
          <div className="mt-8 pt-4 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-700 gap-3">
            <div>
              <p>총괄 실무책임자 확인: ___________________ (서명)</p>
              <p className="text-[11px] text-slate-500 mt-1">소재지: {company.address || '회사 사업장'}</p>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <p>점검 확인일자: {new Date().toLocaleDateString('ko-KR')}</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {company.companyName} 대표이사 {company.ceoName}
                </p>
              </div>
              {company.sealUrl ? (
                <img src={company.sealUrl} alt="직인" className="w-10 h-10 object-contain inline-block" />
              ) : (
                <span className="w-9 h-9 rounded-full border border-rose-400 text-rose-600 text-[10px] font-bold inline-flex items-center justify-center rotate-[-10deg]">
                  (인)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer in modal */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
