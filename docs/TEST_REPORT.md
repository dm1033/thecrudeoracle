# TEST_REPORT.md — The Crude Oracle
Run: 2026-07-05 · Environment: local production build (next build && next start) + live-domain spot checks

| Test | Method | Result |
|---|---|---|
| Production build | `npm run build` | ✅ 40/40 routes compile & prerender |
| Route sweep (40 routes) | curl status codes | ✅ all 200; unknown route → 404 page |
| SEO files | /sitemap.xml /robots.txt /manifest.json | ✅ 200 |
| Report download | /reports/…pdf | ✅ 200, application/pdf (also verified on live domain) |
| Secret scan | grep sk_live/sk_test/whsec_/service-role JWT across src,data,public,docs | ✅ clean |
| Data integrity | python json.tool on 14 files | ✅ all valid |
| data_type coverage | grep per file | ✅ all files (4 fixed in loop #1) |
| API placeholder behaviour | GET /api/me → `{"mode":"placeholder"}`; POST /api/stripe-webhook unconfigured → 503 | ✅ safe failure |
| Access tiers | manual: public gate shown; demo free login; ORACLE-PREMIUM unlock; sign-out reset | ✅ |
| Stripe link | live /subscribe → buy.stripe.com/8x2aEY2r7eCO2lfbJSgYU00 | ✅ resolves to live checkout |
| Live domain | Vercel fetch of /, /subscribe, /oil-truth, /tools/*, /portfolio | ✅ 200 + expected content |
| Stale-marking (loop #1) | FreshnessBadge renders for record older than threshold; absent when fresh | ✅ manual render check |
| npm audit | prod deps | ⚠️ Next 14.2.35 advisories — see SECURITY_REVIEW.md / B-04 |
| Automated unit/e2e suite | — | ❌ not yet (B-06) |
| Lighthouse/CWV on production | — | ⏳ pending (post-deploy task) |
| Webhook end-to-end (test mode) | — | ⏳ blocked on B-02 env vars |

Defects found this run: none new. Known items tracked in KNOWN_ISSUES.md.
