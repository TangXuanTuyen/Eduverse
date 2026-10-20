'use client';

import { useActionState, useRef, useState } from 'react';
import { importQuestionsAction, type QuestionActionState } from './actions';
import type { CreateQuestionData } from '@/services/questions';

type Props = { onClose: () => void };

export function ImportDialog({ onClose }: Props) {
  const [state, formAction, pending] = useActionState<QuestionActionState, FormData>(importQuestionsAction, {});
  const [rows, setRows] = useState<CreateQuestionData[]>([]);
  const [parseError, setParseError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParseError('');
    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        setRows(Array.isArray(parsed) ? parsed : [parsed]);
        return;
      }

      // CSV: header row + data rows
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) { setParseError('Cần ít nhất 2 dòng (tiêu đề + dữ liệu)'); return; }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const contentIdx = headers.indexOf('content');
      const typeIdx = headers.indexOf('type');
      if (contentIdx < 0) { setParseError('Thiếu cột "content"'); return; }

      const parsed: CreateQuestionData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c) => c.trim());
        if (!cols[contentIdx]) continue;
        parsed.push({
          type: (typeIdx >= 0 ? cols[typeIdx] : 'essay') as CreateQuestionData['type'],
          content: cols[contentIdx],
          difficulty: Number(cols[headers.indexOf('difficulty')]) || 1,
          skill_tags: cols[headers.indexOf('skill_tags')]?.split(';').filter(Boolean) ?? [],
        });
      }
      setRows(parsed);
    } catch {
      setParseError('Không đọc được file');
    }
  }

  if (state.success) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-green-400 text-sm">{state.success}</p>
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      <h3 className="font-bold text-white">Nhập câu hỏi từ file</h3>
      <p className="text-xs text-slate-400">Hỗ trợ CSV (cột: content, type, difficulty, skill_tags) hoặc JSON.</p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-sm text-slate-300"
      />

      {parseError && <p className="text-red-400 text-sm">{parseError}</p>}
      {state.error && <p className="text-red-400 text-sm">{state.error}</p>}

      {rows.length > 0 && (
        <>
          <div className="bg-slate-800 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-slate-400 mb-2">{rows.length} câu hỏi sẽ được nhập:</p>
            <ul className="space-y-1">
              {rows.slice(0, 20).map((r, i) => (
                <li key={i} className="text-xs text-white truncate">
                  {i + 1}. [{r.type}] {r.content}
                </li>
              ))}
              {rows.length > 20 && <li className="text-xs text-slate-400">...và {rows.length - 20} câu nữa</li>}
            </ul>
          </div>

          <form action={formAction}>
            <input type="hidden" name="data" value={JSON.stringify(rows)} />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-green-600 hover:bg-green-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 min-h-[44px]"
              >
                {pending ? 'Đang nhập...' : `Nhập ${rows.length} câu hỏi`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]"
              >
                Hủy
              </button>
            </div>
          </form>
        </>
      )}

      {rows.length === 0 && (
        <button onClick={onClose} className="rounded-lg bg-slate-700 hover:bg-slate-600 px-4 py-2 text-sm text-white min-h-[44px]">
          Hủy
        </button>
      )}
    </div>
  );
}
