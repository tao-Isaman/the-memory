// Driver scenarios. Each: { proves: [routes from docs/FEATURES.md], run({ page, base, shot, expect }) }.
// Signed-out only for now: signed-in and payment scenarios need a local Supabase and Stripe test
// mode (docs/GUARDRAILS.md, Gap G2). Never press a button that would pay, sign in or send.

const okPage = async (page, url, expect) => {
  const res = await page.goto(url, { waitUntil: "networkidle2", timeout: 60_000 });
  expect(res && res.status() < 400, `${url} answered ${res?.status()}`);
  return res;
};

export const SCENARIOS = {
  landing: {
    proves: ["/[locale]"],
    async run({ page, base, shot, expect }) {
      await okPage(page, `${base}/`, expect);
      expect((await page.content()).length > 2000, "the landing page is empty");
      await shot("landing-th");
      await okPage(page, `${base}/en`, expect);
      await shot("landing-en");
    },
  },
  occasions: {
    proves: ["/[locale]/birthday", "/[locale]/anniversary", "/[locale]/loykrathong"],
    async run({ page, base, shot, expect }) {
      for (const p of ["birthday", "anniversary", "loykrathong"]) {
        await okPage(page, `${base}/${p}`, expect);
        await shot(p);
      }
    },
  },
  login: {
    proves: ["/[locale]/login"],
    async run({ page, base, shot, expect }) {
      await okPage(page, `${base}/login`, expect);
      await shot("login");
      // never press the Google button: it would leave for a real sign-in page
    },
  },
  legal: {
    proves: ["/[locale]/privacy", "/[locale]/terms"],
    async run({ page, base, shot, expect }) {
      for (const p of ["privacy", "terms"]) {
        await okPage(page, `${base}/${p}`, expect);
        await shot(p);
      }
    },
  },
  "payment-cancel": {
    proves: ["/[locale]/payment/cancel"],
    async run({ page, base, shot, expect }) {
      await okPage(page, `${base}/payment/cancel`, expect);
      await shot("cancel");
    },
  },
};
