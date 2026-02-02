import { Memory, MemoryStory, MemoryStatus, MemoryTheme } from '@/types/memory';
import { getSupabaseBrowserClient } from './supabase';
import { Database, Json } from '@/types/database';

type DbMemory = Database['public']['Tables']['memories']['Row'];
type DbStory = Database['public']['Tables']['stories']['Row'];

// Convert database memory + stories to app Memory format
function toMemory(dbMemory: DbMemory, dbStories: DbStory[]): Memory {
  const stories = dbStories.map((story) => ({
    id: story.id,
    type: story.type as MemoryStory['type'],
    priority: story.priority,
    title: story.title || undefined,
    content: story.content as MemoryStory['content'],
    createdAt: story.created_at,
  })) as MemoryStory[];

  return {
    id: dbMemory.id,
    userId: dbMemory.user_id,
    title: dbMemory.title,
    stories: stories.sort((a, b) => a.priority - b.priority),
    createdAt: dbMemory.created_at,
    updatedAt: dbMemory.updated_at,
    status: (dbMemory.status || 'pending') as MemoryStatus,
    paidAt: dbMemory.paid_at || undefined,
    theme: (dbMemory.theme || 'love') as MemoryTheme,
  };
}

// Type for memory with embedded stories from Supabase join
type DbMemoryWithStories = DbMemory & {
  stories: DbStory[];
};

// Get all memories for a user - OPTIMIZED: Single query with join
export async function getMemories(userId: string): Promise<Memory[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  // Single query with join instead of N+1
  const { data: memoriesWithStories, error } = await supabase
    .from('memories')
    .select('*, stories(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !memoriesWithStories) {
    console.error('Error fetching memories:', error);
    return [];
  }

  return (memoriesWithStories as DbMemoryWithStories[]).map((memory) =>
    toMemory(memory, memory.stories || [])
  );
}

// Get a single memory by ID (public - no auth required for viewing)
// OPTIMIZED: Single query with join
export async function getMemoryById(id: string): Promise<Memory | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data: memoryWithStories, error } = await supabase
    .from('memories')
    .select('*, stories(*)')
    .eq('id', id)
    .single();

  if (error || !memoryWithStories) {
    console.error('Error fetching memory:', error);
    return null;
  }

  const memory = memoryWithStories as DbMemoryWithStories;
  // Sort stories by priority
  const sortedStories = (memory.stories || []).sort((a, b) => a.priority - b.priority);
  return toMemory(memory, sortedStories);
}

// Save (create or update) a memory - OPTIMIZED: Reduced round-trips
export async function saveMemory(memory: Memory, userId: string): Promise<Memory | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const now = new Date().toISOString();

  // Use upsert for memory (insert or update in single query)
  const { error: upsertError } = await supabase
    .from('memories')
    .upsert({
      id: memory.id,
      user_id: userId,
      title: memory.title,
      theme: memory.theme,
      created_at: memory.createdAt,
      updated_at: now,
      status: memory.status || 'pending',
    }, {
      onConflict: 'id',
    });

  if (upsertError) {
    console.error('Error upserting memory:', upsertError);
    return null;
  }

  // Delete existing stories and re-insert (needed to handle reordering/deletions)
  const { error: deleteError } = await supabase
    .from('stories')
    .delete()
    .eq('memory_id', memory.id);

  if (deleteError) {
    console.error('Error deleting stories:', deleteError);
    return null;
  }

  // Insert stories if any
  if (memory.stories.length > 0) {
    const storiesToInsert = memory.stories.map((story, index) => ({
      id: story.id,
      memory_id: memory.id,
      type: story.type,
      priority: index,
      title: story.title || null,
      content: story.content as Json,
      created_at: story.createdAt,
    }));

    const { error: storiesError } = await supabase
      .from('stories')
      .insert(storiesToInsert);

    if (storiesError) {
      console.error('Error inserting stories:', storiesError);
      return null;
    }
  }

  // Return constructed memory instead of re-fetching
  return {
    ...memory,
    userId,
    updatedAt: now,
    status: memory.status || 'pending',
  };
}

// Delete a memory
export async function deleteMemory(id: string, userId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting memory:', error);
    return false;
  }

  return true;
}

// Generate a UUID for new memories
export function generateId(): string {
  return crypto.randomUUID();
}
