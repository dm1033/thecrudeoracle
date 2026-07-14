# KNOWN_ISSUES.md — The Crude Oracle
Updated: 2026-07-05 · Severity: 🔴 blocking-for-real-money · 🟠 important · 🟡 minor

| ID | Sev | Issue | Impact | Mitigation today | Fix |
|----|-----|-------|--------|------------------|-----|
| KI-01 | 🔴 | Paying customers don't get access automatically — Supabase env vars not yet set | Manual access-code fulfilment | Demo code + email fulfilment; full code deployed | Owner completes PHASE2_SETUP.md (~15 min) |
| KI-02 | 🔴 | Premium gating is client-side; premium sample content exists in static HTML | Determined visitor can read gated sample content | Acceptable while content is sample | Server-side gating pass before real paid content/licensed data |
| KI-03 | 🟠 | All market data is manual sample data | Not decision-grade until feeds land | Fully labelled; FreshnessBadge marks staleness | Phase 3: EIA API first (free, public-domain) |
| KI-04 | 🟠 | Next.js 14.2.35 npm audit advisories (fix = v16 breaking) | Mostly mitigated by Vercel platform; residual moderate | No middleware/i18n/nonces/beforeInteractive in codebase | Scheduled framework upgrade + regression pass |
| KI-05 | 🟠 | No automated test suite | Regressions rely on scripted manual sweeps | Route sweep + secret grep + JSON validation each release | Add Playwright + unit tests (backlog) |
| KI-06 | 🟠 | Contact form is mailto fallback | Enquiries depend on user's mail client | Direct email shown | Wire Formspree/Resend or API route |
| KI-07 | 🟠 | No rate limiting on API routes | Webhook is signature-verified; /api/me is read-only | Low surface while dormant | Add limiter middleware with auth phase |
| KI-08 | 🟡 | Payment Link after-payment redirect set by owner in Stripe dashboard (unverified here) | Customers may see generic Stripe confirmation | Success page exists | Owner: set redirect to /payment/success |
| KI-09 | 🟡 | User-saved watchlists, alerts, search, personal dashboard not built | Feature gaps vs charter | Shown as roadmap, never faked | Backlog items B-07..B-10 |
| KI-10 | 🟡 | Sample tickers (SMPL-A etc.) are anonymised | Less realism | Deliberate compliance choice | Swap when data policy agreed |
| KI-11 | 🟡 | PremiumGate "Checking access…" flash on first paint | Cosmetic | — | Suspense/skeleton polish |
| KI-12 | 🟡 | prefers-reduced-motion not explicitly handled (hover scale on images) | Minor a11y | Small motion only | Add motion-safe variants |

No hidden or disguised failures: every placeholder on the site is labelled as such on-page.
