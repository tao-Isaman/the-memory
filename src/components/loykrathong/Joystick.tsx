'use client';

import { useCallback, useRef, useState } from 'react';

interface JoystickProps {
  /** Called continuously with a unit-ish vector (length 0..1). (0,0) when released. */
  onChange: (v: { x: number; y: number }) => void;
  size?: number;
  /** Extra classes for the touch zone (defaults to the left half of the parent). */
  className?: string;
}

/**
 * Floating virtual joystick for touch devices. The component is an invisible touch
 * zone (the left half of the screen by default): the stick appears wherever the
 * finger lands, follows it while held, and disappears on release. Pointer events
 * only, so it also works with a mouse for testing. The knob clamps to the base radius.
 *
 * Render it BEFORE the HUD in DOM order so buttons and inputs on top keep their taps.
 */
export default function Joystick({ onChange, size = 128, className = 'inset-y-0 left-0 w-1/2' }: JoystickProps) {
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const originRef = useRef({ x: 0, y: 0 });
  const activeId = useRef<number | null>(null);
  const radius = size / 2;
  const knobSize = size * 0.42;
  const max = radius * 0.75;

  const update = useCallback(
    (clientX: number, clientY: number, zone: DOMRect) => {
      let dx = clientX - zone.left - originRef.current.x;
      let dy = clientY - zone.top - originRef.current.y;
      const len = Math.hypot(dx, dy);
      if (len > max) {
        dx = (dx / len) * max;
        dy = (dy / len) * max;
      }
      setKnob({ x: dx, y: dy });
      const mag = Math.min(1, len / max);
      onChange(len === 0 ? { x: 0, y: 0 } : { x: (dx / Math.hypot(dx, dy)) * mag, y: (dy / Math.hypot(dx, dy)) * mag });
    },
    [max, onChange],
  );

  const release = useCallback(() => {
    activeId.current = null;
    setOrigin(null);
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
  }, [onChange]);

  return (
    <div
      className={`absolute select-none touch-none ${className}`}
      onPointerDown={(e) => {
        if (activeId.current !== null) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const zone = e.currentTarget.getBoundingClientRect();
        activeId.current = e.pointerId;
        originRef.current = { x: e.clientX - zone.left, y: e.clientY - zone.top };
        setOrigin(originRef.current);
        setKnob({ x: 0, y: 0 });
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Pointer already gone (or synthetic): the move/up handlers still work without capture.
        }
      }}
      onPointerMove={(e) => {
        if (activeId.current !== e.pointerId) return;
        update(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
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
      {origin && (
        <div
          className="absolute rounded-full bg-white/15 border-2 border-white/40 backdrop-blur-sm pointer-events-none"
          style={{ width: size, height: size, left: origin.x - radius, top: origin.y - radius }}
        >
          <div
            className="absolute rounded-full bg-white/80 shadow-lg"
            style={{ width: knobSize, height: knobSize, left: radius - knobSize / 2 + knob.x, top: radius - knobSize / 2 + knob.y }}
          />
        </div>
      )}
    </div>
  );
}
