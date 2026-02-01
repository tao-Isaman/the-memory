'use client';

import { useEffect, useState, useCallback, useMemo, use } from 'react';
import Link from 'next/link';
import { Memory, MemoryNode } from '@/types/memory';
import { getMemoryById } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import NodeViewer from '@/components/NodeViewer';
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
    const sortedNodes = [...memory.nodes].sort((a, b) => a.priority - b.priority);
    return { ...memory, nodes: sortedNodes };
  }, [memory]);

  // Load memory on mount
  useEffect(() => {
    async function loadMemory() {
      const foundMemory = await getMemoryById(id);
      if (foundMemory) {
        setMemory(foundMemory);
        // Check if first node is a password
        const sortedNodes = [...foundMemory.nodes].sort((a, b) => a.priority - b.priority);
        if (sortedNodes.length > 0 && sortedNodes[0].type === 'password') {
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
    if (nextIndex >= sortedMemory.nodes.length) {
      return;
    }

    const nextNode = sortedMemory.nodes[nextIndex];
    if (nextNode.type === 'password') {
      setIsPasswordLocked(true);
    }
    setCurrentIndex(nextIndex);
  }, [sortedMemory, currentIndex]);

  // Auto-advance effect
  useEffect(() => {
    if (!autoAdvance || !sortedMemory || isPasswordLocked) return;

    const currentNode = sortedMemory.nodes[currentIndex];
    if (!currentNode || currentNode.type === 'password' || currentNode.type === 'youtube') return;

    const timer = setTimeout(() => {
      if (currentIndex < sortedMemory.nodes.length - 1) {
        handleNext();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [autoAdvance, currentIndex, sortedMemory, isPasswordLocked, handleNext]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPasswordLocked(false);
    }
  }, [currentIndex]);

  const handlePasswordUnlock = useCallback(() => {
    setIsPasswordLocked(false);
    if (sortedMemory && currentIndex < sortedMemory.nodes.length - 1) {
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

  const currentNode: MemoryNode | undefined = sortedMemory.nodes[currentIndex];
  const isLastNode = currentIndex >= sortedMemory.nodes.length - 1;
  const isFirstNode = currentIndex === 0;
  const progress = ((currentIndex + 1) / sortedMemory.nodes.length) * 100;

  return (
    <main className="min-h-screen relative z-10 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b border-pink-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[#E63946] hover:opacity-80 transition-opacity flex items-center gap-2">
            <span>&larr;</span>
            <span>ออก</span>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon size={20} className="animate-pulse-heart" />
            <span className="font-kanit font-semibold text-[#E63946] truncate max-w-[200px]">
              {sortedMemory.title}
            </span>
          </div>
          <button
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              autoAdvance
                ? 'bg-[#FF6B9D] text-white'
                : 'bg-pink-100 text-[#E63946]'
            }`}
          >
            อัตโนมัติ: {autoAdvance ? 'เปิด' : 'ปิด'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="h-2 bg-pink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FF6B9D] to-[#E63946] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            {currentIndex + 1} จาก {sortedMemory.nodes.length}
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
          {isPasswordLocked && currentNode?.type === 'password' ? (
            <PasswordGate
              correctPassword={currentNode.content.password}
              title={currentNode.title}
              onUnlock={handlePasswordUnlock}
            />
          ) : currentNode ? (
            <NodeViewer node={currentNode} />
          ) : null}
        </div>
      </div>

      {/* Navigation */}
      <footer className="py-6 px-4 border-t border-pink-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstNode}
            className={`btn-secondary ${
              isFirstNode ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            &larr; ก่อนหน้า
          </button>

          {/* Dots indicator */}
          <div className="flex items-center gap-1">
            {sortedMemory.nodes.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-[#E63946]'
                    : index < currentIndex
                    ? 'bg-[#FF6B9D]'
                    : 'bg-pink-200'
                }`}
              />
            ))}
          </div>

          {isLastNode && !isPasswordLocked ? (
            <Link href="/" className="btn-primary flex items-center gap-2">
              เสร็จสิ้น
              <HeartIcon size={16} filled />
            </Link>
          ) : (
            <button
              onClick={handleNext}
              disabled={isPasswordLocked}
              className={`btn-primary ${
                isPasswordLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              ถัดไป &rarr;
            </button>
          )}
        </div>
      </footer>

      {/* Decorative hearts */}
      <div className="fixed bottom-20 left-4 opacity-20 pointer-events-none">
        <HeartIcon size={40} className="animate-float" />
      </div>
      <div className="fixed top-20 right-4 opacity-20 pointer-events-none">
        <HeartIcon size={30} className="animate-float" />
      </div>
    </main>
  );
}
