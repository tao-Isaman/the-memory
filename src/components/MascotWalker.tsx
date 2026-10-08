'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Mascot from './Mascot';
import { MascotEmotion } from '@/lib/mascot';

interface MascotWalkerProps {
  size?: number;
  className?: string;
}

// Emotions the crab cycles through when tapped. Each tap moves to the next one,
// so repeat visitors can discover them all.
const REACTIONS: MascotEmotion[] = ['happy', 'love', 'surprised', 'wink'];
const REACTION_MS = 1800;

/**
 * The mascot scuttling along the bottom edge of its parent (which must be
 * `position: relative`). Tapping it stops the walk and plays a reaction.
 */
export default function MascotWalker({ size = 64, className = '' }: MascotWalkerProps) {
  const [reaction, setReaction] = useState<MascotEmotion | null>(null);
  const nextIndex = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const react = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const emotion = REACTIONS[nextIndex.current % REACTIONS.length];
    nextIndex.current += 1;
    setReaction(emotion);
    timer.current = setTimeout(() => setReaction(null), REACTION_MS);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <div className={`mascot-track ${className}`.trim()} aria-hidden="true">
      <div
        className="mascot-runner"
        // Pausing the track animation while reacting keeps the crab where it was tapped.
        style={{ animationPlayState: reaction ? 'paused' : 'running' }}
      >
        <Mascot
          size={size}
          emotion={reaction ?? 'idle'}
          animation={reaction ? (reaction === 'wink' ? 'wave' : 'bounce') : 'walk'}
          onClick={react}
        />
      </div>
    </div>
  );
}
