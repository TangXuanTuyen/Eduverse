/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CharacterConfig, Direction, PlayerProgress } from '@/types/game';
import { PixelAvatar } from './PixelAvatar';
import { DialogFrame } from '@/components/ui/DialogFrame';
import { sound } from '@/lib/audio';
import {
  Sparkles,
  Check,
  RotateCw,
  Play,
  Pause,
  Lock,
  User,
  GraduationCap,
  Shirt,
  Sparkle,
  ArrowRight,
} from 'lucide-react';

interface CharacterSelectionProps {
  initialConfig: CharacterConfig;
  progress: PlayerProgress;
  onConfirm: (config: CharacterConfig) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const PRESETS: { name: string; desc: string; config: Partial<CharacterConfig> }[] = [
  {
    name: 'Nam sinh THCS',
    desc: 'Chăm chỉ, khăn quàng đỏ chỉnh tề',
    config: {
      gender: 'boy',
      hairStyle: 'short_classic',
      hairColor: '#1E293B',
      skinTone: '#FDE047',
      eyeColor: '#0F172A',
      outfit: 'thcs_uniform',
      outfitColor: '#2563EB',
      accessory: 'glasses',
    },
  },
  {
    name: 'Nữ sinh thông thái',
    desc: 'Năng động, tóc đuôi ngựa cá tính',
    config: {
      gender: 'girl',
      hairStyle: 'ponytail',
      hairColor: '#451A03',
      skinTone: '#FEF08A',
      eyeColor: '#1E293B',
      outfit: 'thcs_uniform',
      outfitColor: '#DB2777',
      accessory: 'none',
    },
  },
  {
    name: 'Nhà khoa học nhí',
    desc: 'Yêu thích hóa học và chế tạo STEM',
    config: {
      gender: 'neutral',
      hairStyle: 'curly',
      hairColor: '#0284C7',
      skinTone: '#FCD34D',
      eyeColor: '#0369A1',
      outfit: 'stem_coat',
      outfitColor: '#0D9488',
      accessory: 'glasses',
    },
  },
  {
    name: 'Vận động viên KHTN',
    desc: 'Nhanh nhẹn, mê khám phá vũ trụ',
    config: {
      gender: 'boy',
      hairStyle: 'spiky',
      hairColor: '#D97706',
      skinTone: '#FDBA74',
      eyeColor: '#1E293B',
      outfit: 'sport',
      outfitColor: '#10B981',
      accessory: 'headphones',
    },
  },
];

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  initialConfig,
  progress,
  onConfirm,
  onCancel,
  isEditing = false,
}) => {
  const [config, setConfig] = useState<CharacterConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'hair' | 'outfit' | 'skin' | 'accessory'>('hair');
  const [direction, setDirection] = useState<Direction>('down');
  const [isWalking, setIsWalking] = useState(true);
  const [stepFrame, setStepFrame] = useState(0);

  // Walk animation ticker for preview
  useEffect(() => {
    if (!isWalking) return;
    const interval = setInterval(() => {
      setStepFrame((prev) => (prev + 1) % 3);
    }, 250);
    return () => clearInterval(interval);
  }, [isWalking]);

  const rotateDirection = () => {
    sound.playClick();
    const order: Direction[] = ['down', 'left', 'up', 'right'];
    const idx = order.indexOf(direction);
    setDirection(order[(idx + 1) % order.length]);
  };

  const handleApplyPreset = (presetConfig: Partial<CharacterConfig>) => {
    sound.playClick();
    setConfig((prev) => ({
      ...prev,
      ...presetConfig,
    }));
  };

  const handleConfirm = () => {
    sound.playSuccess();
    onConfirm(config);
  };

  const hairStyles = [
    { id: 'short_classic', label: 'Ngắn Thư Sinh' },
    { id: 'spiky', label: 'Vuốt Cá Tính' },
    { id: 'ponytail', label: 'Đuôi Ngựa' },
    { id: 'bob', label: 'Tóc Bob Ngắn' },
    { id: 'curly', label: 'Xoăn Bồng Bềnh' },
    { id: 'wavy', label: 'Tóc Gợn Sóng' },
  ];

  const hairColors = [
    { id: '#1E293B', label: 'Đen Tuyền' },
    { id: '#451A03', label: 'Nâu Hạt Dẻ' },
    { id: '#D97706', label: 'Vàng Nâu' },
    { id: '#2563EB', label: 'Xanh Lam Neon' },
    { id: '#DC2626', label: 'Đỏ Hung' },
    { id: '#94A3B8', label: 'Bạch Kim' },
  ];

  const skinTones = [
    { id: '#FEF08A', label: 'Trắng Sáng' },
    { id: '#FCD34D', label: 'Tự Nhiên' },
    { id: '#FDBA74', label: 'Khỏe Khoắn' },
    { id: '#D97706', label: 'Bánh Mật' },
  ];

  const eyeColors = [
    { id: '#0F172A', label: 'Đen Láy' },
    { id: '#451A03', label: 'Nâu Đen' },
    { id: '#0284C7', label: 'Xanh Dương' },
    { id: '#059669', label: 'Xanh Ngọc' },
  ];

  const outfits = [
    {
      id: 'thcs_uniform',
      label: 'Đồng Phục THCS',
      desc: 'Áo trắng, quần than, khăn quàng đỏ',
      unlocked: true,
    },
    {
      id: 'sport',
      label: 'Bộ Thể Thao Năng Động',
      desc: 'Thoải mái tham gia hoạt động ngoại khóa',
      unlocked: true,
    },
    {
      id: 'hoodie',
      label: 'Áo Hoodie Hiện Đại',
      desc: 'Mở khóa khi đạt Cấp 2',
      unlocked: progress.level >= 2,
      requirement: 'Đạt Cấp 2',
    },
    {
      id: 'stem_coat',
      label: 'Áo Blouse STEM Cấp Cao',
      desc: 'Mở khóa khi thực hiện 1 thí nghiệm STEM',
      unlocked: progress.experimentsCompleted.length >= 1,
      requirement: 'Hoàn thành 1 thí nghiệm tại STEM Lab',
    },
    {
      id: 'astronaut',
      label: 'Bộ Thám Hiểm Vũ Trụ',
      desc: 'Mở khóa khi đạt Cấp 4',
      unlocked: progress.level >= 4,
      requirement: 'Đạt Cấp 4',
    },
  ];

  const outfitColors = [
    { id: '#3B82F6', label: 'Xanh Lam' },
    { id: '#10B981', label: 'Xanh Lá' },
    { id: '#8B5CF6', label: 'Tím Neon' },
    { id: '#EF4444', label: 'Đỏ Thắm' },
    { id: '#F59E0B', label: 'Vàng Cam' },
    { id: '#0F172A', label: 'Đen Than' },
  ];

  const accessories = [
    { id: 'none', label: 'Không Có', unlocked: true },
    { id: 'glasses', label: 'Kính Cận Tri Thức', desc: 'Dành cho mọt sách', unlocked: true },
    { id: 'headphones', label: 'Tai Nghe Công Nghệ', desc: 'Âm nhạc kích thích tư duy', unlocked: true },
    { id: 'cap', label: 'Mũ Snapback', desc: 'Năng động ngoài trời', unlocked: true },
    {
      id: 'vr_headset',
      label: 'Kính Cyber VR',
      desc: 'Phần thưởng tham gia Quiz Arcade',
      unlocked: progress.quizzesCompleted >= 1,
      requirement: 'Chơi 1 ván Quiz Arcade',
    },
    {
      id: 'backpack',
      label: 'Balo Khám Phá',
      desc: 'Hành trang thám hiểm thế giới',
      unlocked: progress.level >= 3,
      requirement: 'Đạt Cấp độ 3',
    },
    {
      id: 'science_badge',
      label: 'Huy Hiệu Sao Khoa Học',
      desc: 'Sửa lỗi sai tại Review Station',
      unlocked: progress.mistakes.some((m) => m.reviewed),
      requirement: 'Sửa 1 lỗi sai tại Trạm Sửa Lỗi',
    },
  ];

  return (
    <DialogFrame onClose={isEditing ? onCancel : undefined} label={isEditing ? 'Tùy chỉnh diện mạo nhân vật' : 'Tạo nhân vật EDUVERSE'} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-2xl shadow-indigo-950/50 text-slate-100 flex flex-col md:flex-row overflow-hidden my-auto max-h-[92vh]">
        {/* LEFT COLUMN: LIVE AVATAR PREVIEW STAGE */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-900 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div className="text-center w-full">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isEditing ? 'TÙY CHỈNH DIỆN MẠO' : 'TẠO NHÂN VẬT EDUVERSE'}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">
              {config.name || 'Học Sinh EDUVERSE'}
            </h2>
            <p className="text-xs text-indigo-300/80 font-medium">{config.className}</p>
          </div>

          {/* AVATAR PEDESTAL PREVIEW */}
          <div className="relative my-6 flex flex-col items-center">
            {/* Ambient Spotlight */}
            <div className="absolute w-44 h-44 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />

            {/* Pedestal Stage */}
            <div className="relative p-6 bg-slate-800/80 rounded-2xl border border-slate-700/80 shadow-inner flex flex-col items-center justify-center min-w-[200px] min-h-[200px]">
              <PixelAvatar
                config={config}
                direction={direction}
                isWalking={isWalking}
                stepFrame={stepFrame}
                size={120}
              />

              {/* Direction Indicator */}
              <div className="mt-3 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Hướng: {direction === 'down' ? 'Nhìn Thẳng' : direction === 'up' ? 'Sau Lưng' : direction === 'left' ? 'Quay Trái' : 'Quay Phải'}
              </div>
            </div>

            {/* Preview Controls (Rotate / Toggle Walk) */}
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={rotateDirection}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 transition active:scale-95 cursor-pointer"
                title="Xoay góc nhìn 4 hướng"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Xoay hướng</span>
              </button>

              <button
                type="button"
                onClick={() => setIsWalking(!isWalking)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition active:scale-95 cursor-pointer ${
                  isWalking
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Bật/Tắt hoạt ảnh bước đi"
              >
                {isWalking ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isWalking ? 'Đang bước đi' : 'Đứng yên'}</span>
              </button>
            </div>
          </div>

          {/* QUICK PRESETS */}
          <div className="w-full">
            <div className="text-[11px] text-slate-400 font-medium mb-2 uppercase tracking-wider">
              Gợi ý phong cách nhanh:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p.config)}
                  className="px-2.5 py-2 text-left bg-slate-800/70 hover:bg-indigo-900/40 border border-slate-700/70 hover:border-indigo-500/50 rounded-xl transition text-slate-200 hover:text-white cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-white group-hover:text-indigo-300">{p.name}</div>
                  <div className="text-[10px] text-slate-300 leading-snug mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED CUSTOMIZATION TABS */}
        <div className="w-full md:w-7/12 flex flex-col p-6 overflow-hidden">
          {/* STUDENT INFO HEADER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-400" /> Tên Học Sinh
              </label>
              <input
                type="text"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                placeholder="Nhập họ và tên..."
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                maxLength={25}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" /> Chi Đội / Lớp Học
              </label>
              <input
                type="text"
                value={config.className}
                onChange={(e) => setConfig({ ...config, className: e.target.value })}
                placeholder="Ví dụ: Lớp 7A1"
                className="w-full px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                maxLength={15}
              />
            </div>
          </div>

          {/* CUSTOMIZATION TABS */}
          <div className="flex border-b border-slate-800 gap-1 pb-2">
            {[
              { id: 'hair', label: 'Tóc & Kiểu Dáng', icon: Sparkle },
              { id: 'outfit', label: 'Trang Phục', icon: Shirt },
              { id: 'skin', label: 'Da & Mắt', icon: User },
              { id: 'accessory', label: 'Phụ Kiện', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id as typeof activeTab);
                  }}
                  className={`flex-1 py-2 px-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
            {/* TAB: HAIR */}
            {activeTab === 'hair' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Kiểu tóc 2D Pixel:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hairStyles.map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setConfig({ ...config, hairStyle: style.id });
                        }}
                        className={`p-2.5 text-xs text-left rounded-lg border transition cursor-pointer ${
                          config.hairStyle === style.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white font-semibold'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Màu tóc:
                  </h4>
                  <div className="flex flex-wrap gap-2.5">
                    {hairColors.map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setConfig({ ...config, hairColor: color.id });
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          config.hairColor === color.id
                            ? 'bg-slate-700 border-indigo-400 text-white'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: color.id }}
                        />
                        <span>{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: OUTFIT */}
            {activeTab === 'outfit' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Bộ trang phục (Mở khóa qua tiến độ học tập):
                  </h4>
                  <div className="space-y-2">
                    {outfits.map((item) => {
                      const isSelected = config.outfit === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!item.unlocked}
                          onClick={() => {
                            if (item.unlocked) {
                              sound.playClick();
                              setConfig({ ...config, outfit: item.id });
                            }
                          }}
                          className={`w-full p-3 text-left rounded-xl border flex items-center justify-between transition cursor-pointer ${
                            !item.unlocked
                              ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-2">
                              {item.label}
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            <div className="text-[11px] text-slate-400">{item.desc}</div>
                          </div>

                          {!item.unlocked && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                              <Lock className="w-3 h-3" />
                              <span>{item.requirement}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {config.outfit !== 'thcs_uniform' && config.outfit !== 'stem_coat' && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Màu áo chính:
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {outfitColors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setConfig({ ...config, outfitColor: color.id });
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            config.outfitColor === color.id
                              ? 'bg-slate-700 border-indigo-400 text-white'
                              : 'bg-slate-800/70 border-slate-700 text-slate-300'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full border border-white/30"
                            style={{ backgroundColor: color.id }}
                          />
                          <span>{color.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SKIN & EYES */}
            {activeTab === 'skin' && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Màu da nhân vật:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {skinTones.map((skin) => (
                      <button
                        key={skin.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setConfig({ ...config, skinTone: skin.id });
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                          config.skinTone === skin.id
                            ? 'bg-slate-700 border-indigo-400 text-white'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: skin.id }}
                        />
                        <span>{skin.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Màu mắt:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {eyeColors.map((eye) => (
                      <button
                        key={eye.id}
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setConfig({ ...config, eyeColor: eye.id });
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs transition cursor-pointer ${
                          config.eyeColor === eye.id
                            ? 'bg-slate-700 border-indigo-400 text-white'
                            : 'bg-slate-800/70 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: eye.id }}
                        />
                        <span>{eye.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ACCESSORIES */}
            {activeTab === 'accessory' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Phụ kiện đi kèm:
                  </h4>
                  <div className="space-y-2">
                    {accessories.map((acc) => {
                      const isSelected = config.accessory === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          disabled={!acc.unlocked}
                          onClick={() => {
                            if (acc.unlocked) {
                              sound.playClick();
                              setConfig({ ...config, accessory: acc.id });
                            }
                          }}
                          className={`w-full p-3 text-left rounded-xl border flex items-center justify-between transition cursor-pointer ${
                            !acc.unlocked
                              ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 text-white'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-xs flex items-center gap-2">
                              {acc.label}
                              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                            </div>
                            {acc.desc && <div className="text-[11px] text-slate-400">{acc.desc}</div>}
                          </div>

                          {!acc.unlocked && (
                            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                              <Lock className="w-3 h-3" />
                              <span>{acc.requirement}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            {onCancel && isEditing && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Hủy bỏ
              </button>
            )}

            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition transform active:scale-95 cursor-pointer"
            >
              <span>{isEditing ? 'Lưu Thay Đổi Nhân Vật' : 'Xác Nhận & Khám Phá EDUVERSE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </DialogFrame>
  );
};
