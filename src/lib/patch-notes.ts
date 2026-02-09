const STORAGE_KEY = 'thememory_last_seen_version';

export function getLastSeenVersion(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastSeenVersion(version: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, version);
  } catch {
    // localStorage may be unavailable in private browsing
  }
}

export function hasUnseenUpdate(latestVersion: string): boolean {
  const lastSeen = getLastSeenVersion();
  if (!lastSeen) return true;
  return lastSeen !== latestVersion;
}
