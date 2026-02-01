'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Memory, MemoryStory, MemoryStatus } from '@/types/memory';
import { saveMemory, getMemoryById, generateId } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import StoryEditor from '@/components/StoryEditor';
import StoryList from '@/components/StoryList';
import ShareModal from '@/components/ShareModal';
import PaymentButton from '@/components/PaymentButton';
import { Plus, ArrowLeft } from 'lucide-react';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [stories, setStories] = useState<MemoryStory[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingStory, setEditingStory] = useState<MemoryStory | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);
  const [savedMemoryStatus, setSavedMemoryStatus] = useState<MemoryStatus>('pending');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Load existing memory for edit mode
  useEffect(() => {
    async function loadMemory() {
      if (editId) {
        const existingMemory = await getMemoryById(editId);
        if (existingMemory) {
          setTitle(existingMemory.title);
          setStories(existingMemory.stories);
          setIsEditMode(true);
          setOriginalCreatedAt(existingMemory.createdAt);
          setSavedMemoryStatus(existingMemory.status);
        }
      }
      setInitialLoading(false);
    }

    if (!authLoading && user) {
      loadMemory();
    }
  }, [editId, authLoading, user]);

  const handleSaveStory = useCallback((story: MemoryStory) => {
    if (editingStory) {
      // Update existing story
      setStories((prev) =>
        prev.map((s) => (s.id === story.id ? story : s))
      );
    } else {
      // Add new story
      setStories((prev) => {
        const newStory = { ...story, priority: prev.length };
        return [...prev, newStory];
      });
    }
    setShowEditor(false);
    setEditingStory(null);
  }, [editingStory]);

  const handleEditStory = useCallback((story: MemoryStory) => {
    setEditingStory(story);
    setShowEditor(true);
  }, []);

  const handleReorder = useCallback((newStories: MemoryStory[]) => {
    setStories(newStories);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setStories((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((story, index) => ({ ...story, priority: index }));
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    if (!title.trim()) {
      alert('กรุณาใส่ชื่อความทรงจำ');
      return;
    }

    if (stories.length === 0) {
      alert('กรุณาเพิ่มอย่างน้อยหนึ่งเรื่องราว');
      return;
    }

    setSaving(true);

    const memoryId = editId || generateId();
    // Preserve existing status for edits, set pending for new memories
    const currentStatus = isEditMode ? savedMemoryStatus : 'pending';
    const memory: Memory = {
      id: memoryId,
      title: title.trim(),
      stories,
      createdAt: originalCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: currentStatus,
    };

    await saveMemory(memory, user.id);
    setSaving(false);
    setSavedMemoryId(memoryId);

    // Show payment prompt for new/pending memories, share modal for active ones
    if (currentStatus === 'active') {
      setShowShareModal(true);
    } else {
      setShowPaymentPrompt(true);
    }
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    router.push('/dashboard');
  };

  if (authLoading || initialLoading) {
    return (
      <main className="min-h-screen relative z-10 flex items-center justify-center">
        <HeartLoader message="กำลังโหลด..." size="lg" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen relative z-10">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-[#E63946] hover:opacity-80 transition-opacity flex items-center gap-2">
            <ArrowLeft size={20} />
            <span>กลับ</span>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon size={24} className="animate-pulse-heart" />
            <span className="font-kanit text-lg font-semibold text-[#E63946]">
              {isEditMode ? 'แก้ไขความทรงจำ' : 'สร้างความทรงจำ'}
            </span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Title Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อความทรงจำ
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ตั้งชื่อพิเศษให้ความทรงจำของคุณ..."
            className="input-valentine text-xl font-semibold"
          />
        </div>

        {/* Story List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-kanit text-lg font-semibold text-[#E63946]">เรื่องราวความทรงจำ</h2>
            <span className="text-sm text-gray-500">
              {stories.length} เรื่องราว
            </span>
          </div>
          <StoryList stories={stories} onReorder={handleReorder} onDelete={handleDelete} onEdit={handleEditStory} />
        </div>

        {/* Add Story Button / Editor */}
        {showEditor ? (
          <StoryEditor
            onSave={handleSaveStory}
            onCancel={() => {
              setShowEditor(false);
              setEditingStory(null);
            }}
            editingStory={editingStory || undefined}
          />
        ) : (
          <button
            onClick={() => setShowEditor(true)}
            className="w-full memory-card p-6 text-center hover:shadow-lg transition-shadow border-2 border-dashed border-[#FFB6C1] hover:border-[#FF6B9D]"
          >
            <Plus size={32} className="mx-auto mb-2 text-[#E63946]" />
            <span className="text-[#E63946] font-medium">เพิ่มเรื่องราวความทรงจำ</span>
          </button>
        )}

        {/* Save Button */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/dashboard" className="btn-secondary">
            ยกเลิก
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary min-w-[160px] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <HeartIcon size={16} className="animate-pulse-heart" />
                กำลังบันทึก...
              </span>
            ) : (
              `${isEditMode ? 'อัพเดท' : 'บันทึก'}ความทรงจำ`
            )}
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {savedMemoryId && (
        <ShareModal
          isOpen={showShareModal}
          onClose={handleCloseShareModal}
          memoryId={savedMemoryId}
          memoryTitle={title}
        />
      )}

      {/* Payment Prompt Modal */}
      {showPaymentPrompt && savedMemoryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="memory-card p-8 max-w-md w-full text-center">
            <HeartIcon size={48} className="mx-auto mb-4 animate-pulse-heart" />
            <h2 className="font-kanit text-2xl font-bold text-[#E63946] mb-4">
              บันทึกสำเร็จ!
            </h2>
            <p className="text-gray-600 mb-6">
              ความทรงจำของคุณถูกบันทึกแล้ว ชำระเงินเพื่อเปิดใช้งานและแชร์ให้คนพิเศษของคุณได้เลย
            </p>
            <div className="flex flex-col gap-3">
              <PaymentButton
                memoryId={savedMemoryId}
                memoryTitle={title}
                userId={user!.id}
                className="w-full"
              />
              <button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  router.push(`/memory/${savedMemoryId}`);
                }}
                className="btn-secondary w-full"
              >
                ดูตัวอย่างก่อน
              </button>
              <button
                onClick={() => {
                  setShowPaymentPrompt(false);
                  router.push('/dashboard');
                }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                กลับไปหน้าหลัก
              </button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              คุณสามารถดูตัวอย่างได้ แต่ต้องชำระเงินก่อนจึงจะแชร์ได้
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative z-10 flex items-center justify-center">
        <HeartLoader message="กำลังโหลด..." size="lg" />
      </main>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
