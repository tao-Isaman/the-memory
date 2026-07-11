import { MemoryTheme } from '@/types/memory';

export interface ThemeColors {
  primary: string;
  dark: string;
  accent: string;
  background: string;
}

export const THEMES: Record<MemoryTheme, ThemeColors> = {
  love: {
    primary: '#FF6B9D',
    dark: '#E63946',
    accent: '#FFB6C1',
    background: '#FFF0F5',
  },
  friend: {
    primary: '#6BCB77',
    dark: '#2D9B4E',
    accent: '#A8E6CF',
    background: '#F0FFF4',
  },
  family: {
    primary: '#6B9FFF',
    dark: '#4169E1',
    accent: '#B6D4FF',
    background: '#F0F5FF',
  },
  anniversary: {
    primary: '#C9A96E',
    dark: '#8B7340',
    accent: '#F0E6C8',
    background: '#FFFBF2',
  },
  birthday: {
    primary: '#FF8C42',
    dark: '#D4622B',
    accent: '#FFD4B0',
    background: '#FFF5ED',
  },
  apology: {
    primary: '#9B8EC4',
    dark: '#6B5B95',
    accent: '#D4CCE6',
    background: '#F5F0FF',
  },
  longdistance: {
    primary: '#5BA4CF',
    dark: '#3A7CA5',
    accent: '#B8D9F0',
    background: '#F0F7FF',
  },
};

// Locale-independent theme metadata. The display name + mood copy lives in the
// `create.themes.<theme>` messages (this module is imported from plain server/client
// libs, so it must NOT depend on next-intl); only the emoji + the internal English
// name stay here.
export const THEME_INFO: Record<MemoryTheme, { name: string; emoji: string }> = {
  love: {
    name: 'Love',
    emoji: '💕',
  },
  friend: {
    name: 'Friend',
    emoji: '🌿',
  },
  family: {
    name: 'Family',
    emoji: '💙',
  },
  anniversary: {
    name: 'Anniversary',
    emoji: '💍',
  },
  birthday: {
    name: 'Birthday',
    emoji: '🎂',
  },
  apology: {
    name: 'Apology',
    emoji: '🌷',
  },
  longdistance: {
    name: 'Long Distance',
    emoji: '✈️',
  },
};

// Display order of the theme grid in ThemeSelector.
export const THEME_ORDER: MemoryTheme[] = [
  'love',
  'anniversary',
  'birthday',
  'apology',
  'family',
  'friend',
  'longdistance',
];

export function getThemeColors(theme: MemoryTheme): ThemeColors {
  return THEMES[theme] || THEMES.love;
}
