export type StoryType = 'password' | 'image' | 'text' | 'text-image' | 'youtube' | 'scratch' | 'question' | 'voice' | 'slideshow';

export interface BaseStory {
  id: string;
  type: StoryType;
  priority: number;
  title?: string;
  createdAt: string;
}

export interface PasswordStory extends BaseStory {
  type: 'password';
  content: { password: string };
}

export interface ImageStory extends BaseStory {
  type: 'image';
  content: { imageUrl: string; caption?: string };
}

export interface TextStory extends BaseStory {
  type: 'text';
  content: { text: string };
}

export interface TextImageStory extends BaseStory {
  type: 'text-image';
  content: { text: string; imageUrl: string };
}

export interface YouTubeStory extends BaseStory {
  type: 'youtube';
  content: { youtubeUrl: string };
}

export interface ScratchStory extends BaseStory {
  type: 'scratch';
  content: { imageUrl: string; caption?: string };
}

export interface QuestionStory extends BaseStory {
  type: 'question';
  content: {
    question: string;      // The question text
    choices: string[];     // Array of 4 choice strings
    correctIndex: number;  // Index of correct answer (0-3)
  };
}

export interface VoiceStory extends BaseStory {
  type: 'voice';
  content: {
    audioUrl: string;            // public URL in the `audio` bucket, voices/ folder (NEVER a blob/objectURL)
    durationSec: number;         // 1..60 integer, computed editor-side (wall-clock for record, loadedmetadata for upload) — AUTHORITATIVE, sidesteps Chrome webm duration:Infinity
    mimeType: string;            // ACTUAL recorded/uploaded container, e.g. 'audio/mp4' | 'audio/webm' | 'audio/mpeg' | 'audio/wav' — used for <source type>
    source: 'record' | 'upload'; // analytics/future affordance; not viewer-critical
    caption?: string;            // optional one-line caption under the player (<= STORY_TEXT_LIMITS.caption)
  };
}

export interface SlideshowStory extends BaseStory {
  type: 'slideshow';
  content: {
    imageUrls: string[];   // 2..5 public WebP URLs in the `images` bucket — array ORDER = display order
    caption?: string;      // single overall caption shown beneath the stage (<= STORY_TEXT_LIMITS.caption)
  };
}

export type MemoryStory = PasswordStory | ImageStory | TextStory | TextImageStory | YouTubeStory | ScratchStory | QuestionStory | VoiceStory | SlideshowStory;

export type MemoryStatus = 'pending' | 'active' | 'failed';

export type MemoryTheme = 'love' | 'friend' | 'family' | 'anniversary' | 'birthday' | 'apology' | 'longdistance';

export interface Memory {
  id: string;
  userId?: string;
  title: string;
  stories: MemoryStory[];
  createdAt: string;
  updatedAt: string;
  status: MemoryStatus;
  paidAt?: string;
  theme: MemoryTheme;
  /**
   * Universe (จักรวาล): include this memory's stories in the public feed.
   * Opt-out — defaults to true; the owner unticks to hide the memory.
   * Applies to ALL image/text stories, including those behind a PIN story
   * (the checkbox is the owner's explicit consent; PIN gates only the link's
   * viewing sequence — product decision 2026-06-12, migration 025).
   */
  shareToUniverse: boolean;
}
