// Run: npm test
// Sweeps every API route file and checks how it decides who the caller is.
// The middleware skips /api entirely, so each route guards itself; this test
// is what stops a new route from shipping without a guard.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API = new URL('../app/api/', import.meta.url).pathname;

function routes(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return routes(p);
    return name === 'route.ts' ? [p] : [];
  });
}

const HANDLER = /export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g;

// The body of each exported handler, up to the next export (good enough for these files).
function handlers(src) {
  const starts = [...src.matchAll(HANDLER)];
  return starts.map((m, i) => ({
    method: m[1],
    body: src.slice(m.index, starts[i + 1]?.index ?? src.length),
  }));
}

// Guard must come before any data access: the first `await` in the handler is the guard.
function firstAwait(body) {
  const m = body.match(/await\s+([A-Za-z_.]+)/);
  return m ? m[1] : null;
}

const all = routes(API);
assert.ok(all.length > 30, `expected the API routes, found ${all.length}`);

// 1. Every admin route: requireAdmin is the first thing each handler awaits.
const admin = all.filter((p) => relative(API, p).startsWith('admin/'));
assert.ok(admin.length >= 13, `expected admin routes, found ${admin.length}`);
for (const file of admin) {
  const src = readFileSync(file, 'utf8');
  const hs = handlers(src);
  assert.ok(hs.length > 0, `${relative(API, file)}: no handlers found`);
  for (const h of hs) {
    assert.equal(firstAwait(h.body), 'requireAdmin', `${relative(API, file)} ${h.method} must start with requireAdmin(request)`);
  }
}

// 2. Per-user routes: requireUser is the first thing each handler awaits, and the
//    user id comes from the token (auth.user.id), never from the request.
const USER_ROUTES = [
  'cartoon/delete', 'cartoon/generate', 'cartoon/history',
  'checkout', 'credits/checkout', 'credits/balance', 'credits/transactions',
  'profile', 'profile/claim-credits',
  'referral/status', 'referral/check-discount', 'referral/referred-users',
  'referral/link-code', 'referral/claim-discount', 'referral/setup',
];
for (const r of USER_ROUTES) {
  const file = join(API, r, 'route.ts');
  const src = readFileSync(file, 'utf8');
  for (const h of handlers(src)) {
    assert.equal(firstAwait(h.body), 'requireUser', `${r} ${h.method} must start with requireUser(request)`);
  }
  assert.match(src, /const userId = auth\.user\.id;/, `${r} must take userId from the token`);
}

// 3. No route anywhere reads a user id from the query string, form or JSON body.
const CLIENT_USER_ID = [
  /searchParams\.get\(\s*['"]userId['"]\s*\)/,
  /formData\.get\(\s*['"]userId['"]\s*\)/,
  /const\s*\{[^}=']*\buserId\b[^}=']*\}\s*=\s*(await\s+request\.json\(\)|body)/,
  /body\??\.userId/,
];
for (const file of all) {
  const src = readFileSync(file, 'utf8');
  for (const re of CLIENT_USER_ID) {
    assert.doesNotMatch(src, re, `${relative(API, file)} reads userId from the request; use requireUser`);
  }
}

console.log(`api-auth.test: ${admin.length} admin + ${USER_ROUTES.length} user routes guarded, ${all.length} routes free of client user ids`);
