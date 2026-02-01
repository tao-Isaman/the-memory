'use client';

import { useState, useCallback, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Memory, MemoryNode } from '@/types/memory';
import { saveMemory, getMemoryById, generateId } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import HeartIcon from '@/components/HeartIcon';
import HeartLoader from '@/components/HeartLoader';
import NodeEditor from '@/components/NodeEditor';
import NodeList from '@/components/NodeList';
import ShareModal from '@/components/ShareModal';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [nodes, setNodes] = useState<MemoryNode[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedMemoryId, setSavedMemoryId] = useState<string | null>(null);

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
          setNodes(existingMemory.nodes);
          setIsEditMode(true);
          setOriginalCreatedAt(existingMemory.createdAt);
        }
      }
      setInitialLoading(false);
    }

    if (!authLoading && user) {
      loadMemory();
    }
  }, [editId, authLoading, user]);

  const handleAddNode = useCallback((node: MemoryNode) => {
    setNodes((prev) => {
      const newNode = { ...node, priority: prev.length };
      return [...prev, newNode];
    });
    setShowEditor(false);
  }, []);

  const handleReorder = useCallback((newNodes: MemoryNode[]) => {
    setNodes(newNodes);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setNodes((prev) => {
      const filtered = prev.filter((n) => n.id !== id);
      return filtered.map((node, index) => ({ ...node, priority: index }));
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    if (!title.trim()) {
      alert('กรุณาใส่ชื่อความทรงจำ');
      return;
    }

    if (nodes.length === 0) {
      alert('กรุณาเพิ่มอย่างน้อยหนึ่งโหนด');
      return;
    }

    setSaving(true);

    const memoryId = editId || generateId();
    const memory: Memory = {
      id: memoryId,
      title: title.trim(),
      nodes,
      createdAt: originalCreatedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMemory(memory, user.id);
    setSaving(false);
    setSavedMemoryId(memoryId);
    setShowShareModal(true);
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
            <span>&larr;</span>
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

        {/* Node List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-kanit text-lg font-semibold text-[#E63946]">โหนดความทรงจำ</h2>
            <span className="text-sm text-gray-500">
              {nodes.length} โหนด
            </span>
          </div>
          <NodeList nodes={nodes} onReorder={handleReorder} onDelete={handleDelete} />
        </div>

        {/* Add Node Button / Editor */}
        {showEditor ? (
          <NodeEditor onAdd={handleAddNode} onCancel={() => setShowEditor(false)} />
        ) : (
          <button
            onClick={() => setShowEditor(true)}
            className="w-full memory-card p-6 text-center hover:shadow-lg transition-shadow border-2 border-dashed border-[#FFB6C1] hover:border-[#FF6B9D]"
          >
            <span className="text-3xl mb-2 block">+</span>
            <span className="font-kanit text-[#E63946] font-medium">เพิ่มโหนดความทรงจำ</span>
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
