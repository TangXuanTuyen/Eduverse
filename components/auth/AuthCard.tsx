export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950">
      <div className="w-full max-w-md bg-slate-900/90 border border-indigo-500/40 rounded-2xl shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2" aria-hidden="true">
            🏫
          </div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-indigo-300 mt-1">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
