'use client';

import { useEffect, useState, useMemo } from 'react';

interface Heart {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
}

// Seeded random number generator for consistent results
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function FloatingHearts() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate hearts with deterministic values using useMemo
  const hearts = useMemo(() => {
    const generatedHearts: Heart[] = [];
    for (let i = 0; i < 15; i++) {
      generatedHearts.push({
        id: i,
        left: seededRandom(i * 1) * 100,
        top: 20 + seededRandom(i * 2) * 60,
        delay: seededRandom(i * 3) * 5,
        duration: 5 + seededRandom(i * 4) * 10,
        size: 12 + seededRandom(i * 5) * 20,
      });
    }
    return generatedHearts;
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute text-pink-200 opacity-30"
          style={{
            left: `${heart.left}%`,
            top: `${heart.top}%`,
            fontSize: `${heart.size}px`,
            animation: `float ${heart.duration}s ease-in-out infinite`,
            animationDelay: `${heart.delay}s`,
          }}
        >
          &#9829;
        </div>
      ))}
    </div>
  );
}
