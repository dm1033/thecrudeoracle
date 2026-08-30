# EIA Open Data API integration

Replaces the hand-typed entries for four fields with an automated pull from
the US Energy Information Administration's free, public-domain Open Data API
(https://api.eia.gov, no licence restriction — see
https://www.eia.gov/opendata/). Everything else in `data/*.json` stays
exactly as it is today: hand-authored, `data_type: "manual"`.

**Status: UNVERIFIED against the live API.** The sandbox this was built in
has no outbound internet access — `api.eia.gov` is blocked by its egress
proxy — so nothing here has ever made a real HTTP call to EIA. It is
verified thoroughly against realistic offline fixtures instead (see
"What was and wasn't verified" below). Do not trust it in production until
a human runs it once against the live API and checks the output.

## What it updates

| File | Field(s) | EIA series | Cadence |
|---|---|---|---|
| `data/market-prices.json` | `prices[].price/.daily_change/.weekly_change/.monthly_change/.trend/.source/.source_url/.last_updated/.data_type` for `ticker: "WTI"` | `RWTC` — Cushing, OK WTI Spot Price FOB | Daily |
| `data/market-prices.json` | same fields, for `ticker: "BRN"` | `RBRTE` — Europe Brent Spot Price FOB | Daily |
| `data/balance-engine.json` | `stocks[].value/.change/.trend/.source/.source_url/.last_updated/.data_type` for `metric: "US commercial crude stocks"` | `WCESTUS1` — Weekly U.S. Ending Stocks excluding SPR of Crude Oil | Weekly |
| `data/balance-engine.json` | same fields, for `metric: "Cushing (WTI delivery hub)"` | `WCESTOK1` — Weekly Cushing, OK Ending Stocks of Crude Oil | Weekly |

Nothing else is touched — Dubai Crude, NBP, TTF, Henry Hub, the JKM/DXY
placeholders, every other `balance-engine.json` supply/demand/stocks row,
and hand-authored fields on the four rows above (`note`, `impact` on the
stock rows) are all left exactly as they were. `data_type` is set to
`"delayed"` — the one existing value (see `src/lib/data.ts`'s `DataType`
union: `"live" | "delayed" | "manual" | "API placeholder"`) that's honest
for an automated pull of a real but non-real-time public feed: WTI/Brent
spot prints with same/next-day publication lag, and the weekly stocks
report itself is inherently ~5 days behind the data it describes. `"live"`
is reserved by this site's own rules (`docs/DAILY_UPDATE_GUIDE.md`) for a
properly licensed real-time feed, which this is not; `"api"` is not a value
this codebase recognizes at all.

## Series identifiers — confidence and verification

Written from training-data recollection with no way to check them live.
Each is a named constant in `src/lib/eia.ts` (`EIA_SERIES`) carrying its own
`confidence` and `verificationNote`. Before the first production run, check
every one of these against https://www.eia.gov/opendata/browser/:

- **`RWTC`, `RBRTE`** (WTI/Brent spot, route `petroleum/pri/spt`) — **high
  confidence**. These are long-standing, widely-used EIA series ids.
- **`WCESTUS1`** (US commercial crude stocks, route `petroleum/stoc/wstk`)
  — **high confidence**. Also mirrored by FRED under the identical id.
- **`WCESTOK1`** (Cushing stocks) — **medium confidence only**. This id is
  a best-recollection guess formed on the same naming pattern as
  `WCESTUS1`. Verify it specifically before trusting it.

If a route or series id is wrong, the request either 404s/400s (fails
loudly, no write happens) or returns rows tagged with an unexpected
`series` value that `parseEiaResponse` drops — it never gets silently
mislabeled as Cushing data.

## Running it

```bash
export EIA_API_KEY=your_free_key   # https://www.eia.gov/opendata/register.php
node scripts/update-eia-data.mjs             # fetch, validate, write
node scripts/update-eia-data.mjs --dry-run   # fetch, validate, print the diff, write nothing
```

Requires a Node version with built-in TypeScript support so
`scripts/update-eia-data.mjs` can `import` the typed `src/lib/eia.ts`
directly with no build step and no added dependency (this repo's
`package.json` is intentionally left alone — no new packages). Confirmed
working unflagged on Node 22.22.2 in this sandbox; if an older Node in your
deploy environment rejects the import, either upgrade Node or run with
`node --experimental-strip-types scripts/update-eia-data.mjs` (available
from Node 22.6).

### Guarantees

- **All-or-nothing**: all four series are fetched and validated *before*
  any file is touched. If even one fails, nothing is written to either
  file and the process exits non-zero.
- **Atomic writes**: each file is written to a `*.tmp-<pid>-<ts>` path in
  `data/` and then `rename()`d into place — a crash mid-write can only
  leave an orphan temp file, never a truncated `data/*.json`.
- **Idempotent**: re-running against the same upstream data reproduces the
  same output byte-for-byte. Safe to run on a schedule (e.g. a daily/weekly
  cron or GitHub Action) without accumulating drift or duplicates.
- **Never invents a value**: every number is traced back to a validated EIA
  observation with its real observation date, which becomes `last_updated`
  — the freshness badge (`src/components/FreshnessBadge.tsx`, untouched by
  this work) then ages from the true observation date, not from whenever
  the script happened to run. A handful of sanity bounds (price range,
  percent-change range, stock-level range, observation-age range) act as a
  last line of defence against a wrong series id or unit mixup; tripping
  one aborts the write, it never clamps or guesses a "close enough" value.

### Offline / local testing (no live API access needed)

```bash
EIA_API_KEY=test EIA_FIXTURE_DIR=scripts/fixtures/live-run \
  EIA_DATA_DIR=/path/to/a/scratch/copy/of/data \
  node scripts/update-eia-data.mjs --dry-run
```

When `EIA_FIXTURE_DIR` is set, HTTP calls are served from local JSON files
(`<dir>/<SERIES_ID>.json`) instead of `https://api.eia.gov` — the script
prints a loud banner so the fixture-served run can never be mistaken for a
real one. `EIA_DATA_DIR` overrides which directory's `market-prices.json` /
`balance-engine.json` get updated, so a fixture run never has to touch the
real `data/` directory. **Never combine a real `EIA_DATA_DIR` (the repo's
own `data/`) with `EIA_FIXTURE_DIR`** — that would write synthetic test
numbers into the live site's data files.

## What was and wasn't verified

**Verified** (run `node scripts/verify-eia-fixtures.mjs`, no network
required):
- Response parsing/validation against 9 realistic-but-synthetic malformed
  EIA v2 payloads (missing `response`, non-array `data`, empty `data`,
  `{error: ...}` envelope, all-null values, non-numeric values, wrong
  `series` echoed back, non-object top level, missing/invalid `period`) —
  every one is rejected with `EiaValidationError`, none is silently
  coerced into a number.
- Parsing and unit conversion (thousand barrels → million barrels) against
  4 realistic valid fixtures (`scripts/fixtures/valid/*.json`), including
  the daily/weekly/monthly % change and week-over-week absolute-change
  arithmetic.
- The network layer's timeout, exponential-backoff retry, and hard retry
  cap, and — importantly — that a *non-transient* failure (4xx other than
  429, e.g. a bad key or bad series id) fails on the first attempt instead
  of burning retry budget. (A real bug of exactly this kind — a fail-fast
  path getting silently re-classified as retriable by its own function's
  catch block — was caught and fixed by this test during development; see
  the `ClassifiedFetchError` comment in `src/lib/eia.ts`.) All exercised by
  monkey-patching `globalThis.fetch`, no real network call is made.
- The full `update-eia-data.mjs` pipeline end-to-end, spawned as a real
  child process against scratch copies of the actual `data/market-prices.json`
  / `data/balance-engine.json`: a full valid run, a byte-identical
  re-run (idempotency), `--dry-run` making no changes, a run with 1 of 4
  series deliberately broken leaving both files byte-identical to before
  (the all-or-nothing / refuse-to-write guarantee), and a missing-API-key
  run failing closed with an actionable error message.

**NOT verified — cannot be, without live network access:**
- That `https://api.eia.gov/v2/petroleum/pri/spt/data/` and
  `https://api.eia.gov/v2/petroleum/stoc/wstk/data/` are the correct v2
  route paths.
- That `RWTC`, `RBRTE`, `WCESTUS1`, and — especially — `WCESTOK1` are the
  correct current series ids, and that EIA hasn't changed the v2 response
  shape (field names, nesting, units string) since this was written from
  memory.
- That a real EIA API key issued today actually authenticates and that
  EIA's real rate limits are compatible with `DEFAULT_MAX_RETRIES` /
  `DEFAULT_RETRY_BASE_DELAY_MS` in `src/lib/eia.ts`.
- That the real weekly stocks report's publication day/lag and the daily
  spot price's publication lag fall inside the sanity-bound freshness
  windows (`maxObservationAgeDaysDaily: 10`, `maxObservationAgeDaysWeekly: 21`
  in `scripts/update-eia-data.mjs`) under real-world EIA holiday/schedule
  variation.

### Verifying it in production — exact steps for a human

1. Get a free key at https://www.eia.gov/opendata/register.php and set
   `EIA_API_KEY` in Vercel's project environment variables (server-side
   only, never `NEXT_PUBLIC_*`).
2. From a machine with real internet access (this sandbox cannot do this
   step): `curl "https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=$EIA_API_KEY&frequency=daily&data[0]=value&facets[series][]=RWTC&sort[0][column]=period&sort[0][direction]=desc&length=3"`
   and confirm it 200s with a `response.data` array shaped like
   `scripts/fixtures/valid/RWTC.json`. Repeat for `RBRTE` on the same
   route, then for `WCESTUS1` and `WCESTOK1` on
   `petroleum/stoc/wstk/data/` with `frequency=weekly`.
3. If any of those 404s, 400s, or comes back with an unexpected shape,
   fix the `route`/`seriesId` in `EIA_SERIES` in `src/lib/eia.ts` (the
   API browser at https://www.eia.gov/opendata/browser/ is the source of
   truth) before proceeding.
4. Run `node scripts/update-eia-data.mjs --dry-run` for real (against the
   actual `data/` directory, no `EIA_FIXTURE_DIR` set) and read the
   printed diff.
5. Spot-check the printed WTI/Brent prices against
   https://www.eia.gov/dnav/pet/hist/RWTCD.htm /
   `.../RBRTED.htm`, and the stock levels against
   https://www.eia.gov/petroleum/supply/weekly/, by eye.
6. Only once that looks right, drop `--dry-run` and let it write, or wire
   it into a scheduled job (cron / GitHub Action / Vercel Cron) — daily for
   the price series, weekly (after EIA's Wednesday ~10:30am ET release) for
   the stock series.

## Files

- `src/lib/eia.ts` — typed client (network + validation + transforms), no
  added dependencies (Node's built-in global `fetch`).
- `scripts/update-eia-data.mjs` — the update script described above.
- `scripts/verify-eia-fixtures.mjs` — offline fixture-based verification
  (59 checks as of this writing).
- `scripts/fixtures/valid/*.json`, `scripts/fixtures/malformed/*.json` —
  realistic sample EIA v2 responses (synthetic data, for shape/parsing
  tests) and deliberately broken ones.
- `scripts/fixtures/live-run/`, `scripts/fixtures/broken-run/` — a full
  4-series fixture set and a 3-good/1-broken set, for manually driving
  `update-eia-data.mjs` end-to-end via `EIA_FIXTURE_DIR` (the automated
  verification script generates its own date-fresh versions of these at
  run time so its freshness-bound checks don't go stale).
- `scripts/fixtures/_generate.mjs` — regenerates the `valid/` fixtures;
  not part of the runtime path.
