// Guardrails: rules the team was corrected on, turned into checks. Each rule is a pure
// function over the repo's files and returns failures shaped "✗ where: problem → supported path".
// The list of rules and their status lives in docs/GUARDRAILS.md.

export type Files = Map<string, string>; // repo-relative path -> content
export type Failure = { rule: string; where: string; problem: string; fix: string };

export const show = (f: Failure) => `✗ [${f.rule}] ${f.where}: ${f.problem}\n  → ${f.fix}`;

const lineOf = (text: string, index: number) => text.slice(0, index).split("\n").length;
const isCode = (p: string) => /^src\/.*\.(ts|tsx|mjs|js)$/.test(p) && !p.includes(".test.") && !p.startsWith("src/guardrails/");
const isClient = (t: string) => /^\s*(\/\/.*\n\s*)*["']use client["']/.test(t);

/** Known violations, recorded as Gap in docs/GUARDRAILS.md. Remove an entry when it is fixed. */
export const ALLOW = {
  // migrations before 035 were written before the rollback rule
  rollbackBefore: 35,
  rollbackOther: new Set(["supabase-setup.sql", "supabase-migration-001-add-node-title.sql"]),
  rls: new Set<string>(),
  // translation missing in Indonesian; the page shows the raw key there
  i18n: new Set(["id/useCase.json:seoLandings.ask-out.guide.intro"]),
};

/** R1: every migration from 035 on has a NNN-name.down.sql in supabase/rollback/. */
export function rollbackPairs(files: Files): Failure[] {
  const names = (dir: string) => [...files.keys()].filter((p) => p.startsWith(dir)).map((p) => p.slice(dir.length));
  const downs = new Set(names("supabase/rollback/"));
  return names("supabase/migrations/")
    .filter((n) => n.endsWith(".sql") && !ALLOW.rollbackOther.has(n))
    .filter((n) => { const k = Number(n.slice(0, 3)); return !(k < ALLOW.rollbackBefore); })
    .filter((n) => !downs.has(n.replace(/\.sql$/, ".down.sql")))
    .map((n) => ({ rule: "R1 rollback", where: `supabase/migrations/${n}`, problem: "no rollback script",
      fix: `add supabase/rollback/${n.replace(/\.sql$/, ".down.sql")} that undoes it` }));
}

/** R2: every table the migrations create has row-level security turned on. */
export function rlsOnEveryTable(files: Files): Failure[] {
  const sql = [...files].filter(([p]) => p.startsWith("supabase/migrations/") && p.endsWith(".sql"));
  const all = sql.map(([, s]) => s.toLowerCase()).join("\n");
  const out: Failure[] = [];
  for (const [path, text] of sql) {
    for (const m of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(/gi)) {
      const t = m[1].toLowerCase();
      const on = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?(?:only\\s+)?(?:public\\.)?"?${t}"?\\s+enable\\s+row\\s+level\\s+security`);
      if (!on.test(all) && !ALLOW.rls.has(t)) out.push({
        rule: "R2 rls", where: `${path}:${lineOf(text, m.index!)}`, problem: `table ${t} has no row-level security`,
        fix: `add "alter table public.${t} enable row level security;" and policies that scope rows to the member's organisation`,
      });
    }
  }
  return out;
}

const SERVER_ONLY = [/["']@\/lib\/supabase-server["']/, /["']@\/lib\/(stripe|openai|push-server)["']/, /["']next\/headers["']/, /["'](stripe|openai|web-push)["']/];
const SECRET_ENV = /SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET|STRIPE_WEBHOOK_SECRET|OPENAI_API_KEY|VAPID_PRIVATE/;
const SECRET_HOMES = new Set(["src/lib/supabase-server.ts", "src/lib/stripe.ts", "src/lib/openai.ts", "src/lib/push-server.ts", "src/app/api/webhook/stripe/route.ts"]);

/** R3: the browser never gets server-only code or a secret; secrets are read in one place each. */
export function browserBundle(files: Files): Failure[] {
  const out: Failure[] = [];
  for (const [path, text] of files) {
    if (!isCode(path)) continue;
    if (isClient(text)) {
      for (const re of SERVER_ONLY) {
        const m = re.exec(text);
        if (m) out.push({ rule: "R3 browser", where: `${path}:${lineOf(text, m.index)}`, problem: `client component imports ${m[0]}`,
          fix: "call an API route under src/app/api (server) and pass back plain data" });
      }
      for (const m of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
        if (!m[1].startsWith("NEXT_PUBLIC_") && m[1] !== "NODE_ENV") out.push({ rule: "R3 browser", where: `${path}:${lineOf(text, m.index!)}`,
          problem: `client component reads process.env.${m[1]}`, fix: "only NEXT_PUBLIC_* values may reach the browser" });
      }
    }
    const s = SECRET_ENV.exec(text);
    if (s && !SECRET_HOMES.has(path)) out.push({ rule: "R3 browser", where: `${path}:${lineOf(text, s.index)}`, problem: `reads ${s[0]} outside its one home`,
      fix: "import the client from src/lib/supabase-server.ts, src/lib/stripe.ts, src/lib/openai.ts or src/lib/push-server.ts instead" });
  }
  return out;
}

const PAID_WRITERS = new Set(["src/app/api/webhook/stripe/route.ts", "src/app/api/payment/verify/route.ts", "src/app/api/cron/reconcile-payments/route.ts"]);

/** R4: a memory becomes "active" (paid) only where Stripe's word is checked. */
export function paidOnlyFromStripe(files: Files): Failure[] {
  const out: Failure[] = [];
  for (const [path, text] of files) {
    if (!isCode(path) || PAID_WRITERS.has(path)) continue;
    for (const m of text.matchAll(/status\s*:\s*["']active["']/g)) out.push({ rule: "R4 paid", where: `${path}:${lineOf(text, m.index!)}`,
      problem: "sets a memory to active outside the payment path",
      fix: "a memory goes active only in the Stripe webhook, /api/payment/verify or the reconcile cron, after Stripe confirms payment" });
  }
  return out;
}

// Shapes of real credentials. Values are never printed, only where they are.
const SECRET_SHAPES: [string, RegExp][] = [
  ["Stripe live key", /\b[sr]k_live_[A-Za-z0-9]{16,}/],
  ["Supabase secret key", /\bsb_secret_[A-Za-z0-9_-]{16,}/],
  ["JWT", /\beyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}/],
  ["Anthropic key", /\bsk-ant-[A-Za-z0-9_-]{32,}/],
  ["private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

/** R5: no credential is committed. */
export function noSecrets(files: Files): Failure[] {
  const out: Failure[] = [];
  for (const [path, text] of files) {
    if (path.startsWith("src/guardrails/") || path.startsWith(".claude/")) continue; // the patterns above, test fixtures, tool skills
    for (const [what, re] of SECRET_SHAPES) {
      const m = re.exec(text);
      if (m) out.push({ rule: "R5 secret", where: `${path}:${lineOf(text, m.index)}`, problem: `looks like a ${what} (value not shown)`,
        fix: "remove it, rotate it, and read it at run time from the environment (Vercel env / .env.local, which git ignores)" });
    }
  }
  return out;
}

/** The URL a Next app-router file serves: "(group)" folders vanish, "[id]" stays. */
export function routeOf(path: string): string {
  const parts = path.replace(/^src\/app\//, "").split("/").slice(0, -1).filter((p) => !/^\(.*\)$/.test(p));
  return "/" + parts.join("/");
}

/** R6: docs/FEATURES.md names every page and endpoint, and nothing that no longer exists. */
export function featureMap(files: Files): Failure[] {
  const map = files.get("docs/FEATURES.md");
  if (!map) return [{ rule: "R6 features", where: "docs/FEATURES.md", problem: "missing", fix: "add the feature map (see docs/GUARDRAILS.md)" }];
  const listed = new Set([...map.matchAll(/`(\/[^`\s]*)`/g)].map((m) => m[1]));
  const routes = new Set([...files.keys()].filter((p) => /^src\/app\/.*\/(page\.tsx|route\.ts)$/.test(p) || p === "src/app/page.tsx").map(routeOf));
  const out: Failure[] = [];
  for (const r of routes) if (!listed.has(r)) out.push({ rule: "R6 features", where: r, problem: "route is not in the feature map",
    fix: `add a row for \`${r}\` to docs/FEATURES.md: what the boss uses it for and how to reach it` });
  for (const r of listed) if (!routes.has(r)) out.push({ rule: "R6 features", where: `docs/FEATURES.md ${r}`, problem: "the map lists a route that does not exist",
    fix: "remove or rename the row so the map matches src/app" });
  return out;
}

/** R7: every message key exists in every language (messages/<lang>/<file>.json). */
export function messagesMatch(files: Files): Failure[] {
  const keys = (o: unknown, pre = ""): string[] => o && typeof o === "object" && !Array.isArray(o)
    ? Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => keys(v, pre ? `${pre}.${k}` : k)) : [pre];
  const byFile = new Map<string, Map<string, Set<string>>>(); // file -> lang -> keys
  for (const [path, text] of files) {
    const m = /^messages\/([a-z]{2})\/(.+\.json)$/.exec(path);
    if (!m) continue;
    const langs = byFile.get(m[2]) ?? new Map();
    langs.set(m[1], new Set(keys(JSON.parse(text))));
    byFile.set(m[2], langs);
  }
  const all = new Set([...files.keys()].map((p) => /^messages\/([a-z]{2})\//.exec(p)?.[1]).filter(Boolean) as string[]);
  const out: Failure[] = [];
  for (const [file, langs] of byFile) {
    const union = new Set([...langs.values()].flatMap((s) => [...s]));
    for (const lang of all) {
      const have = langs.get(lang);
      const missing = [...union].filter((k) => !have?.has(k) && !ALLOW.i18n.has(`${lang}/${file}:${k}`));
      if (missing.length) out.push({ rule: "R7 i18n", where: `messages/${lang}/${file}`,
        problem: `missing ${missing.length} key(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}`,
        fix: "add the same keys to every language; the page shows the raw key when one is missing" });
    }
  }
  return out;
}

export const RULES = { rollbackPairs, rlsOnEveryTable, browserBundle, paidOnlyFromStripe, noSecrets, featureMap, messagesMatch };
