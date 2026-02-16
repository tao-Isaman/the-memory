-- Expand theme types to support new use cases
-- No-op if constraint doesn't exist; updates if it does
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_theme_check;
ALTER TABLE memories ADD CONSTRAINT memories_theme_check
  CHECK (theme IN ('love', 'friend', 'family', 'anniversary', 'birthday', 'apology', 'longdistance'));
