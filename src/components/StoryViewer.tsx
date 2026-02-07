'use client';

import { memo } from 'react';
import { MemoryStory } from '@/types/memory';
import { ThemeColors } from '@/lib/themes';
import YouTubeEmbed from './YouTubeEmbed';
import HeartIcon from './HeartIcon';
import ImageWithLoader from './ImageWithLoader';
import ScratchCard from './ScratchCard';

interface StoryViewerProps {
  story: MemoryStory;
  themeColors?: ThemeColors;
  isRevealed?: boolean;
  onReveal?: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#FF6B9D',
  dark: '#E63946',
  accent: '#FFB6C1',
  background: '#FFF0F5',
};

function StoryViewer({ story, themeColors = defaultColors, isRevealed, onReveal }: StoryViewerProps) {
  const TitleHeader = ({ title }: { title?: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <HeartIcon size={20} style={{ color: themeColors.primary }} />
      <span className="font-kanit text-sm font-medium" style={{ color: themeColors.primary }}>
        {title}
      </span>
    </div>
  );

  switch (story.type) {
    case 'text':
      return (
        <div className="memory-card p-8 max-w-2xl mx-auto animate-fade-in-up">
          <TitleHeader title={story.title} />
          <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
            {story.content.text}
          </p>
        </div>
      );

    case 'image':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <TitleHeader title={story.title} />
          <ImageWithLoader
            src={story.content.imageUrl}
            alt={story.content.caption || 'รูปภาพความทรงจำ'}
            className="w-full rounded-lg shadow-md"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
            themeColors={themeColors}
          />
          {story.content.caption && (
            <p className="mt-4 text-center text-gray-600 italic">
              {story.content.caption}
            </p>
          )}
        </div>
      );

    case 'text-image':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <TitleHeader title={story.title} />
          <div className="mb-4">
            <ImageWithLoader
              src={story.content.imageUrl}
              alt="ความทรงจำ"
              className="w-full rounded-lg shadow-md"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
              themeColors={themeColors}
            />
          </div>
          <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
            {story.content.text}
          </p>
        </div>
      );

    case 'youtube':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <TitleHeader title={story.title} />
          <YouTubeEmbed url={story.content.youtubeUrl} />
        </div>
      );

    case 'scratch':
      return (
        <div className="memory-card p-6 max-w-2xl mx-auto animate-fade-in-up">
          <TitleHeader title={story.title} />
          <ScratchCard
            imageUrl={story.content.imageUrl}
            themeColors={themeColors}
            initialRevealed={isRevealed}
            onComplete={onReveal}
          />
          {story.content.caption && (
            <p className="mt-4 text-center text-gray-600 italic">
              {story.content.caption}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

export default memo(StoryViewer);
