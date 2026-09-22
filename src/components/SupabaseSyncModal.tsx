import React, { useState, useEffect } from 'react';
import { CompanyProfile, DocumentGroup } from '../types';
import { SELF_AUDIT_GUIDE_ITEMS } from '../data/selfAuditGuideData';
import {
  getSupabaseClient,
  getStoredSupabaseConfig,
  saveStoredSupabaseConfig,
  isSupabaseConnected,
} from '../lib/supabaseClient';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Server,
  Cloud,
  Layers,
  FileCheck2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: CompanyProfile;
  groups: DocumentGroup[];
}

const OPTIONS_STORAGE_KEY = 'innobiz_self_audit_selected_options_v2';

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  company,
  groups,
}) => {
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Load existing configuration on mount
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg) {
      setSupabaseUrlInput(cfg.url);
      setSupabaseKeyInput(cfg.anonKey);
    }
    const savedLastSync = localStorage.getItem('innobiz_last_supabase_sync_time');
    if (savedLastSync) {
      setLastSyncedTime(savedLastSync);
    }
  }, []);

  const isConnected = isSupabaseConnected();

  // Test and save Supabase config
  const handleSaveAndTestConfig = async () => {
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      setStatusMsg({ type: 'error', text: 'Supabase Project URL과 Anon Public Key를 모두 입력해주세요.' });
      return;
    }

    setIsTesting(true);
    setStatusMsg({ type: 'info', text: 'Supabase 서버 연결 상태를 확인하고 있습니다...' });

    try {
      saveStoredSupabaseConfig({
        url: supabaseUrlInput.trim(),
        anonKey: supabaseKeyInput.trim(),
      });

      const client = getSupabaseClient();
      if (!client) {
        setStatusMsg({ type: 'error', text: 'Supabase 클라이언트 생성에 실패했습니다. URL 형식을 확인해주세요.' });
        return;
      }

      const { data, error } = await client.auth.getSession();
      if (error && error.message && !error.message.includes('Auth session missing')) {
        setStatusMsg({ type: 'info', text: `연결 확인됨 (경고 메시지: ${error.message})` });
      } else {
        setStatusMsg({ type: 'success', text: '✅ Supabase 클라우드 데이터베이스에 성공적으로 연결되었습니다!' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `연결 실패: ${err?.message || '네트워크 오류가 발생했습니다.'}` });
    } finally {
      setIsTesting(false);
    }
  };

  // Perform full cloud sync
  const handleSyncData = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setStatusMsg({ type: 'error', text: '먼저 Supabase 연결 설정을 완료해주세요.' });
      return;
    }

    setIsSyncing(true);
    setStatusMsg({ type: 'info', text: '기업 프로필, 자가진단표 및 36개 서류철 데이터를 클라우드로 전송 중...' });

    try {
      let selectedOptions = {};
      try {
        const savedOptions = localStorage.getItem(OPTIONS_STORAGE_KEY);
        if (savedOptions) selectedOptions = JSON.parse(savedOptions);
      } catch (e) {
        console.error('Failed to parse selected options', e);
      }

      const payload = {
        company_name: company.companyName,
        biz_number: company.bizNumber,
        ceo_name: company.ceoName,
        industry: company.industry,
        synced_at: new Date().toISOString(),
        items_count: SELF_AUDIT_GUIDE_ITEMS.length,
        selected_options: selectedOptions,
        groups_count: groups.length,
        groups_data: groups,
      };

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
        if (error.code === '42P01' || error.message.includes('relation "innobiz_self_audit_records" does not exist')) {
          setStatusMsg({
            type: 'error',
            text: 'Supabase 데이터베이스에 "innobiz_self_audit_records" 테이블이 없습니다. Supabase SQL Editor에서 테이블을 생성해 주세요.',
          });
        } else {
          setStatusMsg({ type: 'error', text: `동기화 오류: ${error.message}` });
        }
      } else {
        const nowStr = new Date().toLocaleString('ko-KR');
        setLastSyncedTime(nowStr);
        localStorage.setItem('innobiz_last_supabase_sync_time', nowStr);
        setStatusMsg({
          type: 'success',
          text: `🎉 ${company.companyName}의 모든 인증 실무 데이터가 Supabase 클라우드에 성공적으로 백업 및 동기화되었습니다!`,
        });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: `클라우드 동기화 실패: ${e?.message || '네트워크 오류'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-4 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                  관리자 전용
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {company.companyName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Supabase 클라우드 DB 연동 및 백업 관리
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-slate-600">
          {/* Explanation Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
            <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-emerald-600" />
              <span>실시간 원격 클라우드 저장소 연동</span>
            </p>
            <p className="text-[11px] text-slate-600">
              컨설턴트 및 마스터 관리자 환경에서 Supabase Project URL 및 API Key를 연동하여,
              수임 기업의 <strong>36개 서류철 및 모의 자가진단 채점 데이터</strong>를 클라우드에 영구 백업하고 다중 기기에서 실시간 동기화합니다.
            </p>
          </div>

          {/* Connection Inputs */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                <span>Supabase Project URL</span>
              </label>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {isConnected ? '● 연결 활성화' : '○ 미연결'}
              </span>
            </div>
            <input
              type="text"
              value={supabaseUrlInput}
              onChange={(e) => setSupabaseUrlInput(e.target.value)}
              placeholder="https://xyzproject.supabase.co"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div>
              <label className="font-bold text-slate-900 block mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                value={supabaseKeyInput}
                onChange={(e) => setSupabaseKeyInput(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveAndTestConfig}
                disabled={isTesting}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isTesting ? '연결 테스트 중...' : '연결 설정 저장'}</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : statusMsg.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-snug">{statusMsg.text}</div>
            </div>
          )}

          {/* Sync Action Area */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>실시간 데이터 클라우드 전송</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  현재 기업({company.companyName})의 36개 문서철 및 진단 점수를 원격 DB에 갱신합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncData}
                disabled={isSyncing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{isSyncing ? '동기화 중...' : '클라우드로 즉시 동기화'}</span>
              </button>
            </div>

            {lastSyncedTime && (
              <div className="text-[11px] text-emerald-800 font-medium pt-1 border-t border-emerald-200/60">
                마지막 동기화 완료: <strong>{lastSyncedTime}</strong>
              </div>
            )}
          </div>

          {/* Table Guide Info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>권장 테이블 스키마 안내 (innobiz_self_audit_records)</span>
            </div>
            <p className="leading-relaxed">
              Supabase SQL Editor에서 <code>innobiz_self_audit_records</code> 테이블(컬럼: <code>biz_number text primary key, company_name text, data jsonb, updated_at timestamptz</code>)을 생성하시면 원활하게 저장됩니다.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>컨설턴트 마스터 보안 인증 상태</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
