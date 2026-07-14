# CHANGELOG — The Crude Oracle

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
