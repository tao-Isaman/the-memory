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

console.log(`api-auth.test: ${admin.length} admin routes guarded`);
