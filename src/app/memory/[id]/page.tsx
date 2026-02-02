'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { Memory, MemoryStory } from '@/types/memory';
import { getMemoryById } from '@/lib/storage';
import { getThemeColors, ThemeColors } from '@/lib/themes';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import StoryViewer from '@/components/StoryViewer';
import PasswordGate from '@/components/PasswordGate';
import PaymentButton from '@/components/PaymentButton';
import { Eye } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MemoryViewerPage({ params }: PageProps) {
  const { id } = use(params);
  const { user } = useAuth();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPasswordLocked, setIsPasswordLocked] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);

  // Memoize sorted memory
  const sortedMemory = useMemo(() => {
    if (!memory) return null;
    const sortedStories = [...memory.stories].sort((a, b) => a.priority - b.priority);
    return { ...memory, stories: sortedStories };
  }, [memory]);

  // Load memory on mount
  useEffect(() => {
    async function loadMemory() {
      const foundMemory = await getMemoryById(id);
      if (foundMemory) {
        setMemory(foundMemory);
        // Check if first story is a password
        const sortedStories = [...foundMemory.stories].sort((a, b) => a.priority - b.priority);
        if (sortedStories.length > 0 && sortedStories[0].type === 'password') {
          setIsPasswordLocked(true);
        }
      }
      setLoading(false);
    }
    loadMemory();
  }, [id]);

  const handleNext = useCallback(() => {
    if (!sortedMemory) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= sortedMemory.stories.length) {
      return;
    }

    const nextStory = sortedMemory.stories[nextIndex];
    if (nextStory.type === 'password') {
      setIsPasswordLocked(true);
    }
    setCurrentIndex(nextIndex);
  }, [sortedMemory, currentIndex]);

  // Auto-advance effect
  useEffect(() => {
    if (!autoAdvance || !sortedMemory || isPasswordLocked) return;

    const currentStory = sortedMemory.stories[currentIndex];
    if (!currentStory || currentStory.type === 'password' || currentStory.type === 'youtube') return;

    const timer = setTimeout(() => {
      if (currentIndex < sortedMemory.stories.length - 1) {
        handleNext();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [autoAdvance, currentIndex, sortedMemory, isPasswordLocked, handleNext]);

  const handlePrevious = useCallback(() => {
    if (!sortedMemory || currentIndex <= 0) return;

    const prevIndex = currentIndex - 1;
    const prevStory = sortedMemory.stories[prevIndex];

    setCurrentIndex(prevIndex);
    // Lock if previous story is a password story
    if (prevStory?.type === 'password') {
      setIsPasswordLocked(true);
    }
  }, [currentIndex, sortedMemory]);

  const handlePasswordUnlock = useCallback(() => {
    setIsPasswordLocked(false);
    if (sortedMemory && currentIndex < sortedMemory.stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [sortedMemory, currentIndex]);

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

  // Check ownership for pending memories
  const isOwner = user && sortedMemory.userId === user.id;
  const isPreviewMode = sortedMemory.status !== 'active' && isOwner;

  // Block non-owners from viewing pending memories
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

  return (
    <main className="min-h-screen relative z-10 flex flex-col" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: themeColors.accent }}>
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
            className="text-sm px-3 py-1 rounded-full transition-colors"
            style={{
              backgroundColor: autoAdvance ? themeColors.primary : themeColors.accent,
              color: autoAdvance ? 'white' : themeColors.dark,
            }}
          >
            อัตโนมัติ: {autoAdvance ? 'เปิด' : 'ปิด'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: themeColors.accent }}>
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(to right, ${themeColors.primary}, ${themeColors.dark})`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {currentIndex + 1} จาก {sortedMemory.stories.length}
          </p>
        </div>
      </header>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <Eye size={18} />
              <span className="text-sm font-medium">
                โหมดตัวอย่าง - ชำระเงินเพื่อแชร์ให้คนพิเศษของคุณ
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

      {/* Content */}
      <div className="grow flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {isPasswordLocked && currentStory?.type === 'password' ? (
            <PasswordGate
              correctPassword={currentStory.content.password}
              title={currentStory.title}
              onUnlock={handlePasswordUnlock}
              themeColors={themeColors}
            />
          ) : currentStory ? (
            <StoryViewer story={currentStory} themeColors={themeColors} />
          ) : null}
        </div>
      </div>

      {/* Navigation */}
      <footer className="py-6 px-4 border-t bg-white/80 backdrop-blur-sm" style={{ borderColor: themeColors.accent }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstStory}
            className={`px-6 py-2.5 rounded-full font-medium transition-all ${
              isFirstStory ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
            }`}
            style={{
              backgroundColor: themeColors.accent,
              color: themeColors.dark,
            }}
          >
            &larr; ก่อนหน้า
          </button>

          {/* Dots indicator */}
          <div className="flex items-center gap-1">
            {sortedMemory.stories.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    index === currentIndex
                      ? themeColors.dark
                      : index < currentIndex
                      ? themeColors.primary
                      : themeColors.accent,
                }}
              />
            ))}
          </div>

          {isLastStory && !isPasswordLocked ? (
            <Link
              href={isPreviewMode ? `/create?edit=${sortedMemory.id}` : "/"}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                boxShadow: `0 4px 15px ${themeColors.dark}4D`,
              }}
            >
              {isPreviewMode ? 'แก้ไขต่อ' : 'เสร็จสิ้น'}
              <HeartIcon size={16} filled color="white" />
            </Link>
          ) : (
            <button
              onClick={handleNext}
              disabled={isPasswordLocked}
              className={`px-6 py-2.5 rounded-full font-semibold text-white transition-all ${
                isPasswordLocked ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:-translate-y-0.5'
              }`}
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
                boxShadow: `0 4px 15px ${themeColors.dark}4D`,
              }}
            >
              ถัดไป &rarr;
            </button>
          )}
        </div>
      </footer>

      {/* Decorative hearts */}
      <div className="fixed bottom-20 left-4 opacity-20 pointer-events-none">
        <HeartIcon size={40} className="animate-float" style={{ color: themeColors.primary }} />
      </div>
      <div className="fixed top-20 right-4 opacity-20 pointer-events-none">
        <HeartIcon size={30} className="animate-float" style={{ color: themeColors.primary }} />
      </div>
    </main>
  );
}
