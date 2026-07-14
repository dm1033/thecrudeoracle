# DATA_SOURCE_REGISTER.md — The Crude Oracle
Updated: 2026-07-05 · Governing rule: **no value displays without source, timestamp and data-type label; nothing indicative is ever labelled live.**

## Current pipeline status
ALL market values are **manual desk entries / indicative samples**, keyed on public-source ranges. No live or delayed feeds are connected yet. Every record carries `source`, `source_url`, `last_updated`, `data_type`. Stale-data marking: client-computed FreshnessBadge (see thresholds below); stale values remain visible but flagged, never silently replaced. API failure policy (for future feeds): retain last verified value → mark stale → show last successful update → notify admin → never present as current.

| Dataset (file) | Source basis | Frequency | Method | Stale threshold | Fallback |
|---|---|---|---|---|---|
| market-prices.json | EIA/ICE/NYMEX-style desk marks (indicative) | Daily | Manual | 48h | Show stale badge |
| dashboard-signals.json | EIA/IEA/OPEC/Baker Hughes public summaries | Daily | Manual | 96h | Show stale badge |
| daily-briefing.json | Editorial on public sources | Each trading day | Manual | 48h | Latest edition dated |
| chart-data.json | Sample series shaped on public ranges | Daily append | Manual | 96h | Chart caption dates |
| balance-engine.json | EIA weekly / IEA & OPEC monthly | Wed (EIA) / report days | Manual | 8d weekly, 35d monthly | Stale badge |
| flow-map.json | Public flow summaries (Kpler/Vortexa-class NOT licensed) | Daily | Manual | 96h | Stale badge |
| curve-monitor.json | Desk marks (exchange settles NOT licensed) | Daily | Manual | 48h | Stale badge |
| news-to-barrels.json | Public reporting, editor-reviewed | Event-driven | Manual (AI-assisted) | Status field | Resolved events retired |
| positioning-engine.json | CFTC COT (Fri) / ICE COT — public | Weekly | Manual | 9d | `delayed` badge always |
| hypothesis-builder.json | Cross-module synthesis | Event-driven | Manual | Status field | Invalidated = recorded |
| investment-watchlist.json | Filings/RNS/investor decks | Event-driven | Manual | 30d review | Review date shown |
| company-intelligence.json | Filings/RNS (anonymised samples) | Event-driven | Manual | 30d review | "Data unavailable or awaiting verification" |
| research-library.json | Editorial index | On publish | Manual | n/a | — |
| virtual-portfolio.json | Delayed/indicative quote marks | Daily | Manual | 48h | Stale badge |

## Approved source hierarchy (for live-feed phase)
EIA · IEA (public pages) · OPEC · Energy Institute · CFTC · Baker Hughes · UK DESNZ · NSTA · ONS · National Grid/NESO · SEC filings · RNS/LSE · company reports/presentations · licensed APIs (Alpha Vantage / Polygon / Nasdaq Data Link) — public data is never presented as matching licensed institutional feed speed or depth.

## Quality checks (enforced manually now; automate with feeds)
Valid JSON on every commit · unit/currency stated per record · timestamps UTC ISO · no impossible values · revisions overwrite with new `last_updated` (git history = revision log) · source disagreement noted in desk notes (e.g. IEA vs OPEC).
