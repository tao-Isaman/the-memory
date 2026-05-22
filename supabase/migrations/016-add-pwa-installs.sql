-- PWA install tracking.
-- One row per installed device (deduped by device_id). Used to count installs,
-- estimate active installs (recent last_seen_at), and estimate uninstalls
-- (installed devices that stopped opening the app in standalone mode).
CREATE TABLE IF NOT EXISTS public.pwa_installs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pwa_installs_last_seen ON public.pwa_installs(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_pwa_installs_installed_at ON public.pwa_installs(installed_at);
CREATE INDEX IF NOT EXISTS idx_pwa_installs_user_id ON public.pwa_installs(user_id);

-- Enable RLS. Rows are written/read only via the API using the service role,
-- which bypasses RLS. No public policies are granted (no client-side access).
ALTER TABLE public.pwa_installs ENABLE ROW LEVEL SECURITY;
