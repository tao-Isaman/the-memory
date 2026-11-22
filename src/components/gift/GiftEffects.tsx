'use client';

import { useEffect, useRef, useState } from 'react';
import type { GiftEffect } from '@/lib/gift/date';

// Lightweight celebratory overlay for the gift reveal. Snow is pure CSS
// (cheap, no canvas); fireworks is a small self-contained canvas loop. Both are
// decorative only — pointer-events: none — so they never block the CTA.

function Snow() {
  // A fixed set of flakes with randomised fall timing, created once (render
  // data, so lazy state rather than a ref).
  const [flakes] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      size: 8 + Math.random() * 16,
      delay: Math.random() * 6,
      dur: 6 + Math.random() * 6,
      drift: (Math.random() * 2 - 1) * 40,
      key: i,
    })),
  );
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 5 }}>
      {flakes.map((f) => (
        <span
          key={f.key}
          className="absolute top-[-10%] text-white"
          style={{
            left: `${f.left}%`,
            fontSize: f.size,
            // CSS custom props consumed by the keyframes below.
            ['--drift' as string]: `${f.drift}px`,
            animation: `giftSnowFall ${f.dur}s linear ${f.delay}s infinite`,
            opacity: 0.85,
          }}
        >
          ❄
        </span>
      ))}
      <style>{`@keyframes giftSnowFall{0%{transform:translate(0,0) rotate(0);opacity:0}10%{opacity:.9}100%{transform:translate(var(--drift),110vh) rotate(360deg);opacity:.9}}`}</style>
    </div>
  );
}

function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string };
    let particles: P[] = [];
    const colors = ['#ffd369', '#ff6b6b', '#4ecdc4', '#c084fc', '#ffffff'];
    const burst = () => {
      const cx = w * (0.2 + Math.random() * 0.6);
      const cy = h * (0.15 + Math.random() * 0.35);
      const color = colors[(Math.random() * colors.length) | 0];
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const sp = 1.5 + Math.random() * 2.5;
        particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, color });
      }
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      acc += dt;
      if (acc > 650) {
        acc = 0;
        burst();
      }
      ctx.clearRect(0, 0, w, h);
      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // gravity
        p.vx *= 0.99;
        p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };
    burst();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0" style={{ zIndex: 5 }} />;
}

export default function GiftEffects({ kind }: { kind: GiftEffect }) {
  return kind === 'fireworks' ? <Fireworks /> : <Snow />;
}
