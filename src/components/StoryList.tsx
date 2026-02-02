'use client';

import { MemoryStory } from '@/types/memory';
import { ThemeColors } from '@/lib/themes';
import { storyTypeLabels, storyTypeIcons } from './StoryEditor';
import HeartIcon from './HeartIcon';
import { ChevronUp, ChevronDown, X, Pencil } from 'lucide-react';

interface StoryListProps {
  stories: MemoryStory[];
  onReorder: (stories: MemoryStory[]) => void;
  onDelete: (id: string) => void;
  onEdit: (story: MemoryStory) => void;
  themeColors?: ThemeColors;
}

// Default theme colors (love theme)
const defaultColors: ThemeColors = {
  primary: '#FF6B9D',
  dark: '#E63946',
  accent: '#FFB6C1',
  background: '#FFF0F5',
};

function getStoryPreview(story: MemoryStory): string {
  switch (story.type) {
    case 'password':
      return '••••••';
    case 'text':
      return story.content.text.substring(0, 50) + (story.content.text.length > 50 ? '...' : '');
    case 'image':
      return story.content.caption || 'รูปภาพ';
    case 'text-image':
      return story.content.text.substring(0, 50) + (story.content.text.length > 50 ? '...' : '');
    case 'youtube':
      return 'วิดีโอ YouTube';
    default:
      return '';
  }
}

export default function StoryList({
  stories,
  onReorder,
  onDelete,
  onEdit,
  themeColors = defaultColors,
}: StoryListProps) {
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newStories = [...stories];
    [newStories[index - 1], newStories[index]] = [newStories[index], newStories[index - 1]];
    // Update priorities
    newStories.forEach((story, i) => {
      story.priority = i;
    });
    onReorder(newStories);
  };

  const moveDown = (index: number) => {
    if (index === stories.length - 1) return;
    const newStories = [...stories];
    [newStories[index], newStories[index + 1]] = [newStories[index + 1], newStories[index]];
    // Update priorities
    newStories.forEach((story, i) => {
      story.priority = i;
    });
    onReorder(newStories);
  };

  if (stories.length === 0) {
    return (
      <div className="memory-card p-8 text-center">
        <HeartIcon size={48} className="mx-auto mb-4 opacity-50" color={themeColors.primary} />
        <p className="text-gray-500">ยังไม่มีเรื่องราวความทรงจำ</p>
        <p className="text-sm text-gray-400 mt-1">
          เพิ่มเรื่องราวแรกเพื่อเริ่มสร้างความทรงจำของคุณ!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stories.map((story, index) => (
        <div
          key={story.id}
          className="memory-card p-4 flex items-center gap-4"
        >
          {/* Priority Number */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
            style={{
              background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.dark} 100%)`,
            }}
          >
            {index + 1}
          </div>

          {/* Story Icon */}
          <div className="flex-shrink-0">
            {(() => {
              const IconComponent = storyTypeIcons[story.type];
              return <IconComponent size={24} style={{ color: themeColors.dark }} />;
            })()}
          </div>

          {/* Story Info */}
          <div className="flex-grow min-w-0">
            <p className="font-kanit font-medium text-sm" style={{ color: themeColors.dark }}>
              {story.title || storyTypeLabels[story.type]}
            </p>
            <p className="text-gray-600 text-sm truncate">
              {story.title ? `${storyTypeLabels[story.type]} • ${getStoryPreview(story)}` : getStoryPreview(story)}
            </p>
          </div>

          {/* Reorder Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-1">
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors"
              style={{
                backgroundColor: index === 0 ? '#f3f4f6' : `${themeColors.accent}66`,
                color: index === 0 ? '#d1d5db' : themeColors.dark,
              }}
              title="เลื่อนขึ้น"
            >
              <ChevronUp size={18} />
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === stories.length - 1}
              className="w-8 h-8 rounded flex items-center justify-center transition-colors"
              style={{
                backgroundColor: index === stories.length - 1 ? '#f3f4f6' : `${themeColors.accent}66`,
                color: index === stories.length - 1 ? '#d1d5db' : themeColors.dark,
              }}
              title="เลื่อนลง"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => onEdit(story)}
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors border-2"
            style={{
              borderColor: themeColors.primary,
              color: themeColors.dark,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="แก้ไขเรื่องราว"
          >
            <Pencil size={16} />
          </button>

          {/* Delete Button */}
          <button
            onClick={() => onDelete(story.id)}
            className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center transition-colors border-2"
            style={{
              borderColor: themeColors.dark,
              color: themeColors.dark,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${themeColors.dark}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="ลบเรื่องราว"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}
