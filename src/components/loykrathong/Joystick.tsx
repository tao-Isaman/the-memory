'use client';

import { useCallback, useRef, useState } from 'react';

interface JoystickProps {
  /** Called continuously with a unit-ish vector (length 0..1). (0,0) when released. */
  onChange: (v: { x: number; y: number }) => void;
  size?: number;
}

/**
 * Fixed-position virtual joystick for touch devices. Pointer events only, so it
 * also works with a mouse for testing. The knob clamps to the base radius.
 */
export default function Joystick({ onChange, size = 128 }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const activeId = useRef<number | null>(null);
  const radius = size / 2;
  const knobSize = size * 0.42;

  const update = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const len = Math.hypot(dx, dy);
      const max = radius * 0.75;
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      setKnob({ x: dx, y: dy });
      const mag = Math.min(1, len / max);
      const nx = len === 0 ? 0 : (dx / Math.hypot(dx, dy)) * mag;
      const ny = len === 0 ? 0 : (dy / Math.hypot(dx, dy)) * mag;
      onChange({ x: nx, y: ny });
    },
    [onChange, radius],
  );

  const release = useCallback(() => {
    activeId.current = null;
    setActive(false);
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  }, [onChange]);

  return (
    <div
      ref={baseRef}
      className="relative select-none touch-none rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-sm"
      style={{ width: size, height: size }}
      onPointerDown={(e) => {
        if (activeId.current !== null) return;
        activeId.current = e.pointerId;
        setActive(true);
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activeId.current !== e.pointerId) return;
        update(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activeId.current !== e.pointerId) return;
        release();
      }}
      onPointerCancel={release}
      onLostPointerCapture={release}
      aria-label="joystick"
      role="application"
    >
      <div
        className="absolute rounded-full bg-white/80 shadow-lg"
        style={{
          width: knobSize,
          height: knobSize,
          left: radius - knobSize / 2 + knob.x,
          top: radius - knobSize / 2 + knob.y,
          transition: active ? 'none' : 'left 120ms, top 120ms',
        }}
      />
    </div>
  );
}
