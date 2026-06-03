'use client';

import { memo } from 'react';
import { MemoryStory } from '@/types/memory';
import { ThemeColors } from '@/lib/themes';
import YouTubeEmbed from './YouTubeEmbed';
import HeartIcon from './HeartIcon';
import ImageWithLoader from './ImageWithLoader';
import ScratchCard from './ScratchCard';
import QuestionGate from './QuestionGate';
import VoicePlayer from './VoicePlayer';
import SlideshowViewer from './SlideshowViewer';

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
    <div className="flex items-center gap-2 mb-4 flex-shrink-0">
      <HeartIcon size={20} style={{ color: themeColors.primary }} />
      <span className="font-kanit text-sm font-medium" style={{ color: themeColors.primary }}>
        {title}
      </span>
    </div>
  );

  switch (story.type) {
    case 'text':
      return (
        <div className="viewer-card p-8 max-w-2xl mx-auto flex flex-col max-h-full">
          <TitleHeader title={story.title} />
          <div className="min-h-0 overflow-y-auto">
            <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
              {story.content.text}
            </p>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="viewer-card p-6 max-w-2xl mx-auto">
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
        <div className="viewer-card p-6 max-w-2xl mx-auto flex flex-col max-h-full">
          <TitleHeader title={story.title} />
          <div className="min-h-0 overflow-y-auto">
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
        </div>
      );

    case 'youtube':
      // w-full stops the card collapsing (the embed has no intrinsic width).
      // flex-col + max-h-full keeps the card within the viewport so the title
      // (flex-shrink-0) stays pinned at the top instead of being clipped when
      // the wrapper vertically-centers an over-tall card. max-w-4xl keeps the
      // 16:9 video ~480px tall on desktop, matching the image cap.
      return (
        <div className="viewer-card p-6 w-full max-w-4xl mx-auto flex flex-col max-h-full min-h-0">
          <TitleHeader title={story.title} />
          <YouTubeEmbed url={story.content.youtubeUrl} />
        </div>
      );

    case 'scratch':
      return (
        <div className="viewer-card p-6 max-w-2xl mx-auto">
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

    case 'question':
      return (
        <QuestionGate
          question={story.content.question}
          choices={story.content.choices}
          correctIndex={story.content.correctIndex}
          title={story.title}
          onUnlock={() => onReveal?.()}
          themeColors={themeColors}
        />
      );

    case 'voice':
      return (
        <div className="viewer-card p-8 max-w-md mx-auto flex flex-col items-center">
          <TitleHeader title={story.title} />
          <VoicePlayer
            audioUrl={story.content.audioUrl}
            durationSec={story.content.durationSec}
            mimeType={story.content.mimeType}
            caption={story.content.caption}
            themeColors={themeColors}
            onEnded={onReveal}
          />
        </div>
      );

    case 'slideshow':
      return (
        <div className="viewer-card p-3 sm:p-4 max-w-2xl mx-auto flex flex-col max-h-full w-full">
          <TitleHeader title={story.title} />
          <SlideshowViewer
            imageUrls={story.content.imageUrls}
            themeColors={themeColors}
            initialRevealed={isRevealed}
            onComplete={onReveal}
            caption={story.content.caption}
          />
        </div>
      );

    default:
      return null;
  }
}

export default memo(StoryViewer);
