export type StoryType = 'password' | 'image' | 'text' | 'text-image' | 'youtube';

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

export type MemoryStory = PasswordStory | ImageStory | TextStory | TextImageStory | YouTubeStory;

export type MemoryStatus = 'pending' | 'active' | 'failed';

export interface Memory {
  id: string;
  userId?: string;
  title: string;
  stories: MemoryStory[];
  createdAt: string;
  updatedAt: string;
  status: MemoryStatus;
  paidAt?: string;
}
