# CHANGELOG — The Crude Oracle

## 2026-09-25 — Market-intelligence globe header

- Replaced the abstract holographic hero with a cinematic night-side Earth: gold and cyan
  tanker routes, oil tankers and offshore rigs, styled for a financial-intelligence header.
- Added `HeroGlobe` with a slow orbital ken-burns, pulsing route wash and a gold/cyan scan
  ring. Motion is disabled under `prefers-reduced-motion`.
- Wired the globe into the homepage hero, Physical Flow Map and Gas/LNG page headers.
- Open Graph / Twitter cards now use the globe (1280×720) instead of the compass still.

## 2026-07-15 — Accessibility (WCAG 2.2 AA), SEO and data-integrity fixes

Accessibility:
- Fixed real contrast failures: `loss` red was 3.51:1 on navy surfaces (AA needs 4.5:1) —
  corrected to #ff6b5c in the Tailwind config; alert borders were 1.69–2.41:1 against a 3:1
  non-text minimum — opacities raised in markup.
- Added a skip-to-content link (WCAG 2.4.1); previously every page required tabbing through
  the banner and full nav.
- Screen-reader data tables for all 8 Recharts charts, which were SVG-only (WCAG 1.1.1).
- Table captions and `scope="col"` on all 7 data tables; nav marked up as lists with
  `aria-current`; `aria-controls` wired on the mobile nav toggle; focus rings on text inputs.

Data integrity:
- `/watchlist` and `/company-intelligence` hardcoded `dataType="manual"` instead of reading each
  record's own `data_type`; the field was also missing from both TypeScript interfaces. A record
  marked live or delayed would have kept displaying MANUAL.

Copy/SEO:
- Removed stale "Premium"/paid-tier language left over from the paywall, including contact and
  account page metadata.

## 2026-07-15 — Remove dead payment plumbing

- Deleted `/api/stripe-webhook` and `/api/billing-portal` routes; removed the `stripe` dependency.
- Removed unused `STRIPE_SUBSCRIPTION_LINK` / `STRIPE_LINK_IS_PLACEHOLDER` exports.
- Account panel: dropped the Stripe billing-portal link and the upgrade upsell (both dead).
- Rewrote the orphaned `/payment/success` and `/payment/cancelled` pages, which still claimed a
  payment had been taken and a Stripe receipt sent. Routes kept for historic redirects.
- `.env.example`, deployment and setup docs updated to record the retirement; historical audit
  docs keep their content below a retirement banner.
- Kept `/api/me` (serves auth identity, no Stripe) and the legal pages (Terms, Privacy,
  Subscription Terms) — those still name Stripe as past processor and need a legal review, not a
  unilateral edit.

## 2026-07-15 — The paywall is removed: The Crude Oracle is now 100% free

- Retired the £299.99/month premium subscription; no payment flow remains on the site.
- `PremiumGate` now renders all content for everyone; `SubscribeCTA` became the free-access banner.
- Site-wide gold announcement banner; header CTA now "100% Free — No Paywall".
- `/subscribe` rewritten as the Free Access announcement page (with FAQ on retired billing).
- Homepage pricing card replaced with a £0/forever card plus a live $1M virtual-portfolio
  performance strip (account value, return since inception, open positions, max drawdown).
- Subscription Terms marked historic; payment success/cancelled pages neutralised;
  login/account copy updated to reflect free access.

## 2026-07-05 — Audit + improvement loop #1
- Protected baseline: branch `baseline/v1.0-pre-audit` @ `3530706`
- Published audit suite: CURRENT_SITE_AUDIT, FEATURE_INVENTORY, DATA_SOURCE_REGISTER, DATA_LICENSING_REGISTER, KNOWN_ISSUES, IMPROVEMENT_BACKLOG, SECURITY_REVIEW, SEO_AUDIT, PRODUCT_READINESS_SCORE, TEST_REPORT, ADMIN_GUIDE, SUBSCRIBER_GUIDE
- **Improvement B-01:** automatic stale-data marking (client-computed FreshnessBadge on all sourced cards); row-level `data_type` added to daily-briefing, investment-watchlist, company-intelligence, research-library records; data-type badges surfaced on watchlist and company cards

## 2026-07-04/05 — Feature build-out (pre-audit)
- $1,000,000 virtual paper-trading portfolio: public /portfolio + premium /portfolio/dashboard, full journal/rules/benchmarks, PORTFOLIO_PLAYBOOK
- Trader Toolkit Modules 5–6: Positioning & Crowd-Risk Engine, Trade Hypothesis Builder; roadmap modules 7–10 on hub
- Module 4: News-to-Barrels AI; Module 3: Futures Curve & Spread Dashboard (+forward-curve chart); Module 2: Physical Flow Map (σ-anomaly radar); Module 1: Global Balance Engine
- Professional imagery site-wide + downloadable Energy Reserves report; OG cards
- Phase 2 auth stack: Supabase magic-link (dormant), Stripe webhook entitlements, billing portal, /api/me; PHASE2_SETUP guide

## 2026-07-03/04 — Launch
- Domain www.thecrudeoracle.com live (Vercel, GoDaddy DNS); production from `main`
- Live Stripe Payment Link £299.99/month wired
- Initial platform: 24+ pages, JSON data layer, dashboards, charts, legal suite, SEO files, deployment docs
