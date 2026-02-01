-- Migration: Rename nodes table to stories
-- This aligns the database schema with domain-driven design terminology

-- Step 1: Drop existing RLS policies that reference 'nodes'
DROP POLICY IF EXISTS "Anyone can view nodes of active memories or own memories" ON public.nodes;
DROP POLICY IF EXISTS "Users can insert own memory nodes" ON public.nodes;
DROP POLICY IF EXISTS "Users can update own memory nodes" ON public.nodes;
DROP POLICY IF EXISTS "Users can delete own memory nodes" ON public.nodes;

-- Step 2: Rename the table
ALTER TABLE public.nodes RENAME TO stories;

-- Step 3: Rename indexes
ALTER INDEX IF EXISTS nodes_memory_id_idx RENAME TO stories_memory_id_idx;
ALTER INDEX IF EXISTS nodes_priority_idx RENAME TO stories_priority_idx;

-- Step 4: Update column comment
COMMENT ON COLUMN public.stories.title IS 'Optional display title for the story';

-- Step 5: Recreate RLS policies with updated names
CREATE POLICY "Anyone can view stories of active memories or own memories"
  ON public.stories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = stories.memory_id
      AND (memories.status = 'active' OR memories.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert own memory stories"
  ON public.stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = stories.memory_id
      AND memories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own memory stories"
  ON public.stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = stories.memory_id
      AND memories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own memory stories"
  ON public.stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = stories.memory_id
      AND memories.user_id = auth.uid()
    )
  );
