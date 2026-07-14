# SECURITY_REVIEW.md — The Crude Oracle
Reviewed: 2026-07-05

## Verified controls ✅
- **Secrets:** none in shipped code (grep sweep of src/data/public/docs clean); all keys via env vars only; `.env*` git-ignored; `.env.example` placeholders only
- **Headers:** X-Content-Type-Options nosniff, X-Frame-Options DENY, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy camera/mic/geo off (vercel.json + netlify.toml); HSTS via Vercel
- **Webhook:** /api/stripe-webhook verifies Stripe signatures (`constructEvent`) before any action; 503 when unconfigured; 400 on bad signature; 500 → Stripe retry
- **Injection/XSS:** no SQL layer active; no `dangerouslySetInnerHTML` with user input (only self-generated JSON-LD); no user-generated content stored; React escaping throughout
- **CSRF:** no state-changing cookie-authenticated POST endpoints exposed (webhook is signature-auth, not cookie-auth)
- **IDOR:** no object IDs exposed; /api/me derives identity from session only
- **File uploads:** none
- **Payments:** card data never touches the site (Stripe-hosted); Payment Link is public by design
- **Supabase design:** RLS on profiles ("read own row"); service-role key server-only; admin client never imported client-side
- **Robots/index:** /admin, /account, /payment/* noindex + robots-disallowed
- **Backups/DR:** site+content fully in git (Vercel rebuildable from any commit); baseline branch retained; no DB yet to back up

## Findings & actions
| Sev | Finding | Action |
|---|---|---|
| 🟠 | Next 14.2.35 advisories (npm audit; fix = v16 breaking). Applicability review: no middleware, no i18n, no CSP nonces, no beforeInteractive, image optimizer is Vercel-managed, no WebSockets → majority not exploitable here; cache-poisoning class residual | Backlog B-04 scheduled upgrade + regression |
| 🟠 | Client-side premium gating (until Supabase live) — content disclosure, not account compromise | B-03 server-side gating before real paid content |
| 🟠 | No rate limiting on API routes | Add with auth activation (B-02) |
| 🟡 | No audit-log system for manual data corrections (git history serves interim) | B-17 admin system |
| 🟡 | Session security / password reset N/A until Supabase live (magic-link = no passwords) | Verify session cookie flags at B-02 activation test |

## Test accounts policy
Development uses synthetic data only (SMPL-* tickers, demo access code). No real subscriber data exists yet; when Supabase activates, test with disposable emails before real customers.
