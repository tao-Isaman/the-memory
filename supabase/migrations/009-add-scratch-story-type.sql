-- Migration: Add 'scratch' type to stories table
-- This adds support for the new scratch-to-reveal story type

-- Step 1: Drop the existing type check constraint
-- The constraint was originally named 'nodes_type_check' from when the table was called 'nodes'
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS nodes_type_check;

-- Step 2: Add the updated type check constraint with 'scratch' included
ALTER TABLE public.stories ADD CONSTRAINT stories_type_check 
  CHECK (type IN ('password', 'image', 'text', 'text-image', 'youtube', 'scratch'));
