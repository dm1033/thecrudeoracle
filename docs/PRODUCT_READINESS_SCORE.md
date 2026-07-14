# PRODUCT_READINESS_SCORE.md — The Crude Oracle
Scored: 2026-07-05 (post improvement loop #1) · Scale 0–100 · Honest scoring: sample-data platform, pre-revenue-operations

| Category | Score | Rationale |
|---|---|---|
| Data accuracy | 62 | Nothing fabricated-as-real; all values labelled indicative samples — accurate *as labelled*; real feeds absent |
| Source transparency | 90 | Source, URL, timestamp, data-type on every record; registers published; methodology notes on tools |
| Data freshness | 70 | Daily JSON workflow + NEW automatic stale-marking; no automated feeds yet |
| Oil-market depth | 82 | Balance, flows, curve, positioning, news, hypotheses, UK/North Sea — unusually deep for stage |
| Analysis quality | 78 | Cross-module coherence (contradiction verdicts, crowd-risk → hypotheses); sample content professional |
| Chart quality | 72 | 8 chart types, labelled, sourced; no full-screen mode/date-range control yet |
| Dashboard usability | 74 | Dense but clean; responsive; no saved layouts/keyboard nav yet |
| Company intelligence | 60 | Structured template solid; anonymised samples; "awaiting verification" pattern defined |
| Alerts | 15 | Roadmap only (B-09), honestly labelled |
| Personalisation | 20 | Access tiers only; saved watchlists/layouts pending auth (B-08/B-10) |
| Subscriber value | 70 | Toolkit + portfolio + briefings substantial; hinges on daily updates + B-02 |
| Mobile experience | 78 | Responsive grids, hamburger nav, scrollable tables |
| Accessibility | 68 | Semantic headings, labels, alt text, aria on charts' figures; AA audit pending (B-15) |
| Security | 76 | Strong hygiene; framework advisories + client gating documented (B-03/B-04) |
| Performance | 80 | Static prerender, CDN, next/image, lazy client charts; Lighthouse run pending |
| SEO | 82 | Comprehensive; schema gaps minor; GSC submission pending (owner) |
| Subscription reliability | 55 | Live Payment Link works; automatic entitlement dormant (B-02) — biggest commercial gap |
| Admin efficiency | 65 | Git+JSON workflow documented on /admin; browser admin pending (B-17) |
| Commercial readiness | 66 | Can sell today with manual fulfilment; B-02 closes the loop |
| Differentiation | 85 | Explainable anomalies, 3-verdict spreads, falsifiable hypotheses, transparent paper portfolio — genuinely distinct from broad terminals |

**Overall: 67/100.** Lowest important categories: **Subscription reliability (55)** → next improvement = B-02 (needs ~15 min of owner action: Supabase project + env vars + webhook), then **B-03 server-side gating**, then **B-05 first real feed (EIA)**.

## Mandatory quality gates
| Gate | Status |
|---|---|
| All primary pages load | ✅ 40/40 routes, verified 2026-07-05 |
| Data sourced and timestamped | ✅ every record |
| Fabricated data removed | ✅ none presented as real; all labelled sample/indicative |
| Stale data visibly marked | ✅ FreshnessBadge (loop #1) |
| API failure behaviour safe | ✅ policy implemented for current stack; feeds inherit it |
| Premium access control works | 🟡 demo mode works; live entitlements await B-02 (owner env vars) |
| Stripe checkout + webhooks in test mode | 🟡 checkout LIVE; webhook code deployed, unconfigured — B-02 |
| Account cancellation works | 🟡 Stripe portal path built; activates with B-02 |

Site is NOT declared "ready" until the three 🟡 gates pass — blocked on owner-side configuration, not code.
