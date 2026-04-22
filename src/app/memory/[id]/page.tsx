'use client';

import { useEffect, useState, useCallback, useMemo, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Memory, MemoryStory } from '@/types/memory';
import { getMemoryById } from '@/lib/storage';
import { getThemeColors } from '@/lib/themes';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import StoryViewer from '@/components/StoryViewer';
import PasswordGate from '@/components/PasswordGate';
import PaymentButton from '@/components/PaymentButton';
import { Eye, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface PageProps {
  params: Promise<{ id: string }>;
}

type AnimState = 'idle' | 'exit-next' | 'enter-next' | 'exit-prev' | 'enter-prev';

const floatingHearts = [
  { size: 24, pos: { top: '12%', left: '6%' } as React.CSSProperties, delay: '0s', duration: '7s' },
  { size: 18, pos: { top: '65%', left: '4%' } as React.CSSProperties, delay: '1.5s', duration: '8s' },
  { size: 28, pos: { top: '25%', right: '5%' } as React.CSSProperties, delay: '0.5s', duration: '6s' },
  { size: 14, pos: { top: '80%', right: '10%' } as React.CSSProperties, delay: '3s', duration: '9s' },
  { size: 20, pos: { top: '45%', right: '3%' } as React.CSSProperties, delay: '2s', duration: '7.5s' },
  { size: 16, pos: { top: '90%', left: '12%' } as React.CSSProperties, delay: '4s', duration: '8.5s' },
];

function getStoryAnimation(state: AnimState): string {
  switch (state) {
    case 'exit-next': return 'slide-out-left 0.3s ease-in both';
    case 'enter-next': return 'slide-in-from-right 0.45s ease-out both';
    case 'exit-prev': return 'slide-out-right 0.3s ease-in both';
    case 'enter-prev': return 'slide-in-from-left 0.45s ease-out both';
    default: return 'none';
  }
}

export default function MemoryViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPasswordLocked, setIsPasswordLocked] = useState(false);
  const [isQuestionLocked, setIsQuestionLocked] = useState(false);
  const [revealedStories, setRevealedStories] = useState<Set<string>>(new Set());
  const [animState, setAnimState] = useState<AnimState>('idle');
  const isNavigating = useRef(false);

  const sortedMemory = useMemo(() => {
    if (!memory) return null;
    const sortedStories = [...memory.stories].sort((a, b) => a.priority - b.priority);
    return { ...memory, stories: sortedStories };
  }, [memory]);

  useEffect(() => {
    async function loadMemory() {
      const foundMemory = await getMemoryById(id);
      if (foundMemory) {
        setMemory(foundMemory);
        const sortedStories = [...foundMemory.stories].sort((a, b) => a.priority - b.priority);
        if (sortedStories.length > 0 && sortedStories[0].type === 'password') {
          setIsPasswordLocked(true);
        }
        if (sortedStories.length > 0 && sortedStories[0].type === 'question') {
          setIsQuestionLocked(true);
        }
        if (foundMemory.status !== 'active' && user && foundMemory.userId === user.id) {
          trackEvent('view_preview', { memory_id: id });
        }
      }
      setLoading(false);
    }
    loadMemory();
  }, [id, user]);

  const navigateWithTransition = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (!sortedMemory || isNavigating.current) return;
    if (newIndex < 0 || newIndex >= sortedMemory.stories.length) return;

    isNavigating.current = true;
    setAnimState(dir === 'next' ? 'exit-next' : 'exit-prev');

    setTimeout(() => {
      const story = sortedMemory.stories[newIndex];
      setIsPasswordLocked(story?.type === 'password');
      setIsQuestionLocked(story?.type === 'question');
      setCurrentIndex(newIndex);
      setAnimState(dir === 'next' ? 'enter-next' : 'enter-prev');

      setTimeout(() => {
        setAnimState('idle');
        isNavigating.current = false;
      }, 450);
    }, 300);
  }, [sortedMemory]);

  const handleNext = useCallback(() => {
    if (!sortedMemory || currentIndex >= sortedMemory.stories.length - 1) return;
    navigateWithTransition(currentIndex + 1, 'next');
  }, [sortedMemory, currentIndex, navigateWithTransition]);

  const handlePrevious = useCallback(() => {
    if (!sortedMemory || currentIndex <= 0) return;
    navigateWithTransition(currentIndex - 1, 'prev');
  }, [sortedMemory, currentIndex, navigateWithTransition]);

  const handlePasswordUnlock = useCallback(() => {
    if (sortedMemory && currentIndex < sortedMemory.stories.length - 1) {
      navigateWithTransition(currentIndex + 1, 'next');
    } else {
      setIsPasswordLocked(false);
    }
  }, [sortedMemory, currentIndex, navigateWithTransition]);

  const handleQuestionUnlock = useCallback(() => {
    if (sortedMemory && currentIndex < sortedMemory.stories.length - 1) {
      navigateWithTransition(currentIndex + 1, 'next');
    } else {
      setIsQuestionLocked(false);
    }
  }, [sortedMemory, currentIndex, navigateWithTransition]);

  // Derived: should this story auto-advance?
  const currentStory: MemoryStory | undefined = sortedMemory?.stories[currentIndex];
  const isLastStory = sortedMemory ? currentIndex >= sortedMemory.stories.length - 1 : false;

  const shouldAutoAdvance = !!currentStory &&
    !isPasswordLocked && !isQuestionLocked && !isLastStory &&
    currentStory.type !== 'password' && currentStory.type !== 'question' &&
    currentStory.type !== 'youtube' &&
    !(currentStory.type === 'scratch' && !revealedStories.has(currentStory.id));

  // Auto-advance (always on for applicable stories)
  useEffect(() => {
    if (!shouldAutoAdvance || !sortedMemory) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [shouldAutoAdvance, currentIndex, sortedMemory, handleNext]);

  // Tap to navigate
  const handleContentTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isNavigating.current) return;
    if (isPasswordLocked || isQuestionLocked) return;

    // Don't intercept clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea, iframe, canvas, video, [data-interactive]')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width;

    if (relativeX < 0.3) {
      handlePrevious();
    } else if (isLastStory && sortedMemory) {
      const isOwner = user && sortedMemory.userId === user.id;
      const isPreview = sortedMemory.status !== 'active' && isOwner;
      router.push(isPreview ? `/create?edit=${sortedMemory.id}` : '/');
    } else {
      handleNext();
    }
  }, [isPasswordLocked, isQuestionLocked, handlePrevious, handleNext, isLastStory, sortedMemory, user, router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPasswordLocked || isQuestionLocked || isNavigating.current) return;

      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        if (isLastStory && sortedMemory) {
          const isOwner = user && sortedMemory.userId === user.id;
          const isPreview = sortedMemory.status !== 'active' && isOwner;
          router.push(isPreview ? `/create?edit=${sortedMemory.id}` : '/');
        } else {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, isPasswordLocked, isQuestionLocked, isLastStory, sortedMemory, user, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังโหลดความทรงจำของคุณ..." size="lg" />
      </main>
    );
  }

  if (!sortedMemory) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center memory-card p-12">
          <HeartIcon size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-kanit text-xl font-semibold text-gray-600 mb-2">ไม่พบความทรงจำ</h2>
          <p className="text-gray-500 mb-6">ความทรงจำนี้ไม่มีอยู่หรือถูกลบไปแล้ว</p>
          <Link href="/" className="btn-primary inline-block">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  const isOwner = user && sortedMemory.userId === user.id;
  const isPreviewMode = sortedMemory.status !== 'active' && isOwner;

  if (sortedMemory.status !== 'active' && !isOwner) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center memory-card p-12">
          <HeartIcon size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className="font-kanit text-xl font-semibold text-gray-600 mb-2">ความทรงจำนี้ยังไม่พร้อมใช้งาน</h2>
          <p className="text-gray-500 mb-6">ผู้สร้างความทรงจำยังไม่ได้เปิดใช้งาน กรุณาติดต่อผู้ส่งลิงก์</p>
          <Link href="/" className="btn-primary inline-block">
            กลับหน้าหลัก
          </Link>
        </div>
      </main>
    );
  }

  const themeColors = getThemeColors(sortedMemory.theme);
  const closeHref = isPreviewMode ? `/create?edit=${sortedMemory.id}` : '/';

  return (
    <main
      className="h-dvh relative flex flex-col overflow-hidden select-none"
      style={{ backgroundColor: themeColors.background }}
    >
      {/* Atmospheric background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(ellipse at 15% 50%, ${themeColors.accent}25 0%, transparent 55%),
          radial-gradient(ellipse at 85% 20%, ${themeColors.primary}12 0%, transparent 45%),
          radial-gradient(ellipse at 50% 90%, ${themeColors.accent}18 0%, transparent 50%)
        `,
      }} />

      {/* Floating hearts */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart, i) => (
          <HeartIcon
            key={i}
            size={heart.size}
            className="absolute"
            style={{
              color: themeColors.primary,
              opacity: 0.1,
              ...heart.pos,
              animation: `float ${heart.duration} ease-in-out ${heart.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Instagram-style top bar ── */}
      <div
        className="relative z-40 flex-shrink-0"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        {/* Segmented progress bars */}
        <div className="flex gap-1 px-3 pb-1">
          {sortedMemory.stories.map((_, i) => (
            <div
              key={i}
              className="h-[3px] flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: `${themeColors.dark}18` }}
            >
              {i < currentIndex ? (
                <div
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: themeColors.primary }}
                />
              ) : i === currentIndex ? (
                <div
                  key={`seg-${currentIndex}`}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: themeColors.primary,
                    transformOrigin: 'left',
                    animation: shouldAutoAdvance
                      ? 'auto-advance-fill 5s linear forwards'
                      : 'none',
                    transform: shouldAutoAdvance ? undefined : 'scaleX(0)',
                  }}
                />
              ) : null}
            </div>
          ))}
        </div>

        {/* Title + close button */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <HeartIcon size={18} className="flex-shrink-0 animate-pulse-heart" style={{ color: themeColors.primary }} />
            <span
              className="font-kanit text-sm font-semibold truncate"
              style={{ color: themeColors.dark }}
            >
              {sortedMemory.title}
            </span>
          </div>
          <Link
            href={closeHref}
            className="flex-shrink-0 p-1.5 rounded-full transition-colors hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} style={{ color: themeColors.dark }} />
          </Link>
        </div>
      </div>

      {/* Preview Mode Banner (floating) */}
      {isPreviewMode && (
        <div className="relative z-40 mx-3 mb-2">
          <div
            className="rounded-2xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2"
            style={{
              backgroundColor: 'rgba(254, 243, 199, 0.9)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(253, 224, 71, 0.5)',
            }}
          >
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <Eye size={16} />
              <span>ตัวอย่าง — เปิดใช้งาน 99 บาท</span>
            </div>
            <PaymentButton
              memoryId={sortedMemory.id}
              memoryTitle={sortedMemory.title}
              userId={user!.id}
              className="text-xs py-1 px-3"
            />
          </div>
        </div>
      )}

      {/* ── Story content area (tappable) ── */}
      <div
        className="grow relative z-10 flex items-center justify-center p-4 cursor-pointer"
        onClick={handleContentTap}
      >
        {/* Tap zone hints (visible briefly on first load) */}
        <div className="absolute left-0 top-0 w-[30%] h-full z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 w-[70%] h-full z-20 pointer-events-none" />

        {/* Story content with slide animation */}
        <div
          className="w-full max-w-2xl relative z-10 h-full flex flex-col justify-center"
          style={{ animation: getStoryAnimation(animState) }}
        >
          {isPasswordLocked && currentStory?.type === 'password' ? (
            <PasswordGate
              correctPassword={currentStory.content.password}
              title={currentStory.title}
              onUnlock={handlePasswordUnlock}
              themeColors={themeColors}
            />
          ) : currentStory ? (
            <StoryViewer
              key={currentStory.id}
              story={currentStory}
              themeColors={themeColors}
              isRevealed={revealedStories.has(currentStory.id)}
              onReveal={currentStory.type === 'question' ? handleQuestionUnlock : () => setRevealedStories(prev => new Set(prev).add(currentStory.id))}
            />
          ) : null}
        </div>
      </div>

      {/* ── Floating completion button (last story) ── */}
      {isLastStory && !isPasswordLocked && !isQuestionLocked && (
        <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center animate-fade-in-up">
          <Link
            href={closeHref}
            className="flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
              boxShadow: `0 8px 25px ${themeColors.dark}50`,
            }}
          >
            {isPreviewMode ? 'แก้ไขต่อ' : 'เสร็จสิ้น'}
            <HeartIcon size={18} filled color="white" />
          </Link>
        </div>
      )}
    </main>
  );
}
