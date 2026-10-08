-- Loy Krathong mini-game: record which scene a krathong was floated from
-- (village | temple | bangkok | chiangmai). Display is still one shared river.
ALTER TABLE public.krathong_floats ADD COLUMN IF NOT EXISTS scene text NULL;
