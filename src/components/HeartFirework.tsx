'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface HeartFireworkProps {
  enabled?: boolean;
  themeColors?: ThemeColors;
}

const DEFAULT_COLORS = ['#FF6B9D', '#E63946', '#FFB6C1', '#FF1493', '#FF69B4'];

export default function HeartFirework({ enabled = true, themeColors }: HeartFireworkProps) {
  const colors = themeColors
    ? [themeColors.primary, themeColors.dark, themeColors.accent, themeColors.primary, themeColors.dark]
    : DEFAULT_COLORS;
  const [particles, setParticles] = useState<Particle[]>([]);

  const createParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const count = 8 + Math.floor(Math.random() * 5); // 8-12 hearts

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;

      newParticles.push({
        id: Date.now() + i,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Initial upward boost
        size: 12 + Math.random() * 16,
        opacity: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      });
    }

    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;
      createParticles(e.clientX, e.clientY);
    },
    [enabled, createParticles]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [enabled, handleClick]);

  // Animation loop
  useEffect(() => {
    if (particles.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // Gravity
            opacity: p.opacity - 0.02,
            rotation: p.rotation + p.vx * 2,
          }))
          .filter((p) => p.opacity > 0)
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [particles]);

  if (!enabled || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.opacity,
            transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.opacity})`,
            transition: 'none',
          }}
        >
          <HeartIcon size={particle.size} filled style={{ color: particle.color }} />
        </div>
      ))}
    </div>
  );
}
