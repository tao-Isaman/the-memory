'use client';

import { useState, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Memory, MemoryNode } from '@/types/memory';
import { saveMemory, getMemoryById, generateId } from '@/lib/storage';
import HeartIcon from '@/components/HeartIcon';
import NodeEditor from '@/components/NodeEditor';
import NodeList from '@/components/NodeList';

function CreatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  // Initialize state based on editId (computed once)
  const initialData = useMemo(() => {
    if (editId && typeof window !== 'undefined') {
      const existingMemory = getMemoryById(editId);
      if (existingMemory) {
        return {
          title: existingMemory.title,
          nodes: existingMemory.nodes,
          isEditMode: true,
        };
      }
    }
    return { title: '', nodes: [] as MemoryNode[], isEditMode: false };
  }, [editId]);

  const [title, setTitle] = useState(initialData.title);
  const [nodes, setNodes] = useState<MemoryNode[]>(initialData.nodes);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditMode = initialData.isEditMode;

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
      // Update priorities
      return filtered.map((node, index) => ({ ...node, priority: index }));
    });
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a title for your memory');
      return;
    }

    if (nodes.length === 0) {
      alert('Please add at least one node to your memory');
      return;
    }

    setSaving(true);

    const memory: Memory = {
      id: editId || generateId(),
      title: title.trim(),
      nodes,
      createdAt: editId ? (getMemoryById(editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMemory(memory);

    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 500));

    router.push('/');
  };

  return (
    <main className="min-h-screen relative z-10">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-[#E63946] hover:opacity-80 transition-opacity flex items-center gap-2">
            <span>&larr;</span>
            <span>Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <HeartIcon size={24} className="animate-pulse-heart" />
            <span className="text-lg font-semibold text-[#E63946]">
              {isEditMode ? 'Edit Memory' : 'Create Memory'}
            </span>
          </div>
          <div className="w-16" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Title Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Memory Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your memory a special name..."
            className="input-valentine text-xl font-semibold"
          />
        </div>

        {/* Node List */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#E63946]">Memory Nodes</h2>
            <span className="text-sm text-gray-500">
              {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
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
            <span className="text-[#E63946] font-medium">Add Memory Node</span>
          </button>
        )}

        {/* Save Button */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/" className="btn-secondary">
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary min-w-[160px] ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <HeartIcon size={16} className="animate-pulse-heart" />
                Saving...
              </span>
            ) : (
              `${isEditMode ? 'Update' : 'Save'} Memory`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen relative z-10 flex items-center justify-center">
        <div className="text-center">
          <HeartIcon size={48} className="mx-auto animate-pulse-heart" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </main>
    }>
      <CreatePageContent />
    </Suspense>
  );
}
