'use client';

import { useActionState } from 'react';
import { GraduationCap, BookOpen, Users } from 'lucide-react';
import { chooseRoleAction, type OnboardingState } from './actions';

const ROLES = [
  { value: 'teacher', label: 'Giáo viên', desc: 'Tạo phòng học, giao bài, theo dõi tiến độ', icon: GraduationCap, color: 'border-blue-500 hover:bg-blue-950/40' },
  { value: 'student', label: 'Học sinh', desc: 'Khám phá thành phố, học bài, làm thí nghiệm', icon: BookOpen, color: 'border-emerald-500 hover:bg-emerald-950/40' },
  { value: 'parent', label: 'Phụ huynh', desc: 'Theo dõi tiến độ và kết quả học tập của con', icon: Users, color: 'border-amber-500 hover:bg-amber-950/40' },
] as const;

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(chooseRoleAction, {});

  return (
    <div className="space-y-3">
      {ROLES.map((r) => (
        <form key={r.value} action={formAction}>
          <input type="hidden" name="role" value={r.value} />
          <button
            type="submit"
            disabled={pending}
            className={`w-full text-left p-4 rounded-xl border-2 bg-slate-800/50 ${r.color} transition-colors disabled:opacity-60`}
          >
            <div className="flex items-center gap-3">
              <r.icon className="w-8 h-8 shrink-0" aria-hidden="true" />
              <div>
                <div className="font-bold text-white">{r.label}</div>
                <div className="text-sm text-slate-300">{r.desc}</div>
              </div>
            </div>
          </button>
        </form>
      ))}

      {state.error && (
        <p role="alert" className="text-sm text-rose-200 bg-rose-950/60 border border-rose-800 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}
    </div>
  );
}
