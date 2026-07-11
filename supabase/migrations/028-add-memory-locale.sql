-- Reaction notifications (in-app + Web Push) are sent to the memory's OWNER, and their
-- title/body were hardcoded Thai. With English/Indonesian creators that means a foreign
-- creator gets a Thai push when someone reacts to their memory.
--
-- Record the creator's language on the memory itself: both notification routes already
-- load the memory row, so this needs no extra lookup and no new endpoint. Existing rows
-- default to 'th', which is correct — every memory created before i18n was Thai.
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'th';

ALTER TABLE public.memories
  DROP CONSTRAINT IF EXISTS memories_locale_check;

ALTER TABLE public.memories
  ADD CONSTRAINT memories_locale_check
  CHECK (locale = ANY (ARRAY['th'::text, 'en'::text, 'id'::text]));
