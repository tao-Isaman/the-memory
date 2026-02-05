-- Site statistics table for caching counts
-- Updated by Vercel Cron job every 12 hours

CREATE TABLE site_stats (
  id INTEGER PRIMARY KEY DEFAULT 1,
  total_users INTEGER DEFAULT 0,
  total_memories INTEGER DEFAULT 0,
  total_stories INTEGER DEFAULT 0,
  active_memories INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO site_stats (id) VALUES (1);

-- Allow public read access (for /api/stats endpoint)
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to site_stats"
  ON site_stats
  FOR SELECT
  TO public
  USING (true);

-- Service role can update (for cron job)
CREATE POLICY "Allow service role to update site_stats"
  ON site_stats
  FOR UPDATE
  TO service_role
  USING (true);
