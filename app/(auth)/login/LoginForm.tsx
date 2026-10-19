'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { loginAction, type LoginState } from './actions';

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div>
        <label htmlFor="identifier" className="block text-sm font-semibold text-slate-200 mb-1.5">
          Mã học sinh hoặc email
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          required
          defaultValue={state.identifier}
          aria-describedby="identifier-hint"
          className="w-full min-h-12 px-4 rounded-xl bg-slate-800 border border-slate-600 text-white text-base placeholder:text-slate-500 focus:border-indigo-400"
          placeholder="Ví dụ: EDU6A101"
        />
        <p id="identifier-hint" className="mt-1 text-xs text-slate-400">
          Học sinh nhập mã do trường cấp. Thầy cô, phụ huynh nhập email.
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-1.5">
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="w-full min-h-12 pl-4 pr-14 rounded-xl bg-slate-800 border border-slate-600 text-white text-base focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            aria-pressed={showPassword}
            className="absolute right-1 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

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
        <LogIn className="w-5 h-5" aria-hidden="true" />
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Học sinh quên mật khẩu? Hãy nhờ thầy cô chủ nhiệm đặt lại.
      </p>
    </form>
  );
}
