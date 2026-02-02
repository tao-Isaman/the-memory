'use client';

import { memo } from 'react';
import { ThemeColors } from '@/lib/themes';
import HeartIcon from './HeartIcon';

interface HeartLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  themeColors?: ThemeColors;
}

const defaultColors: ThemeColors = {
  primary: '#FF6B9D',
  dark: '#E63946',
  accent: '#FFB6C1',
  background: '#FFF0F5',
};

const HeartLoader = memo(function HeartLoader({ message = 'กำลังโหลด...', size = 'md', themeColors = defaultColors }: HeartLoaderProps) {
  const sizes = {
    sm: { heart: 32, text: 'text-sm' },
    md: { heart: 48, text: 'text-base' },
    lg: { heart: 64, text: 'text-lg' },
  };

  const { heart, text } = sizes[size];

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Center heart */}
        <HeartIcon size={heart} className="animate-pulse-heart" filled style={{ color: themeColors.dark }} />

        {/* Orbiting hearts */}
        <div className="absolute inset-0 animate-spin-slow">
          <HeartIcon
            size={heart * 0.4}
            className="absolute -top-4 left-1/2 -translate-x-1/2 opacity-70"
            style={{ color: themeColors.primary }}
          />
        </div>
        <div className="absolute inset-0 animate-spin-slow-reverse">
          <HeartIcon
            size={heart * 0.3}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-60"
            style={{ color: themeColors.accent }}
          />
        </div>
        <div className="absolute inset-0 animate-spin-slower">
          <HeartIcon
            size={heart * 0.35}
            className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-50"
            style={{ color: themeColors.primary }}
          />
        </div>
      </div>

      {message && (
        <p className={`text-gray-500 ${text} animate-pulse`}>{message}</p>
      )}
    </div>
  );
});

export default HeartLoader;
