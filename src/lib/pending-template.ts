/**
 * Carries a starter-template choice across the Google sign-in round trip.
 * /create?template=<slug> (signed out) stores it; the dashboard, where the OAuth callback
 * always lands, takes it once and sends the user back to /create?template=<slug>.
 */
const KEY = 'pending_template';

export function storePendingTemplate(slug: string): void {
  try {
    sessionStorage.setItem(KEY, slug);
  } catch {
    // Storage blocked (private mode): the user simply lands on the dashboard.
  }
}

/** Returns the stored slug and clears it, so the redirect happens at most once. */
export function takePendingTemplate(): string | null {
  try {
    const slug = sessionStorage.getItem(KEY);
    if (slug) sessionStorage.removeItem(KEY);
    return slug;
  } catch {
    return null;
  }
}
