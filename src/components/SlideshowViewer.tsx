'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { ThemeColors } from '@/lib/themes';

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

// Polaroid pile tuning — photos sit on a loose 2-column grid with seeded jitter + tilt, each
// card SIZED TO ITS CELL so they spread out (light overlap, not a clump) and CLAMPED so a
// tilted card never spills past the stage edge (no clipped borders).
const CELL_FILL = 0.88;          // card size as a fraction of its grid cell (lower = more spacing)
const MAX_TILT = 8;              // max tilt in degrees (+/-)
const JITTER = 9;               // peak-to-peak position jitter within a cell (% of stage)
const POLA_HEIGHT_RATIO = 1.105; // polaroid card height / width (incl. the deeper bottom lip)
const BOUND_FACTOR = 1.16;       // bounding-box inflation used when clamping the tilt in-bounds
const DROP_STAGGER = 150;        // ms between each photo dropping in
const DROP_DURATION = 520;       // ms for one photo's drop-in (matches .polaroid-drop in globals.css)

// Deterministic PRNG seeded from the image URLs (xorshift on an FNV-1a hash) — the SAME
// scatter renders every time the gift is reopened, instead of reshuffling on each visit.
// Same idea as VoicePlayer's seeded waveform.
function makeSeededRandom(seed: string): () => number {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return () => {
        h ^= h << 13;
        h ^= h >>> 17;
        h ^= h << 5;
        return ((h >>> 0) % 100000) / 100000; // 0..1
    };
}

type Placement = { cx: number; cy: number; w: number; rot: number };

export default function SlideshowViewer({
    imageUrls,
    themeColors = defaultColors,
    initialRevealed = false,
    onComplete,
    caption,
}: SlideshowViewerProps) {
    const total = imageUrls.length;

    // Which photo is lifted to the very front (by index). -1 = natural stacking order.
    const [topIndex, setTopIndex] = useState(-1);

    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    // Seeded layout — stable per album. A loose 2-column grid (more rows as photos grow) with
    // per-cell jitter + tilt; each card is sized to fit its cell and its center is clamped so the
    // tilted card stays fully inside the stage. This spreads photos out and guarantees no edge clip.
    const placements = useMemo<Placement[]>(() => {
        const rand = makeSeededRandom(imageUrls.join('|') || 'album');
        const rows = total <= 2 ? 1 : total <= 4 ? 2 : 3;
        const cols = Math.ceil(total / rows);
        const cellW = 100 / cols;                          // cell width  (% of stage width)
        const cellHInW = (100 / rows) * (5 / 4);           // cell height as %width (stage is 4:5 → H=1.25W)
        const w = Math.min(cellW, cellHInW / POLA_HEIGHT_RATIO) * CELL_FILL; // card width (%W)
        const cardHInH = w * POLA_HEIGHT_RATIO * (4 / 5);  // card height as % of stage height
        const bw = (w * BOUND_FACTOR) / 2;                 // half bounding width  (%W)
        const bh = (cardHInH * BOUND_FACTOR) / 2;          // half bounding height (%H)
        return imageUrls.map((_, i) => {
            const row = Math.floor(i / cols);
            const itemsInRow = Math.min(cols, total - row * cols);
            const colInRow = i - row * cols;
            // Center within the (possibly partial) row, then jitter; partial rows auto-center.
            let cx = ((colInRow + 0.5) / itemsInRow) * 100 + (rand() - 0.5) * JITTER;
            let cy = ((row + 0.5) / rows) * 100 + (rand() - 0.5) * JITTER;
            const rot = (rand() - 0.5) * 2 * MAX_TILT;
            cx = Math.max(bw + 1, Math.min(100 - bw - 1, cx));
            cy = Math.max(bh + 1, Math.min(100 - bh - 1, cy));
            return { cx, cy, w, rot };
        });
    }, [imageUrls, total]);

    // Fire onComplete once, after the pile has settled (or immediately when already revealed
    // or motion is reduced) — keeps the page's reveal→auto-advance gate working exactly as it
    // did for the old slideshow (page.tsx gates slideshow auto-advance on reveal).
    const hasCompletedRef = useRef(initialRevealed);
    useEffect(() => {
        if (hasCompletedRef.current) return;
        const settleMs = reducedMotion ? 0 : (total - 1) * DROP_STAGGER + DROP_DURATION + 150;
        const t = setTimeout(() => {
            hasCompletedRef.current = true;
            onComplete?.();
        }, settleMs);
        return () => clearTimeout(t);
    }, [reducedMotion, total, onComplete]);

    // Bring a tapped photo to the front. stopPropagation so the page tap-nav never advances
    // the story while the recipient is just inspecting a photo in the pile.
    const liftToFront = useCallback((e: React.MouseEvent, i: number) => {
        e.stopPropagation();
        setTopIndex(i);
    }, []);

    return (
        <div className="w-full flex flex-col" role="group" aria-roledescription="อัลบั้มภาพ">
            {/* Stage — data-interactive so the page tap-nav never hijacks photo taps. */}
            <div
                data-interactive
                className="relative w-full aspect-[4/5] max-h-[460px] rounded-2xl overflow-hidden"
                style={{ background: `linear-gradient(160deg, ${themeColors.background}, ${themeColors.accent}33)` }}
            >
                {imageUrls.map((url, i) => {
                    const { cx, cy, w, rot } = placements[i];
                    const isTop = i === topIndex;
                    // Base stacking by order; a tapped photo jumps above everything.
                    const zIndex = isTop ? total + 5 : i + 1;
                    // Stable per-photo angle for the drop-in keyframe (see globals.css).
                    const cardVars = { '--rot': `${rot}deg` } as React.CSSProperties;

                    return (
                        <div
                            key={`${url}-${i}`}
                            className="absolute"
                            style={{
                                left: `${cx.toFixed(2)}%`,
                                top: `${cy.toFixed(2)}%`,
                                width: `${w.toFixed(2)}%`,
                                transform: 'translate(-50%, -50%)',
                                zIndex,
                            }}
                        >
                            <button
                                type="button"
                                data-interactive
                                onClick={(e) => liftToFront(e, i)}
                                aria-label={`รูปที่ ${i + 1} จาก ${total}`}
                                className={`block w-full border-0 cursor-pointer ${reducedMotion ? '' : 'polaroid-drop'}`}
                                style={{
                                    ...cardVars,
                                    // White polaroid frame: thin sides/top, deep bottom lip.
                                    background: '#ffffff',
                                    padding: '4.5% 4.5% 15% 4.5%',
                                    borderRadius: '4px',
                                    boxShadow: isTop
                                        ? '0 16px 34px rgba(107, 94, 87, 0.32)'
                                        : '0 6px 16px rgba(107, 94, 87, 0.18)',
                                    // Resting tilt; the drop-in keyframe ends at this same rotation.
                                    transform: `rotate(${rot}deg)`,
                                    animationDelay: reducedMotion ? undefined : `${i * DROP_STAGGER}ms`,
                                    transition: 'box-shadow 0.25s ease',
                                }}
                            >
                                {/* Square crop — every photo the SAME ratio, cover-cropped so mixed
                                    portrait/landscape uploads all read as uniform polaroids. */}
                                <div
                                    className="relative w-full aspect-square overflow-hidden"
                                    style={{ background: `${themeColors.accent}22` }}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={url}
                                        alt={`รูปที่ ${i + 1} จาก ${total}`}
                                        loading="eager"
                                        draggable={false}
                                        className="absolute inset-0 w-full h-full object-cover select-none"
                                    />
                                </div>
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* aria-live announcement */}
            <span className="sr-only" aria-live="polite">{`อัลบั้มภาพ ${total} รูป`}</span>

            {/* Single overall caption beneath the pile */}
            {caption && (
                <p className="mt-3 text-center text-gray-600 italic">{caption}</p>
            )}
        </div>
    );
}
