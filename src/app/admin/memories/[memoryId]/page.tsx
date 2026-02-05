'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Clock, XCircle, Lock, Image as ImageIcon, FileText, Music, Layers, Sparkles } from 'lucide-react';
import HeartLoader from '@/components/HeartLoader';

interface Story {
  id: string;
  type: 'password' | 'image' | 'text' | 'text-image' | 'youtube' | 'scratch';
  priority: number;
  title: string | null;
  content: Record<string, unknown>;
  created_at: string;
}

interface Memory {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'active' | 'failed';
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
}

interface User {
  user_id: string;
  user_email: string;
  referral_code: string;
}

export default function MemoryDetailsPage() {
  const params = useParams();
  const memoryId = params.memoryId as string;
  const [memory, setMemory] = useState<Memory | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/memories/${memoryId}`)
      .then((res) => res.json())
      .then((data) => {
        setMemory(data.memory);
        setUser(data.user);
        setStories(data.stories);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch memory:', err);
        setLoading(false);
      });
  }, [memoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <HeartLoader message="กำลังโหลด..." size="md" />
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="text-center py-12 text-gray-500">
        Memory not found
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle size={14} />
            Paid
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock size={14} />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle size={14} />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const getStoryIcon = (type: string) => {
    switch (type) {
      case 'password':
        return <Lock size={18} className="text-pink-500" />;
      case 'image':
        return <ImageIcon size={18} className="text-blue-500" />;
      case 'text':
        return <FileText size={18} className="text-green-500" />;
      case 'text-image':
        return <Layers size={18} className="text-purple-500" />;
      case 'youtube':
        return <Music size={18} className="text-red-500" />;
      case 'scratch':
        return <Sparkles size={18} className="text-amber-500" />;
      default:
        return null;
    }
  };

  const renderStoryContent = (story: Story) => {
    const content = story.content as Record<string, string>;

    switch (story.type) {
      case 'password':
        return (
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Password:</p>
            <code className="text-lg font-mono text-pink-600">{content.password}</code>
          </div>
        );
      case 'image':
        return (
          <div>
            {content.imageUrl && (
              <img
                src={content.imageUrl}
                alt={content.caption || 'Image'}
                className="rounded-lg max-h-96 w-auto object-contain bg-gray-100"
              />
            )}
            {content.caption && (
              <p className="text-gray-600 mt-2">{content.caption}</p>
            )}
          </div>
        );
      case 'text':
        return (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="whitespace-pre-wrap text-gray-700">{content.text}</p>
          </div>
        );
      case 'text-image':
        return (
          <div>
            {content.imageUrl && (
              <img
                src={content.imageUrl}
                alt="Image"
                className="rounded-lg max-h-96 w-auto object-contain bg-gray-100 mb-3"
              />
            )}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-700">{content.text}</p>
            </div>
          </div>
        );
      case 'youtube':
        return (
          <div>
            <p className="text-sm text-gray-600 mb-2">YouTube URL:</p>
            <a
              href={content.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {content.youtubeUrl}
            </a>
          </div>
        );
      case 'scratch':
        return (
          <div>
            <p className="text-sm text-amber-600 mb-2">Scratch Card Image:</p>
            {content.imageUrl && (
              <img
                src={content.imageUrl}
                alt={content.caption || 'Scratch image'}
                className="rounded-lg max-h-96 w-auto object-contain bg-gray-100"
              />
            )}
            {content.caption && (
              <p className="text-gray-600 mt-2">{content.caption}</p>
            )}
          </div>
        );
      default:
        return (
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div>
      {/* Back button */}
      <Link
        href={user ? `/admin/users/${user.user_id}/memories` : '/admin/users'}
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={18} />
        Back to Memories
      </Link>

      {/* Memory Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{memory.title}</h1>
            <p className="text-gray-500 mt-1">
              By: {user?.user_email || 'Unknown'}
            </p>
          </div>
          {getStatusBadge(memory.status)}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-sm text-gray-500">Memory ID</p>
            <code className="text-sm text-gray-700">{memory.id.slice(0, 8)}...</code>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm text-gray-700">
              {new Date(memory.created_at).toLocaleDateString('th-TH')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid At</p>
            <p className="text-sm text-gray-700">
              {memory.paid_at
                ? new Date(memory.paid_at).toLocaleDateString('th-TH')
                : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Stories</p>
            <p className="text-sm text-gray-700">{stories.length}</p>
          </div>
        </div>

        {/* View public link */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link
            href={`/memory/${memory.id}`}
            target="_blank"
            className="text-blue-600 hover:underline text-sm"
          >
            View Public Memory →
          </Link>
        </div>
      </div>

      {/* Stories */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Stories ({stories.length})</h2>
      <div className="space-y-4">
        {stories.map((story, index) => (
          <div
            key={story.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                {index + 1}
              </span>
              {getStoryIcon(story.type)}
              <span className="font-medium text-gray-700 capitalize">
                {story.type.replace('-', ' ')}
              </span>
              {story.title && (
                <span className="text-gray-500">- {story.title}</span>
              )}
            </div>
            {renderStoryContent(story)}
          </div>
        ))}
      </div>

      {stories.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
          No stories in this memory
        </div>
      )}
    </div>
  );
}
