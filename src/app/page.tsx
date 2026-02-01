'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Memory } from '@/types/memory';
import { getMemories, deleteMemory } from '@/lib/storage';
import HeartIcon from '@/components/HeartIcon';

export default function HomePage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMemories(getMemories());
    setLoading(false);
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this memory?')) {
      deleteMemory(id);
      setMemories(getMemories());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen relative z-10">
      {/* Header */}
      <header className="py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <HeartIcon size={40} className="animate-pulse-heart" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#FF6B9D] to-[#E63946] bg-clip-text text-transparent">
            The Memory
          </h1>
          <HeartIcon size={40} className="animate-pulse-heart" />
        </div>
        <p className="text-gray-600 max-w-md mx-auto px-4">
          Create beautiful memory presentations for your loved ones
        </p>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Create New Button */}
        <div className="mb-8 text-center">
          <Link href="/create" className="btn-primary inline-flex items-center gap-2">
            <span className="text-xl">+</span>
            Create New Memory
          </Link>
        </div>

        {/* Memories List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-pulse-heart inline-block">
              <HeartIcon size={48} />
            </div>
            <p className="text-gray-500 mt-4">Loading your memories...</p>
          </div>
        ) : memories.length === 0 ? (
          <div className="memory-card p-12 text-center">
            <HeartIcon size={64} className="mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              No memories yet
            </h2>
            <p className="text-gray-500 mb-6">
              Start creating beautiful memories to share with your special someone!
            </p>
            <Link href="/create" className="btn-primary inline-block">
              Create Your First Memory
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {memories.map((memory) => (
              <div key={memory.id} className="memory-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-xl font-bold text-[#E63946] truncate flex-grow">
                    {memory.title}
                  </h2>
                  <HeartIcon size={20} className="flex-shrink-0 ml-2" />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {memory.nodes.length} {memory.nodes.length === 1 ? 'node' : 'nodes'} &bull; Created {formatDate(memory.createdAt)}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/memory/${memory.id}`}
                    className="btn-primary text-sm py-2 px-4 flex-grow text-center"
                  >
                    View Memory
                  </Link>
                  <Link
                    href={`/create?edit=${memory.id}`}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(memory.id)}
                    className="px-4 py-2 text-sm rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>Made with <HeartIcon size={14} className="inline-block align-middle mx-1" /> for your special moments</p>
      </footer>
    </main>
  );
}
