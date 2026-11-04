'use client';

import { useTranslations } from 'next-intl';
import { Check, Delete, HelpCircle, Lock, Play } from 'lucide-react';
import HeartIcon from '@/components/HeartIcon';
import Mascot from '@/components/Mascot';
import { getThemeColors } from '@/lib/themes';

interface HeroPhoneDemoProps {
  onOpen: () => void;
  className?: string;
}

const PIN_FILLED = 4;
const NUMPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/**
 * Landing hero: a phone that plays a four-screen sample memory on a CSS loop
 * (PIN gate, message, cartoon photo, quiz). Tapping it opens the real demo.
 * Timing lives in globals.css (`.lp-slide`), so no timers and nothing to hydrate.
 */
export default function HeroPhoneDemo({ onOpen, className = '' }: HeroPhoneDemoProps) {
  const t = useTranslations('landing');
  const colors = getThemeColors('love');

  const slides = [
    // 1. PIN gate
    <div key="pin" className="flex h-full flex-col items-center justify-center text-center">
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${colors.primary}1f`, color: colors.dark }}
      >
        <Lock size={26} />
      </div>
      <p className="font-kanit text-base font-semibold text-[#4A1942]">{t('hero.phone.pinTitle')}</p>
      <p className="mt-1 text-xs text-[#6B5E57]">{t('hero.phone.pinHint')}</p>
      <div className="my-4 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="h-3 w-3 rounded-full border-2"
            style={{
              borderColor: colors.primary,
              backgroundColor: i < PIN_FILLED ? colors.primary : 'transparent',
            }}
          />
        ))}
      </div>
      <div className="grid w-40 grid-cols-3 gap-1.5">
        {NUMPAD.map((k, i) => (
          <span
            key={i}
            className={`flex h-8 items-center justify-center rounded-lg font-kanit text-sm ${
              k === '' ? '' : 'bg-white text-[#4A1942] shadow-sm'
            }`}
          >
            {k === 'del' ? <Delete size={14} /> : k}
          </span>
        ))}
      </div>
    </div>,

    // 2. Message
    <div key="text" className="flex h-full flex-col justify-center">
      <div className="viewer-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <HeartIcon size={16} style={{ color: colors.primary }} />
          <span className="font-kanit text-xs font-medium" style={{ color: colors.primary }}>
            {t('demo.s1.title')}
          </span>
        </div>
        <p className="line-clamp-5 whitespace-pre-line text-sm leading-relaxed text-gray-700">{t('demo.s1.text')}</p>
      </div>
    </div>,

    // 3. Cartoon photo
    <div key="photo" className="flex h-full flex-col justify-center">
      <div className="viewer-card overflow-hidden">
        {/* Plain <img>: the asset is a fixed local PNG and next/image would only add a loader hop here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/template/example.png" alt="" className="aspect-square w-full object-cover" loading="lazy" />
        <div className="p-4">
          <p className="font-kanit text-sm font-semibold text-[#4A1942]">{t('demo.s2.title')}</p>
          <p className="mt-0.5 text-xs text-[#6B5E57]">{t('hero.phone.photoCaption')}</p>
        </div>
      </div>
    </div>,

    // 4. Quiz
    <div key="quiz" className="flex h-full flex-col justify-center">
      <div className="viewer-card p-5 text-center">
        <HelpCircle size={34} className="mx-auto mb-2" style={{ color: colors.primary }} />
        <p className="font-kanit text-sm font-semibold text-[#4A1942]">{t('demo.s3.question')}</p>
        <div className="mt-3 space-y-2 text-left">
          {(['c1', 'c2', 'c3'] as const).map((c, i) => {
            const right = i === 1;
            return (
              <div
                key={c}
                className="flex items-center justify-between rounded-xl border px-3 py-2 text-xs"
                style={{
                  borderColor: right ? colors.primary : '#F5EDE4',
                  backgroundColor: right ? `${colors.primary}14` : 'white',
                  color: right ? colors.dark : '#4A1942',
                }}
              >
                <span>{t(`demo.s3.${c}`)}</span>
                {right && <Check size={14} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
  ];

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('hero.ctaSecondary')}
      className={`group relative block w-[250px] sm:w-[290px] text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-300 rounded-[2.75rem] ${className}`}
    >
      {/* The crab peeks over the top edge */}
      <div className="absolute -top-9 right-7 z-20 transition-transform duration-300 group-hover:-translate-y-1">
        <Mascot size={52} emotion="love" animation="idle" />
      </div>

      {/* Frame */}
      <div className="relative rounded-[2.75rem] bg-[#4A1942] p-2.5 shadow-[0_30px_60px_-20px_rgba(74,25,66,0.45)] transition-transform duration-500 group-hover:-translate-y-1">
        <div
          className="relative aspect-[9/18.5] overflow-hidden rounded-[2.25rem]"
          style={{ background: `linear-gradient(180deg, ${colors.background} 0%, #FFFBF7 100%)` }}
        >
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-[#4A1942]" />

          {/* Viewer-style progress */}
          <div className="absolute inset-x-4 top-9 z-10 flex gap-1">
            {slides.map((_, i) => (
              <span key={i} className="lp-slide-dot h-[3px] flex-1 overflow-hidden rounded-full" style={{ backgroundColor: `${colors.dark}1a` }}>
                <span className="block h-full w-full rounded-full" style={{ backgroundColor: colors.primary, animationDelay: `${i * 3}s` }} />
              </span>
            ))}
          </div>

          {/* Slides (CSS-timed crossfade) */}
          {slides.map((slide, i) => (
            <div key={i} className="lp-slide absolute inset-0 px-4 pb-14 pt-14" style={{ animationDelay: `${i * 3}s` }}>
              {slide}
            </div>
          ))}

          {/* Tap hint */}
          <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#4A1942]/85 px-3 py-1.5 font-kanit text-xs text-white shadow-md backdrop-blur-sm">
              <Play size={12} fill="currentColor" />
              {t('hero.phone.tap')}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
