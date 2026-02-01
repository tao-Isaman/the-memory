'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Memory } from '@/types/memory';
import { getMemories, deleteMemory } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import ShareModal from '@/components/ShareModal';
import PaymentStatus from '@/components/PaymentStatus';
import PaymentButton from '@/components/PaymentButton';
import { Plus, Share2, Pencil, Trash2, Eye } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handleShare = (memory: Memory) => {
    setSelectedMemory(memory);
    setShowShareModal(true);
  };

  const loadMemories = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await getMemories(user.id);
    setMemories(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadMemories();
    }
  }, [user, loadMemories]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบความทรงจำนี้?')) {
      await deleteMemory(id, user.id);
      loadMemories();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <HeartLoader message="กำลังเชื่อมต่อ..." size="lg" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen relative z-10">
      {/* Header */}
      <header className="py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HeartIcon size={40} className="animate-pulse-heart" />
          <Link href="/">
            <h1 className="font-leckerli text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              The Memory
            </h1>
          </Link>
          <HeartIcon size={40} className="animate-pulse-heart" />
        </div>
        <p className="text-gray-600 max-w-md mx-auto px-4">
          สร้างความทรงจำสวยๆ ให้คนที่คุณรัก
        </p>
        {/* User Info */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-sm text-gray-500">
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-[#E63946] hover:underline"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-2 pb-12">
        {/* Create New Button */}
        <div className="mb-8 text-center">
          <Link href="/create" className="btn-primary inline-flex items-center gap-2">
            <Plus size={20} />
            สร้างความทรงจำใหม่
          </Link>
        </div>

        {/* Memories List */}
        {loading ? (
          <div className="text-center py-12">
            <HeartLoader message="กำลังโหลดความทรงจำของคุณ..." size="md" />
          </div>
        ) : memories.length === 0 ? (
          <div className="memory-card p-12 text-center">
            <HeartIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="font-kanit text-xl font-semibold text-gray-600 mb-2">
              ยังไม่มีความทรงจำ
            </h2>
            <p className="text-gray-500 mb-6">
              เริ่มสร้างความทรงจำสวยๆ เพื่อแชร์กับคนพิเศษของคุณเลย!
            </p>
            <Link href="/create" className="btn-primary inline-block">
              สร้างความทรงจำแรกของคุณ
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memories.map((memory) => (
              <div key={memory.id} className="memory-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-kanit text-xl font-bold text-[#E63946] truncate grow">
                    {memory.title}
                  </h2>
                  <PaymentStatus status={memory.status} size="sm" />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {memory.nodes.length} โหนด &bull; สร้างเมื่อ {formatDate(memory.createdAt)}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {memory.status === 'active' ? (
                    <>
                      <Link
                        href={`/memory/${memory.id}`}
                        className="btn-primary text-sm py-2 px-3 flex-1 text-center flex items-center justify-center gap-1"
                        title="ดูความทรงจำ"
                      >
                        <span>ดูความทรงจำ</span>
                      </Link>
                      <button
                        onClick={() => handleShare(memory)}
                        className="px-3 py-2 text-sm rounded-full bg-pink-100 text-[#E63946] hover:bg-pink-200 transition-colors flex items-center justify-center gap-1"
                        title="แชร์"
                      >
                        <Share2 size={16} />
                        <span className="hidden sm:inline">แชร์</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/memory/${memory.id}`}
                        className="btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1"
                        title="ดูตัวอย่าง"
                      >
                        <Eye size={16} />
                        <span className="hidden sm:inline">ดูตัวอย่าง</span>
                      </Link>
                      <PaymentButton
                        memoryId={memory.id}
                        memoryTitle={memory.title}
                        userId={user.id}
                        className="flex-1 text-sm py-2"
                      />
                    </>
                  )}
                  <Link
                    href={`/create?edit=${memory.id}`}
                    className="btn-secondary text-sm py-2 px-3 flex items-center justify-center gap-1"
                    title="แก้ไข"
                  >
                    <Pencil size={16} />
                    <span className="hidden sm:inline">แก้ไข</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="px-3 py-2 text-sm rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    title="ลบ"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">ลบ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>สร้างด้วย <HeartIcon size={14} className="inline-block align-middle mx-1" /> สำหรับช่วงเวลาพิเศษของคุณ</p>
      </footer>

      {/* Share Modal */}
      {selectedMemory && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedMemory(null);
          }}
          memoryId={selectedMemory.id}
          memoryTitle={selectedMemory.title}
          showSuccessMessage={false}
        />
      )}
    </main>
  );
}
