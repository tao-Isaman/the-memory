'use client';

import { CSSProperties, memo, useMemo } from 'react';
import {
  MASCOT_GRID,
  MASCOT_PALETTE,
  MASCOT_PALETTE_MONO,
  MascotAnimation,
  MascotEmotion,
  gridToRuns,
  mascotFrames,
} from '@/lib/mascot';

export interface MascotProps {
  emotion?: MascotEmotion;
  animation?: MascotAnimation;
  /** Rendered width/height in px. The art is 32x32, so multiples of 32 are crispest. */
  size?: number;
  /** White-on-colour palette for gradient / dark backgrounds. */
  mono?: boolean;
  className?: string;
  style?: CSSProperties;
  title?: string;
  onClick?: () => void;
}

const MOTION_CLASS: Record<MascotAnimation, string> = {
  none: '',
  idle: 'mascot-bob',
  walk: 'mascot-step',
  wave: 'mascot-bob',
  bounce: 'mascot-bounce',
};

/**
 * The Memory's pixel-art crab. Pure inline SVG: no image requests, crisp at any size,
 * and every emotion/animation is a few extra <rect>s rather than an asset.
 */
const Mascot = memo(function Mascot({
  emotion = 'idle',
  animation = 'idle',
  size = 48,
  mono = false,
  className = '',
  style,
  title = 'The Memory mascot',
  onClick,
}: MascotProps) {
  const set = useMemo(() => mascotFrames(emotion, animation), [emotion, animation]);
  const palette = mono ? MASCOT_PALETTE_MONO : MASCOT_PALETTE;
  const frameCount = set.frames.length;

  const svgStyle = {
    ...style,
    '--mascot-duration': `${set.duration}ms`,
  } as CSSProperties;

  return (
    <svg
      viewBox={`0 0 ${MASCOT_GRID} ${MASCOT_GRID}`}
      width={size}
      height={size}
      className={`mascot ${MOTION_CLASS[animation]} ${className}`.trim()}
      style={svgStyle}
      role="img"
      aria-label={title}
      onClick={onClick}
    >
      {set.frames.map((rows, i) => {
        let frameClass: string | undefined;
        let frameStyle: CSSProperties | undefined;
        if (set.mode === 'cycle') {
          frameClass = 'mascot-frame-cycle';
          frameStyle = { animationDelay: `${-(i / frameCount) * set.duration}ms` };
        } else if (set.mode === 'blink') {
          frameClass = i === 0 ? 'mascot-frame-blink-open' : 'mascot-frame-blink-closed';
        }
        return (
          <g key={i} className={frameClass} style={frameStyle}>
            {gridToRuns(rows).map((r) => (
              <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={palette[r.key]} />
            ))}
          </g>
        );
      })}
    </svg>
  );
});

export default Mascot;
