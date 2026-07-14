# ADMIN_GUIDE.md — The Crude Oracle
The admin system is git+JSON: edit → commit → push → auto-deploy (~1 min). Live cheat-sheet at /admin (noindex).

## Daily (5–15 min)
1. `data/market-prices.json` — prices, changes, timestamps (honest `data_type`)
2. `data/dashboard-signals.json` — signals + six-field bottom line
3. `data/daily-briefing.json` — new 11-section entry at TOP of array
4. `data/balance-engine.json` — rows + implied balance
5. `data/chart-data.json` — append today's points
6. `data/virtual-portfolio.json` — position marks, account, 16-section trading brief
7. Commit `daily update YYYY-MM-DD`, push, spot-check live site

## Event-driven
- `flow-map.json` (anomalies in/out) · `curve-monitor.json` (verdicts) · `news-to-barrels.json` (event cards) · `positioning-engine.json` (Fridays, post-COT) · `hypothesis-builder.json` (open/invalidate — never delete losers) · watchlist/company/research files

## Rules that never bend
Timestamps UTC ISO · every record has source + source_url + data_type · never label indicative data live · no buy/sell language · losses published like gains · stale is fine, hidden-stale is not (FreshnessBadge will expose it anyway).

## Corrections
Fix the value, update `last_updated`, put the reason in the commit message — git history is the interim audit log (original value, revised value, author, time). Browser-based admin with formal correction records: backlog B-17.

## Ops
- Deploys/rollbacks: Vercel dashboard → Deployments (any previous build can be promoted)
- Baseline snapshot: branch `baseline/v1.0-pre-audit`
- Stale warnings: visible on-page via amber STALE badges
- Subscriptions: Stripe dashboard (payments, refunds, cancellations); entitlement automation → PHASE2_SETUP.md
- Full references: DAILY_UPDATE_GUIDE.md · PORTFOLIO_PLAYBOOK.md · README_DEPLOYMENT.md
