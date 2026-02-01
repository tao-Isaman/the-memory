'use client';

import { MemoryNode } from '@/types/memory';
import YouTubeEmbed from './YouTubeEmbed';
import HeartIcon from './HeartIcon';

interface NodeViewerProps {
  node: MemoryNode;
}

export default function NodeViewer({ node }: NodeViewerProps) {
  switch (node.type) {
    case 'text':
      return (
        <div className="memory-card p-8 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {node.title} </span>
          </div>
          <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
            {node.content.text}
          </p>
        </div>
      );

    case 'image':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {node.title} </span>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={node.content.imageUrl}
              alt={node.content.caption || 'รูปภาพความทรงจำ'}
              className="w-full rounded-lg shadow-md"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
            {node.content.caption && (
              <p className="mt-4 text-center text-gray-600 italic">
                {node.content.caption}
              </p>
            )}
          </div>
        </div>
      );

    case 'text-image':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {node.title} </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.content.imageUrl}
            alt="ความทรงจำ"
            className="w-full rounded-lg shadow-md mb-4"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
          <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
            {node.content.text}
          </p>
        </div>
      );

    case 'youtube':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {node.title} </span>
          </div>
          <YouTubeEmbed url={node.content.youtubeUrl} />
        </div>
      );

    default:
      return null;
  }
}
