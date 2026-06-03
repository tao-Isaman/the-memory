'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { ThemeColors } from '@/lib/themes';
import ImageWithLoader from './ImageWithLoader';

interface SlideshowViewerProps {
    imageUrls: string[];
    themeColors?: ThemeColors;
    initialRevealed?: boolean;
    onComplete?: () => void;
    caption?: string;
}

const defaultColors: ThemeColors = {
    primary: '#FF6B9D',
    dark: '#E63946',
    accent: '#FFB6C1',
    background: '#FFF0F5',
};

// How long each slide stays on screen before auto-advancing (ms).
const DWELL = 3500;
// Minimum horizontal travel (px) to count as a swipe rather than a tap.
const SWIPE_THRESHOLD = 40;

export default function SlideshowViewer({
    imageUrls,
    themeColors = defaultColors,
    initialRevealed = false,
    onComplete,
    caption,
}: SlideshowViewerProps) {
    const total = imageUrls.length;
    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);

    // hasReachedEnd guards onComplete so it fires EXACTLY ONCE for the lifetime
    // of this slideshow (whether reached via auto-play or manual navigation).
    const hasReachedEndRef = useRef(initialRevealed);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartXRef = useRef<number | null>(null);
    const touchStartYRef = useRef<number | null>(null);
    const swipeHandledRef = useRef(false);

    // Respect the user's motion preference: skip ken-burns + crossfade when reduced.
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Fire onComplete once when the album finishes (last slide reached).
    const markReachedEnd = useCallback(() => {
        if (hasReachedEndRef.current) return;
        hasReachedEndRef.current = true;
        onComplete?.();
    }, [onComplete]);

    // If we landed already on (or past) the last slide, treat the album as done.
    useEffect(() => {
        if (index >= total - 1) markReachedEnd();
    }, [index, total, markReachedEnd]);

    // Auto-play: advance every DWELL ms up to the last slide only (no loop).
    useEffect(() => {
        if (paused || index >= total - 1) return;
        timerRef.current = setTimeout(() => {
            setIndex((prev) => Math.min(prev + 1, total - 1));
        }, DWELL);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [index, paused, total]);

    // Preload the next image so the upcoming crossfade is instant on slow networks.
    useEffect(() => {
        const next = imageUrls[index + 1];
        if (next) {
            const img = new Image();
            img.src = next;
        }
    }, [index, imageUrls]);

    // Manual navigation — clamps to ends (no wrap) and locks auto-play permanently.
    const goTo = useCallback((target: number) => {
        const clamped = Math.max(0, Math.min(target, total - 1));
        if (clamped === index) return; // boundary no-op: don't pause, don't re-set index
        setPaused(true);
        setIndex(clamped);
    }, [total, index]);   // NOTE: add `index` to deps (it's now read inside)

    const prev = useCallback(() => goTo(index - 1), [goTo, index]);
    const next = useCallback(() => goTo(index + 1), [goTo, index]);

    // Touch swipe inside the stage — self-contained, never bubbles to story nav.
    const handleTouchStart = (e: React.TouchEvent) => {
        swipeHandledRef.current = false;
        touchStartXRef.current = e.touches[0].clientX;
        touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartXRef.current === null || touchStartYRef.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartXRef.current;
        const dy = e.changedTouches[0].clientY - touchStartYRef.current;
        touchStartXRef.current = null;
        touchStartYRef.current = null;
        // Ignore mostly-vertical gestures (let the page scroll).
        if (Math.abs(dx) <= SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
        const dir = dx > 0 ? -1 : 1;            // right-swipe -> prev, left-swipe -> next
        const target = index + dir;
        const clamped = Math.max(0, Math.min(target, total - 1));
        if (clamped === index) return;          // boundary: let it bubble, no needless pause, don't mark handled
        swipeHandledRef.current = true;         // swallow the browser's trailing synthesized click
        e.stopPropagation();
        goTo(clamped);
    };

    // Tap zones inside the stage: left 30% prev, right 70% next.
    const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (swipeHandledRef.current) {
            swipeHandledRef.current = false; // consume; next real tap proceeds
            e.stopPropagation();             // swallow the synthesized click after a handled swipe
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const target = ratio < 0.3 ? index - 1 : index + 1;
        const clamped = Math.max(0, Math.min(target, total - 1));
        if (clamped === index) return; // let the tap bubble to the page (next/prev STORY)
        e.stopPropagation();
        goTo(clamped);
    };

    const isLastSlide = index >= total - 1;

    return (
        <div
            className="w-full flex flex-col"
            role="group"
            aria-roledescription="สไลด์โชว์"
        >
            {/* Stage — data-interactive so the page tap-nav never hijacks album gestures */}
            <div
                data-interactive
                className="relative w-full aspect-[4/5] max-h-[500px] rounded-2xl overflow-hidden"
                style={{ background: `${themeColors.background}`, touchAction: 'pan-y' }}
                onClick={handleStageClick}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Stacked slides — current opacity-100, others opacity-0 (500ms crossfade) */}
                {imageUrls.map((url, i) => {
                    const isActive = i === index;
                    // Ken Burns variant cycles by slide position; re-keyed per active
                    // slide so the animation restarts cleanly on each entry.
                    const kbClass = reducedMotion
                        ? ''
                        : ['ken-burns-a', 'ken-burns-b', 'ken-burns-c'][i % 3];

                    return (
                        <div
                            key={`${url}-${i}`}
                            className={`absolute inset-0 ${reducedMotion ? '' : 'transition-opacity duration-500'} ${isActive ? 'opacity-100' : 'opacity-0'
                                }`}
                            style={{ zIndex: isActive ? 1 : 0 }}
                            aria-hidden={!isActive}
                        >
                            {i === 0 ? (
                                // First slide uses the themed heart-loader shimmer.
                                <ImageWithLoader
                                    key={`loader-${i}`}
                                    src={url}
                                    alt={`รูปที่ ${i + 1} จาก ${total}`}
                                    className={`w-full h-full object-cover ${isActive ? kbClass : ''}`}
                                    style={{ height: '100%', minHeight: '100%', objectFit: 'cover' }}
                                    themeColors={themeColors}
                                />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    key={isActive ? `kb-${index}` : 'idle'}
                                    src={url}
                                    alt={`รูปที่ ${i + 1} จาก ${total}`}
                                    className={`w-full h-full object-cover ${isActive ? kbClass : ''}`}
                                />
                            )}
                        </div>
                    );
                })}

                {/* Top segmented mini-progress (Instagram-stories language).
                    Past = filled primary; current = scaleX fill over DWELL; future = dark @18. */}
                <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
                    {imageUrls.map((url, i) => {
                        const isPast = i < index;
                        const isCurrent = i === index;
                        // The current bar animates its fill over DWELL while auto-playing.
                        // Past bars (and the current bar when paused/last/reduced-motion)
                        // sit fully filled; future bars stay empty.
                        const animating = isCurrent && !paused && !isLastSlide && !reducedMotion;
                        const filled = isPast || (isCurrent && !animating);
                        return (
                            <div
                                key={`${url}-${i}`}
                                className="h-1 flex-1 rounded-full overflow-hidden"
                                style={{ background: `${themeColors.dark}18` }}
                            >
                                <div
                                    // Re-key the current bar so its scaleX fill restarts per slide.
                                    key={isCurrent ? `fill-${index}` : 'static'}
                                    className="h-full origin-left rounded-full"
                                    style={{
                                        background: themeColors.primary,
                                        transform: filled ? 'scaleX(1)' : 'scaleX(0)',
                                        animation: animating
                                            ? `auto-advance-fill ${DWELL}ms linear forwards`
                                            : undefined,
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dot row below the stage */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
                {imageUrls.map((url, i) => {
                    const isActive = i === index;
                    const celebrate = isActive && isLastSlide;
                    return (
                        <button
                            key={`${url}-${i}`}
                            type="button"
                            data-interactive
                            onClick={() => goTo(i)}
                            aria-label={`ไปรูปที่ ${i + 1}`}
                            className={`rounded-full transition-all duration-300 ${celebrate ? 'animate-pulse-heart' : ''}`}
                            style={{
                                width: isActive ? '20px' : '8px',
                                height: '8px',
                                background: isActive ? themeColors.primary : `${themeColors.dark}25`,
                            }}
                        />
                    );
                })}
            </div>

            {/* aria-live announcement for slide changes */}
            <span className="sr-only" aria-live="polite">
                {`รูปที่ ${index + 1} จาก ${total}`}
            </span>

            {/* Single overall caption beneath the dots */}
            {caption && (
                <p className="mt-3 text-center text-gray-600 italic">
                    {caption}
                </p>
            )}
        </div>
    );
}
