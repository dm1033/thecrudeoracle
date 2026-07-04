# Daily Update Guide — The Crude Oracle

Everything on the site renders from JSON files in `/data`. The daily routine is:
**edit JSON → commit → push → auto-deploy** (Vercel/Netlify rebuilds on push).
Target time: 5–15 minutes per day. A live copy of these instructions is at `/admin`.

## The morning routine

### 1. Market prices — `data/market-prices.json`
For each asset update:
```jsonc
{
  "price": 78.42,            // new value
  "daily_change": 1.12,      // % vs yesterday
  "weekly_change": 2.87,     // % vs last week
  "monthly_change": -1.35,   // % vs last month
  "trend": "up",             // up | down | flat | mixed
  "last_updated": "2026-07-04T07:00:00Z",
  "data_type": "manual"      // manual | delayed | live | API placeholder
}
```
Rules:
- `data_type` must be honest. Only mark `live` if the feed is properly licensed.
- Keep `source` and `source_url` pointing at where you actually took the number.

### 2. Signals + bottom line — `data/dashboard-signals.json`
- Update any `supply`, `demand`, `risk` card whose story changed: `value`,
  `detail`, `signal` (`bullish` | `bearish` | `neutral` | `risk`), `last_updated`.
- Rewrite all six `bottom_line` fields daily (what moved / why / what's next /
  biggest risk / biggest opportunity / watch tomorrow) and its `last_updated`.

### 3. Daily briefing — `data/daily-briefing.json`
Add a **new object at the TOP of the `briefings` array** (copy yesterday's as a
template). All 11 sections are required:
`oil_summary, gas_summary, supply_risk, demand_signal, opec_note,
inventory_signal, geopolitical_risk, equities_to_watch, uk_energy_note,
one_chart, bottom_line` — plus `date`, `headline`, `sources`, `last_updated`,
and `status: "published"` (use `"draft"` to keep it hidden).
Older entries stay below and become the archive automatically.

### 4. Charts — `data/chart-data.json`
Append today's point to each series you track (`brent_wti_30d`,
`gas_trend_30d`, `us_inventories_weeks`, `rig_count_weeks`,
`opec_production_months`, `watchlist_performance_30d`, `sector_heatmap`).
Trim the oldest point to keep ~30 days. Update `meta.last_published`.

### 5. Watchlist / company intel (event-driven, not daily)
- `data/investment-watchlist.json`: edit or add companies. Every entry needs
  `investment_theme`, `catalyst`, `risk`, `source`, `last_updated`. The UI
  labels all entries "Watchlist, not recommendation" — write accordingly:
  describe, never instruct.
- `data/company-intelligence.json`: update `latest_update` and any structural
  fields when a company reports or announces; refresh `sources`.

### 6. Research notes (as published)
`data/research-library.json`: add to `notes` with `access: "free" | "premium"`
and `status: "published" | "draft"`.

### 7. Ship it
```bash
git add data/
git commit -m "daily update 2026-07-04"
git push
```
Deployment is automatic. Spot-check `/dashboard`, `/premium-dashboard` and
`/daily-briefing` after the deploy finishes.

## Content rules (compliance)

1. **Never** tell readers to buy or sell. Describe, contextualise, monitor.
2. **Never** promise returns or "guaranteed" signals.
3. Cite a source for every figure; set `data_type` honestly.
4. Don't paste text from paid publications (Bloomberg, Reuters, Argus, Platts,
   broker research). Summarise public facts in your own words and cite public
   sources (EIA, IEA, OPEC, Energy Institute, DESNZ, NSTA, ONS, company filings).
5. Timestamps in UTC ISO format: `YYYY-MM-DDTHH:MM:SSZ`.

## JSON safety

- Keep every file valid JSON (no trailing commas, quote all strings).
- Validate before pushing: `npx tsc --noEmit` or paste into a JSON validator.
- If the build fails after a push, it is almost always a JSON syntax error —
  check the deploy log, fix, push again.
