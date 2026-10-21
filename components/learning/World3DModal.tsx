'use client';

import React, { useState, useEffect } from 'react';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { Globe, ArrowLeft, Loader2, RotateCcw, ZoomIn, Box } from 'lucide-react';

type Model3D = {
  id: string;
  title: string;
  description: string;
  category: string;
  embed_url: string | null;
  thumbnail_url: string | null;
};

const CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: '🌐' },
  { key: 'Sinh học', label: 'Sinh học', icon: '🧬' },
  { key: 'Hóa học', label: 'Hóa học', icon: '⚗️' },
  { key: 'Vật lý', label: 'Thiên văn', icon: '🪐' },
];

const DEMO_MODELS: Model3D[] = [
  {
    id: 'demo_cell_3d',
    title: 'Tế bào động vật',
    description: 'Mô hình 3D tế bào động vật với nhân, ti thể, lưới nội chất và các bào quan.',
    category: 'Sinh học',
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_solar',
    title: 'Hệ Mặt Trời',
    description: 'Mô hình hệ Mặt Trời với 8 hành tinh, quỹ đạo và khoảng cách tương đối.',
    category: 'Vật lý',
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_water',
    title: 'Phân tử nước (H₂O)',
    description: 'Cấu trúc phân tử nước: liên kết cộng hóa trị, góc liên kết 104.5°, phân cực.',
    category: 'Hóa học',
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_heart',
    title: 'Tim người',
    description: 'Mô hình 3D tim người với 4 ngăn, van tim và hệ mạch máu chính.',
    category: 'Sinh học',
    embed_url: null,
    thumbnail_url: null,
  },
  {
    id: 'demo_nacl',
    title: 'Tinh thể NaCl',
    description: 'Cấu trúc tinh thể muối ăn: ion Na⁺ và Cl⁻ sắp xếp đều đặn trong không gian.',
    category: 'Hóa học',
    embed_url: null,
    thumbnail_url: null,
  },
];

interface World3DModalProps {
  onClose: () => void;
}

export function World3DModal({ onClose }: World3DModalProps) {
  const [models, setModels] = useState<Model3D[]>(DEMO_MODELS);
  const [activeModel, setActiveModel] = useState<Model3D | null>(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setModels(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? models : models.filter((m) => m.category === filter);

  if (activeModel) {
    return (
      <DialogFrame onClose={onClose} label="Thế Giới 3D" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-cyan-800/30 flex flex-col bg-gradient-to-b from-cyan-950/90 to-slate-950/95 text-white">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-800/40">
            <button
              onClick={() => setActiveModel(null)}
              className="p-2 rounded-lg hover:bg-cyan-900/50 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Quay lại danh sách"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg truncate">{activeModel.title}</h2>
              <p className="text-sm text-cyan-300">{activeModel.category}</p>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {activeModel.embed_url ? (
              <iframe
                src={activeModel.embed_url}
                className="w-full h-[60vh] rounded-xl border border-cyan-800/30"
                title={activeModel.title}
                sandbox="allow-scripts allow-same-origin"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-cyan-900/50 border border-cyan-700/50 flex items-center justify-center">
                  <Box className="w-10 h-10 text-cyan-400" />
                </div>
                <div>
                  <p className="text-cyan-200 font-medium">{activeModel.description}</p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-cyan-400">
                    <span className="flex items-center gap-1"><RotateCcw className="w-4 h-4" /> Xoay</span>
                    <span className="flex items-center gap-1"><ZoomIn className="w-4 h-4" /> Phóng to</span>
                  </div>
                  <p className="text-sm text-cyan-400 mt-3">
                    Mô hình đang được phát triển. Giáo viên có thể gán mô hình từ nguồn bên ngoài.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogFrame>
    );
  }

  return (
    <DialogFrame onClose={onClose} label="Thế Giới 3D" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-cyan-800/30 flex flex-col bg-gradient-to-b from-cyan-950/90 to-slate-950/95 text-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-cyan-800/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center">
              🌐
            </div>
            <div>
              <h1 className="font-bold text-lg">Thế Giới 3D</h1>
              <p className="text-xs text-cyan-300">Xoay, phóng to, khám phá mô hình khoa học</p>
            </div>
          </div>
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition min-h-[36px] flex items-center gap-1.5 ${
                  filter === c.key ? 'bg-cyan-600 text-white' : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-900/60'
                }`}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Model grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-cyan-400 py-8">Chưa có mô hình nào cho danh mục này.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filtered.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setActiveModel(model)}
                  className="text-left p-3 rounded-xl bg-cyan-900/30 border border-cyan-800/30 hover:bg-cyan-900/50 hover:border-cyan-600/50 transition group min-h-[44px]"
                >
                  <div className="w-full aspect-square rounded-lg bg-cyan-900/40 flex items-center justify-center mb-2">
                    {model.thumbnail_url ? (
                      <img src={model.thumbnail_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Globe className="w-8 h-8 text-cyan-500 group-hover:text-cyan-300 transition" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm text-white group-hover:text-cyan-200 transition truncate">
                    {model.title}
                  </h3>
                  <p className="text-xs text-cyan-400 mt-0.5">{model.category}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DialogFrame>
  );
}
