'use client';

import { useState } from 'react';
import { QuestionForm } from './QuestionForm';
import { ImportDialog } from './ImportDialog';
import { AIGenerateDialog } from './AIGenerateDialog';

export function QuestionToolbar() {
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const closeAll = () => { setShowCreate(false); setShowImport(false); setShowAI(false); };

  return (
    <div className="space-y-3">
      {/* Filters */}
      <form className="flex flex-wrap gap-2">
        <input
          name="search"
          type="text"
          placeholder="Tìm kiếm..."
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px] flex-1 min-w-[160px]"
        />
        <select
          name="type"
          defaultValue=""
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">Tất cả loại</option>
          <option value="single_choice">Trắc nghiệm</option>
          <option value="multiple_choice">Nhiều đáp án</option>
          <option value="short_answer">Trả lời ngắn</option>
          <option value="essay">Tự luận</option>
        </select>
        <select
          name="difficulty"
          defaultValue=""
          className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-white min-h-[44px]"
        >
          <option value="">Tất cả độ khó</option>
          <option value="1">Dễ</option>
          <option value="2">Trung bình</option>
          <option value="3">Khó</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          Lọc
        </button>
      </form>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { closeAll(); setShowCreate(!showCreate); }}
          className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {showCreate ? 'Ẩn form' : 'Tạo câu hỏi'}
        </button>
        <button
          type="button"
          onClick={() => { closeAll(); setShowAI(!showAI); }}
          className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          {showAI ? 'Ẩn' : '✦ Tạo bằng AI'}
        </button>
        <button
          type="button"
          onClick={() => { closeAll(); setShowImport(!showImport); }}
          className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
        >
          {showImport ? 'Ẩn' : 'Nhập từ file'}
        </button>
      </div>

      {showCreate && <QuestionForm onDone={() => setShowCreate(false)} />}
      {showAI && <AIGenerateDialog onClose={() => setShowAI(false)} />}
      {showImport && <ImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
