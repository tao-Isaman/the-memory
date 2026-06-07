-- Reaction / reply loop (engagement — Phase 3).
-- Recipients (anonymous viewers) of a shared memory can send a ❤️ reaction and an
-- optional short reply from the ending screen. The memory's owner is notified
-- (in-app inbox + Web Push) and returns to see it — closing the recipient→creator loop.
-- One row per reaction event. Written/read only via the API using the service role
-- (no public policies), mirroring memory_views.
CREATE TABLE IF NOT EXISTS public.memory_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,                 -- anonymous client id (localStorage), reused across memories
  emoji TEXT NOT NULL DEFAULT '❤️',        -- the reaction emoji
  message TEXT,                            -- optional short reply (NULL = reaction only)
  is_owner BOOLEAN DEFAULT FALSE,          -- true when the creator reacts to their own memory (filter out)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_reactions_memory_id ON public.memory_reactions(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_reactions_memory_created ON public.memory_reactions(memory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_reactions_viewer_id ON public.memory_reactions(viewer_id);

-- Enable RLS. Rows are written/read only via the API using the service role,
-- which bypasses RLS. No public policies are granted (no direct client access).
ALTER TABLE public.memory_reactions ENABLE ROW LEVEL SECURITY;
