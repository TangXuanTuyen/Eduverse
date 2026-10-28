import { Mail, Phone } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-slate-800/60 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center">
        <span className="font-semibold text-slate-200">Vina - Eduverse</span>
        <a href="tel:0964022270" className="inline-flex items-center gap-1.5 min-h-11 hover:text-white transition-colors">
          <Phone className="w-3.5 h-3.5" /> Hotline: 0964022270
        </a>
        <a href="mailto:xuantuyen96@gmail.com" className="inline-flex items-center gap-1.5 min-h-11 hover:text-white transition-colors">
          <Mail className="w-3.5 h-3.5" /> Email: xuantuyen96@gmail.com
        </a>
        <span>Phát triển bởi: Tăng Thị Xuân Tuyền</span>
      </div>
    </footer>
  );
}
