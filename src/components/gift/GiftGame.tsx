'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { trackEvent } from '@/lib/analytics';
import { todayCode, todayCodeHint, effectForDate } from '@/lib/gift/date';
import { GIFT_IMAGES, GIFT_AUDIO } from '@/lib/gift/assets';
import GiftCodeScene from './GiftCodeScene';
import GiftEffects from './GiftEffects';

type Scene = 'intro' | 'unwrap' | 'code' | 'reveal';

const UNWRAP_TAPS = 4;
const DEFAULT_NAME = 'คนพิเศษ';

export default function GiftGame() {
  const params = useSearchParams();
  const router = useRouter();
  const src = params.get('src') || '';

  const [scene, setScene] = useState<Scene>('intro');
  const [nameInput, setNameInput] = useState('');
  const name = nameInput.trim() || DEFAULT_NAME;
  const [taps, setTaps] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const code = useMemo(() => todayCode(), []);
  const hint = useMemo(() => todayCodeHint(), []);
  const effect = useMemo(() => effectForDate(), []);
  const audioRef = useRef<HTMLAudioElement>(null);

  const go = useCallback((s: Scene) => setScene(s), []);

  // Intro → start the game.
  const startGame = () => {
    trackEvent('gift_start', { src });
    go('unwrap');
  };

  // Unwrap taps.
  const tapUnwrap = () => {
    setTaps((t) => {
      const n = t + 1;
      if (n >= UNWRAP_TAPS) {
        trackEvent('gift_unwrap_done', { src });
        setTimeout(() => go('code'), 900);
      }
      return n;
    });
  };

  // Reveal → play music + track.
  useEffect(() => {
    if (scene !== 'reveal') return;
    trackEvent('gift_open_done', { src });
    const a = audioRef.current;
    if (a && soundOn) {
      a.volume = 0.6;
      a.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  const toggleSound = () => {
    const a = audioRef.current;
    const next = !soundOn;
    setSoundOn(next);
    if (!a) return;
    if (next) {
      a.volume = 0.6;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  const goCreate = () => {
    trackEvent('gift_cta_click', { src });
    const q = new URLSearchParams({
      utm_source: 'gift',
      utm_medium: 'minigame',
      utm_campaign: 'xmas_ny',
      to: name,
    });
    if (src) q.set('gift_src', src);
    router.push(`/create?${q.toString()}`);
  };

  const shareGame = async () => {
    trackEvent('gift_share_click', { src });
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      if (navigator.share) await navigator.share({ title: 'กล่องของขวัญ The Memory 🎁', url });
      else {
        await navigator.clipboard.writeText(url);
        alert('คัดลอกลิงก์เกมแล้ว ส่งให้เพื่อนได้เลย ✨');
      }
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-gradient-to-b from-[#1a1140] via-[#2a1a4a] to-[#0b1230] text-white select-none"
      style={{ touchAction: scene === 'code' ? 'none' : 'auto' }}
    >
      {/* Reveal background effect */}
      {scene === 'reveal' && <GiftEffects kind={effect} />}

      <div className="relative z-10 mx-auto flex h-full max-w-md flex-col">
        {/* ---------- INTRO ---------- */}
        {scene === 'intro' && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GIFT_IMAGES.boxClosed.file} alt="กล่องของขวัญ" width={200} height={200} className="drop-shadow-2xl" />
            <h1 className="text-2xl font-bold">ข้างในมีของขวัญ<br />ถึงคนที่คุณคิดถึง… 🎁</h1>
            <p className="text-white/70">ใส่ชื่อคนคนนั้น แล้วเปิดกล่องไปด้วยกัน</p>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value.slice(0, 20))}
              maxLength={20}
              placeholder="ชื่อคนที่คุณคิดถึง (ข้ามได้)"
              className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-3 text-center text-lg placeholder:text-white/40 focus:border-amber-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={startGame}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 to-fuchsia-600 px-6 py-4 text-lg font-bold shadow-lg active:scale-95"
            >
              เปิดกล่องของขวัญ ✨
            </button>
          </div>
        )}

        {/* ---------- UNWRAP ---------- */}
        {scene === 'unwrap' && (
          <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
            <h2 className="text-xl font-semibold">แกะกล่องกันเถอะ! แตะที่กล่อง {UNWRAP_TAPS} ครั้ง</h2>
            <button
              type="button"
              onClick={tapUnwrap}
              aria-label="แตะเพื่อแกะกล่อง"
              className="relative h-56 w-56 active:scale-95"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={GIFT_IMAGES.boxClosed.file} alt="กล่อง" className="absolute inset-0 h-full w-full object-contain" />
              {/* Ribbon loosens with each tap */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={GIFT_IMAGES.ribbon.file}
                alt=""
                className="absolute inset-0 h-full w-full object-contain transition-all duration-300"
                style={{ opacity: 1 - taps / UNWRAP_TAPS, transform: `rotate(${taps * 12}deg) scale(${1 + taps * 0.05})` }}
              />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: UNWRAP_TAPS }).map((_, i) => (
                <span key={i} className={`h-2 w-8 rounded-full ${i < taps ? 'bg-amber-300' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>
        )}

        {/* ---------- CODE ---------- */}
        {scene === 'code' && (
          <GiftCodeScene code={code} hint={hint} onSolved={() => { trackEvent('gift_code_done', { src }); go('reveal'); }} onWrong={() => {}} />
        )}

        {/* ---------- REVEAL + CTA ---------- */}
        {scene === 'reveal' && (
          <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
            <button type="button" onClick={toggleSound} aria-label={soundOn ? 'ปิดเสียงเพลง' : 'เปิดเสียงเพลง'} className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg backdrop-blur">
              {soundOn ? '🔊' : '🔇'}
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GIFT_IMAGES.boxOpen.file} alt="กล่องเปิด" width={220} height={220} className="drop-shadow-2xl" />
            <p className="text-sm text-white/70">ของขวัญนี้ถึง</p>
            <h1 className="text-3xl font-extrabold text-amber-300">ถึง {name} 💛</h1>
            <p className="text-white/80">มีคนคิดถึงคุณอยู่นะ… สุขสันต์เทศกาลแห่งความสุข 🎄</p>
            <div className="mt-2 w-full">
              <button type="button" onClick={goCreate} className="w-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-6 py-4 text-lg font-bold text-[#2a1140] shadow-lg active:scale-95">
                ส่งให้ {name} จริงได้ใน 2 นาที ✨
              </button>
              <p className="mt-1 text-xs text-white/60">สร้างและดูตัวอย่างฟรี</p>
              <button type="button" onClick={shareGame} className="mt-3 w-full rounded-full border border-white/25 px-6 py-3 text-sm text-white/90 active:scale-95">
                แชร์เกมนี้ให้เพื่อน 🔗
              </button>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} src={GIFT_AUDIO.open.file} loop preload="none" className="hidden" aria-hidden="true" />
    </div>
  );
}
