# DATA_SOURCE_REGISTER.md — The Crude Oracle
Updated: 2026-07-05 · Governing rule: **no value displays without source, timestamp and data-type label; nothing indicative is ever labelled live.**

## Current pipeline status
**Update, November 2026.** The dashboard cards, Global Balance Engine, Curve page, What Changed, Public Data Monitor and the Desk Bot are no longer edited by hand. They read public feeds (EIA, CFTC, FRED, GDELT) when the site is built and show nothing for a feed that fails. The old files `dashboard-signals.json`, `balance-engine.json` and `curve-monitor.json` have been deleted. News-to-Barrels, Flow Map and Hypothesis Builder are a July 2026 archive and are marked as such on the site. The table below covers only the files still edited by hand.

Market values in the JSON files are **manual desk entries / indicative samples**, keyed on public-source ranges. The exception is the watched vessel: position, speed, course and the cargo flag are read from the TankerMap public API and labelled `delayed`, on the Flow Map and as the named marker on the homepage earth. Homepage crude and LNG lanes, and the offshore rigs on the same earth, are fixed desk geometry, labelled schematic. The rigs are not a vessel feed and not a rig-count feed. The homepage barrels and trading graph replay `brent_wti_30d` from chart-data.json. That replay is the published indicative series, labelled manual. The desk note attached to that hull stays in `vessel-attachments.json` and is labelled `indicative`. Every stored record carries `source`, `source_url`, `last_updated`, `data_type`. Stale-data marking: client-computed FreshnessBadge (see thresholds below); a TankerMap position older than 6 hours is badged on the vessel card. Stale values remain visible but flagged, never silently replaced. If TankerMap does not answer, the position is left blank — it is not invented — and the page links to the TankerMap vessel.

| Dataset (file) | Source basis | Frequency | Method | Stale threshold | Fallback |
|---|---|---|---|---|---|
| market-prices.json | EIA/ICE/NYMEX-style desk marks (indicative) | Daily | Manual | 48h | Show stale badge |
| daily-briefing.json | Editorial on public sources | Each trading day | Manual | 48h | Latest edition dated |
| chart-data.json | Sample series shaped on public ranges | Daily append | Manual | 96h | Chart caption dates |
| flow-map.json | July 2026 sample tables (tanker tracking NOT licensed) | Not updated | Manual | n/a | Archive notice on the page |
| vessel-attachments.json | Crude Oracle desk note on one TankerMap hull | When the watch changes | Manual | 30d review | Note stays visible, dated |
| TankerMap vessel watch (`?vessel=`, default IMO 1076599) | TankerMap public API | Upstream about hourly; page revalidates 30 min | Server fetch of search, vessel and track. Homepage reads the same hull via `/api/globe-vessel` | 6h on the position | Blank position, source link, no invented coordinates. Homepage omits the marker if the feed fails |
| news-to-barrels.json | July 2026 sample events | Not updated | Manual | n/a | Archive notice on the page |
| positioning-engine.json | July 2026 desk notes on markets other than WTI (WTI itself comes from the automated CFTC pull) | Not updated | Manual | n/a | "Not current" notice on the page |
| hypothesis-builder.json | July 2026 sample hypotheses | Not updated | Manual | n/a | Archive notice on the page |
| investment-watchlist.json | Filings/RNS/investor decks | Event-driven | Manual | 30d review | Review date shown |
| company-intelligence.json | Filings/RNS (anonymised samples) | Event-driven | Manual | 30d review | "Data unavailable or awaiting verification" |
| research-library.json | Editorial index | On publish | Manual | n/a | — |
| virtual-portfolio.json | Delayed/indicative quote marks | Daily | Manual | 48h | Stale badge |

## Approved source hierarchy (for live-feed phase)
EIA · IEA (public pages) · OPEC · Energy Institute · CFTC · Baker Hughes · UK DESNZ · NSTA · ONS · National Grid/NESO · SEC filings · RNS/LSE · company reports/presentations · licensed APIs (Alpha Vantage / Polygon / Nasdaq Data Link) — public data is never presented as matching licensed institutional feed speed or depth.

## Quality checks (enforced manually now; automate with feeds)
Valid JSON on every commit · unit/currency stated per record · timestamps UTC ISO · no impossible values · revisions overwrite with new `last_updated` (git history = revision log) · source disagreement noted in desk notes (e.g. IEA vs OPEC).
