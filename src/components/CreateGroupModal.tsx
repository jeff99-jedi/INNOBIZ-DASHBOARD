import React, { useState } from 'react';
import { DocumentGroup, InnoBizCategory, DocumentItem } from '../types';
import { INNOBIZ_DOCUMENT_TEMPLATES } from '../data/defaultGroups';
import { X, Plus, Sparkles, Check, Trash2, FolderPlus, HelpCircle } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (newGroup: DocumentGroup) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreateGroup,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<InnoBizCategory>('custom');
  const [department, setDepartment] = useState('이노비즈 TF팀');
  const [manager, setManager] = useState('');
  const [targetDate, setTargetDate] = useState('2026-10-31');
  const [description, setDescription] = useState('');
  const [customDocInput, setCustomDocInput] = useState('');
  const [initialDocs, setInitialDocs] = useState<string[]>([
    '이노비즈 자가진단표 및 현장실사 사전 질의서',
    '회사 소개서 및 주요 사업 포트폴리오'
  ]);

  if (!isOpen) return null;

  const categoryNames: Record<InnoBizCategory, string> = {
    tech_innovation: '기술혁신능력',
    tech_commercialize: '기술사업화능력',
    tech_management: '기술혁신경영능력',
    tech_performance: '기술혁신성과',
    custom: '사용자 맞춤 그룹',
  };

  const currentTemplate = INNOBIZ_DOCUMENT_TEMPLATES.find((t) => t.category === category);

  const handleAddCustomDoc = () => {
    if (!customDocInput.trim()) return;
    setInitialDocs([...initialDocs, customDocInput.trim()]);
    setCustomDocInput('');
  };

  const handleToggleTemplateDoc = (docTitle: string) => {
    if (initialDocs.includes(docTitle)) {
      setInitialDocs(initialDocs.filter((d) => d !== docTitle));
    } else {
      setInitialDocs([...initialDocs, docTitle]);
    }
  };

  const handleRemoveDoc = (index: number) => {
    setInitialDocs(initialDocs.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newDocs: DocumentItem[] = initialDocs.map((docTitle, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      title: docTitle,
      isRequired: true,
      status: 'pending',
      formatGuide: '이노비즈 심사 가이드라인 기준 증빙 편철 요망',
      updatedAt: new Date().toISOString().split('T')[0],
    }));

    const newGroup: DocumentGroup = {
      id: `grp-${Date.now()}`,
      title: title.trim(),
      category,
      categoryName: categoryNames[category],
      description: description.trim() || '사용자가 새로 생성한 이노비즈 문서 그룹입니다.',
      department: department.trim() || '이노비즈 TF팀',
      manager: manager.trim() || '담당자 미지정',
      targetDate: targetDate || '2026-10-31',
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      documents: newDocs,
    };

    onCreateGroup(newGroup);
    onClose();
    // Reset form
    setTitle('');
    setDescription('');
    setManager('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">새 이노비즈 문서 그룹 만들기</h2>
              <p className="text-xs text-slate-500">
                인증 심사 및 현장실사용 증빙 서류철을 새로운 그룹으로 묶어 체계적으로 관리합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              문서 그룹명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: 2026 하반기 이노비즈 재인증 필수 서류철, 연구개발 실적 증빙군 등"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category & Target Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                이노비즈 심사 분류
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InnoBizCategory)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="custom">맞춤 생성 그룹 (자유 분류)</option>
                <option value="tech_innovation">1. 기술혁신능력 (R&D, 특허)</option>
                <option value="tech_commercialize">2. 기술사업화능력 (생산, 공정, 납품)</option>
                <option value="tech_management">3. 기술혁신경영능력 (조직, 교육)</option>
                <option value="tech_performance">4. 기술혁신성과 (재무, 시험성적)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                목표 완료일 (D-Day)
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Department & Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                담당 부서
              </label>
              <input
                type="text"
                placeholder="예: 기업부설연구소, 품질경영팀, 기획팀"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                담당자 성명
              </label>
              <input
                type="text"
                placeholder="예: 홍길동 과장"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              문서 그룹 설명 (선택)
            </label>
            <textarea
              rows={2}
              placeholder="이 문서 그룹의 목적이나 심사위원 제출 시 참고사항을 기록하세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Quick Document Picker from Templates */}
          {currentTemplate && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  {currentTemplate.categoryName} 추천 필수 서류 추가
                </span>
                <span className="text-xs text-slate-400">클릭하여 선택</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentTemplate.suggestions.map((sug) => {
                  const isSelected = initialDocs.includes(sug);
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleToggleTemplateDoc(sug)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 font-medium'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      <span>{sug}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Document list to be created */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              포함될 증빙 서류 목록 ({initialDocs.length}건)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="추가할 서류명 직접 입력 (예: 공장등록증 원본)"
                value={customDocInput}
                onChange={(e) => setCustomDocInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomDoc();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomDoc}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
              >
                추가
              </button>
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 border border-slate-200 rounded-lg p-2">
              {initialDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs bg-white px-2.5 py-1.5 rounded-md border border-slate-200"
                >
                  <span className="text-slate-800 font-medium truncate pr-2">
                    {idx + 1}. {doc}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {initialDocs.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">
                  서류가 없습니다. 위 추천 목록이나 입력창으로 서류를 추가해주세요.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              문서 그룹 만들기 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
