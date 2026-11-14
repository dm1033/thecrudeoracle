# ADMIN_GUIDE.md — The Crude Oracle
The admin system is git+JSON: edit → commit → push → auto-deploy (~1 min). Live cheat-sheet at /admin (noindex).

## Daily (5–15 min)
1. `data/market-prices.json` — prices, changes, timestamps (honest `data_type`)
2. `data/daily-briefing.json` — new 11-section entry at TOP of array
3. `data/chart-data.json` — append today's points
4. `data/virtual-portfolio.json` — position marks, account, 16-section trading brief
5. Commit `daily update YYYY-MM-DD`, push, spot-check live site

## No longer edited by hand
The dashboard cards, Global Balance Engine, Curve page, What Changed, Public Data Monitor and the Desk Bot are no longer edited by hand. They read public feeds (EIA, CFTC, FRED, GDELT) when the site is built and show nothing for a feed that fails. The old files `dashboard-signals.json`, `balance-engine.json` and `curve-monitor.json` have been deleted. News-to-Barrels, Flow Map and Hypothesis Builder are a July 2026 archive and are marked as such on the site.

## Event-driven
- watchlist/company/research files. `flow-map.json`, `news-to-barrels.json` and `hypothesis-builder.json` are an archive: if you start updating one again, remove its archive notice in the same commit.

## Rules that never bend
Timestamps UTC ISO · every record has source + source_url + data_type · never label indicative data live · no buy/sell language · losses published like gains · stale is fine, hidden-stale is not (FreshnessBadge will expose it anyway).

## Corrections
Fix the value, update `last_updated`, put the reason in the commit message — git history is the interim audit log (original value, revised value, author, time). Browser-based admin with formal correction records: backlog B-17.

## Ops
- Deploys/rollbacks: Vercel dashboard → Deployments (any previous build can be promoted)
- Baseline snapshot: branch `baseline/v1.0-pre-audit`
- Stale warnings: visible on-page via amber STALE badges
- Subscriptions: retired — The Crude Oracle is 100% free; the Stripe integration (payments, webhook, billing portal) has been removed from the codebase, see README_DEPLOYMENT.md §3
- Full references: DAILY_UPDATE_GUIDE.md · PORTFOLIO_PLAYBOOK.md · README_DEPLOYMENT.md
