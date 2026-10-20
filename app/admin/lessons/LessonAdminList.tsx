'use client';

import { BookOpen, Eye, EyeOff, Trash2 } from 'lucide-react';
import { toggleLessonPublishAction, deleteLessonAction } from './actions';

const SUBJECT_LABELS: Record<string, string> = {
  vat_ly: 'Vật lý', hoa_hoc: 'Hóa học', sinh_hoc: 'Sinh học', khtn_chung: 'KHTN chung',
};
const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp', published: 'Đã xuất bản', archived: 'Lưu trữ',
};

type Lesson = {
  id: string;
  title: string;
  subject: string;
  grade_level: number;
  chapter: string;
  status: string;
  created_at: string;
};

export function LessonAdminList({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Chưa có bài học nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((l) => (
        <div key={l.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
          <div className="space-y-0.5">
            <p className="text-sm text-white font-medium">{l.title}</p>
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span>{SUBJECT_LABELS[l.subject] ?? l.subject}</span>
              <span>Lớp {l.grade_level}</span>
              {l.chapter && <span>· {l.chapter}</span>}
              <span className={l.status === 'published' ? 'text-green-400' : 'text-slate-500'}>
                {STATUS_LABELS[l.status]}
              </span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={async () => {
                await toggleLessonPublishAction(l.id, l.status);
                window.location.reload();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white min-h-[36px]"
              title={l.status === 'published' ? 'Gỡ xuất bản' : 'Xuất bản'}
            >
              {l.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={async () => {
                if (!confirm('Xóa bài học này?')) return;
                await deleteLessonAction(l.id);
                window.location.reload();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-red-700 text-slate-400 hover:text-white min-h-[36px]"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
