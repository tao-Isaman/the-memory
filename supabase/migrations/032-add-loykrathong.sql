-- Loy Krathong online 2569 (หมู่บ้านน้องปู) — free marketing mini-game.
--
-- One row per krathong floated. Guests (no login) can float, so `user_id` is optional
-- and `guest_id` is a per-device id from localStorage. Rows are inserted ONLY by the
-- API route (service role) after validation + profanity filtering; the browser never
-- inserts directly. Anyone can read them: the river is public, and Realtime
-- `postgres_changes` needs a SELECT policy to deliver INSERT events to anon clients.

CREATE TABLE IF NOT EXISTS public.krathong_floats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_id text NOT NULL,
  display_name text NOT NULL,
  design text NOT NULL,
  wish text NOT NULL,
  to_name text NULL,
  color text NULL,
  room int NULL,
  year int NOT NULL DEFAULT 2569,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_krathong_floats_created ON public.krathong_floats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_krathong_floats_guest ON public.krathong_floats(guest_id, created_at DESC);

ALTER TABLE public.krathong_floats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "krathong_floats_public_read" ON public.krathong_floats;
CREATE POLICY "krathong_floats_public_read"
  ON public.krathong_floats FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies: service role only.

-- Realtime: every client in every room sees new krathongs on the river.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'krathong_floats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.krathong_floats;
  END IF;
END $$;
