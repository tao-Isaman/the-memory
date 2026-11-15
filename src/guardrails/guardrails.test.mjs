// Run: npm test. Each rule is proven to fire on a bad example, then the repo must pass them all.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { RULES, show, routeOf } from "./rules.ts";

const fx = (o) => new Map(Object.entries(o));

test("R1 fires for a new migration without a .down.sql", () => {
  const f = RULES.rollbackPairs(fx({ "supabase/migrations/040-x.sql": "", "supabase/migrations/041-y.sql": "", "supabase/rollback/041-y.down.sql": "", "supabase/migrations/010-old.sql": "" }));
  assert.deepEqual(f.map((x) => x.where), ["supabase/migrations/040-x.sql"]);
});

test("R2 fires for a table without row-level security", () => {
  const f = RULES.rlsOnEveryTable(fx({ "supabase/migrations/040-x.sql": "create table public.notes (id int);\ncreate table tags (id int);\nalter table tags enable row level security;" }));
  assert.deepEqual(f.map((x) => x.problem), ["table notes has no row-level security"]);
});

test("R3 fires for server code or secrets in the browser, and a secret read outside its home", () => {
  const f = RULES.browserBundle(fx({
    "src/components/Pay.tsx": `'use client';\nimport { stripe } from '@/lib/stripe';\nconst a = process.env.STRIPE_SECRET_KEY; const b = process.env.NEXT_PUBLIC_X; const c = process.env.NODE_ENV;`,
    "src/app/api/x/route.ts": `const k = process.env.SUPABASE_SERVICE_ROLE_KEY;`,
    "src/lib/supabase-server.ts": `const k = process.env.SUPABASE_SERVICE_ROLE_KEY;`,
  }));
  assert.deepEqual(f.map((x) => x.where), ["src/components/Pay.tsx:2", "src/components/Pay.tsx:3", "src/components/Pay.tsx:3", "src/app/api/x/route.ts:1"]);
});

test("R4 fires when a memory is set active outside the payment path", () => {
  const f = RULES.paidOnlyFromStripe(fx({
    "src/app/api/memory/x/route.ts": "await db.update({ status: 'active' })",
    "src/app/api/webhook/stripe/route.ts": "await db.update({ status: 'active' })",
  }));
  assert.deepEqual(f.map((x) => x.where), ["src/app/api/memory/x/route.ts:1"]);
});

test("R5 fires for a committed credential and never prints it", () => {
  const fake = "sk_live_" + "A1b2C3d4E5f6G7h8I9j0";
  const f = RULES.noSecrets(fx({ "src/lib/pay.ts": `const key = "${fake}";` }));
  assert.equal(f.length, 1);
  assert.ok(!show(f[0]).includes(fake));
});

test("R6 fires both ways: a route missing from the map, and a map row with no route", () => {
  assert.equal(routeOf("src/app/[locale]/(app)/create/page.tsx"), "/[locale]/create");
  const f = RULES.featureMap(fx({ "docs/FEATURES.md": "| a | `/[locale]` |\n| b | `/gone` |", "src/app/[locale]/(landing)/page.tsx": "", "src/app/api/stats/route.ts": "" }));
  assert.deepEqual(f.map((x) => x.where).sort(), ["/api/stats", "docs/FEATURES.md /gone"]);
});

test("R7 fires for a message key missing in one language", () => {
  const f = RULES.messagesMatch(fx({ "messages/th/a.json": '{"x":{"y":"ก"},"z":"ข"}', "messages/en/a.json": '{"x":{"y":"a"}}' }));
  assert.deepEqual(f.map((x) => x.where + " " + x.problem), ["messages/en/a.json missing 1 key(s): z"]);
});

test("the repo passes every guardrail", () => {
  const root = new URL("../../", import.meta.url);
  const paths = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" })
    .split("\n").filter((p) => p && !/\.(png|jpe?g|gif|pdf|woff2?|ttf|ico|webp|mp3|mp4|svg|wav)$/i.test(p));
  const files = new Map();
  for (const p of paths) { try { files.set(p, readFileSync(new URL(p, root), "utf8")); } catch { /* deleted in the working tree */ } }
  const fails = Object.values(RULES).flatMap((r) => r(files));
  assert.equal(fails.length, 0, `\n${fails.map(show).join("\n\n")}\n\n(See docs/GUARDRAILS.md.)\n`);
});
