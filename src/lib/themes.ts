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
};

export const THEME_INFO: Record<MemoryTheme, { name: string; nameThai: string; emoji: string }> = {
  love: {
    name: 'Love',
    nameThai: 'ความรัก',
    emoji: '💕',
  },
  friend: {
    name: 'Friend',
    nameThai: 'มิตรภาพ',
    emoji: '🌿',
  },
  family: {
    name: 'Family',
    nameThai: 'ครอบครัว',
    emoji: '💙',
  },
};

export function getThemeColors(theme: MemoryTheme): ThemeColors {
  return THEMES[theme] || THEMES.love;
}
