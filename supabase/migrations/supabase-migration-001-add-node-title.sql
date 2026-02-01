-- Migration: Add title column to nodes table
-- Run this SQL in your Supabase SQL Editor

-- Add title column to nodes table
ALTER TABLE public.nodes
ADD COLUMN IF NOT EXISTS title text;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.nodes.title IS 'Optional display title for the node';
