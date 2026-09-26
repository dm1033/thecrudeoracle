# DATA_LICENSING_REGISTER.md — The Crude Oracle
Updated: 2026-07-05

## Licence position today
The platform displays **no licensed commercial data**. Anomaly and price values are manual indicative samples referencing public sources, labelled as such. The Flow Map watched vessel reads one hull from TankerMap's documented public API (informational use, attributed, delayed). No scraping. No paid-publication content reproduced. No real-time exchange data.

| Data class | Example provider | Licence required? | Status | Platform behaviour |
|---|---|---|---|---|
| Real-time exchange prices | ICE, CME | Yes — exchange fees | ❌ Not licensed | Never shown; desk marks labelled `manual`/`indicative` |
| Delayed exchange prices | ICE/CME via vendors | Yes (vendor terms) | ❌ Not licensed | Placeholder; `.env.example` slots for Alpha Vantage/Polygon/Nasdaq Data Link |
| LNG spot assessments (JKM) | Platts/S&P | Yes | ❌ Not licensed | Explicit "API placeholder — licensed assessment required" |
| Tanker tracking | Kpler, Vortexa | Yes | ❌ Not licensed | Stated on Flow Map methodology note. Fleet-wide σ tables stay desk estimates. |
| Single-hull AIS (watched vessel) | TankerMap public API | No formal open-data licence. Informational use of documented public endpoints (`/api/search`, `/api/vessels/{id}`, `/api/vessels/{id}/track`). | ✅ Cited, delayed, one hull | Flow Map `?vessel=` layer. Attribution to TankerMap. Not a navigation, sanctions or compliance source. Desk note on the same hull is ours and labelled indicative. |
| Freight indices | Baltic Exchange | Yes | ❌ Not licensed | Worldscale-style desk marks labelled indicative |
| EIA data & API | US EIA | No (public domain, attribution) | ✅ Approved for Phase 3 | Cited as source basis |
| CFTC COT | CFTC | No (public) | ✅ Approved | Cited; always `delayed` |
| Baker Hughes rig count | Baker Hughes | Public summary usable w/ attribution | ✅ Cited | Summary figures only |
| IEA data | IEA | Public pages citable; datasets licensed | ⚠️ Public summaries only | Cited as "(public summary)" |
| OPEC MOMR | OPEC | Public with attribution | ✅ Cited | Summary references |
| UK DESNZ/NSTA/ONS | UK Gov | OGL v3 | ✅ Approved | Source placeholders live |
| Company filings/RNS | SEC/LSE | Public | ✅ Approved | Cited on cards |
| TradingView widgets | TradingView | Embed terms | 📋 Optional later | Not used |

## Standing rules
1. No dataset goes live before this register records its licence status.
2. Attribution never implies endorsement (stated in Data Disclaimer).
3. Paid/licensed data must not be redistributed beyond licence scope; premium gating must be server-side before any licensed feed ships.
4. Takedown contact published on /data-disclaimer.
