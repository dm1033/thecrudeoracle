# DATA_LICENSING_REGISTER.md — The Crude Oracle
Updated: 2026-07-05

## Licence position today
The platform displays **no licensed commercial data**. Anomaly and price values are manual indicative samples referencing public sources, labelled as such. The Flow Map vessel card reads one hull from TankerMap's documented public API. The homepage map and the flow-map earth read TankerMap's documented `/api/vessels/live` endpoint and keep hulls at 1 knot or more that are not anchored, moored or drifting (informational use, attributed, delayed). Homepage sea lanes and offshore rig marks are desk geometry, not AIS and not a rig census. Satellite basemaps are NASA GIBS mosaics (Blue Marble and VIIRS Black Marble), public and attributed, and are not a live picture of the hulls. No scraping. No paid-publication content reproduced. No real-time exchange data.

| Data class | Example provider | Licence required? | Status | Platform behaviour |
|---|---|---|---|---|
| Real-time exchange prices | ICE, CME | Yes — exchange fees | ❌ Not licensed | Never shown; desk marks labelled `manual`/`indicative` |
| Delayed exchange prices | ICE/CME via vendors | Yes (vendor terms) | ❌ Not licensed | Placeholder; `.env.example` slots for Alpha Vantage/Polygon/Nasdaq Data Link |
| LNG spot assessments (JKM) | Platts/S&P | Yes | ❌ Not licensed | Explicit "API placeholder — licensed assessment required" |
| Tanker tracking | Kpler, Vortexa | Yes | ❌ Not licensed | Stated on Flow Map methodology note. Fleet-wide σ tables stay desk estimates. |
| Single-hull AIS (watched vessel) | TankerMap public API | No formal open-data licence. Informational use of documented public endpoints (`/api/search`, `/api/vessels/{id}`, `/api/vessels/{id}/track`). | ✅ Cited, delayed, one hull | Flow Map `?vessel=` card. Attribution to TankerMap. Not a navigation, sanctions or compliance source. Desk note on the same hull is ours and labelled indicative. |
| Moving-tanker AIS | TankerMap public API `/api/vessels/live` | Documented public endpoint on the TankerMap data catalog. Informational use, attributed, delayed. | ✅ Cited | Homepage map and the flow-map earth. Speed at least 1 knot, excluding anchored, moored and drifting. Class is TankerMap `vessel_type`. Not a bill of lading, not a sanctions screen, not for navigation. If the feed fails, the map draws no stand-in hulls. |
| Satellite basemap | NASA GIBS | US government public imagery. | ✅ Cited | Day: Blue Marble Shaded Relief and Bathymetry. Night: VIIRS Black Marble. Attribution on the map. Mosaics, not a live optical feed of the tankers. Homepage lanes and offshore rigs stay schematic. The rigs are rounded public field locations, not Baker Hughes and not live positions. |
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
