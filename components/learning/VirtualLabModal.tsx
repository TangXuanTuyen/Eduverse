'use client';

import React, { useState, useEffect } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { Microscope, Zap, FlaskConical, Atom, Play, Clock, ArrowLeft, Loader2, ExternalLink } from 'lucide-react';

type Experiment = {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade_level: number;
  thumbnail_url: string | null;
  embed_url: string | null;
  component_key: string | null;
  duration_minutes: number;
  difficulty: number;
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  'Vật lý': <Zap className="w-5 h-5 text-yellow-400" />,
  'Hóa học': <FlaskConical className="w-5 h-5 text-green-400" />,
  'Sinh học': <Microscope className="w-5 h-5 text-pink-400" />,
};

const DEMO_EXPERIMENTS: Experiment[] = [
  {
    id: 'simple_circuit',
    title: 'Thí nghiệm lắp mạch điện đơn giản',
    description: 'Bài 22 · Chương V: Điện — Kéo thả pin, bóng đèn, công tắc và dây dẫn để lắp mạch điện kín. Quan sát dòng điện và đèn sáng.',
    subject: 'Vật lý',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: '/experiments/simple-circuit/index.html',
    component_key: 'simple_circuit',
    duration_minutes: 15,
    difficulty: 1,
  },
  {
    id: 'demo_acid_base',
    title: 'Phản ứng axit – bazơ',
    description: 'Nhỏ dung dịch axit và bazơ lên quỳ tím, quan sát sự đổi màu và ghi nhận kết quả.',
    subject: 'Hóa học',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 10,
    difficulty: 1,
  },
  {
    id: 'demo_cell',
    title: 'Quan sát tế bào thực vật',
    description: 'Sử dụng kính hiển vi ảo để quan sát cấu trúc tế bào hành tây ở các độ phóng đại khác nhau.',
    subject: 'Sinh học',
    grade_level: 6,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 12,
    difficulty: 1,
  },
  {
    id: 'demo_force',
    title: 'Lực và chuyển động',
    description: 'Đẩy vật trên mặt phẳng nghiêng, thay đổi góc nghiêng và khối lượng để quan sát gia tốc.',
    subject: 'Vật lý',
    grade_level: 8,
    thumbnail_url: null,
    embed_url: null,
    component_key: null,
    duration_minutes: 15,
    difficulty: 2,
  },
];

interface VirtualLabModalProps {
  onClose: () => void;
}

export function VirtualLabModal({ onClose }: VirtualLabModalProps) {
  const [experiments, setExperiments] = useState<Experiment[]>(DEMO_EXPERIMENTS);
  const [activeExp, setActiveExp] = useState<Experiment | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/experiments')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setExperiments(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? experiments : experiments.filter((e) => e.subject === filter);
  const subjects = [...new Set(experiments.map((e) => e.subject))];

  if (activeExp) {
    return (
      <DialogFrame onClose={onClose} label="Phòng Thí Nghiệm Ảo" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-orange-800/30 flex flex-col bg-gradient-to-b from-orange-950/90 to-slate-950/95 text-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-orange-800/40">
            <button
              onClick={() => setActiveExp(null)}
              className="p-2 rounded-lg hover:bg-orange-900/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{activeExp.title}</h2>
              <p className="text-sm text-orange-300">{activeExp.subject} · Lớp {activeExp.grade_level}</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <p className="text-orange-200 mb-4">{activeExp.description}</p>
            {activeExp.embed_url ? (
              <a
                href={activeExp.embed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition min-h-[44px]"
              >
                <Play className="w-5 h-5" /> Bắt đầu thí nghiệm <ExternalLink className="w-4 h-4 opacity-60" />
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-orange-900/50 border border-orange-700/50 flex items-center justify-center">
                  <Atom className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-sm text-orange-400">
                  Thí nghiệm này đang được phát triển. Giáo viên có thể gán thí nghiệm từ nguồn bên ngoài.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogFrame>
    );
  }

  return (
    <DialogFrame onClose={onClose} label="Phòng Thí Nghiệm Ảo" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-orange-800/30 flex flex-col bg-gradient-to-b from-orange-950/90 to-slate-950/95 text-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-orange-800/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-900/60 border border-orange-700/50 flex items-center justify-center">
              🔬
            </div>
            <div>
              <h1 className="font-bold text-lg">Phòng Thí Nghiệm Ảo</h1>
              <p className="text-xs text-orange-300">Mô phỏng an toàn — thử bao nhiêu lần cũng được</p>
            </div>
          </div>
          {/* Subject filter */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] ${
                filter === 'all' ? 'bg-orange-600 text-white' : 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60'
              }`}
            >
              Tất cả
            </button>
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] flex items-center gap-1.5 ${
                  filter === s ? 'bg-orange-600 text-white' : 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60'
                }`}
              >
                {SUBJECT_ICONS[s]} {s}
              </button>
            ))}
          </div>
        </div>

        {/* Experiment list */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-orange-400 py-8">Chưa có thí nghiệm nào cho môn này.</p>
          ) : (
            filtered.map((exp) => (
              <button
                key={exp.id}
                onClick={() => setActiveExp(exp)}
                className="w-full text-left p-4 rounded-xl bg-orange-900/30 border border-orange-800/30 hover:bg-orange-900/50 hover:border-orange-600/50 transition group min-h-[44px]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-900/60 flex items-center justify-center shrink-0 mt-0.5">
                    {SUBJECT_ICONS[exp.subject] ?? <Atom className="w-5 h-5 text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-orange-200 transition">{exp.title}</h3>
                    <p className="text-sm text-orange-300/80 mt-0.5 line-clamp-2">{exp.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-orange-400">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {exp.duration_minutes} phút</span>
                      <span>Lớp {exp.grade_level}</span>
                      <span>{'⭐'.repeat(exp.difficulty)}</span>
                    </div>
                  </div>
                  <Play className="w-5 h-5 text-orange-500 group-hover:text-orange-300 transition shrink-0 mt-2" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
