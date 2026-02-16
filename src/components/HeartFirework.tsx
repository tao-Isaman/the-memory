'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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

const DEFAULT_COLORS = ['#E8A0B5', '#D4888F', '#C9A96E', '#B8A090', '#E8846B'];

export default function HeartFirework({ enabled = true, themeColors }: HeartFireworkProps) {
  // Memoize colors to prevent recreation on every render
  const colors = useMemo(() =>
    themeColors
      ? [themeColors.primary, themeColors.dark, themeColors.accent, themeColors.primary, themeColors.dark]
      : DEFAULT_COLORS,
    [themeColors]
  );

  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextIdRef = useRef(0);

  const createParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const count = 5 + Math.floor(Math.random() * 3); // 5-7 hearts

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 3 + Math.random() * 4;

      newParticles.push({
        id: nextIdRef.current++,
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

    particlesRef.current = [...particlesRef.current, ...newParticles];
    setParticles([...particlesRef.current]);
  }, [colors]);

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

  // Optimized animation loop using ref to batch updates
  useEffect(() => {
    if (particlesRef.current.length === 0) return;

    let animationFrameId: number;

    const animate = () => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.15, // Gravity
          opacity: p.opacity - 0.02,
          rotation: p.rotation + p.vx * 2,
        }))
        .filter((p) => p.opacity > 0);

      setParticles([...particlesRef.current]);

      if (particlesRef.current.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [particles.length > 0]); // Only restart when particles appear/disappear

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
