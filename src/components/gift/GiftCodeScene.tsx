'use client';

import { useEffect, useRef, useState } from 'react';

// Scene 2: drag digit tiles into six slots to enter today's date code.
// Drag uses Pointer Events + setPointerCapture, so one code path handles touch,
// pen and mouse. The scene sets touch-action:none so a drag never scrolls the
// page. Digits repeat freely (each tile is a reusable source), tapping a filled
// slot clears it, a wrong code shakes the box and raises the hint level, and the
// full answer is revealed after three misses so no one is ever stuck.

interface Props {
  code: string; // 6 digits
  hint: string; // e.g. "23 / 11 / 69"
  onSolved: () => void;
  onWrong: (attempt: number) => void;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function GiftCodeScene({ code, hint, onSolved, onWrong }: Props) {
  const [slots, setSlots] = useState<(string | null)[]>(() => Array(6).fill(null));
  const [drag, setDrag] = useState<{ digit: string; x: number; y: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [hintLevel, setHintLevel] = useState(0); // 0 base, 1 after a miss, 2 full
  const attemptsRef = useRef(0);
  const solvedRef = useRef(false);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Slight, stable rotations so the tile cloud looks scattered, not a grid.
  const [rot] = useState(() => DIGITS.map(() => (Math.random() * 16 - 8).toFixed(1)));

  const fillSlotAt = (clientX: number, clientY: number, digit: string) => {
    const idx = slotRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    });
    if (idx === -1) return;
    setSlots((prev) => {
      const next = [...prev];
      next[idx] = digit;
      return next;
    });
  };

  const startDrag = (digit: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDrag({ digit, x: e.clientX, y: e.clientY });
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag) return;
    setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
  };
  const endDrag = (digit: string) => (e: React.PointerEvent) => {
    if (drag) fillSlotAt(e.clientX, e.clientY, digit);
    setDrag(null);
  };

  const clearSlot = (i: number) =>
    setSlots((prev) => {
      const next = [...prev];
      next[i] = null;
      return next;
    });

  // Check whenever all six are filled.
  useEffect(() => {
    if (solvedRef.current) return;
    if (slots.some((s) => s === null)) return;
    const entered = slots.join('');
    if (entered === code) {
      solvedRef.current = true;
      onSolved();
      return;
    }
    const attempt = (attemptsRef.current += 1);
    onWrong(attempt);
    setShake(true);
    setHintLevel(attempt >= 3 ? 2 : 1);
    const t1 = setTimeout(() => setShake(false), 500);
    const t2 = setTimeout(() => setSlots(Array(6).fill(null)), 650);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [slots, code, onSolved, onWrong]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between px-5 py-6" style={{ touchAction: 'none' }}>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">ใส่รหัสปลดล็อกกล่อง 🔐</h2>
        <p className="mt-1 text-sm text-white/70">คำใบ้: <b>วันที่วันนี้</b></p>
        {hintLevel >= 1 && <p className="mt-1 text-sm text-amber-300">รูปแบบ วว/ดด/ปป (ปี พ.ศ. 2 หลัก)</p>}
        {hintLevel >= 2 && <p className="mt-1 text-base font-bold text-amber-300">เฉลย: {hint}</p>}
      </div>

      {/* Slots */}
      <div className={`flex gap-2 ${shake ? 'gift-shake' : ''}`}>
        {slots.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              slotRefs.current[i] = el;
            }}
            onClick={() => s && clearSlot(i)}
            className={`flex h-14 w-11 items-center justify-center rounded-xl border-2 text-2xl font-bold transition-colors ${
              s ? 'border-amber-300 bg-white text-[#4A1942]' : 'border-dashed border-white/40 bg-white/10 text-white/30'
            }`}
          >
            {s ?? '•'}
          </div>
        ))}
      </div>
      <p className="-mt-3 text-xs text-white/50">แตะช่องที่ใส่แล้วเพื่อลบ</p>

      {/* Digit tray */}
      <div className="flex max-w-sm flex-wrap items-center justify-center gap-3 pb-4">
        {DIGITS.map((d, i) => (
          <button
            key={d}
            type="button"
            onPointerDown={startDrag(d)}
            onPointerMove={moveDrag}
            onPointerUp={endDrag(d)}
            aria-label={`ลากเลข ${d}`}
            className="flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-fuchsia-500 text-2xl font-bold text-white shadow-lg active:scale-95"
            style={{ transform: `rotate(${rot[i]}deg)`, touchAction: 'none' }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Drag ghost */}
      {drag && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl bg-fuchsia-500 text-2xl font-bold text-white opacity-90 shadow-xl"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.digit}
        </div>
      )}

      <style>{`@keyframes giftShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-7px)}80%{transform:translateX(7px)}}.gift-shake{animation:giftShake .5s}`}</style>
    </div>
  );
}
