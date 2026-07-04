# Future Roadmap — The Crude Oracle

## Phase 1 — Launch (this build)
- Next.js + TypeScript + Tailwind platform, 24+ pages
- JSON-driven dashboards, briefings, watchlist, company intel, research index
- Stripe Payment Link at £299.99/month (placeholder to swap)
- Client-side access-tier placeholder (public / free / premium)
- SEO complete (metadata, schema, sitemap, robots, manifest)

## Phase 2 — Real accounts & entitlements
- Supabase Auth (magic-link email) — replaces localStorage placeholder
- `profiles` table with `tier`; Stripe webhooks (`checkout.session.completed`,
  `customer.subscription.updated/deleted`) set/revoke premium
- Next.js middleware protecting premium routes server-side
- Stripe customer portal link on `/account` ("Manage billing")
- Stripe Checkout API route replacing the Payment Link

## Phase 3 — Data pipeline
- Move JSON content into Supabase tables (schema already mirrors the JSON)
- Authenticated admin UI: edit briefing/prices/watchlist in the browser,
  draft → publish workflow, audit trail of `last_updated`
- Lawful market-data APIs where licensed: EIA open data (free, official),
  Alpha Vantage / Polygon.io / Nasdaq Data Link for equities (per licence),
  TradingView widgets where embedding terms allow
- Automatic "delayed" labelling from feed metadata

## Phase 4 — Member experience
- Daily briefing email (Resend/Postmark) to premium members
- Downloadable PDF reports from research notes
- Premium alerts (email/push) for OPEC decisions, inventory surprises, disruptions
- Watchlist performance tracking with real (licensed) price history
- Search across briefing archive and research library

## Phase 5 — Growth
- Free weekly teaser email → conversion funnel
- Annual plan (e.g. 2 months free) as a second Stripe price
- Team/enterprise seats with per-seat billing
- Referral programme; affiliate tracking
- Expanded coverage: uranium/power, refined products, carbon markets

## Standing compliance workstream
- Quarterly legal-page review
- Data-licence audit before enabling any live feed
- Copy audit: no advice language, no guarantees, sources cited
