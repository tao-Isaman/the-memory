'use client';

import { useRef, useState, useMemo, useCallback } from 'react';
import { ThemeColors } from '@/lib/themes';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
    audioUrl: string;
    durationSec: number;
    mimeType?: string;
    caption?: string;
    themeColors?: ThemeColors;
    onEnded?: () => void;
}

const defaultColors: ThemeColors = {
    primary: '#FF6B9D',
    dark: '#E63946',
    accent: '#FFB6C1',
    background: '#FFF0F5',
};

// Player lifecycle. NO 'autoplay' state — playback is ALWAYS user-gestured.
type PlayerState = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

const WAVEFORM_BARS = 28;

// Deterministic pseudo-random heights seeded by the audioUrl's char codes.
// Same URL => identical waveform every render (NOT Math.random), so the
// "voiceprint" looks stable across the editor preview and the viewer.
function seededWaveform(seed: string): number[] {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
        // xorshift step for the next pseudo-random value
        h ^= h << 13;
        h ^= h >>> 17;
        h ^= h << 5;
        const r = ((h >>> 0) % 1000) / 1000; // 0..1
        // Map to 28%..100% so even the shortest bar reads as a bar
        bars.push(0.28 + r * 0.72);
    }
    return bars;
}

function formatTime(totalSeconds: number): string {
    const safe = Number.isFinite(totalSeconds) && totalSeconds > 0 ? totalSeconds : 0;
    const m = Math.floor(safe / 60);
    const s = Math.floor(safe % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoicePlayer({
    audioUrl,
    durationSec,
    mimeType,
    caption,
    themeColors = defaultColors,
    onEnded,
}: VoicePlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [state, setState] = useState<PlayerState>('loading');
    const [currentTime, setCurrentTime] = useState(0);
    // Total seeded from the prop immediately so the timeline shows e.g. '0:00 / 0:42'
    // before metadata loads (no NaN flicker; also covers Chrome webm duration:Infinity).
    const [totalDuration, setTotalDuration] = useState(durationSec);
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

    const isPlaying = state === 'playing';
    const safeTotal = totalDuration > 0 ? totalDuration : durationSec;
    // Unknown total: provisional durationSec<=0 AND no finite element duration yet.
    const totalKnown = safeTotal > 0;
    const progress = totalKnown ? Math.min(1, currentTime / safeTotal) : 0;

    const bars = useMemo(() => seededWaveform(audioUrl || 'voice'), [audioUrl]);

    // --- audio element listeners ---
    const handleLoadedMetadata = useCallback(() => {
        const el = audioRef.current;
        // Reconcile to real metadata ONLY when finite — webm reports Infinity on
        // Chrome and some m4a report NaN, in which case we keep the prop durationSec.
        if (el && Number.isFinite(el.duration) && el.duration > 0) {
            setTotalDuration(el.duration);
        }
        setState((prev) => (prev === 'loading' ? 'ready' : prev));
    }, []);

    // Reconcile total whenever a finite duration becomes available, not just at
    // loadedmetadata — many webm/m4a files only expose a finite el.duration after
    // playback/seek begins (durationchange).
    const handleDurationChange = useCallback(() => {
        const el = audioRef.current;
        if (el && Number.isFinite(el.duration) && el.duration > 0) {
            setTotalDuration(el.duration);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const el = audioRef.current;
        if (el) setCurrentTime(el.currentTime);
    }, []);

    const handleEnded = useCallback(() => {
        const el = audioRef.current;
        if (el) el.currentTime = 0;
        setCurrentTime(0);
        setState('ended');
        onEnded?.();
    }, [onEnded]);

    const handleError = useCallback(() => {
        setState('error');
    }, []);

    // --- play / pause toggle (the play button IS the user gesture) ---
    const togglePlay = useCallback(async () => {
        const el = audioRef.current;
        if (!el) return;

        if (isPlaying) {
            el.pause();
            setState('paused');
            return;
        }

        // NEVER call audioRef.play() from an effect — iOS rejects non-gestured
        // playback. play() MUST stay inside this click handler.
        try {
            await el.play();
            setHasPlayedOnce(true);
            setState('playing');
        } catch {
            // Autoplay block / not-yet-gestured — stay paused silently; the next
            // tap (now a fresh gesture) will succeed.
            setState('paused');
        }
    }, [isPlaying]);

    // --- scrub via the transparent range overlay ---
    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const el = audioRef.current;
        if (!el) return;
        let value = parseFloat(e.target.value);
        // If the element knows its real (finite) duration, clamp so we never seek past the true end.
        if (Number.isFinite(el.duration) && el.duration > 0) {
            value = Math.min(value, el.duration);
        }
        el.currentTime = value;
        setCurrentTime(value);
    }, []);

    const playheadBar = currentTime > 0 ? Math.floor(progress * WAVEFORM_BARS) : -1;

    // Aura ring tint per theme (foundation CSS reads these custom properties;
    // pink fallback applies if unset). Full-opacity start, transparent end.
    const auraVars = {
        '--voice-aura-color': `${themeColors.primary}73`,
        '--voice-aura-color-fade': `${themeColors.primary}00`,
    } as React.CSSProperties;

    if (state === 'error') {
        return (
            <div className="w-full flex flex-col items-center gap-3 py-4">
                <p className="text-center text-sm text-gray-600">
                    ไม่สามารถเล่นเสียงได้ในอุปกรณ์นี้
                </p>
                <a
                    href={audioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    data-interactive
                    className="px-5 py-2.5 rounded-full font-semibold text-white text-sm transition-all hover:opacity-90"
                    style={{
                        background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                        boxShadow: `0 4px 15px ${themeColors.dark}4D`,
                    }}
                >
                    เปิดไฟล์เสียง
                </a>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center gap-4">
            {/* Hidden audio element — preload metadata only, NEVER autoplay */}
            <audio
                ref={audioRef}
                preload="metadata"
                onLoadedMetadata={handleLoadedMetadata}
                onDurationChange={handleDurationChange}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onError={handleError}
                className="hidden"
            >
                {mimeType && <source src={audioUrl} type={mimeType} />}
                {/* Bare fallback so browsers that ignore the typed source still resolve */}
                <source src={audioUrl} />
            </audio>

            {/* Large gradient play / pause orb. data-interactive keeps page tap-nav
                from swallowing the tap. .voice-aura pulses only while playing. */}
            <button
                type="button"
                onClick={togglePlay}
                data-interactive
                aria-label={isPlaying ? 'หยุดเสียง' : 'เล่นเสียง'}
                aria-pressed={isPlaying}
                className={`relative flex items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-95 ${
                    isPlaying ? 'voice-aura' : 'animate-pulse-heart'
                }`}
                style={{
                    width: '88px',
                    height: '88px',
                    background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                    boxShadow: `0 8px 24px ${themeColors.dark}4D`,
                    ...auraVars,
                }}
            >
                {isPlaying ? (
                    <Pause size={36} className="fill-current" />
                ) : (
                    // Nudge the play triangle slightly right so it reads centered
                    <Play size={36} className="fill-current ml-1" />
                )}
            </button>

            {/* Static seeded waveform with a transparent range overlay for seeking */}
            <div className="relative w-full max-w-xs">
                <div className="flex items-center justify-between gap-[3px] h-12">
                    {bars.map((height, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-full transition-colors"
                            style={{
                                height: `${Math.round(height * 100)}%`,
                                minWidth: '2px',
                                backgroundColor:
                                    i <= playheadBar ? themeColors.primary : `${themeColors.accent}66`,
                            }}
                        />
                    ))}
                </div>

                {/* Transparent native range = free touch drag-to-seek + a11y */}
                <input
                    type="range"
                    min={0}
                    max={totalKnown ? safeTotal : Math.max(currentTime, 1)}
                    step={0.1}
                    value={Math.min(currentTime, totalKnown ? safeTotal : Math.max(currentTime, 1))}
                    onChange={handleSeek}
                    data-interactive
                    aria-label="เลื่อนตำแหน่งเสียง"
                    className="voice-seek absolute inset-0 w-full h-full cursor-pointer opacity-0 appearance-none [-webkit-appearance:none]"
                    style={{ touchAction: 'none' }}
                />
            </div>

            {/* Time row: current / total (total seeded from props so no NaN flicker) */}
            <div
                className="flex items-center justify-between w-full max-w-xs text-sm font-medium tabular-nums"
                style={{ color: themeColors.dark }}
            >
                <span>{formatTime(currentTime)}</span>
                <span>{totalKnown ? formatTime(safeTotal) : '—'}</span>
            </div>

            {/* Pre-play hint — hidden once playback has started once */}
            {!hasPlayedOnce && (
                <p
                    className="text-center text-sm animate-pulse"
                    style={{ color: themeColors.primary }}
                >
                    แตะเพื่อฟังข้อความเสียง
                </p>
            )}

            {/* Optional caption — italic, centered, like the image caption */}
            {caption && (
                <p className="text-center text-gray-600 italic text-sm leading-relaxed">
                    {caption}
                </p>
            )}
        </div>
    );
}
