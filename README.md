# The Crude Oracle

**Crude Oil Intelligence Without the Noise** — a premium subscription oil and gas
intelligence platform for investors, traders and energy professionals.

- **Domain:** www.thecrudeoracle.com
- **Plan:** The Crude Oracle Premium — **£299.99/month** via Stripe
- **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Recharts · JSON data layer

> The Crude Oracle provides market commentary, educational content and investment
> research for information purposes only. It is not financial advice. Capital at risk.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## What's inside

| Area | Route(s) |
|---|---|
| Home (hero, dashboard preview, pricing, FAQ) | `/` |
| Free daily snapshot | `/dashboard` |
| Premium dashboard (prices, supply, demand, risk, charts, intel, bottom line) | `/premium-dashboard` |
| Daily briefing (11-section template + archive) | `/daily-briefing` |
| Investment watchlist (12 segments) | `/watchlist` |
| Company intelligence notes | `/company-intelligence` |
| Market pages | `/crude-oil-prices`, `/gas-lng`, `/opec-supply-risk` |
| UK coverage | `/uk-energy-security`, `/north-sea` |
| Education | `/oil-truth`, `/research-library` |
| Commerce | `/subscribe`, `/payment/success`, `/payment/cancelled` |
| Membership | `/login`, `/account` |
| Company | `/about`, `/contact` |
| Legal | `/privacy-policy`, `/terms-of-use`, `/financial-disclaimer`, `/data-disclaimer`, `/subscription-terms` |
| Admin instructions | `/admin` (noindex, not linked publicly) |
| SEO | `/sitemap.xml`, `/robots.txt`, `/manifest.json` (generated) |

## Data-driven content

All market content lives in `/data/*.json` and renders automatically:

- `market-prices.json` — price cards (asset, price, changes, trend, source, last_updated, data_type)
- `dashboard-signals.json` — supply / demand / risk signals + daily bottom line
- `daily-briefing.json` — 11-section daily briefings (first entry = today)
- `investment-watchlist.json` — watchlist companies by category
- `company-intelligence.json` — structured company notes
- `chart-data.json` — chart series (Brent/WTI, gas, inventories, rigs, OPEC, heatmap)
- `research-library.json` — research note index (free/premium, draft/published)

**Daily update:** edit JSON → commit → push → auto-deploy.
Full instructions: [`docs/DAILY_UPDATE_GUIDE.md`](docs/DAILY_UPDATE_GUIDE.md) and `/admin`.

## Access tiers

| Tier | Access |
|---|---|
| Public | Home, free snapshot, Oil Truth, research primers, About, Subscribe, Contact, legal |
| Free registered | Limited dashboard, sample content (placeholder login) |
| Premium | Everything: full dashboard, briefings, watchlist, intel, archive |

Gating is currently a **client-side placeholder** (`src/lib/access.ts`) so the tiers can
be exercised before real auth ships. Production path (Supabase auth + Stripe webhooks)
is documented in [`README_DEPLOYMENT.md`](README_DEPLOYMENT.md) and `docs/ROADMAP.md`.

## Stripe

The subscribe CTA uses a Payment Link placeholder in `src/lib/site.ts`:

```ts
export const STRIPE_SUBSCRIPTION_LINK = "[INSERT_STRIPE_MONTHLY_SUBSCRIPTION_LINK_299_99]";
```

Replace it with your live £299.99/month Payment Link. No secret keys exist anywhere in
frontend code; the full Checkout/webhook setup uses env vars only (`.env.example`).

## Docs

- [`README_DEPLOYMENT.md`](README_DEPLOYMENT.md) — deploy to Vercel/Netlify, Stripe setup, domain
- [`docs/DAILY_UPDATE_GUIDE.md`](docs/DAILY_UPDATE_GUIDE.md) — the daily content workflow
- [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) — pre-launch QA
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — future phases (auth, DB admin, licensed data APIs)

## Compliance posture

- Financial + data disclaimers on every content page and in the footer
- No advice language; watchlists labelled “Watchlist, not recommendation”
- Every data card shows **source, last updated, and data type** (manual / delayed / indicative / API placeholder)
- No unlicensed real-time exchange data; licensed-data placeholders only
- Original design — no third-party terminal branding or trade dress
