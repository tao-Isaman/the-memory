'use client';

import { memo } from 'react';
import { useTranslations } from 'next-intl';
import { ThemeColors } from '@/lib/themes';
import Mascot from './Mascot';

interface HeartLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Kept for API compatibility with existing call sites; tints the label only. */
  themeColors?: ThemeColors;
}

// Multiples of the 32px art keep the pixels crisp.
const SIZES = {
  sm: { mascot: 32, text: 'text-sm' },
  md: { mascot: 64, text: 'text-base' },
  lg: { mascot: 96, text: 'text-lg' },
};

/**
 * Loading indicator: the mascot walking in place. The name is historical (it used to
 * be an orbiting heart); it is imported from two dozen places, so it keeps its name.
 */
const HeartLoader = memo(function HeartLoader({ message, size = 'md', themeColors }: HeartLoaderProps) {
  const t = useTranslations('common');
  const { mascot, text } = SIZES[size];
  // Callers may pass their own copy; otherwise fall back to the shared "Loading..." string.
  const label = message === undefined ? t('state.loading') : message;

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Mascot size={mascot} emotion="idle" animation="walk" title={label || 'Loading'} />
      {label && (
        <p className={`${text} animate-pulse`} style={{ color: themeColors?.dark ?? '#7A6A63' }}>
          {label}
        </p>
      )}
    </div>
  );
});

export default HeartLoader;
