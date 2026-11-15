# Guardrails

Rules this project was corrected on, as checks that run in `npm test`. A check fails with
`✗ [rule] where: problem → the supported way`. When someone corrects the team, the fix comes
with a new row here and a check, not a new line of prose.

Status: **Enforced** = a check stops it. **Tested** = a test proves the check fires.
**Gap** = known hole or allow-listed violation, to be fixed and then removed from the allow list.

## Checks (`src/guardrails/rules.ts`, run by `src/guardrails/guardrails.test.mjs`)

| Rule | What it stops | Status | Added |
|---|---|---|---|
| R1 rollback | a migration from `035-…` on without `supabase/rollback/<same name>.down.sql` | Enforced · Tested | 2026-11-16, team rule "prepare rollback before any prod DB change" |
| R2 rls | a `create table` with no `enable row level security` anywhere in the migrations (22 tables today, all on) | Enforced · Tested | 2026-11-16 |
| R3 browser | a `'use client'` file importing server-only code (`@/lib/supabase-server`, `@/lib/stripe`, `@/lib/openai`, `@/lib/push-server`, `next/headers`, `stripe`, `openai`, `web-push`) or reading a non-`NEXT_PUBLIC_` env; a secret env (service role, Stripe secret/webhook, OpenAI, VAPID private) read outside its one home file | Enforced · Tested | 2026-11-16 |
| R4 paid | a memory set to `status: 'active'` anywhere but the Stripe webhook, `/api/payment/verify` and the reconcile cron | Enforced · Tested | 2026-11-16, payment flow (CLAUDE.md) |
| R5 secret | a committed credential (Stripe live, Supabase secret, JWT, Google, GitHub, OpenAI, Anthropic, private key). The value is never printed | Enforced · Tested | 2026-11-16, team rule "no keys in repos" |
| R6 features | a page or endpoint under `src/app` missing from `docs/FEATURES.md`, or a map row whose route is gone | Enforced · Tested | 2026-11-16, feature map |
| R7 i18n | a message key present in one language (`messages/<th,en,id>/*.json`) and missing in another | Enforced · Tested | 2026-11-16 |

Run only these: `node --no-warnings --experimental-strip-types --test src/guardrails/guardrails.test.mjs`
Also in `npm test` already: `src/lib/api-auth.test.mjs` checks every API handler guards its caller.

## Allow-listed today (Gap) — `ALLOW` in `src/guardrails/rules.ts`

| Gap | Why it is allowed | To close it |
|---|---|---|
| G1 migrations `001`–`034` and `supabase-setup.sql` have no `.down.sql` | written before the rollback rule | write rollbacks when one of them is next touched |
| G2 `messages/id/useCase.json` lacks `seoLandings.ask-out.guide.intro` | found by R7 on day one; it needs an Indonesian sentence, which is content, not code | add the translation, remove the entry |

## Not checked yet (Gap)

| Gap | Why | Next step |
|---|---|---|
| G3 signed-in, payment and admin screens are not driven | no local Supabase on this machine (no Docker), and the rule is never prod, never the boss's account, Stripe test mode only | signed-out driving for now; revisit if Docker is approved |
| G4 a payment end-to-end in Stripe test mode | needs G3 plus a Stripe test key in `.env.local` | with G3 |

## Evidence (`npm run drive`)

`scripts/drive.mjs` starts `next dev` with placeholder settings that point at 127.0.0.1 (nothing
leaves the machine; no production data, no live Stripe), runs `scripts/drive/scenarios.mjs` in
Chrome at 390×844, and saves screenshots (with `--video` a .webm) to `artifacts/<date>/`, which
git ignores. It lists browser console errors and failed requests; with placeholder settings the
data calls fail, which is expected. The scenarios never press a button that pays, signs in or sends.
Every report of a change attaches the screenshots of the scenarios it touches.
