'use client';

import { MemoryStory } from '@/types/memory';
import YouTubeEmbed from './YouTubeEmbed';
import HeartIcon from './HeartIcon';

interface StoryViewerProps {
  story: MemoryStory;
}

export default function StoryViewer({ story }: StoryViewerProps) {
  switch (story.type) {
    case 'text':
      return (
        <div className="memory-card p-8 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {story.title} </span>
          </div>
          <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
            {story.content.text}
          </p>
        </div>
      );

    case 'image':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {story.title} </span>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={story.content.imageUrl}
              alt={story.content.caption || 'รูปภาพความทรงจำ'}
              className="w-full rounded-lg shadow-md"
              style={{ maxHeight: '500px', objectFit: 'contain' }}
            />
            {story.content.caption && (
              <p className="mt-4 text-center text-gray-600 italic">
                {story.content.caption}
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
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {story.title} </span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.content.imageUrl}
            alt="ความทรงจำ"
            className="w-full rounded-lg shadow-md mb-4"
            style={{ maxHeight: '400px', objectFit: 'contain' }}
          />
          <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
            {story.content.text}
          </p>
        </div>
      );

    case 'youtube':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <HeartIcon size={20} />
            <span className="font-kanit text-sm text-[#FF6B9D] font-medium"> {story.title} </span>
          </div>
          <YouTubeEmbed url={story.content.youtubeUrl} />
        </div>
      );

    default:
      return null;
  }
}
