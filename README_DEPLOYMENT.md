# Deployment Guide — The Crude Oracle

Deploy-ready for **Vercel** (recommended for Next.js) or **Netlify**.
Target domain: **www.thecrudeoracle.com**.

---

## 1. Deploy to Vercel (recommended)

1. Push this repository to GitHub.
2. In [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
   Vercel auto-detects Next.js; no build settings needed (`vercel.json` adds security headers).
3. Click **Deploy**. You get a `*.vercel.app` preview URL immediately.

### Custom domain
1. Project → **Settings → Domains** → add `thecrudeoracle.com` and `www.thecrudeoracle.com`.
2. At your DNS provider: `A` record for apex → `76.76.21.21`, `CNAME` for `www` → `cname.vercel-dns.com` (Vercel shows the exact records).
3. Set `www.thecrudeoracle.com` as primary; Vercel provisions HTTPS automatically.

## 2. Deploy to Netlify (alternative)

1. Netlify → **Add new site → Import an existing project** → pick the repo.
2. `netlify.toml` already sets `npm run build` + the Next.js runtime plugin.
3. Add your domain under **Domain management**; HTTPS is automatic.

---

## 3. Stripe subscription setup (£299.99/month)

### Option A — Payment Link (fastest, no code, no keys)

1. Stripe Dashboard → **Product catalogue → Add product**
   - Name: `The Crude Oracle Premium`
   - Price: **£299.99 GBP**, recurring, monthly.
2. **Payment Links → New** → select that price.
   - After payment: redirect to `https://www.thecrudeoracle.com/payment/success`
   - Allow customers to cancel via the customer portal (enable in Settings → Billing → Customer portal).
3. Copy the link (`https://buy.stripe.com/...`) and paste it into
   `src/lib/site.ts` → `STRIPE_SUBSCRIPTION_LINK`, replacing
   `[INSERT_STRIPE_MONTHLY_SUBSCRIPTION_LINK_299_99]`.
4. Commit and deploy. The setup warning on `/subscribe` disappears automatically.

> Payment Links cannot redirect on cancel; users who abandon checkout use their
> back button. The site's `/payment/cancelled` page is wired for Option B.

### Option B — Stripe Checkout (full integration, Phase 2)

Use environment variables **only** (never in code):

| Variable | Where | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Server env only | Create Checkout sessions, verify subscriptions |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public env | Stripe.js on the client |
| `STRIPE_WEBHOOK_SECRET` | Server env only | Verify webhook signatures |
| `PRICE_ID_CRUDE_ORACLE_PREMIUM` | Server env | The £299.99/month price |

Steps:
1. Copy `.env.example` → `.env.local` (local) and add the same vars in
   Vercel → Settings → Environment Variables (or Netlify equivalent).
2. Add an API route (e.g. `src/app/api/checkout/route.ts`) that creates a
   Checkout Session with `mode: "subscription"`, `success_url: /payment/success`,
   `cancel_url: /payment/cancelled`.
3. Add a webhook route (e.g. `/api/stripe-webhook`) handling
   `checkout.session.completed`, `customer.subscription.updated`,
   `customer.subscription.deleted` → update the member's tier in your database.
4. Point a Stripe webhook endpoint at it and store the signing secret in
   `STRIPE_WEBHOOK_SECRET`.

**Security rules (enforced in this codebase):**
- No secret keys in frontend code — verified: the only Stripe reference in `src/`
  is the public Payment Link constant.
- `.env*` files are git-ignored.
- Set secrets only in the hosting dashboard, never commit them.

---

## 4. Authentication placeholder → production

Current state: `src/lib/access.ts` stores the tier in `localStorage`
(public / free / premium; demo premium code `ORACLE-PREMIUM`). This is a UX
placeholder, **not** a security boundary.

Production path (see `docs/ROADMAP.md`):
1. Create a Supabase project; enable email (magic link) auth.
2. `profiles` table with a `tier` column (`free` | `premium`).
3. Stripe webhook sets `tier = 'premium'` on active subscription, downgrades on cancellation.
4. Replace `useAccess()` with a Supabase session hook and add `middleware.ts`
   protecting `/premium-dashboard`, `/daily-briefing`, `/watchlist`,
   `/company-intelligence` server-side.

---

## 5. Contact form

`/contact` currently opens the visitor's email client (mailto) as a functional
fallback. Before launch, wire it to Formspree, Netlify Forms, Resend or an API
route, and set the real inbox in `src/lib/site.ts` → `contactEmail`.

---

## 6. Post-deploy checklist

- [ ] Stripe Payment Link live and tested end-to-end (test mode first)
- [ ] `/payment/success` reached after test checkout
- [ ] Domain + HTTPS working on `www.thecrudeoracle.com`
- [ ] `https://www.thecrudeoracle.com/sitemap.xml` and `/robots.txt` reachable
- [ ] Submit sitemap in Google Search Console
- [ ] Run `docs/QA_CHECKLIST.md` in full
