-- Memory view tracking (recipient engagement instrumentation — Phase 0).
-- One row per viewing SESSION (each open of /memory/[id]). Captures who viewed
-- (anonymous viewer_id), how far they got (max_story_reached / stories_total),
-- whether they finished (completed), and how long they stayed (duration_seconds).
-- This is the baseline measurement layer that "time-in-app" features are judged against.
CREATE TABLE IF NOT EXISTS public.memory_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,                 -- anonymous client id (localStorage), reused across memories
  is_owner BOOLEAN DEFAULT FALSE,          -- true when the creator views their own memory (filter these out)
  stories_total INTEGER DEFAULT 0,         -- number of stories at view time
  max_story_reached INTEGER DEFAULT 0,     -- furthest story index reached (0-based) → drop-off funnel
  completed BOOLEAN DEFAULT FALSE,         -- reached the last story
  duration_seconds INTEGER DEFAULT 0,      -- dwell time for the session
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_event_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_views_memory_id ON public.memory_views(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_views_created_at ON public.memory_views(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_views_viewer_id ON public.memory_views(viewer_id);

-- Enable RLS. Rows are written/read only via the API using the service role,
-- which bypasses RLS. No public policies are granted (no direct client access).
ALTER TABLE public.memory_views ENABLE ROW LEVEL SECURITY;
