// Minimal, safe service worker for The Memory PWA.
// Purpose: satisfy PWA installability and provide an offline fallback for
// navigations ONLY. It deliberately does NOT cache API/auth/dynamic responses
// (Supabase, Stripe, etc.) to avoid serving stale or sensitive data.

const CACHE = 'thememory-shell-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Network-first for page navigations; fall back to a friendly offline page.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
  }
  // Everything else (assets, API calls) goes straight to the network.
});
