'use client';

import { useActionState } from 'react';
import { KeyRound } from 'lucide-react';
import { changePasswordAction, type ChangePasswordState } from './actions';

const FIELDS = [
  { name: 'currentPassword', label: 'Mật khẩu hiện tại (mật khẩu tạm)', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Nhập lại mật khẩu mới', autoComplete: 'new-password' },
] as const;

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {FIELDS.map((f) => {
        const err = state.fieldErrors?.[f.name];
        return (
          <div key={f.name}>
            <label htmlFor={f.name} className="block text-sm font-semibold text-slate-200 mb-1.5">
              {f.label}
            </label>
            <input
              id={f.name}
              name={f.name}
              type="password"
              autoComplete={f.autoComplete}
              required
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${f.name}-error` : f.name === 'newPassword' ? 'pw-rules' : undefined}
              className="w-full min-h-12 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-base focus:border-indigo-400 aria-[invalid=true]:border-rose-500"
            />
            {f.name === 'newPassword' && !err && (
              <p id="pw-rules" className="mt-1 text-xs text-slate-400">
                Ít nhất 8 ký tự, có cả chữ và số, không chứa mã học sinh.
              </p>
            )}
            {err && (
              <p id={`${f.name}-error`} className="mt-1 text-xs text-rose-300">
                {err}
              </p>
            )}
          </div>
        );
      })}

      {state.error && (
        <p role="alert" className="text-sm text-rose-200 bg-rose-950/60 border border-rose-800 rounded-xl px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full min-h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold flex items-center justify-center gap-2"
      >
        <KeyRound className="w-5 h-5" aria-hidden="true" />
        {pending ? 'Đang lưu…' : 'Đổi mật khẩu'}
      </button>
    </form>
  );
}
