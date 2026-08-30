#!/usr/bin/env node
/**
 * scripts/update-eia-data.mjs
 * ----------------------------------------------------------------------------
 * Fetches the four EIA series this site cares about (WTI spot, Brent spot,
 * US commercial crude stocks, Cushing stocks) and updates the matching
 * records in data/market-prices.json and data/balance-engine.json.
 *
 * Usage:
 *   EIA_API_KEY=xxxxx node scripts/update-eia-data.mjs [--dry-run]
 *
 * Safety properties (see docs/EIA_INTEGRATION.md for the full writeup):
 *   - Idempotent: re-running with the same upstream data reproduces the same
 *     output file byte-for-byte (no duplication, no drift).
 *   - All-or-nothing: every series is fetched and validated BEFORE any file
 *     is touched. If any single series fails, NOTHING is written and the
 *     process exits non-zero — existing data/*.json is left exactly as-is.
 *   - Atomic writes: each file is written to a temp path in the same
 *     directory and then renamed into place, so a crash mid-write cannot
 *     leave a truncated/corrupt JSON file.
 *   - Never invents a value: every number written is traced back to a
 *     validated EIA observation with its real observation date; on any
 *     doubt (missing series, out-of-range value, stale/future date) the
 *     script refuses to write rather than guess.
 *
 * Offline/local testing (no live API access required):
 *   EIA_FIXTURE_DIR=scripts/fixtures/live-run EIA_DATA_DIR=<scratch dir> \
 *     node scripts/update-eia-data.mjs --dry-run
 *   When EIA_FIXTURE_DIR is set, HTTP calls are served from local JSON files
 *   instead of https://api.eia.gov — see scripts/verify-eia-fixtures.mjs for
 *   the full exercised test matrix (happy path, idempotent re-run, and the
 *   refuse-to-write path against a deliberately broken fixture).
 * ----------------------------------------------------------------------------
 */

import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run") || args.includes("-n");

const FIXTURE_DIR = process.env.EIA_FIXTURE_DIR ? resolve(process.cwd(), process.env.EIA_FIXTURE_DIR) : null;
const DATA_DIR = process.env.EIA_DATA_DIR ? resolve(process.cwd(), process.env.EIA_DATA_DIR) : join(PROJECT_ROOT, "data");

// ----------------------------------------------------------------------------
// Optional fixture-backed fetch, for offline testing only. See docstring above.
// ----------------------------------------------------------------------------
function installFixtureFetch(dir) {
  console.warn("*".repeat(78));
  console.warn(`* EIA_FIXTURE_DIR is set — serving LOCAL FIXTURES from:`);
  console.warn(`*   ${dir}`);
  console.warn(`* This run does NOT touch the live EIA API. Output values are synthetic`);
  console.warn(`* test data and must never be mistaken for real observations.`);
  console.warn("*".repeat(78));

  globalThis.fetch = async (url) => {
    const u = new URL(String(url));
    const seriesId = u.searchParams.get("facets[series][]");
    if (!seriesId) {
      return new Response(JSON.stringify({ error: "fixture fetch: URL had no facets[series][] param" }), {
        status: 400,
      });
    }
    const fixturePath = join(dir, `${seriesId}.json`);
    try {
      const body = await readFile(fixturePath, "utf8");
      return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
    } catch {
      return new Response(
        JSON.stringify({ error: `fixture fetch: no fixture file for series '${seriesId}' at ${fixturePath}` }),
        { status: 404 }
      );
    }
  };
}

if (FIXTURE_DIR) installFixtureFetch(FIXTURE_DIR);

// ----------------------------------------------------------------------------
// Load the typed library. src/lib/eia.ts is plain, erasable-syntax TypeScript
// (no enums/decorators), which modern Node loads directly without a build
// step or an added dependency. If an older Node rejects this, fail with a
// clear, actionable message rather than a raw stack trace.
// ----------------------------------------------------------------------------
let eia;
try {
  eia = await import("../src/lib/eia.ts");
} catch (err) {
  console.error(
    "[eia] Could not load src/lib/eia.ts directly. This script requires a Node version with " +
      "built-in TypeScript support (Node >=22.6, unflagged on Node >=22.18 / 23.6+; on an older " +
      "22.x you may need to run with `node --experimental-strip-types scripts/update-eia-data.mjs`). " +
      `Underlying error: ${err instanceof Error ? err.message : String(err)}`
  );
  process.exitCode = 1;
  process.exit(1);
}

const {
  EIA_SERIES,
  getWtiSpot,
  getBrentSpot,
  getUsCommercialCrudeStocks,
  getCushingStocks,
  EiaConfigError,
} = eia;

// ----------------------------------------------------------------------------
// Sanity bounds — a last line of defence against a wrong series id or a unit
// mixup slipping a wildly-wrong number into the site. These are deliberately
// generous (they should never fire on real data) but catch gross errors.
// ----------------------------------------------------------------------------
const BOUNDS = {
  price: { min: 0, max: 400 }, // USD/bbl
  pctChange: { min: -50, max: 50 }, // percent, daily/weekly/monthly
  usStocksMb: { min: 100, max: 900 }, // million barrels
  cushingStocksMb: { min: 1, max: 90 }, // million barrels
  maxObservationAgeDaysDaily: 10,
  maxObservationAgeDaysWeekly: 21,
};

class ScriptValidationError extends Error {}

function assertInRange(value, bounds, label) {
  if (value === null) return; // preserved-old-value case, nothing new to bound-check
  if (!Number.isFinite(value) || value < bounds.min || value > bounds.max) {
    throw new ScriptValidationError(`${label} = ${value} is outside the sane range [${bounds.min}, ${bounds.max}]`);
  }
}

function assertObservationFresh(dateIso, maxAgeDays, label) {
  const obsDate = new Date(`${dateIso.slice(0, 10)}T00:00:00Z`);
  const now = new Date();
  const ageDays = (now.getTime() - obsDate.getTime()) / 86_400_000;
  if (ageDays < -1) {
    // allow 1 day of slack for timezone edges; a genuinely future date is a bug
    throw new ScriptValidationError(`${label}: observation date ${dateIso} is in the future`);
  }
  if (ageDays > maxAgeDays) {
    throw new ScriptValidationError(
      `${label}: observation date ${dateIso} is ${ageDays.toFixed(1)} days old, exceeding the ` +
        `${maxAgeDays}-day sanity bound — the EIA feed may be broken or the wrong series id may be in use`
    );
  }
}

function round(n, decimals) {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

// ----------------------------------------------------------------------------
// Update logic — mutates in-memory copies; never touches disk directly.
// ----------------------------------------------------------------------------
function applyDailyPriceUpdate(marketPrices, ticker, result, seriesDef) {
  const entry = marketPrices.prices.find((p) => p.ticker === ticker);
  if (!entry) {
    throw new ScriptValidationError(`ticker '${ticker}' not found in market-prices.json — refusing to guess`);
  }

  assertObservationFresh(result.latest.date, BOUNDS.maxObservationAgeDaysDaily, `${ticker} latest observation`);

  const newPrice = round(result.latest.value, 2);
  assertInRange(newPrice, BOUNDS.price, `${ticker} price`);
  assertInRange(result.dailyChangePct, BOUNDS.pctChange, `${ticker} daily_change`);
  assertInRange(result.weeklyChangePct, BOUNDS.pctChange, `${ticker} weekly_change`);
  assertInRange(result.monthlyChangePct, BOUNDS.pctChange, `${ticker} monthly_change`);

  const dailyChange = result.dailyChangePct ?? entry.daily_change;
  const weeklyChange = result.weeklyChangePct ?? entry.weekly_change;
  const monthlyChange = result.monthlyChangePct ?? entry.monthly_change;
  const trend = result.dailyChangePct === null ? entry.trend : dailyChange > 0 ? "up" : dailyChange < 0 ? "down" : "flat";

  const before = { price: entry.price, daily_change: entry.daily_change, data_type: entry.data_type };

  entry.price = newPrice;
  entry.daily_change = dailyChange;
  entry.weekly_change = weeklyChange;
  entry.monthly_change = monthlyChange;
  entry.trend = trend;
  entry.source = `EIA Open Data API — ${seriesDef.description}`;
  entry.source_url = seriesDef.sourcePageUrl;
  entry.last_updated = `${result.latest.date}T00:00:00Z`;
  entry.data_type = "delayed"; // automated pull of a public, lagged (non-real-time) EIA series

  return (
    `${entry.asset} (${ticker}): price ${before.price} -> ${entry.price}, ` +
    `data_type ${before.data_type} -> ${entry.data_type}, observed ${result.latest.date}`
  );
}

function applyStockUpdate(balance, metricName, result, seriesDef, boundsKey) {
  const row = balance.stocks.find((r) => r.metric === metricName);
  if (!row) {
    throw new ScriptValidationError(`metric '${metricName}' not found in balance-engine.json stocks — refusing to guess`);
  }

  assertObservationFresh(result.latest.date, BOUNDS.maxObservationAgeDaysWeekly, `${metricName} latest observation`);

  const newValueMb = round(result.latest.value, 1);
  assertInRange(newValueMb, BOUNDS[boundsKey], `${metricName} value`);

  const changeAbs = result.changeAbs;
  const changeStr = changeAbs === null ? row.change : `${changeAbs >= 0 ? "+" : ""}${changeAbs.toFixed(1)} w/w`;
  const trend = changeAbs === null ? row.trend : changeAbs > 0 ? "up" : changeAbs < 0 ? "down" : "flat";

  const before = { value: row.value, data_type: row.data_type };

  row.value = newValueMb.toFixed(1);
  row.change = changeStr;
  row.trend = trend;
  row.source = `EIA Weekly Petroleum Status Report — Open Data API (${seriesDef.seriesId})`;
  row.source_url = seriesDef.sourcePageUrl;
  row.last_updated = result.latest.date;
  row.data_type = "delayed";
  // `note` and `impact` are hand-authored editorial judgement — left untouched.

  return (
    `${row.metric}: value ${before.value} -> ${row.value} mb, ` +
    `data_type ${before.data_type} -> ${row.data_type}, observed ${result.latest.date}`
  );
}

// ----------------------------------------------------------------------------
// Atomic write: temp file in the same directory, then rename (atomic on a
// same-filesystem rename). A crash mid-write leaves only an orphan .tmp file,
// never a corrupt target file.
// ----------------------------------------------------------------------------
async function writeJsonAtomic(filePath, obj) {
  const tmpPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const content = JSON.stringify(obj, null, 2) + "\n";
  try {
    await writeFile(tmpPath, content, "utf8");
    await rename(tmpPath, filePath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------
const TARGETS = [
  {
    name: `WTI spot (${EIA_SERIES.WTI_SPOT.seriesId})`,
    kind: "daily",
    fetcher: () => getWtiSpot(),
    apply: (result, marketPrices) => applyDailyPriceUpdate(marketPrices, "WTI", result, EIA_SERIES.WTI_SPOT),
  },
  {
    name: `Brent spot (${EIA_SERIES.BRENT_SPOT.seriesId})`,
    kind: "daily",
    fetcher: () => getBrentSpot(),
    apply: (result, marketPrices) => applyDailyPriceUpdate(marketPrices, "BRN", result, EIA_SERIES.BRENT_SPOT),
  },
  {
    name: `US commercial crude stocks (${EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS.seriesId})`,
    kind: "weekly",
    fetcher: () => getUsCommercialCrudeStocks(),
    apply: (result, balance) =>
      applyStockUpdate(balance, "US commercial crude stocks", result, EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS, "usStocksMb"),
  },
  {
    name: `Cushing stocks (${EIA_SERIES.CUSHING_CRUDE_STOCKS.seriesId})`,
    kind: "weekly",
    fetcher: () => getCushingStocks(),
    apply: (result, balance) =>
      applyStockUpdate(balance, "Cushing (WTI delivery hub)", result, EIA_SERIES.CUSHING_CRUDE_STOCKS, "cushingStocksMb"),
  },
];

async function main() {
  console.log(`[eia] update-eia-data.mjs starting${DRY_RUN ? " (--dry-run)" : ""} — data dir: ${DATA_DIR}`);

  const fetchResults = [];
  for (const target of TARGETS) {
    try {
      const result = await target.fetcher();
      fetchResults.push({ target, ok: true, result });
      console.log(`[eia] OK   ${target.name} -> latest ${result.latest.date} = ${result.latest.value}`);
    } catch (err) {
      if (err instanceof EiaConfigError) {
        console.error(`[eia] CONFIG ERROR: ${err.message}`);
        process.exitCode = 1;
        return;
      }
      fetchResults.push({ target, ok: false, error: err });
      console.error(`[eia] FAIL ${target.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const failures = fetchResults.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.error(
      `\n[eia] ${failures.length}/${TARGETS.length} series failed fetch/validation. Refusing to write ANY ` +
        `data file — existing data/*.json left untouched. Exiting non-zero.\n`
    );
    process.exitCode = 1;
    return;
  }

  const marketPricesPath = join(DATA_DIR, "market-prices.json");
  const balancePath = join(DATA_DIR, "balance-engine.json");
  const marketPrices = JSON.parse(await readFile(marketPricesPath, "utf8"));
  const balance = JSON.parse(await readFile(balancePath, "utf8"));

  const changeLog = [];
  try {
    for (const { target, result } of fetchResults) {
      changeLog.push(target.apply(result, target.kind === "daily" ? marketPrices : balance));
    }
  } catch (err) {
    console.error(`\n[eia] Post-fetch validation failed while applying updates: ${err instanceof Error ? err.message : String(err)}`);
    console.error(`[eia] Refusing to write — existing data/*.json left untouched. Exiting non-zero.\n`);
    process.exitCode = 1;
    return;
  }

  console.log("\n[eia] Changes:");
  for (const c of changeLog) console.log(`  - ${c}`);

  if (DRY_RUN) {
    console.log("\n[eia] --dry-run set — no files written.");
    return;
  }

  await writeJsonAtomic(marketPricesPath, marketPrices);
  await writeJsonAtomic(balancePath, balance);

  console.log(`\n[eia] Wrote ${marketPricesPath}`);
  console.log(`[eia] Wrote ${balancePath}`);
  console.log(
    `[eia] Source: ${FIXTURE_DIR ? "LOCAL FIXTURES (synthetic test data)" : "EIA Open Data API (https://api.eia.gov)"}. ` +
      `On first production run, spot-check the written values against ` +
      `https://www.eia.gov/petroleum/supply/weekly/ and https://www.eia.gov/dnav/pet/ — see docs/EIA_INTEGRATION.md.`
  );
}

main().catch((err) => {
  console.error(`[eia] Unexpected error: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exitCode = 1;
});
