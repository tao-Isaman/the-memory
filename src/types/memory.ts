export type StoryType = 'password' | 'image' | 'text' | 'text-image' | 'youtube' | 'scratch' | 'question';

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

export type MemoryStory = PasswordStory | ImageStory | TextStory | TextImageStory | YouTubeStory | ScratchStory | QuestionStory;

export type MemoryStatus = 'pending' | 'active' | 'failed';

export type MemoryTheme = 'love' | 'friend' | 'family';

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
}
