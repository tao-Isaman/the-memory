# Engagement Feature Ideas

> Goal stated: "a feature to make users spend more time in the app."
> Reframed below into engagement that also drives revenue.
> Created: 2026-05-22

## Context (from real dashboard data, 22 May 2026)

- **7,576 users**, **฿99,538 revenue**, **994 paid memories** (~฿100 each).
- Funnel: 77% of users create a memory, but only **17% of created memories get paid** → the big leak is at the paywall, not engagement.
- **Customer persona is sharp and consistent:** female (69%), under 25 (81%), student (~69%), has a partner (71%), buying for anniversaries (#1 occasion, ahead of Valentine).
- Credits/AI cartoon feature underperforms: ~6% of revenue, used by only ~2% of users.
- Mild post-Valentine seasonal cool-down (last 30d ~20% below lifetime daily average).

## Reframe: "time in app" is not the real goal

For a **gifting product**, time-in-app is a vanity metric. Creators already engage well
(4.2 stories per memory). More building time doesn't help if they still don't pay.

Engagement that makes money =
1. **Recipients coming back** → they become creators (free growth, warmest audience).
2. **Creators returning** for the next occasion → repeat revenue.

## The untapped audience: recipients

994 paid memories were each shared with at least one person → **thousands of recipients**
who open the app, feel an emotional moment, then leave and never return. They are the
best future customers and currently unused. Every idea below targets this gap.

## Feature ideas, ranked by business impact

| # | Feature | What it does | Why it fits our data | Impact | Effort |
|---|---------|-------------|----------------------|--------|--------|
| 1 | **Reaction / reply loop** (หัวใจ + ตอบกลับ) | Recipient sends hearts or a short reply; creator is notified and returns to see it. | Young couples thrive on emotional back-and-forth; creator returns → repeat creation. | High (engagement + repeat) | Medium |
| 2 | **"Make your own" viral CTA** (สร้างของคุณเอง) | At the end of viewing, an emotional button prompting the recipient to create their own. | Recipients are already in-app and emotional → free growth at $0 ad cost. | High (growth + revenue) | Low |
| 3 | **New interactive story types** | e.g. voice message, countdown timer, photo slideshow, "open when…" letters, spin-the-wheel. | More time inside the experience → recipient wants their own. Story-type system makes adding one easy. | Medium (engagement) | Low per type |
| 4 | **Occasion reminders** (เตือนวันสำคัญ) | Save people + their dates; app reminds before birthday/anniversary, one tap to create. | Uses birthday/anniversary data already collected; turns one-time → recurring. | High (retention) | Higher (email/notif) |

## Recommendation: build the engagement loop (#1 + #2)

> Recipient opens memory → feels emotion → sends ❤️ or reply → creator is notified and
> **comes back** → sees the reply → prompted to create again → recipient sees
> **"สร้างของคุณเอง"** → becomes a new creator.

This loop simultaneously:
- Brings both creator and recipient back into the app (the requested "more time"),
- Generates free growth (recipients → creators),
- Drives repeat revenue (creators return for the next occasion).

Fits the persona (teen/early-20s couples love emotional back-and-forth).

**Fastest standalone win:** #3 — adding one new story type (e.g. voice message or
countdown) leverages the existing 7-type architecture and is immediately visible to users.

## Open question before committing spend

We don't yet know **customer acquisition cost** (ad/marketing spend per signup).
With ARPU ~฿13 and ~฿100 per sale, unit economics can't be judged profitable/unprofitable
until CAC is known.

## Next steps (not yet decided)

- [ ] Choose: build the loop (#1+#2), or start with a new story type (#3).
- [ ] Plan implementation (DB schema, API routes, UI, notifications).
