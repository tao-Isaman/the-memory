'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import StoryViewer from '@/components/StoryViewer';
import HeartIcon from '@/components/HeartIcon';
import Mascot from '@/components/Mascot';
import { getThemeColors } from '@/lib/themes';
import { trackEvent } from '@/lib/analytics';
import type { MemoryStory } from '@/types/memory';

interface DemoMemoryModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Landing-page demo: a three-story sample memory (text, cartoon photo + text, quiz)
 * rendered with the real StoryViewer, ending on a "make your own / sign in" screen.
 */
export default function DemoMemoryModal({ open, onClose }: DemoMemoryModalProps) {
  const t = useTranslations('landing.demo');
  const colors = getThemeColors('love');
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [ended, setEnded] = useState(false);

  const stories = useMemo<MemoryStory[]>(
    () => [
      { id: 'demo-1', type: 'text', priority: 0, createdAt: '', title: t('s1.title'), content: { text: t('s1.text') } },
      {
        id: 'demo-2',
        type: 'text-image',
        priority: 1,
        createdAt: '',
        title: t('s2.title'),
        content: { imageUrl: '/template/example.png', text: t('s2.text') },
      },
      {
        id: 'demo-3',
        type: 'question',
        priority: 2,
        createdAt: '',
        title: t('s3.title'),
        content: { question: t('s3.question'), choices: [t('s3.c1'), t('s3.c2'), t('s3.c3'), t('s3.c4')], correctIndex: 1 },
      },
    ],
    [t],
  );

  const restart = useCallback(() => {
    setIndex(0);
    setAnswered(false);
    setEnded(false);
  }, []);

  // Fresh run each time it opens; lock page scroll; Escape closes.
  useEffect(() => {
    if (!open) return;
    restart();
    trackEvent('view_demo');
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, restart]);

  if (!open) return null;

  const story = stories[index];
  const isLast = index === stories.length - 1;
  const locked = story.type === 'question' && !answered;

  const next = () => {
    if (locked) return;
    if (isLast) {
      setEnded(true);
      trackEvent('complete_demo');
    } else {
      setIndex((i) => i + 1);
    }
  };
  const prev = () => setIndex((i) => Math.max(0, i - 1));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      className="fixed inset-0 z-[70] flex flex-col"
      style={{ background: `linear-gradient(180deg, ${colors.background} 0%, #FFFBF7 100%)` }}
    >
      {/* Top bar: segmented progress + title + close */}
      <div className="flex-shrink-0" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="flex gap-1 px-3 pb-1">
          {stories.map((s, i) => (
            <div key={s.id} className="h-[3px] flex-1 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.dark}18` }}>
              {ended || i <= index ? <div className="w-full h-full rounded-full" style={{ backgroundColor: colors.primary }} /> : null}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <HeartIcon size={18} className="flex-shrink-0 animate-pulse-heart" style={{ color: colors.primary }} />
            <span className="font-kanit font-semibold text-[#4A1942] truncate">{t('title')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/70 text-[#6B5E57] border border-pink-100 whitespace-nowrap">{t('badge')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="w-9 h-9 rounded-full bg-white/80 border border-pink-100 flex items-center justify-center text-[#6B5E57] hover:bg-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grow min-h-0 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {ended ? (
            <div className="viewer-card p-8 text-center animate-fade-in-up">
              <div className="flex justify-center mb-3">
                <Mascot size={96} emotion="love" animation="bounce" />
              </div>
              <h2 className="font-kanit text-2xl font-bold text-[#4A1942] mb-2">{t('end.heading')}</h2>
              <p className="text-[#6B5E57] mb-6">{t('end.text')}</p>
              <Link
                href="/login"
                onClick={() => trackEvent('click_create_cta', { source: 'demo' })}
                className="btn-primary inline-flex items-center justify-center gap-2 text-lg py-3.5 px-8 w-full sm:w-auto"
              >
                <span>{t('end.cta')}</span>
                <HeartIcon size={18} filled />
              </Link>
              <p className="text-xs text-[#6B5E57] mt-3">{t('end.hint')}</p>
              <button type="button" onClick={restart} className="mt-5 text-sm text-[#E63946] underline underline-offset-4">
                {t('end.replay')}
              </button>
            </div>
          ) : (
            <StoryViewer key={story.id} story={story} themeColors={colors} isRevealed={answered} onReveal={() => setAnswered(true)} />
          )}
        </div>
      </div>

      {/* Bottom nav */}
      {!ended && (
        <div className="flex-shrink-0 px-4 flex items-center justify-between gap-3" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label={t('prev')}
            className="w-11 h-11 rounded-full bg-white/80 border border-pink-100 flex items-center justify-center text-[#4A1942] disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-sm text-[#6B5E57] text-center">
            {locked ? t('answerFirst') : t('counter', { current: index + 1, total: stories.length })}
          </div>
          <button
            type="button"
            onClick={next}
            disabled={locked}
            className="btn-primary h-11 px-5 flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>{isLast ? t('finish') : t('next')}</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
