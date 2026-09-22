import React, { useState, useEffect, useRef } from 'react';
import { Lock, KeyRound, ShieldAlert, ArrowRight, X, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CORRECT_PASSWORD = '9638';

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError(false);
      setErrorMessage('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setErrorMessage('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
      setPassword('');
      inputRef.current?.focus();
    }
  };

  const handleKeypadPress = (num: string) => {
    if (password.length < 8) {
      const next = password + num;
      setPassword(next);
      setError(false);
      if (next.length === 4 && next === CORRECT_PASSWORD) {
        onSuccess();
      }
    }
  };

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
    setError(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
            <Lock className="w-7 h-7 text-indigo-600" />
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block mb-1.5">
            컨설턴트 및 마스터 관리자 전용
          </span>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            관리자 페이지 인증
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            이노비즈 문서대시보드 접근을 위해 보안 비밀번호(4자리)를 입력해 주세요.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = password.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-black transition-all ${
                      error
                        ? 'border-rose-400 bg-rose-50 text-rose-600'
                        : isFilled
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-2xs'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isFilled ? (showPassword ? password[idx] : '●') : ''}
                  </div>
                );
              })}
            </div>

            {/* Actual Hidden/Visible Input for Keyboard Typing */}
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={password}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setPassword(val);
                  setError(false);
                }}
                placeholder="4자리 숫자 입력"
                className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center justify-center gap-1.5 text-xs text-rose-600 font-semibold mt-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick keypad for easy touch / mobile usage */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-800 text-base font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPassword('')}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              전체삭제
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-800 text-base font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              지우기
            </button>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>확인 (대시보드 입장)</span>
            </button>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-400">
          수임 기업 담당자는 메인 화면의 <strong>[이노비즈 모의평가]</strong>를 선택해 주세요.
        </div>
      </div>
    </div>
  );
};
