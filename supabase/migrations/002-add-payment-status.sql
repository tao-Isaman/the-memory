-- Add payment-related columns to memories table
ALTER TABLE public.memories
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'active', 'failed')),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_memories_status ON public.memories(status);
CREATE INDEX IF NOT EXISTS idx_memories_stripe_session ON public.memories(stripe_checkout_session_id);

-- Update RLS policy: Only active memories can be viewed publicly
DROP POLICY IF EXISTS "Anyone can view memories" ON public.memories;
CREATE POLICY "Anyone can view active memories or own memories"
  ON public.memories FOR SELECT
  USING (status = 'active' OR auth.uid() = user_id);

-- Same for nodes
DROP POLICY IF EXISTS "Anyone can view nodes" ON public.nodes;
CREATE POLICY "Anyone can view nodes of active memories or own memories"
  ON public.nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = nodes.memory_id
      AND (memories.status = 'active' OR memories.user_id = auth.uid())
    )
  );
