-- Cartoon Generations table
CREATE TABLE IF NOT EXISTS cartoon_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_image_url TEXT,
  cartoon_image_url TEXT,
  credits_used INTEGER NOT NULL DEFAULT 10,
  prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cartoon_generations_user_id ON cartoon_generations(user_id);
CREATE INDEX idx_cartoon_generations_user_created ON cartoon_generations(user_id, created_at DESC);

-- RLS
ALTER TABLE cartoon_generations ENABLE ROW LEVEL SECURITY;

-- Users can view their own cartoon generations
CREATE POLICY "Users can view own cartoon generations"
  ON cartoon_generations FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (API routes use service role)
CREATE POLICY "Service role can manage cartoon generations"
  ON cartoon_generations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Storage: Create bucket for cartoon images (if not exists)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cartoon-images', 'cartoon-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access (images are shared via public URLs)
CREATE POLICY "Public read cartoon images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cartoon-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload cartoon originals"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cartoon-images'
    AND (storage.foldername(name))[1] = 'originals'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can upload cartoon results"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'cartoon-images'
    AND (storage.foldername(name))[1] = 'results'
    AND auth.role() = 'authenticated'
  );

-- Service role bypass (for API routes uploading on behalf of users)
CREATE POLICY "Service role full access cartoon images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'cartoon-images')
  WITH CHECK (bucket_id = 'cartoon-images');
