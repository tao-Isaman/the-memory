-- PDPA consent records — one row per (user, legal version) accepted.
-- New users accept on the login page (checkbox gates the Google button); that
-- acceptance is persisted here on their first authenticated load. Users with an
-- existing session who never accepted the current version get a blocking modal.
-- Bumping CONSENT_VERSION in src/data/legal.ts forces everyone to re-accept.
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version TEXT NOT NULL,                       -- legal docs version accepted (e.g. '1.0')
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT,                                 -- 'login' (checkbox before OAuth) | 'modal' (re-consent)
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, version)
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON public.user_consents(user_id);

-- Users read and write ONLY their own consent rows directly from the browser
-- (works without the service role; consent must never be blocked by missing keys).
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "insert own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
