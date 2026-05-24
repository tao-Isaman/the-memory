'use client';

import { useEffect, useRef, useState } from 'react';
import { ThemeColors } from '@/lib/themes';
import HeartIcon from './HeartIcon';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
}

const DEFAULT_COLORS = ['#E8A0B5', '#D4888F', '#C9A96E', '#B8A090', '#E8846B'];

/**
 * One-shot celebratory heart burst, fired automatically on mount.
 * Unlike HeartFirework (which is click-triggered and global), this is a
 * programmatic celebration used on the memory ending screen.
 */
export default function CelebrationBurst({ themeColors }: { themeColors?: ThemeColors }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    // Respect reduced-motion preferences.
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const colors = themeColors
      ? [themeColors.primary, themeColors.dark, themeColors.accent, themeColors.primary]
      : DEFAULT_COLORS;
    const w = typeof window !== 'undefined' ? window.innerWidth : 360;
    const h = typeof window !== 'undefined' ? window.innerHeight : 640;
    const origins = [
      { x: w * 0.3, y: h * 0.36 },
      { x: w * 0.7, y: h * 0.36 },
      { x: w * 0.5, y: h * 0.28 },
    ];

    const initial: Particle[] = [];
    origins.forEach((o) => {
      const count = 12;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = 4 + Math.random() * 5;
        initial.push({
          id: idRef.current++,
          x: o.x,
          y: o.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 3, // upward boost, gravity pulls back down
          size: 14 + Math.random() * 18,
          opacity: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
        });
      }
    });

    particlesRef.current = initial;
    setParticles(initial);

    let raf: number;
    const animate = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.18, // gravity
          opacity: p.opacity - 0.012,
          rotation: p.rotation + p.vx * 2,
        }))
        .filter((p) => p.opacity > 0);
      setParticles([...particlesRef.current]);
      if (particlesRef.current.length > 0) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [themeColors]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: p.x,
            top: p.y,
            opacity: p.opacity,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg) scale(${p.opacity})`,
          }}
        >
          <HeartIcon size={p.size} filled style={{ color: p.color }} />
        </div>
      ))}
    </div>
  );
}
