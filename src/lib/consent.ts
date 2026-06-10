// PDPA consent helpers.
// Flow: the login page gates the Google button behind a checkbox and stores a
// "pending" acceptance in localStorage (the user has no account yet). After the
// OAuth round-trip, ConsentGuard persists it into user_consents (RLS: own rows
// only — no service role needed). Existing sessions without a recorded consent
// for CONSENT_VERSION get a blocking re-consent modal instead.
import { getSupabaseBrowserClient } from './supabase';
import { CONSENT_VERSION } from '@/data/legal';

const STORAGE_KEY = 'consent_accepted_v1';

export interface PendingConsent {
  version: string;
  acceptedAt: string;
}

/** Remember that the (not yet logged-in) visitor accepted the current legal docs. */
export function storePendingConsent(): void {
  try {
    const pending: PendingConsent = {
      version: CONSENT_VERSION,
      acceptedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Private mode / storage blocked — ConsentGuard's modal will catch it after login.
  }
}

/** Pending acceptance for the CURRENT version, or null. */
export function getPendingConsent(): PendingConsent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingConsent;
    if (parsed?.version !== CONSENT_VERSION || !parsed.acceptedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Whether the user has a recorded consent for the current version.
 * Returns null when it cannot be determined (network/db error) — callers should
 * fail open and not nag the user on transient errors.
 */
export async function hasRecordedConsent(userId: string): Promise<boolean | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', userId)
    .eq('version', CONSENT_VERSION)
    .limit(1);

  if (error) {
    console.error('Error checking consent:', error);
    return null;
  }
  return (data?.length ?? 0) > 0;
}

/** Persist the user's acceptance of the current legal version (idempotent). */
export async function recordConsent(
  userId: string,
  source: 'login' | 'modal',
  acceptedAt?: string
): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { error } = await supabase.from('user_consents').upsert(
    {
      user_id: userId,
      version: CONSENT_VERSION,
      accepted_at: acceptedAt || new Date().toISOString(),
      source,
      user_agent:
        typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 255) : null,
    },
    { onConflict: 'user_id,version', ignoreDuplicates: true }
  );

  if (error) {
    console.error('Error recording consent:', error);
    return false;
  }
  return true;
}
