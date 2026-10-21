'use client';

import Link from 'next/link';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { useRouter } from 'next/navigation';
import { STUDENT_HOME } from '@/lib/student-routes';

type Assignment = {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  assignment_type?: string;
  rooms: { name: string };
};

export function StudentAssignmentList({ assignments }: { assignments: Assignment[] }) {
  const router = useRouter();

  return (
    <DialogFrame
      onClose={() => router.push(STUDENT_HOME)}
      label="Bài giao"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-blue-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        <div className="px-6 py-4 border-b border-blue-500/30 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Bài giao</h2>
          <button
            type="button"
            onClick={() => router.push(STUDENT_HOME)}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2">
          {assignments.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Chưa có bài giao nào.</p>
          ) : (
            assignments.map((a) => {
              const overdue = a.due_at && new Date(a.due_at) < new Date();
              const isTask = a.assignment_type === 'lesson' || a.assignment_type === 'experiment' || a.assignment_type === 'model3d' || a.assignment_type === 'stem';
              const taskRoute = a.assignment_type === 'lesson' ? '/student/library'
                : a.assignment_type === 'model3d' ? '/student/world-3d'
                : a.assignment_type === 'stem' ? '/student/stem'
                : '/student/virtual-lab';
              const typeIcon = a.assignment_type === 'lesson' ? '📖' : a.assignment_type === 'experiment' ? '🔬' : a.assignment_type === 'model3d' ? '🌐' : a.assignment_type === 'stem' ? '🧪' : '📝';
              return (
                <Link
                  key={a.id}
                  href={isTask ? taskRoute : `/student/assignments/real/${a.id}`}
                  className="block bg-slate-800 hover:bg-slate-700 rounded-xl p-3 transition"
                >
                  <div className="font-medium text-sm text-white">{typeIcon} {a.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{a.rooms.name}</div>
                  {a.due_at && (
                    <div className={`text-xs mt-1 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                      {overdue ? 'Quá hạn' : 'Hạn'}: {new Date(a.due_at).toLocaleString('vi-VN')}
                    </div>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
