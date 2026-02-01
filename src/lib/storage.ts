import { Memory, MemoryStory, MemoryStatus } from '@/types/memory';
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
  };
}

// Get all memories for a user
export async function getMemories(userId: string): Promise<Memory[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data: memories, error: memoriesError } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (memoriesError || !memories) {
    console.error('Error fetching memories:', memoriesError);
    return [];
  }

  if (memories.length === 0) return [];

  const memoryIds = memories.map((m) => m.id);
  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .in('memory_id', memoryIds);

  if (storiesError) {
    console.error('Error fetching stories:', storiesError);
    return [];
  }

  return memories.map((memory) => {
    const memoryStories = (stories || []).filter((s) => s.memory_id === memory.id);
    return toMemory(memory, memoryStories);
  });
}

// Get a single memory by ID (public - no auth required for viewing)
export async function getMemoryById(id: string): Promise<Memory | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .select('*')
    .eq('id', id)
    .single();

  if (memoryError || !memory) {
    console.error('Error fetching memory:', memoryError);
    return null;
  }

  const { data: stories, error: storiesError } = await supabase
    .from('stories')
    .select('*')
    .eq('memory_id', id)
    .order('priority', { ascending: true });

  if (storiesError) {
    console.error('Error fetching stories:', storiesError);
    return null;
  }

  return toMemory(memory, stories || []);
}

// Save (create or update) a memory
export async function saveMemory(memory: Memory, userId: string): Promise<Memory | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  // Check if memory exists (for update)
  const { data: existing } = await supabase
    .from('memories')
    .select('id')
    .eq('id', memory.id)
    .single();

  if (existing) {
    // Update existing memory
    const { error: updateError } = await supabase
      .from('memories')
      .update({
        title: memory.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memory.id)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating memory:', updateError);
      return null;
    }

    // Delete existing stories and re-insert
    await supabase.from('stories').delete().eq('memory_id', memory.id);
  } else {
    // Insert new memory
    const { error: insertError } = await supabase.from('memories').insert({
      id: memory.id,
      user_id: userId,
      title: memory.title,
      created_at: memory.createdAt,
      updated_at: new Date().toISOString(),
      status: memory.status || 'pending',
    });

    if (insertError) {
      console.error('Error inserting memory:', insertError);
      return null;
    }
  }

  // Insert stories
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

    const { error: storiesError } = await supabase.from('stories').insert(storiesToInsert);

    if (storiesError) {
      console.error('Error inserting stories:', storiesError);
      return null;
    }
  }

  return getMemoryById(memory.id);
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
