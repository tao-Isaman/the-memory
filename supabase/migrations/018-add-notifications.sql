-- Notification system (in-app inbox + Web Push delivery channel).
-- Notifications are first-class; "push" is one delivery channel — email/SMS can be
-- added later without changing this schema.

-- 1. notifications: one row per notification. user_id NULL = broadcast to ALL users.
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,        -- NULL = broadcast to everyone
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,                                                         -- optional deep link opened on click
  icon TEXT,                                                        -- optional icon url
  type TEXT NOT NULL DEFAULT 'general',                            -- general | announcement | promo | system
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,     -- admin who sent it
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 2. notification_reads: per-user read state (works for both targeted and broadcast rows).
CREATE TABLE IF NOT EXISTS public.notification_reads (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON public.notification_reads(user_id);

-- 3. push_subscriptions: Web Push endpoints per device. Written/read only via the API (service role).
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Authenticated users read their own + broadcast notifications. Inserts are service-role only (admin send).
CREATE POLICY "read own and broadcast notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own notification reads" ON public.notification_reads
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "insert own notification reads" ON public.notification_reads
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- No client policies: push subscriptions are managed exclusively through the API using the service role.
