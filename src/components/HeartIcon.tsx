'use client';

import { CSSProperties, memo } from 'react';

interface HeartIconProps {
  className?: string;
  filled?: boolean;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

const HeartIcon = memo(function HeartIcon({
  className = '',
  filled = true,
  size = 24,
  color = '#E63946',
  style,
}: HeartIconProps) {
  // Allow style.color to override the color prop for theme support
  const effectiveColor = (style?.color as string) || color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? effectiveColor : 'none'}
      stroke={effectiveColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
});

export default HeartIcon;
