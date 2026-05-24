-- Per-user notification dismissal ("delete from my inbox").
-- Safe for shared broadcast rows (user_id IS NULL): a user dismisses their own VIEW
-- of a notification without deleting the row everyone else still sees.
-- Reuses notification_reads as the per-user state table (read_at and/or dismissed_at).

ALTER TABLE public.notification_reads
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- Dismissing an already-read notification UPDATES its state row, so users need
-- UPDATE on their own rows (previously only SELECT + INSERT were granted).
DROP POLICY IF EXISTS "update own notification reads" ON public.notification_reads;
CREATE POLICY "update own notification reads" ON public.notification_reads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notification_reads_dismissed
  ON public.notification_reads(user_id, dismissed_at);
