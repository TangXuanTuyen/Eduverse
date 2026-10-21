'use client';

import React, { useState, useCallback } from 'react';

type ComponentType = 'battery' | 'bulb' | 'switch' | 'wire';

interface CircuitComponent {
  id: string;
  type: ComponentType;
  slot: number;
}

const SLOTS = [
  { label: 'Vị trí 1', x: 80, y: 120 },
  { label: 'Vị trí 2', x: 240, y: 120 },
  { label: 'Vị trí 3', x: 240, y: 280 },
  { label: 'Vị trí 4', x: 80, y: 280 },
];

const PALETTE: { type: ComponentType; label: string; icon: string }[] = [
  { type: 'battery', label: 'Pin', icon: '🔋' },
  { type: 'bulb', label: 'Bóng đèn', icon: '💡' },
  { type: 'switch', label: 'Công tắc', icon: '🔘' },
  { type: 'wire', label: 'Dây dẫn', icon: '〰️' },
];

function checkCircuit(components: CircuitComponent[], switchOn: boolean) {
  const hasBattery = components.some((c) => c.type === 'battery');
  const hasBulb = components.some((c) => c.type === 'bulb');
  const allSlotsFilled = SLOTS.every((_, i) => components.some((c) => c.slot === i));
  const hasSwitch = components.some((c) => c.type === 'switch');
  const switchOk = !hasSwitch || switchOn;
  return { hasBattery, hasBulb, allSlotsFilled, complete: hasBattery && hasBulb && allSlotsFilled && switchOk };
}

export function SimpleCircuitExperiment({ onBack }: { onBack: () => void }) {
  const [components, setComponents] = useState<CircuitComponent[]>([]);
  const [switchOn, setSwitchOn] = useState(false);
  const [dragging, setDragging] = useState<ComponentType | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const circuit = checkCircuit(components, switchOn);

  const addToSlot = useCallback(
    (slotIndex: number) => {
      if (!dragging) return;
      setComponents((prev) => {
        const without = prev.filter((c) => c.slot !== slotIndex);
        return [...without, { id: `${dragging}_${slotIndex}`, type: dragging, slot: slotIndex }];
      });
      setDragging(null);
      setMessage(null);
    },
    [dragging]
  );

  const removeFromSlot = useCallback((slotIndex: number) => {
    setComponents((prev) => prev.filter((c) => c.slot !== slotIndex));
    setMessage(null);
  }, []);

  const reset = useCallback(() => {
    setComponents([]);
    setSwitchOn(false);
    setMessage(null);
  }, []);

  const testCircuit = useCallback(() => {
    if (!circuit.hasBattery) {
      setMessage('⚠️ Mạch chưa có pin — cần nguồn điện để tạo dòng điện.');
    } else if (!circuit.hasBulb) {
      setMessage('⚠️ Mạch chưa có bóng đèn — cần thiết bị tiêu thụ điện.');
    } else if (!circuit.allSlotsFilled) {
      setMessage('⚠️ Mạch hở — dòng điện không chạy được vì có chỗ đứt.');
    } else if (components.some((c) => c.type === 'switch') && !switchOn) {
      setMessage('💡 Mạch đã đủ nhưng công tắc đang tắt. Nhấn vào công tắc để bật!');
    } else {
      setMessage('🎉 Mạch kín! Dòng điện chạy từ cực (+) pin → dây dẫn → bóng đèn → dây dẫn → cực (−) pin. Đèn sáng!');
    }
  }, [circuit, components, switchOn]);

  const getSlotContent = (slotIndex: number) => {
    const comp = components.find((c) => c.slot === slotIndex);
    if (!comp) return null;
    return comp;
  };

  const renderComponent = (type: ComponentType, lit: boolean) => {
    switch (type) {
      case 'battery':
        return (
          <div className="flex flex-col items-center">
            <div className="w-12 h-7 bg-gradient-to-r from-red-500 to-slate-600 rounded border-2 border-slate-400 flex items-center justify-center text-[10px] text-white font-bold">
              <span className="text-red-200">+</span>
              <span className="mx-1">PIN</span>
              <span className="text-blue-200">−</span>
            </div>
          </div>
        );
      case 'bulb':
        return (
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-lg transition-all duration-500 ${
                lit
                  ? 'bg-yellow-300 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)]'
                  : 'bg-slate-700 border-slate-500'
              }`}
            >
              {lit ? '💡' : '⚫'}
            </div>
          </div>
        );
      case 'switch':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSwitchOn((p) => !p);
              setMessage(null);
            }}
            className={`w-12 h-7 rounded border-2 flex items-center justify-center text-xs font-bold transition min-h-[44px] ${
              switchOn
                ? 'bg-green-600 border-green-400 text-white'
                : 'bg-slate-700 border-slate-500 text-slate-300'
            }`}
          >
            {switchOn ? 'BẬT' : 'TẮT'}
          </button>
        );
      case 'wire':
        return (
          <div className="w-12 h-2 bg-amber-600 rounded-full border border-amber-500" />
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Info */}
      <div className="bg-orange-900/30 border border-orange-800/30 rounded-xl p-3">
        <h3 className="font-bold text-sm text-orange-200 mb-1">📖 Bài 22 — Mạch điện đơn giản</h3>
        <p className="text-xs text-orange-300/80">
          KHTN Lớp 8 · Chương V: Điện. Kéo linh kiện vào 4 vị trí trên mạch để tạo mạch kín. Mạch cần ít nhất: pin, bóng đèn, và dây nối đủ.
        </p>
      </div>

      {/* Palette */}
      <div className="flex gap-2 flex-wrap">
        {PALETTE.map((p) => (
          <button
            key={p.type}
            onClick={() => setDragging(dragging === p.type ? null : p.type)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition min-h-[44px] ${
              dragging === p.type
                ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                : 'bg-orange-900/40 text-orange-200 hover:bg-orange-900/60'
            }`}
          >
            <span>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {dragging && (
        <p className="text-xs text-orange-400 animate-pulse">
          Đã chọn {PALETTE.find((p) => p.type === dragging)?.label}. Nhấn vào vị trí trên mạch để đặt.
        </p>
      )}

      {/* Circuit board */}
      <div className="relative bg-slate-900/80 border border-slate-700 rounded-xl p-4 mx-auto" style={{ width: 340, height: 320 }}>
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 340 320">
          {[0, 1, 2, 3].map((i) => {
            const from = SLOTS[i];
            const to = SLOTS[(i + 1) % 4];
            const lit = circuit.complete;
            return (
              <line
                key={i}
                x1={from.x + 10}
                y1={from.y}
                x2={to.x + 10}
                y2={to.y}
                stroke={lit ? '#facc15' : '#475569'}
                strokeWidth={lit ? 3 : 2}
                strokeDasharray={lit ? undefined : '6 4'}
              />
            );
          })}
          {circuit.complete && (
            <>
              {[0, 1, 2, 3].map((i) => {
                const from = SLOTS[i];
                const to = SLOTS[(i + 1) % 4];
                const mx = (from.x + to.x) / 2 + 10;
                const my = (from.y + to.y) / 2;
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                return (
                  <g key={`arrow-${i}`} transform={`translate(${mx},${my}) rotate(${angle})`}>
                    <polygon points="-6,-4 6,0 -6,4" fill="#facc15" opacity={0.8}>
                      <animateTransform
                        attributeName="transform"
                        type="translate"
                        values={`${-len / 4},0;${len / 4},0;${-len / 4},0`}
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </polygon>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Slots */}
        {SLOTS.map((slot, i) => {
          const comp = getSlotContent(i);
          return (
            <button
              key={i}
              onClick={() => (comp && !dragging ? removeFromSlot(i) : addToSlot(i))}
              className={`absolute w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center transition ${
                comp
                  ? 'border-orange-500/60 bg-orange-950/40'
                  : dragging
                    ? 'border-orange-400 bg-orange-900/30 animate-pulse cursor-pointer'
                    : 'border-slate-600 bg-slate-800/50'
              }`}
              style={{ left: slot.x - 12, top: slot.y - 32 }}
              title={comp ? `${PALETTE.find((p) => p.type === comp.type)?.label} — nhấn để gỡ` : slot.label}
              aria-label={comp ? `Gỡ ${PALETTE.find((p) => p.type === comp.type)?.label} khỏi ${slot.label}` : `Đặt vào ${slot.label}`}
            >
              {comp ? renderComponent(comp.type, circuit.complete) : <span className="text-xs text-slate-500">{i + 1}</span>}
            </button>
          );
        })}

        {/* Center label */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className={`text-xs font-bold ${circuit.complete ? 'text-yellow-400' : 'text-slate-500'}`}>
            {circuit.complete ? '⚡ MẠCH KÍN' : 'MẠCH HỞ'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={testCircuit}
          className="flex-1 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition min-h-[44px]"
        >
          🔍 Kiểm tra mạch
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition min-h-[44px]"
        >
          🔄 Làm lại
        </button>
        <button
          onClick={onBack}
          className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition min-h-[44px]"
        >
          ← Quay lại
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-xl p-3 text-sm font-medium ${
            message.startsWith('🎉')
              ? 'bg-green-900/40 border border-green-700/50 text-green-200'
              : message.startsWith('💡')
                ? 'bg-blue-900/40 border border-blue-700/50 text-blue-200'
                : 'bg-amber-900/40 border border-amber-700/50 text-amber-200'
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      {/* Theory note */}
      <details className="bg-slate-800/50 border border-slate-700 rounded-xl">
        <summary className="px-3 py-2.5 text-sm font-medium text-slate-300 cursor-pointer min-h-[44px] flex items-center">
          📚 Kiến thức: Mạch điện đơn giản là gì?
        </summary>
        <div className="px-3 pb-3 text-xs text-slate-400 space-y-2">
          <p>
            <strong className="text-slate-300">Mạch điện</strong> gồm nguồn điện (pin), dây dẫn, thiết bị tiêu thụ (đèn, quạt…) và công tắc, nối với nhau thành vòng kín.
          </p>
          <p>
            <strong className="text-slate-300">Dòng điện</strong> chạy từ cực dương (+) của pin, qua dây dẫn và thiết bị, về cực âm (−). Khi mạch hở (có chỗ đứt), dòng điện không chạy được.
          </p>
          <p>
            <strong className="text-slate-300">Công tắc</strong> dùng để đóng/mở mạch — khi tắt, mạch hở; khi bật, mạch kín và dòng điện chạy.
          </p>
        </div>
      </details>
    </div>
  );
}
