# IMPROVEMENT_BACKLOG.md — The Crude Oracle
Updated: 2026-07-05 · Ranked by charter criteria (data integrity → security → subscription → core features → …)

## ✅ B-01 — Stale-data marking (COMPLETED — loop #1, 2026-07-05)
- **Problem:** timestamps existed but nothing flagged out-of-date values; charter gate "stale data visibly marked" unmet. 4 data files lacked row-level data_type.
- **Solution:** client-computed `FreshnessBadge` (age vs per-dataset threshold) wired into DataMeta (all price/signal cards); row-level `data_type` added to briefing/watchlist/company/research records; badges surfaced on watchlist + company cards.
- **Acceptance:** value older than threshold shows amber "STALE — last verified Xd ago"; fresh values unbadged; no fabricated freshness. ✅ Tests: build, route sweep, manual render check.
- **Rollback:** revert single commit; no schema impact.

## B-02 — Activate live entitlements (owner + assistant, ~15 min owner time)
Complete PHASE2_SETUP.md: Supabase project, 5 Vercel env vars, Stripe webhook. Acceptance: test payment auto-grants premium; cancellation revokes; /api/me returns supabase mode.

## B-03 — Server-side premium gating
Middleware + server-rendered premium routes so gated content never ships in HTML. Required before licensed data or real paid content. Acceptance: unauthenticated fetch of premium route contains zero premium payload.

## B-04 — Framework upgrade (Next 15/16) + regression pass
Clears npm-audit advisories (KI-04). Acceptance: build green, route sweep green, no visual regressions.

## B-05 — First real data feed: EIA open API (public domain)
Nightly job → weekly inventories + prices into JSON with retrieval-time stamps; auto data_type `public`; stale logic automatic. Acceptance: EIA rows show real values with retrieval timestamps; failure path retains last value marked stale.

## B-06 — Automated test suite
Playwright route/access/webhook tests + JSON schema validation in CI (GitHub Action). Acceptance: PRs blocked on red.

## B-07 — Full-site search (briefings, companies, research, tools) with filters.
## B-08 — User-saved watchlists + notes/tags/theses (needs B-02 auth).
## B-09 — Alerts centre (email on briefing publish, price/data conditions) — permission-based only.
## B-10 — Personal dashboard (saved layout, preferred modules) + "What changed today?" screen (Toolkit Module 8).
## B-11 — Signal Engine page: 10 evidence-led signals with the charter's classification scale, confidence, contrary evidence, next update — synthesised "Crude Oracle View".
## B-12 — Daily briefing v2: expand to the 20-section premium format with fact/claim/estimate/opinion tagging.
## B-13 — Historical data explorer (chart any stored series; JSON history accumulates from daily updates).
## B-14 — Contact form backend (KI-06); email signup placeholder → provider.
## B-15 — Accessibility pass to WCAG 2.2 AA: reduced-motion, chart text summaries, focus audit.
## B-16 — Macro dashboard (DXY, rates, PMIs from public sources) + refinery/product monitor page.
## B-17 — Browser-based admin (Supabase-backed) with correction audit log (original/revised/reason/user/time).
