-- Migration: Add 'question' type to stories table
-- Description: Support for quiz-style questions with 4 choices
-- The question story allows users to create a question with 4 answer choices
-- When the partner selects the wrong answer, it will show a warning with sound

-- Step 1: Drop the existing type check constraint
ALTER TABLE public.stories DROP CONSTRAINT IF EXISTS stories_type_check;

-- Step 2: Add the updated type check constraint with 'question' included
ALTER TABLE public.stories ADD CONSTRAINT stories_type_check 
  CHECK (type IN ('password', 'image', 'text', 'text-image', 'youtube', 'scratch', 'question'));
