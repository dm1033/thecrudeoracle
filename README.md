# The Crude Oracle

**Crude Oil Intelligence Without the Noise** — oil and gas intelligence for
investors, traders and energy professionals.

- **Domain:** www.thecrudeoracle.com
- **Plan:** 100% free. The paid subscription has been retired.
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
| Dashboard (prices, supply, demand, risk, charts, intel, bottom line) | `/dashboard` |
| Daily briefing (11-section template + archive) | `/daily-briefing` |
| Investment watchlist (12 segments) | `/watchlist` |
| Company intelligence notes | `/company-intelligence` |
| Crude Oracle Paper Book (AI crude desk, timestamped decision log, no-AI baseline) | `/paper-book` — pipeline in [`paper-book/`](paper-book/README.md) |
| Market pages | `/crude-oil-prices`, `/gas-lng`, `/opec-supply-risk` |
| UK coverage | `/uk-energy-security`, `/north-sea` |
| Education | `/oil-truth`, `/research-library` |
| Commerce | `/subscribe`, `/payment/success`, `/payment/cancelled` |
| Account | `/account` |
| Company | `/about`, `/contact` |
| Legal | `/privacy-policy`, `/terms-of-use`, `/financial-disclaimer`, `/data-disclaimer` |
| Admin instructions | `/admin` (noindex, not linked publicly) |
| SEO | `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.json` |

## Data-driven content

All market content lives in `/data/*.json` and renders automatically:

- `market-prices.json` — price cards (asset, price, changes, trend, source, last_updated, data_type)
- `daily-briefing.json` — 11-section daily briefings (first entry = today)
- `investment-watchlist.json` — watchlist companies by category
- `company-intelligence.json` — structured company notes
- `chart-data.json` — chart series (Brent/WTI, gas, inventories, rigs, OPEC, heatmap)
- `research-library.json` — research note index (free/premium, draft/published)

Dashboard cards, the Balance Engine, the Curve page, What Changed, the Public Data Monitor and the Desk Bot are not in these files: they read public feeds (EIA, CFTC, FRED, GDELT) when the site is built.

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

## Automated Repository Datasets
The `data/market_snapshot.json` file is updated automatically via GitHub Actions following official U.S. government release schedules:
* **U.S. Commercial Crude Oil Inventories, excluding the SPR (Wednesdays, 10:30 AM ET):** Pulled directly from the U.S. Energy Information Administration (EIA API v2, Series `WCESTUS1`). Needs the `EIA_API_KEY` repository secret; without it this section is skipped and the CFTC section is still written.
* **Hedge Fund / Managed Money Positioning (Fridays, 3:30 PM ET):** Pulled from the CFTC Disaggregated Futures-Only Commitments of Traders (COT) Socrata endpoint (`72hh-3qpy`, NYMEX WTI Physical contract `067651`).

## Curated Energy Trading & Media Directory

### 1. Fundamental Inventories & Production
* **[U.S. EIA Open Data (API v2)](https://www.eia.gov/opendata/):** Weekly Petroleum Status Reports (WPSR), Cushing OK storage, PADD 1–5 refinery utilization, and strategic petroleum reserve (SPR) stocks.
* **[CFTC Commitments of Traders (Socrata API)](https://publicreporting.cftc.gov/):** Weekly Managed Money, Producer/Merchant, and Swap Dealer positioning for NYMEX WTI (`067651`) and Brent futures.
* **[JODI Oil World Database](https://www.jodidata.org/oil/):** Global monthly production, demand, and inventory changes across 100+ countries.
* **[Baker Hughes Rig Count](https://rigcount.bakerhughes.com/):** Weekly North American basin-level rotary rig counts and international monthly trackers.

### 2. Exchanges, Benchmarks & Maritime Flows
* **[CME Group NYMEX WTI (`CL`)](https://www.cmegroup.com/markets/energy/crude-oil/light-sweet-crude.html):** Official futures settlements, term structure forward curves, and 3-2-1 crack spread specifications.
* **[ICE Futures Brent (`BZ`)](https://www.theice.com/products/219/Brent-Crude-Futures):** Global waterborne crude benchmark settlements and backwardation/contango differentials.
* **[Vortexa Market Insights](https://www.vortexa.com/insights/) & [Kpler Blog](https://www.kpler.com/blog):** Physical seaborne crude flows, floating storage trackers, and chokepoint transit analytics (Strait of Hormuz, Suez Canal, Malacca).

### 3. Price Reporting Agencies (PRAs) & Institutional Research
* **[S&P Global Commodity Insights (Platts)](https://www.spglobal.com/commodityinsights/en)** & **[Argus Media](https://www.argusmedia.com/en):** Methodologies and market commentary for physical grades (Dated Brent, Urals, Dubai/Oman, WCS, ESPO).
* **[OPEC Monthly Oil Market Report (MOMR)](https://www.opec.org/opec_web/en/publications/338.htm):** Official OPEC production tables, secondary-source assessments, and global demand forecasts.
* **[International Energy Agency (IEA)](https://www.iea.org/topics/oil)** & **[Oxford Institute for Energy Studies (OIES)](https://www.oxfordenergy.org/):** Deep-dive macro and geopolitical energy policy papers.

## Media & Press Usage Policy (CC BY 4.0)
Journalists, analysts, and media outlets are granted free permission to cite, embed, and republish charts, tables, and JSON datasets generated by **The Crude Oracle** under the **[Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)**, subject to a visible link back to **[https://www.thecrudeoracle.com](https://www.thecrudeoracle.com)**.
