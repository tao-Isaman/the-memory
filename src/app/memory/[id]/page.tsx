'use client';

import { useEffect, useState, useCallback, useMemo, use, useRef } from 'react';
import Link from 'next/link';
import { Memory, MemoryStory } from '@/types/memory';
import { getMemoryById } from '@/lib/storage';
import { getThemeColors } from '@/lib/themes';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import StoryViewer from '@/components/StoryViewer';
import PasswordGate from '@/components/PasswordGate';
import PaymentButton from '@/components/PaymentButton';
import { Eye } from 'lucide-react';
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
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPasswordLocked, setIsPasswordLocked] = useState(false);
  const [isQuestionLocked, setIsQuestionLocked] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
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

  useEffect(() => {
    if (!autoAdvance || !sortedMemory || isPasswordLocked || isQuestionLocked) return;

    const currentStory = sortedMemory.stories[currentIndex];
    if (!currentStory || currentStory.type === 'password' || currentStory.type === 'youtube' || currentStory.type === 'question') return;
    if (currentIndex >= sortedMemory.stories.length - 1) return;

    const timer = setTimeout(() => {
      handleNext();
    }, 5000);

    return () => clearTimeout(timer);
  }, [autoAdvance, currentIndex, sortedMemory, isPasswordLocked, isQuestionLocked, handleNext]);

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

  const currentStory: MemoryStory | undefined = sortedMemory.stories[currentIndex];
  const isLastStory = currentIndex >= sortedMemory.stories.length - 1;
  const isFirstStory = currentIndex === 0;
  const progress = ((currentIndex + 1) / sortedMemory.stories.length) * 100;
  const themeColors = getThemeColors(sortedMemory.theme);

  const showAutoAdvanceTimer = autoAdvance && !isPasswordLocked && !isQuestionLocked
    && currentStory?.type !== 'youtube' && currentStory?.type !== 'password'
    && currentStory?.type !== 'question' && !isLastStory;

  return (
    <main className="min-h-screen relative flex flex-col overflow-hidden" style={{ backgroundColor: themeColors.background }}>
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

      {/* Header */}
      <header className="relative z-20 py-5 px-4 border-b bg-white/70 backdrop-blur-md" style={{ borderColor: `${themeColors.accent}80` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={isPreviewMode ? `/create?edit=${sortedMemory.id}` : "/"}
            className="hover:opacity-80 transition-opacity flex items-center gap-2"
            style={{ color: themeColors.dark }}
          >
            <span>&larr;</span>
            <span>{isPreviewMode ? 'กลับไปแก้ไข' : 'ออก'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon size={20} className="animate-pulse-heart" style={{ color: themeColors.primary }} />
            <span className="font-kanit font-semibold truncate max-w-[200px]" style={{ color: themeColors.dark }}>
              {sortedMemory.title}
            </span>
          </div>
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className="text-sm px-3 py-1.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: autoAdvance ? themeColors.primary : themeColors.accent,
              color: autoAdvance ? 'white' : themeColors.dark,
              boxShadow: autoAdvance ? `0 2px 8px ${themeColors.primary}40` : 'none',
            }}
          >
            อัตโนมัติ: {autoAdvance ? 'เปิด' : 'ปิด'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.accent}60` }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.dark})`,
                boxShadow: `0 0 8px ${themeColors.primary}50`,
              }}
            />
          </div>

          {/* Auto-advance timer */}
          {showAutoAdvanceTimer && (
            <div className="mt-1.5">
              <div className="h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: `${themeColors.accent}30` }}>
                <div
                  key={`timer-${currentIndex}`}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: `${themeColors.primary}60`,
                    transformOrigin: 'left',
                    animation: 'auto-advance-fill 5s linear forwards',
                  }}
                />
              </div>
            </div>
          )}

          <p className="text-xs mt-1.5 text-center" style={{ color: `${themeColors.dark}80` }}>
            {currentIndex + 1} จาก {sortedMemory.stories.length}
          </p>
        </div>
      </header>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="relative z-20 bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col gap-1 text-yellow-800">
              <div className="flex items-center gap-2">
                <Eye size={18} />
                <span className="text-sm font-medium">
                  นี่คือตัวอย่างที่คนพิเศษของคุณจะเห็น
                </span>
              </div>
              <span className="text-xs">
                เปิดใช้งานเพียง 99 บาท เพื่อส่งลิงก์ให้เขาได้เลย
              </span>
            </div>
            <PaymentButton
              memoryId={sortedMemory.id}
              memoryTitle={sortedMemory.title}
              userId={user!.id}
              className="text-sm py-1.5 px-4"
            />
          </div>
        </div>
      )}

      {/* Story Content with slide transitions */}
      <div className="grow relative z-10 flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl"
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

      {/* Navigation */}
      <footer className="relative z-20 py-5 px-4 border-t bg-white/70 backdrop-blur-md" style={{ borderColor: `${themeColors.accent}80` }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStory}
            className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 ${isFirstStory ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80 active:scale-95'
              }`}
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.dark,
            }}
          >
            &larr; ก่อนหน้า
          </button>

          {/* Enhanced dots indicator */}
          <div className="flex items-center gap-1.5">
            {sortedMemory.stories.map((_, index) => (
              <div
                key={index}
                className="rounded-full transition-all duration-500 ease-out"
                style={{
                  width: index === currentIndex ? '12px' : '8px',
                  height: index === currentIndex ? '12px' : '8px',
                  backgroundColor:
                    index === currentIndex
                      ? themeColors.dark
                      : index < currentIndex
                        ? themeColors.primary
                        : themeColors.accent,
                  boxShadow: index === currentIndex
                    ? `0 0 10px ${themeColors.primary}60`
                    : 'none',
                }}
              />
            ))}
          </div>

          {isLastStory && !isPasswordLocked && !isQuestionLocked ? (
            <Link
              href={isPreviewMode ? `/create?edit=${sortedMemory.id}` : "/"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                boxShadow: `0 4px 20px ${themeColors.dark}40`,
              }}
            >
              {isPreviewMode ? 'แก้ไขต่อ' : 'เสร็จสิ้น'}
              <HeartIcon size={16} filled color="white" />
            </Link>
          ) : (
            <button
              onClick={handleNext}
              disabled={isPasswordLocked || isQuestionLocked}
              className={`px-5 py-2.5 rounded-full font-semibold text-white transition-all duration-300 ${(isPasswordLocked || isQuestionLocked) ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-90 hover:-translate-y-0.5 active:scale-95'
                }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                boxShadow: `0 4px 20px ${themeColors.dark}40`,
              }}
            >
              ถัดไป &rarr;
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}
