#!/usr/bin/env node
// Playtest driver: runs feature scenarios in a real Chrome at phone size and saves evidence.
//   npm run drive                 all scenarios
//   npm run drive -- login gone   only these
//   npm run drive -- --video      also record a short .webm per scenario (needs ffmpeg)
//   npm run drive -- --url=http://localhost:3000   use a server that is already running
// Evidence goes to artifacts/<date>/ (git-ignored). Scenarios are in scripts/drive/scenarios.mjs;
// each one names the feature-map route(s) it proves (docs/FEATURES.md, column "Check").
//
// Without --url it starts `next dev` with placeholder settings pointing at 127.0.0.1, so only the
// signed-out side can be driven. It never talks to the production database or to live Stripe.
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { SCENARIOS } from "./drive/scenarios.mjs";

const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}`));
const video = Boolean(flag("video"));
const wanted = args.filter((a) => !a.startsWith("--"));
const chrome = process.env.CHROME_PATH ?? "/usr/bin/google-chrome";
const PORT = 3199;

const unknown = wanted.filter((w) => !SCENARIOS[w]);
if (unknown.length) {
  console.error(`✗ unknown scenario: ${unknown.join(", ")}\n  → one of: ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(2);
}

async function startServer() {
  const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    detached: true, stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      // a local address nothing listens on: no request leaves this machine, so the app is signed out with no data
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:9",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "driver-placeholder",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "driver-placeholder",
      SUPABASE_SERVICE_ROLE_KEY: "driver-placeholder",
      STRIPE_SECRET_KEY: "sk_test_driver_placeholder",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  let log = "";
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`next dev did not start in 90 s:\n${log.slice(-800)}`)), 90_000);
    const on = (d) => { log += d; if (/Ready in|ready started|Local:/.test(log)) { clearTimeout(t); resolve(); } };
    child.stdout.on("data", on); child.stderr.on("data", on);
    child.on("exit", (c) => { clearTimeout(t); reject(new Error(`next dev exited ${c}:\n${log.slice(-800)}`)); });
  });
  return { url: `http://localhost:${PORT}`, stop: () => { try { process.kill(-child.pid, "SIGTERM"); } catch {} } };
}

const day = new Date().toISOString().slice(0, 10);
const out = new URL(`../artifacts/${day}/`, import.meta.url).pathname;
mkdirSync(out, { recursive: true });

const given = flag("url")?.split("=")[1];
const server = given ? { url: given, stop: () => {} } : await startServer();
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
const results = [];
try {
  for (const name of wanted.length ? wanted : Object.keys(SCENARIOS)) {
    const s = SCENARIOS[name];
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const rec = video ? await page.screencast({ path: `${out}${name}.webm` }) : null;
    const problems = []; // browser console errors and uncaught page errors, reported with the result
    page.on("console", (m) => { if (m.type() === "error") problems.push(m.text().slice(0, 300)); });
    page.on("pageerror", (e) => problems.push(`uncaught: ${e.message.slice(0, 300)}`));
    page.on("response", (r) => { if (r.status() >= 400 && r.url() !== page.url()) problems.push(`HTTP ${r.status()} ${new URL(r.url()).pathname}`); });
    let n = 0;
    const shot = async (label) => {
      const file = `${out}${name}-${String(++n).padStart(2, "0")}-${label}.png`;
      await page.screenshot({ path: file, fullPage: true });
      return file;
    };
    const t0 = Date.now();
    try {
      await s.run({ page, base: server.url, shot, expect: (ok, what) => { if (!ok) throw new Error(what); } });
      results.push({ name, ok: true, ms: Date.now() - t0, proves: s.proves, problems });
    } catch (e) {
      await shot("FAILED").catch(() => {});
      results.push({ name, ok: false, ms: Date.now() - t0, proves: s.proves, problems, error: e.message });
    } finally {
      await rec?.stop();
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.stop();
}

for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name} (${r.ms} ms) proves ${r.proves.join(", ")}${r.ok ? "" : `\n  → ${r.error}`}`);
  for (const p of r.problems) console.log(`  ! browser: ${p}`);
}
console.log(`evidence: ${out}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
