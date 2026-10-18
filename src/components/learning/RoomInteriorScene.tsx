/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BuildingId } from '../../types/game.ts';
import { sound } from '../../utils/audio.ts';
import { Check, Sparkles, Volume2 } from 'lucide-react';

export interface RoomInteriorSceneProps {
  roomId: BuildingId;
  subtitle?: string;
  activeStationId?: string;
  onSelectStation?: (stationId: string) => void;
  completedStations?: string[];
  npcDialogue?: string;
  onNpcClick?: () => void;
}

export const RoomInteriorScene: React.FC<RoomInteriorSceneProps> = ({
  roomId,
  subtitle,
  activeStationId,
  onSelectStation,
  completedStations = [],
  npcDialogue,
  onNpcClick,
}) => {
  const [lampOn, setLampOn] = useState(true);
  const [activeNpcBubble, setActiveNpcBubble] = useState<string | null>(null);

  const handleStationClick = (id: string) => {
    sound.playInteract();
    if (onSelectStation) {
      onSelectStation(id);
    }
  };

  const handleNpcInteract = (fallbackMsg: string) => {
    sound.playClick();
    setActiveNpcBubble((prev) => (prev ? null : (npcDialogue || fallbackMsg)));
    if (onNpcClick) {
      onNpcClick();
    }
  };

  return (
    <div className="relative w-full h-40 sm:h-48 overflow-hidden border-b border-slate-800 bg-slate-950 select-none">
      {/* 1. STEM LAB INTERIOR */}
      {roomId === 'stem_lab' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#042F2E] via-[#0F172A] to-[#042F2E] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Blueprint Grid Background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#14B8A6_1px,transparent_1px),linear-gradient(to_bottom,#14B8A6_1px,transparent_1px)] bg-[size:24px_24px]" />
          
          {/* Left Station: Chemical Reagents & Glassware Station */}
          <div className="relative z-10 flex items-end gap-2 sm:gap-3">
            {/* Reagents Locker */}
            <div 
              onClick={() => handleStationClick('litmus')}
              className={`w-16 sm:w-20 h-32 sm:h-36 bg-slate-900 border-2 rounded-t-lg p-1.5 flex flex-col justify-between shadow-lg cursor-pointer transition-all ${
                activeStationId === 'litmus' ? 'border-teal-400 ring-2 ring-teal-400/50 scale-[1.02]' : 'border-teal-700/60 hover:border-teal-500'
              }`}
              title="Kho Hóa Chất & Giấy Quỳ"
            >
              <div className="flex items-center justify-between border-b border-teal-800 pb-0.5">
                <span className="text-[7.5px] font-mono font-bold text-teal-400">KHO HÓA CHẤT</span>
                {completedStations.includes('litmus') && (
                  <span className="w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center text-[7px] text-white">✓</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1 py-1">
                <div className="h-4 bg-rose-600/90 rounded text-[7px] text-white flex items-center justify-center font-bold font-mono">HCl</div>
                <div className="h-4 bg-blue-600/90 rounded text-[7px] text-white flex items-center justify-center font-bold font-mono">NaOH</div>
                <div className="h-4 bg-purple-600/90 rounded text-[7px] text-white flex items-center justify-center font-bold font-mono">CuSO₄</div>
                <div className="h-4 bg-emerald-600/90 rounded text-[7px] text-white flex items-center justify-center font-bold font-mono">H₂O</div>
              </div>
              <div className="text-[7px] font-bold text-center text-teal-300 bg-teal-950/80 py-0.5 rounded border border-teal-800">
                1. Axit / Bazơ
              </div>
            </div>

            {/* Chemistry Lab Workbench (Litmus) */}
            <button
              type="button"
              onClick={() => handleStationClick('litmus')}
              className={`relative text-left w-28 sm:w-36 h-24 sm:h-28 bg-teal-950 border-t-4 border-l-2 border-r-2 rounded-t-md p-2 flex flex-col justify-between shadow-inner transition-all cursor-pointer ${
                activeStationId === 'litmus' ? 'border-teal-300 ring-2 ring-teal-400/40' : 'border-teal-600/70 hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-between text-[8px] font-bold text-teal-300">
                <span>BÀN HÓA HỌC</span>
                {completedStations.includes('litmus') && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
              {/* Test tubes rack & Flask with bubbles */}
              <div className="flex items-end justify-around pb-1">
                <div className="flex items-end gap-1">
                  <div className="w-2.5 h-8 bg-rose-500/80 rounded-t-sm border border-white/40 animate-pulse" />
                  <div className="w-2.5 h-10 bg-blue-500/80 rounded-t-sm border border-white/40" />
                  <div className="w-2.5 h-7 bg-purple-400/80 rounded-t-sm border border-white/40" />
                </div>
                <div className="relative w-8 h-10 flex flex-col items-center">
                  <div className="w-2 h-3 bg-teal-300/60 border border-white/60" />
                  <div className="w-7 h-7 bg-gradient-to-t from-emerald-500 to-teal-300/60 rounded-b-xl border border-white/50 flex items-center justify-center text-[11px]">
                    ⚗️
                  </div>
                </div>
              </div>
              <div className="text-[7.5px] text-teal-200 text-center bg-teal-900/60 py-0.5 rounded">
                Thử Giấy Quỳ
              </div>
            </button>
          </div>

          {/* Center: Circuit Station Workbench or Interactive Screen */}
          <div className="relative z-10 flex flex-col items-center mb-1">
            {/* NPC Speech bubble */}
            {activeNpcBubble && (
              <div className="absolute -top-12 z-30 max-w-xs bg-slate-900 text-teal-200 border border-teal-400 px-3 py-1.5 rounded-xl shadow-xl text-[10px] text-center animate-in zoom-in-95 duration-150">
                {activeNpcBubble}
              </div>
            )}

            {/* Circuit Workbench */}
            <button
              type="button"
              onClick={() => handleStationClick('circuit')}
              className={`w-32 sm:w-44 h-22 sm:h-26 bg-slate-900/90 border-t-4 border-l-2 border-r-2 rounded-t-xl px-2 py-1.5 flex flex-col justify-between shadow-xl transition-all cursor-pointer ${
                activeStationId === 'circuit' ? 'border-amber-400 ring-2 ring-amber-400/40 bg-slate-900' : 'border-slate-700 hover:border-amber-400/70'
              }`}
            >
              <div className="flex items-center justify-between text-[8px] font-bold text-amber-300">
                <span>2. BÀN MẠCH ĐIỆN VẬT LÝ</span>
                {completedStations.includes('circuit') && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center text-xs">🔋</div>
                <div className="w-8 h-1 bg-amber-400/80 rounded animate-pulse" />
                <div className="text-base animate-bounce duration-1000">💡</div>
              </div>
              <div className="text-[8px] text-amber-200 font-mono text-center bg-amber-950/60 py-0.5 rounded">
                Khóa K & Đèn Sáng
              </div>
            </button>
          </div>

          {/* Right: Microscope Station & Robot STEM-E */}
          <div className="relative z-10 flex items-end gap-2 sm:gap-3">
            {/* Microscope Workbench */}
            <button
              type="button"
              onClick={() => handleStationClick('microscope')}
              className={`w-26 sm:w-32 h-24 sm:h-28 bg-slate-900 border-t-4 border-l-2 border-r-2 rounded-t-md p-2 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
                activeStationId === 'microscope' ? 'border-teal-400 ring-2 ring-teal-400/40' : 'border-teal-700 hover:border-teal-400'
              }`}
            >
              <div className="flex items-center justify-between text-[8px] font-bold text-teal-300">
                <span>3. KÍNH HIỂN VI</span>
                {completedStations.includes('microscope') && <Check className="w-3 h-3 text-emerald-400" />}
              </div>
              <div className="flex items-center justify-center text-2xl py-0.5">🔬</div>
              <div className="text-[7.5px] text-teal-200 text-center bg-teal-950/80 py-0.5 rounded font-mono">
                Tế Bào Lục Lạp
              </div>
            </button>

            {/* Friendly Robot STEM-E */}
            <div 
              onClick={() => handleNpcInteract("STEM-E: 'Tôi là trợ lý nghiên cứu! Bạn hãy nhấp vào các bàn thí nghiệm để khám phá bí ẩn KHTN nhé!'")}
              className="flex flex-col items-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Nhấp để trò chuyện với Robot STEM-E"
            >
              <div className="px-1.5 py-0.5 bg-teal-400 text-slate-950 font-bold text-[7.5px] rounded-full mb-1 shadow animate-pulse flex items-center gap-0.5">
                <span>STEM-E</span>
                <Sparkles className="w-2 h-2" />
              </div>
              <div className="w-10 sm:w-11 h-10 sm:h-11 bg-slate-800 border-2 border-teal-400 rounded-lg flex flex-col items-center justify-center shadow-lg">
                <div className="w-1.5 h-2 bg-amber-400 rounded-full animate-ping" />
                <div className="flex gap-1 mt-0.5">
                  <div className="w-2 h-1 bg-cyan-400 rounded-full" />
                  <div className="w-2 h-1 bg-cyan-400 rounded-full" />
                </div>
              </div>
              <div className="w-12 h-3 bg-slate-700 rounded-full mt-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* 2. LIBRARY INTERIOR */}
      {roomId === 'library' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#1E1B4B] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Wood Parquet Texture */}
          <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(45deg,#78350F_0,#78350F_2px,transparent_2px,transparent_14px)]" />

          {/* Left: Giant Floor-to-Ceiling Bookshelves with 3 Subjects */}
          <div className="relative z-10 flex items-end gap-2">
            {/* Subject Shelves Selector */}
            <div className="w-36 sm:w-44 h-32 sm:h-38 bg-[#451A03] border-t-4 border-r-4 border-[#78350F] rounded-tr-xl p-2 flex flex-col justify-between shadow-2xl">
              <div className="text-[8px] font-bold text-amber-300 uppercase tracking-widest text-center border-b border-amber-900 pb-0.5">
                KỆ SÁCH KHTN THCS
              </div>
              
              {/* Row 1: Vật lý */}
              <button
                type="button"
                onClick={() => handleStationClick('optics_law')}
                className={`flex items-center justify-between px-1.5 py-1 rounded text-left transition cursor-pointer ${
                  activeStationId === 'optics_law' ? 'bg-amber-600/40 border border-amber-400' : 'hover:bg-amber-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">💡</span>
                  <span className="text-[8px] font-bold text-amber-200">1. Vật lý 7 (Quang học)</span>
                </div>
                {completedStations.includes('optics_law') && <Check className="w-2.5 h-2.5 text-emerald-400" />}
              </button>

              {/* Row 2: Hóa học */}
              <button
                type="button"
                onClick={() => handleStationClick('atom_periodic')}
                className={`flex items-center justify-between px-1.5 py-1 rounded text-left transition cursor-pointer ${
                  activeStationId === 'atom_periodic' ? 'bg-amber-600/40 border border-amber-400' : 'hover:bg-amber-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">⚛️</span>
                  <span className="text-[8px] font-bold text-amber-200">2. Hóa học 7 (Nguyên tử)</span>
                </div>
                {completedStations.includes('atom_periodic') && <Check className="w-2.5 h-2.5 text-emerald-400" />}
              </button>

              {/* Row 3: Sinh học */}
              <button
                type="button"
                onClick={() => handleStationClick('plant_cell_photosynthesis')}
                className={`flex items-center justify-between px-1.5 py-1 rounded text-left transition cursor-pointer ${
                  activeStationId === 'plant_cell_photosynthesis' ? 'bg-amber-600/40 border border-amber-400' : 'hover:bg-amber-900/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🧬</span>
                  <span className="text-[8px] font-bold text-amber-200">3. Sinh học (Tế bào)</span>
                </div>
                {completedStations.includes('plant_cell_photosynthesis') && <Check className="w-2.5 h-2.5 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* Center: Warm Reading Table with Banker's Brass Lamp */}
          <div className="relative z-10 flex flex-col items-center">
            {/* NPC Speech bubble */}
            {activeNpcBubble && (
              <div className="absolute -top-10 z-30 max-w-xs bg-amber-950 text-amber-200 border border-amber-400 px-3 py-1.5 rounded-xl shadow-xl text-[10px] text-center animate-in zoom-in-95 duration-150">
                {activeNpcBubble}
              </div>
            )}

            {/* Banker's Lamp (Clickable Toggle) */}
            <div 
              onClick={() => {
                sound.playClick();
                setLampOn(!lampOn);
              }}
              className="flex flex-col items-center mb-1 cursor-pointer transition-transform hover:scale-105 active:scale-95"
              title="Nhấp để bật / tắt đèn bàn Banker's Lamp"
            >
              <div className={`w-8 h-3.5 rounded-t-full border transition-all ${
                lampOn 
                  ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]' 
                  : 'bg-emerald-950 border-emerald-900 opacity-60'
              }`} />
              <div className="w-1 h-3.5 bg-amber-400" />
              <div className="w-4 h-1 bg-amber-500 rounded" />
            </div>

            {/* Reading Desk Center Plaque */}
            <div className="px-4 py-1.5 bg-[#451A03]/90 border border-amber-500/70 rounded-xl shadow-lg text-center backdrop-blur-sm">
              <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5 justify-center">
                <span>📖 KHÔNG GIAN ĐỌC & TỰ HỌC</span>
              </div>
              <div className="text-[10px] text-amber-300/80 mt-0.5">
                {subtitle || 'Chọn bài học bên dưới để nghiên cứu lý thuyết & làm bài tập'}
              </div>
            </div>
          </div>

          {/* Right: Librarian Desk & NPC Madam Lan */}
          <div className="relative z-10 flex items-end gap-2">
            <div 
              onClick={() => handleNpcInteract("Cô Lan (Thủ Thư): 'Chào em! Đọc hết mỗi bài học và trả lời đúng câu hỏi sẽ giúp em nhận +80 XP và tăng bậc học thuật!'")}
              className="w-28 sm:w-36 h-24 sm:h-28 bg-[#78350F] border-t-4 border-[#B45309] rounded-t-lg p-2 flex flex-col justify-between shadow-xl cursor-pointer hover:border-amber-300 transition-all"
              title="Nhấp để trò chuyện với Cô Lan Thủ Thư"
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-amber-300">CÔ THỦ THƯ LAN</span>
                <span className="text-base animate-bounce">👩‍🏫</span>
              </div>
              <div className="text-[7.5px] text-amber-100 bg-amber-950/80 p-1 rounded border border-amber-700/80 text-center">
                Mượn sách KHTN 24/7
              </div>
              <div className="text-[7px] text-amber-300/80 text-center">Nhấp để nghe hướng dẫn</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. QUIZ ARCADE INTERIOR */}
      {roomId === 'quiz_arcade' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#2E1065] via-[#1E1B4B] to-[#0F172A] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Neon Floor Grid */}
          <div className="absolute inset-0 opacity-25 bg-[linear-gradient(to_right,#EC4899_1px,transparent_1px),linear-gradient(to_bottom,#8B5CF6_1px,transparent_1px)] bg-[size:28px_28px]" />

          {/* Left Arcade Machines Cabinet */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-20 sm:w-26 h-34 sm:h-38 bg-slate-900 border-2 border-purple-500 rounded-t-xl p-1.5 flex flex-col justify-between shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              <div className="text-[8px] font-bold text-purple-300 text-center bg-purple-950 py-0.5 rounded border border-purple-600">
                ARCADE 01
              </div>
              {/* Glowing CRT Screen */}
              <div className="h-12 bg-slate-950 border border-cyan-400 rounded flex flex-col items-center justify-center text-cyan-300 font-mono text-[9px] animate-pulse">
                <span>⚡ QUIZ ARENA</span>
                <span className="text-[7px] text-pink-400">CREDIT: 99</span>
              </div>
              {/* Glowing Arcade Push Buttons */}
              <div className="flex items-center justify-around pb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>

            <div className="hidden sm:flex flex-col justify-end w-16 h-26 bg-slate-900 border-2 border-pink-500/70 rounded-t-xl p-1 shadow-lg">
              <div className="text-[7px] text-pink-300 text-center font-bold">ARCADE 02</div>
              <div className="h-10 bg-black rounded flex items-center justify-center text-pink-400 text-sm">
                👾
              </div>
            </div>
          </div>

          {/* Center Arena Neon Board */}
          <div className="relative z-10 flex flex-col items-center mb-1">
            <div className="px-4 py-1.5 bg-purple-950/90 border-2 border-purple-400 rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.5)] text-center backdrop-blur-sm">
              <div className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-300 to-cyan-300 tracking-wider flex items-center gap-1.5 justify-center">
                <span>⚡ ĐẤU TRƯỜNG TƯ DUY PHẢN XẠ KHTN</span>
              </div>
              <div className="text-[10px] text-purple-200 mt-0.5">
                {subtitle || 'Trả lời nhanh · Giữ chuỗi combo · Tích lũy EduPoints'}
              </div>
            </div>
          </div>

          {/* Right: High Score Leaderboard Marquee */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-28 sm:w-36 h-28 sm:h-32 bg-slate-900 border-2 border-cyan-500 rounded-t-xl p-2 flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <div className="text-[8px] font-bold text-cyan-300 text-center border-b border-cyan-800 pb-0.5">
                TOP CAO THỦ ARCADE
              </div>
              <div className="space-y-1 font-mono text-[8px] text-slate-300">
                <div className="flex justify-between text-amber-300">
                  <span>1. Minh Khang</span>
                  <span>950</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>2. Phương Thảo</span>
                  <span>820</span>
                </div>
                <div className="flex justify-between text-amber-600">
                  <span>3. Tuấn Kiệt</span>
                  <span>780</span>
                </div>
              </div>
              <div className="text-[7.5px] text-cyan-400 text-center font-bold">READY PLAYER ONE</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. REVIEW STATION INTERIOR */}
      {roomId === 'review_station' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#431407] via-[#1C1917] to-[#0F172A] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Pegboard Background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#F97316_1px,transparent_1px),linear-gradient(to_bottom,#EA580C_1px,transparent_1px)] bg-[size:20px_20px]" />

          {/* Left: Tool Pegboard & Repair Bench */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-32 sm:w-40 h-28 sm:h-32 bg-[#292524] border-2 border-[#78350F] rounded-t-xl p-2 flex flex-col justify-between shadow-xl">
              <div className="text-[8px] font-bold text-orange-400 text-center border-b border-orange-950 pb-0.5">
                BẢNG TREO CÔNG CỤ SỬA LỖI
              </div>
              <div className="flex items-center justify-around text-lg py-1">
                <span title="Cờ lê">🔧</span>
                <span title="Búa sửa chữa">🔨</span>
                <span title="Tua vít">🪛</span>
                <span title="Nam châm">🧲</span>
              </div>
              <div className="h-5 bg-orange-950/80 rounded border border-orange-800 flex items-center justify-center text-[8px] text-orange-200">
                Hộp linh kiện & sơ đồ giải thích
              </div>
            </div>
          </div>

          {/* Center: Diagnostic Screen */}
          <div className="relative z-10 flex flex-col items-center mb-1">
            <div className="px-4 py-1.5 bg-[#451A03]/90 border border-orange-500/70 rounded-xl shadow-lg text-center backdrop-blur-sm">
              <div className="text-xs font-bold text-orange-200 flex items-center gap-1.5 justify-center">
                <span>🛠️ TRẠM CHẨN ĐOÁN & CỨU NGUY KIẾN THỨC</span>
              </div>
              <div className="text-[10px] text-orange-300/80 mt-0.5">
                {subtitle || 'Xem lại những câu trả lời chưa đúng · Hiểu bản chất · Làm lại nhận điểm'}
              </div>
            </div>
          </div>

          {/* Right: Blueprint Drafting Table */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-28 sm:w-36 h-22 sm:h-26 bg-[#1C1917] border-t-4 border-orange-600 rounded-t-md p-1.5 flex flex-col justify-between shadow-lg">
              <div className="text-[8px] font-mono text-cyan-400 text-center border-b border-slate-700 pb-0.5">
                BẢN VẼ GIẢI THÍCH
              </div>
              <div className="p-1 bg-cyan-950/60 rounded border border-cyan-800 text-[8px] text-cyan-200 font-mono text-center">
                Δ = Đúng - Sai
              </div>
              <div className="text-[7.5px] text-slate-400 text-center">Sửa 1 lỗi = +60 XP</div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SCHOOL INTERIOR */}
      {roomId === 'school' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#1E3A8A] via-[#0F172A] to-[#1E293B] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Classroom Background */}
          <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#3B82F6_1px,transparent_1px),linear-gradient(to_bottom,#1D4ED8_1px,transparent_1px)] bg-[size:24px_24px]" />

          {/* Left: Classic Green Chalkboard with Formulas */}
          <div className="relative z-10 w-36 sm:w-48 h-28 sm:h-32 bg-[#14532D] border-4 border-[#78350F] rounded-md p-1.5 flex flex-col justify-between shadow-2xl">
            <div className="text-[8px] font-bold text-emerald-200 text-center border-b border-emerald-700/60 pb-0.5">
              BẢNG LỚP HỌC KHTN
            </div>
            <div className="font-mono text-[8px] text-emerald-100 space-y-0.5 py-1">
              <div>• F = m · a</div>
              <div>• v = s / t</div>
              <div>• 2H₂ + O₂ → 2H₂O</div>
            </div>
            <div className="text-[7px] text-emerald-300 text-right">Khăn quàng đỏ sẵn sàng!</div>
          </div>

          {/* Center: School Crest Banner */}
          <div className="relative z-10 flex flex-col items-center mb-1">
            <div className="px-4 py-1.5 bg-blue-950/90 border border-blue-400/70 rounded-xl shadow-lg text-center backdrop-blur-sm">
              <div className="text-xs font-bold text-blue-200 flex items-center gap-1.5 justify-center">
                <span>🏫 VĂN PHÒNG ĐOÀN ĐỘI & BẢNG NHIỆM VỤ</span>
              </div>
              <div className="text-[10px] text-blue-300/80 mt-0.5">
                {subtitle || 'Nhận nhiệm vụ học tập · Theo dõi xếp hạng lớp · Nhận thưởng hàng ngày'}
              </div>
            </div>
          </div>

          {/* Right: Teacher's Desk & School Bulletin */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-28 sm:w-36 h-22 sm:h-26 bg-[#78350F] border-t-4 border-[#B45309] rounded-t-md p-1.5 flex flex-col justify-between shadow-xl">
              <div className="text-[8px] font-bold text-amber-300 text-center border-b border-amber-900 pb-0.5">
                BÀN THẦY CÔ GIÁO
              </div>
              <div className="flex items-center justify-around text-base">
                <span title="Quả địa cầu">🌍</span>
                <span title="Sổ điểm">📒</span>
                <span title="Cúp thi đua">🎖️</span>
              </div>
              <div className="text-[7.5px] text-amber-200 text-center font-mono">LỚP HỌC THÂN THIỆN</div>
            </div>
          </div>
        </div>
      )}

      {/* 6. ACHIEVEMENT PLAZA INTERIOR */}
      {roomId === 'achievement_plaza' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#78350F] via-[#1E1B4B] to-[#0F172A] flex items-end justify-between px-3 sm:px-6 pb-2">
          {/* Marble Column Background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#F59E0B_1px,transparent_1px),linear-gradient(to_bottom,#D97706_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Left: Medal Showcase Cabinet */}
          <div className="relative z-10 w-32 sm:w-40 h-28 sm:h-32 bg-[#451A03] border-2 border-[#F59E0B] rounded-t-xl p-2 flex flex-col justify-between shadow-2xl">
            <div className="text-[8px] font-bold text-amber-300 text-center border-b border-amber-900 pb-0.5">
              TỦ HUY HIỆU VINH DANH
            </div>
            <div className="grid grid-cols-3 gap-1 text-center text-sm py-1">
              <span>🥇</span>
              <span>⭐</span>
              <span>🧪</span>
              <span>⚡</span>
              <span>📚</span>
              <span>🎖️</span>
            </div>
            <div className="text-[7.5px] text-amber-400 text-center font-mono">BỘ SƯU TẬP HUY HIỆU</div>
          </div>

          {/* Center: Grand Gold Trophy on Podium with Glint */}
          <div className="relative z-10 flex flex-col items-center mb-1">
            <div className="text-2xl animate-bounce duration-1000 mb-0.5">🏆</div>
            <div className="px-4 py-1.5 bg-amber-950/90 border border-amber-400 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] text-center backdrop-blur-sm">
              <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5 justify-center">
                <span>🏆 QUẢNG TRƯỜNG VINH DANH THÀNH TỰU</span>
              </div>
              <div className="text-[10px] text-amber-300/80 mt-0.5">
                {subtitle || 'Bảng vinh danh cấp độ · Tủ trưng bày huy hiệu KHTN · Tùy chỉnh trang phục'}
              </div>
            </div>
          </div>

          {/* Right: Hall of Fame Pedestal */}
          <div className="relative z-10 flex items-end gap-2">
            <div className="w-28 sm:w-36 h-22 sm:h-26 bg-[#78350F] border-t-4 border-[#FBBF24] rounded-t-md p-1.5 flex flex-col justify-between shadow-xl">
              <div className="text-[8px] font-bold text-amber-300 text-center border-b border-amber-900 pb-0.5">
                BỤC VINH DANH
              </div>
              <div className="text-center font-mono text-[9px] text-amber-200 font-bold">
                HỌC SINH XUẤT SẮC
              </div>
              <div className="text-[7.5px] text-amber-400/90 text-center">Tự hào THCS EDUVERSE</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
