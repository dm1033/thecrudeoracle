# CURRENT_SITE_AUDIT.md — The Crude Oracle
Audit date: 2026-07-05 · Auditor: Claude Code · Baseline: branch `baseline/v1.0-pre-audit` @ `3530706`

## Stack & architecture
- **Framework:** Next.js 14.2.35 (App Router), TypeScript strict, Tailwind CSS 3.4, Recharts 2.12
- **Data layer:** 14 JSON files in `/data` (all content admin-editable, git-versioned); typed via `src/lib/data.ts`
- **Auth:** Dual-mode — Supabase magic-link (code deployed, DORMANT until env vars set) with localStorage demo fallback (`src/lib/access.ts`)
- **Payments:** Live Stripe Payment Link (£299.99/month) on /subscribe; webhook + billing-portal + checkout entitlement code deployed but UNCONFIGURED (see PHASE2_SETUP.md)
- **Database:** None active (Supabase schema written, not provisioned)
- **Deployment:** Vercel, git-integrated; production branch `main`; domain www.thecrudeoracle.com live with HTTPS; security headers via vercel.json
- **APIs:** 4 route handlers — /api/me, /api/stripe-webhook, /api/billing-portal, /auth/callback (all null-safe when unconfigured)

## Verified today (evidence in TEST_REPORT.md)
- Production build passes; all 40 routes return 200; 404 page works
- No secret keys anywhere in shipped code (grep sweep clean)
- All 14 data JSON files parse valid
- Production domain serving latest deployment
- Stripe Payment Link resolves (live checkout)

## Key findings (ranked by the improvement criteria)
1. **Data is 100% sample/indicative** — labelled per card (`manual`/`indicative`/`delayed` badges, sources, timestamps), which is compliant; but there was **no automatic stale-data marking** → fixed in improvement loop #1 (FreshnessBadge).
2. **4 data files lacked row-level `data_type` labels** (daily-briefing, investment-watchlist, company-intelligence, research-library) → fixed in loop #1.
3. **Premium gating is client-side** until Supabase is configured; premium sample content is present in static HTML payloads (acceptable for sample data; must move server-side before real paid content — backlog #3).
4. **npm audit:** Next 14.2.35 carries published advisories (fix = Next 16, breaking). Several are mitigated by Vercel's managed platform (no self-hosting, no middleware, no beforeInteractive scripts, no CSP nonces). Residual risk moderate; framework upgrade scheduled — backlog #4.
5. **No automated test suite** — verification is scripted-manual (route sweep, grep gates). Backlog #6.
6. **Contact form** uses a mailto fallback, not a backend. Backlog #8.
7. **User-facing features not yet real:** saved watchlists, alerts, search, personal dashboard, historical explorer — placeholders/roadmap items, not disguised as working (each labelled).

## What must be preserved
Everything currently deployed is working as designed: 26+ public/premium pages, 6-module Trader Toolkit, $1M virtual portfolio (public+premium), legal suite, SEO files, JSON publishing workflow, dual-mode auth, Stripe link, imagery, disclaimers. No broken features found. No fabricated-as-real data found.
