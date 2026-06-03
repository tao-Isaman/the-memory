-- supabase/migrations/021-add-voice-and-slideshow-story-types.sql
-- Migration: Add 'voice' and 'slideshow' story types + a dedicated public `audio` bucket.
-- 'voice'     : a recorded/uploaded audio message (<= 60s, <= 10MB), played in the viewer.
-- 'slideshow' : 2..5 images shown as an auto-playing Ken Burns slideshow.
-- stories.content is the existing jsonb column (database.ts: stories.content is Json), so
-- NO column/type schema change is needed — only the type CHECK constraint is widened
-- (same additive pattern as 009-add-scratch-story-type.sql / 010-add-question-story-type.sql).
-- Slideshow images REUSE the existing `images` bucket via uploadImage (no storage change for slideshow).

-- ============================================================
-- 1) Widen the stories type CHECK constraint (drop + re-add)
-- ============================================================
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_type_check;

ALTER TABLE public.stories ADD CONSTRAINT stories_type_check
  CHECK (type IN ('password', 'image', 'text', 'text-image', 'youtube', 'scratch', 'question', 'voice', 'slideshow'));

-- ============================================================
-- 2) Dedicated PUBLIC `audio` bucket for voice notes
--    (mirrors the cartoon-images precedent in 012-add-cartoon-generations.sql)
--    NOTE: we deliberately do NOT reuse the `images` bucket — its RLS/MIME were set
--    in the Supabase dashboard and are unverifiable from code; a dedicated bucket with
--    its own `voices/` folder INSERT policy is the only safe choice.
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;

-- Optional hard cap (defense in depth; the editor's 60s/10MB checks are the real gate).
-- NOTE: allowed_mime_types is intentionally LEFT OUT here. A codec-suffixed container
-- ('audio/mp4;codecs=...') or an empty-MIME iOS file can be wrongly rejected by a bucket
-- MIME allowlist; uploadAudio strips ';codecs=...' before sending contentType, but the
-- safest default is to enforce mime ONLY editor-side. If your Supabase version errors on
-- the file_size_limit column, this single statement can be removed without affecting the feature.
UPDATE storage.buckets
SET file_size_limit = 10485760  -- 10 MB
WHERE id = 'audio';

-- Public read (audio is shared via public memory URLs)
CREATE POLICY "Public read audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio');

-- Authenticated users may upload voice notes into the `voices/` folder
-- (browser uploads use the anon/auth client; memory creators are authenticated owners).
CREATE POLICY "Users can upload voices"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'audio'
    AND (storage.foldername(name))[1] = 'voices'
    AND auth.role() = 'authenticated'
  );

-- Service role full access (API routes / future GC cron)
CREATE POLICY "Service role full access audio"
  ON storage.objects FOR ALL
  USING (bucket_id = 'audio')
  WITH CHECK (bucket_id = 'audio');

-- ============================================================
-- TS-only follow-ups (NOT part of this migration; src/types/database.ts needs no edit
-- because stories.type is `string` and stories.content is `Json`):
--   - src/types/memory.ts: extend StoryType union + add VoiceStory/SlideshowStory + extend MemoryStory union
-- ============================================================
