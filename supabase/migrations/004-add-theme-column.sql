-- Add theme column to memories table
-- Supported themes: 'love' (default), 'friend', 'family'

ALTER TABLE memories ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'love';

-- Create an index on theme for potential filtering
CREATE INDEX IF NOT EXISTS idx_memories_theme ON memories(theme);
