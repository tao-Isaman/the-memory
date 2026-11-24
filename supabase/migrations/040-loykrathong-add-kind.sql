-- Loy Krathong mini-game: a floated item is now either a river krathong or a sky
-- lantern (โคมลอย). Both live in the same table / realtime channel / shared feed;
-- `kind` tells them apart. Additive and backward-compatible: the default is
-- 'krathong', so rows written by the pre-lantern code (which never sets `kind`)
-- stay krathongs, and the existing river keeps working unchanged.
--
-- Rollback: ALTER TABLE public.krathong_floats DROP COLUMN kind;

ALTER TABLE public.krathong_floats
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'krathong'
  CHECK (kind IN ('krathong', 'lantern'));
