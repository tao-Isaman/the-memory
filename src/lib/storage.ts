import { Memory } from '@/types/memory';

const STORAGE_KEY = 'the-memory-data';

export function getMemories(): Memory[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    console.error('Error reading from localStorage');
    return [];
  }
}

export function saveMemory(memory: Memory): void {
  if (typeof window === 'undefined') return;

  try {
    const memories = getMemories();
    const existingIndex = memories.findIndex(m => m.id === memory.id);

    if (existingIndex >= 0) {
      memories[existingIndex] = { ...memory, updatedAt: new Date().toISOString() };
    } else {
      memories.push(memory);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch {
    console.error('Error saving to localStorage');
  }
}

export function deleteMemory(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const memories = getMemories();
    const filtered = memories.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    console.error('Error deleting from localStorage');
  }
}

export function getMemoryById(id: string): Memory | null {
  const memories = getMemories();
  return memories.find(m => m.id === id) || null;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
