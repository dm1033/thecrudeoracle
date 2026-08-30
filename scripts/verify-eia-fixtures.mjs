#!/usr/bin/env node
/**
 * scripts/verify-eia-fixtures.mjs
 * ----------------------------------------------------------------------------
 * Offline verification of the EIA integration. This container has no
 * outbound internet access, so api.eia.gov cannot be reached — everything
 * here runs against local JSON fixtures instead, and exercises the full
 * parse -> validate -> transform -> write pipeline with zero network calls
 * (network I/O itself is exercised too, via a monkey-patched globalThis.fetch).
 *
 * Run: node scripts/verify-eia-fixtures.mjs
 * Exits non-zero if any check fails.
 * ----------------------------------------------------------------------------
 */

import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(SCRIPT_DIR, "..");
const FIXTURES_VALID = join(SCRIPT_DIR, "fixtures", "valid");
const FIXTURES_MALFORMED = join(SCRIPT_DIR, "fixtures", "malformed");

let pass = 0;
let fail = 0;

function check(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function expectThrows(label, fn, matchFn) {
  try {
    await fn();
    check(label, false, "expected it to throw, but it did not");
  } catch (err) {
    const ok = matchFn ? matchFn(err) : true;
    check(label, ok, ok ? undefined : `threw ${err?.constructor?.name}: ${err?.message}`);
  }
}

function section(title) {
  console.log(`\n-- ${title} ${"-".repeat(Math.max(0, 70 - title.length))}`);
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const eia = await import("../src/lib/eia.ts");

// ============================================================================
// 1. Valid fixtures parse + transform correctly
// ============================================================================
section("Layer 2/3: valid fixtures parse and transform correctly");
{
  const json = await loadJson(join(FIXTURES_VALID, "RWTC.json"));
  const obs = eia.parseEiaResponse(json, eia.EIA_SERIES.WTI_SPOT);
  check("RWTC fixture parses to 45 observations", obs.length === 45, `got ${obs.length}`);
  check("RWTC observations sorted newest-first", obs[0].date > obs[1].date, `${obs[0].date} vs ${obs[1].date}`);
  check("RWTC latest value matches fixture (74.86)", obs[0].value === 74.86, `got ${obs[0].value}`);
  check("RWTC units passed through unconverted", obs[0].units === "$/BBL");

  const daily = eia.buildDailySeriesResult(obs);
  check(
    "RWTC daily result resolves priorDay/weekAgo/monthAgo",
    Boolean(daily.priorDay && daily.weekAgo && daily.monthAgo)
  );
  check("RWTC dailyChangePct is a finite number", Number.isFinite(daily.dailyChangePct), String(daily.dailyChangePct));
  check(
    "RWTC weeklyChangePct matches hand-computed % change",
    Math.abs(daily.weeklyChangePct - ((daily.latest.value - daily.weekAgo.value) / Math.abs(daily.weekAgo.value)) * 100) < 0.01
  );
}

{
  const json = await loadJson(join(FIXTURES_VALID, "RBRTE.json"));
  const obs = eia.parseEiaResponse(json, eia.EIA_SERIES.BRENT_SPOT);
  check("RBRTE fixture parses to 45 observations", obs.length === 45, `got ${obs.length}`);
  check("RBRTE latest value matches fixture (79.15)", obs[0].value === 79.15, `got ${obs[0].value}`);
}

{
  const json = await loadJson(join(FIXTURES_VALID, "WCESTUS1.json"));
  const obs = eia.parseEiaResponse(json, eia.EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS);
  check("WCESTUS1 fixture parses to 6 observations", obs.length === 6, `got ${obs.length}`);
  check(
    "WCESTUS1 thousand-barrel -> million-barrel conversion (441600 -> 441.6)",
    obs[0].rawValue === 441600 && obs[0].value === 441.6,
    `raw=${obs[0].rawValue} value=${obs[0].value}`
  );
  const weekly = eia.buildWeeklySeriesResult(obs);
  check(
    "WCESTUS1 changeAbs = latest - previous, rounded to 1dp",
    weekly.changeAbs === Math.round((weekly.latest.value - weekly.previous.value) * 10) / 10
  );
}

{
  const json = await loadJson(join(FIXTURES_VALID, "WCESTOK1.json"));
  const obs = eia.parseEiaResponse(json, eia.EIA_SERIES.CUSHING_CRUDE_STOCKS);
  check("WCESTOK1 fixture parses to 6 observations", obs.length === 6, `got ${obs.length}`);
  check(
    "WCESTOK1 thousand-barrel -> million-barrel conversion (24200 -> 24.2)",
    obs[0].rawValue === 24200 && obs[0].value === 24.2,
    `raw=${obs[0].rawValue} value=${obs[0].value}`
  );
}

// ============================================================================
// 2. Malformed fixtures are rejected, never silently coerced
// ============================================================================
section("Layer 2: malformed responses are rejected with EiaValidationError");
{
  const cases = [
    ["api_error.json", "EIA error envelope ({error: ...})"],
    ["missing_response.json", "missing top-level 'response'"],
    ["data_not_array.json", "'response.data' is not an array"],
    ["empty_data.json", "'response.data' is an empty array"],
    ["all_null_values.json", "every row has value: null (not yet published)"],
    ["non_numeric_value.json", "value field is a non-numeric string"],
    ["wrong_series.json", "rows carry a different series id than requested"],
    ["not_json_object.json", "top-level JSON is an array, not an object"],
    ["missing_period.json", "rows with missing/invalid 'period'"],
  ];
  for (const [file, desc] of cases) {
    const json = await loadJson(join(FIXTURES_MALFORMED, file));
    await expectThrows(
      `malformed/${file} (${desc}) -> EiaValidationError`,
      async () => eia.parseEiaResponse(json, eia.EIA_SERIES.WTI_SPOT),
      (err) => err instanceof eia.EiaValidationError
    );
  }
}

// ============================================================================
// 3. API key handling + URL construction
// ============================================================================
section("Config: API key required, never hardcoded, URL built correctly");
{
  const savedKey = process.env.EIA_API_KEY;
  delete process.env.EIA_API_KEY;

  await expectThrows(
    "getApiKey() throws EiaConfigError when EIA_API_KEY is unset",
    async () => eia.getApiKey(),
    (err) => err instanceof eia.EiaConfigError && /EIA_API_KEY/.test(err.message)
  );
  await expectThrows(
    "buildEiaDataUrl() throws EiaConfigError when EIA_API_KEY is unset",
    async () => eia.buildEiaDataUrl(eia.EIA_SERIES.WTI_SPOT),
    (err) => err instanceof eia.EiaConfigError
  );

  process.env.EIA_API_KEY = "test-key-123";
  const url = eia.buildEiaDataUrl(eia.EIA_SERIES.WTI_SPOT, { length: 5 });
  const parsed = new URL(url);
  check("buildEiaDataUrl targets the WTI_SPOT route", url.includes("/petroleum/pri/spt/data/"), url);
  check(
    "buildEiaDataUrl includes the correct series facet",
    parsed.searchParams.getAll("facets[series][]").includes("RWTC")
  );
  check("buildEiaDataUrl includes the api key", parsed.searchParams.get("api_key") === "test-key-123");
  check("buildEiaDataUrl requests descending sort by period", parsed.searchParams.get("sort[0][column]") === "period");
  check(
    "redactApiKey() hides the key but keeps the rest of the URL",
    !eia.redactApiKey(url).includes("test-key-123") && eia.redactApiKey(url).includes("REDACTED")
  );

  if (savedKey === undefined) delete process.env.EIA_API_KEY;
  else process.env.EIA_API_KEY = savedKey;
}

// ============================================================================
// 4. Network layer: timeout, retry/backoff, and non-transient-vs-transient handling
//    (globalThis.fetch is monkey-patched — no real network call is made)
// ============================================================================
section("Layer 1: fetchWithRetry — timeout, retry/backoff, hard cap");
{
  const originalFetch = globalThis.fetch;

  // Transient 502s then success — should retry and eventually succeed.
  {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      if (calls < 3) return new Response("bad gateway", { status: 502 });
      return new Response(JSON.stringify({ response: { data: [{ period: "2026-08-01", value: 70 }] } }), { status: 200 });
    };
    const result = await eia.fetchWithRetry("https://api.eia.gov/v2/fake", { maxRetries: 3, retryBaseDelayMs: 5 });
    check(
      "fetchWithRetry recovers after 2 transient 502s (3rd attempt succeeds)",
      calls === 3 && result && typeof result === "object",
      `calls=${calls}`
    );
  }

  // Persistent 500s — should exhaust retries and throw EiaFetchError.
  {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response("boom", { status: 500 });
    };
    await expectThrows(
      "fetchWithRetry throws EiaFetchError after exhausting retries on persistent 500",
      async () => eia.fetchWithRetry("https://api.eia.gov/v2/fake", { maxRetries: 2, retryBaseDelayMs: 5 }),
      (err) => err instanceof eia.EiaFetchError
    );
    check("fetchWithRetry made exactly maxRetries+1=3 attempts", calls === 3, `calls=${calls}`);
  }

  // Non-transient 400 — should fail immediately, no retry budget burned.
  {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response("bad request", { status: 400 });
    };
    await expectThrows(
      "fetchWithRetry fails immediately on a non-transient 400 (bad api_key/series)",
      async () => eia.fetchWithRetry("https://api.eia.gov/v2/fake", { maxRetries: 3, retryBaseDelayMs: 5 }),
      (err) => err instanceof eia.EiaFetchError
    );
    check("fetchWithRetry made exactly 1 attempt for a 400 (no wasted retries)", calls === 1, `calls=${calls}`);
  }

  // Timeout — a hanging request should abort at timeoutMs and retry up to the cap.
  {
    let calls = 0;
    globalThis.fetch = (_url, init) =>
      new Promise((_resolve, reject) => {
        calls++;
        init.signal.addEventListener("abort", () => {
          const err = new Error("The operation was aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    await expectThrows(
      "fetchWithRetry aborts a hanging request at timeoutMs and eventually throws",
      async () => eia.fetchWithRetry("https://api.eia.gov/v2/fake", { timeoutMs: 20, maxRetries: 1, retryBaseDelayMs: 5 }),
      (err) => err instanceof eia.EiaFetchError && /timed out/.test(err.message)
    );
    check("fetchWithRetry retried once on timeout (maxRetries=1 -> 2 attempts)", calls === 2, `calls=${calls}`);
  }

  globalThis.fetch = originalFetch;
}

// ============================================================================
// 5. End-to-end: run the actual update script as a child process against
//    fixtures, on scratch copies of the real data files. Proves the full
//    fetch -> validate -> transform -> atomic-write pipeline, idempotency,
//    and the refuse-to-write-on-failure guarantee — all offline.
// ============================================================================
section("End-to-end: scripts/update-eia-data.mjs against fixtures (scratch copies of data/*.json)");

function businessDaysBack(startDate, count) {
  const dates = [];
  const d = new Date(startDate);
  while (dates.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates;
}

/**
 * Fixtures dated relative to "now" so this test matrix keeps passing
 * regardless of when it's run (the checked-in scripts/fixtures/valid/*.json
 * are static, dated near authoring time, and exist for human inspection —
 * they are used above in the layer 2/3 parse tests, which don't check
 * observation freshness).
 */
async function writeFreshFixtures(dir) {
  await mkdir(dir, { recursive: true });
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  while (today.getUTCDay() === 0 || today.getUTCDay() === 6) today.setUTCDate(today.getUTCDate() - 1);

  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const dailyDates = businessDaysBack(today, 45);
  let wti = 74.86;
  let brent = 79.15;
  const wtiRows = dailyDates.map((period, i) => {
    if (i > 0) wti += (rand() - 0.5) * 1.6;
    return { period, series: "RWTC", value: Math.round(wti * 100) / 100, units: "$/BBL" };
  });
  const brentRows = dailyDates.map((period, i) => {
    if (i > 0) brent += (rand() - 0.5) * 1.6;
    return { period, series: "RBRTE", value: Math.round(brent * 100) / 100, units: "$/BBL" };
  });

  const weeklyDates = [];
  const w = new Date(today);
  for (let i = 0; i < 6; i++) {
    weeklyDates.push(w.toISOString().slice(0, 10));
    w.setUTCDate(w.getUTCDate() - 7);
  }
  let usStock = 441.6;
  let cushingStock = 24.2;
  const usRows = weeklyDates.map((period, i) => {
    if (i > 0) usStock += (rand() - 0.55) * 3.2;
    return { period, series: "WCESTUS1", value: Math.round(usStock * 1000), units: "MBBL" };
  });
  const cushingRows = weeklyDates.map((period, i) => {
    if (i > 0) cushingStock += (rand() - 0.55) * 0.6;
    return { period, series: "WCESTOK1", value: Math.round(cushingStock * 1000), units: "MBBL" };
  });

  const wrap = (rows) => JSON.stringify({ response: { total: String(rows.length), dateFormat: "YYYY-MM-DD", data: rows } }, null, 2);
  await writeFile(join(dir, "RWTC.json"), wrap(wtiRows));
  await writeFile(join(dir, "RBRTE.json"), wrap(brentRows));
  await writeFile(join(dir, "WCESTUS1.json"), wrap(usRows));
  await writeFile(join(dir, "WCESTOK1.json"), wrap(cushingRows));
  return dailyDates[0]; // the "latest" observation date, for assertions
}

async function makeScratchDataDir(label) {
  const dir = join(tmpdir(), `eia-verify-${label}-${process.pid}-${Date.now()}`);
  await mkdir(dir, { recursive: true });
  await cp(join(PROJECT_ROOT, "data", "market-prices.json"), join(dir, "market-prices.json"));
  await cp(join(PROJECT_ROOT, "data", "balance-engine.json"), join(dir, "balance-engine.json"));
  return dir;
}

function runUpdateScript({ dataDir, fixtureDir, extraArgs = [] }) {
  return spawnSync(process.execPath, [join(SCRIPT_DIR, "update-eia-data.mjs"), ...extraArgs], {
    encoding: "utf8",
    env: { ...process.env, EIA_API_KEY: "verify-fixture-key", EIA_DATA_DIR: dataDir, EIA_FIXTURE_DIR: fixtureDir },
  });
}

{
  const freshDir = join(tmpdir(), `eia-verify-fresh-fixtures-${process.pid}-${Date.now()}`);
  const latestDate = await writeFreshFixtures(freshDir);

  // --- Happy path ---
  const dataDir = await makeScratchDataDir("happy");
  const before = await readFile(join(dataDir, "market-prices.json"), "utf8");

  const res1 = runUpdateScript({ dataDir, fixtureDir: freshDir });
  check("update-eia-data.mjs exits 0 against a full valid fixture set", res1.status === 0, `status=${res1.status}\n${res1.stderr}`);

  const afterFirst = await readFile(join(dataDir, "market-prices.json"), "utf8");
  const afterFirstBalance = await readFile(join(dataDir, "balance-engine.json"), "utf8");
  check("market-prices.json changed after a successful run", afterFirst !== before);

  const parsedPrices = JSON.parse(afterFirst);
  const wti = parsedPrices.prices.find((p) => p.ticker === "WTI");
  const brn = parsedPrices.prices.find((p) => p.ticker === "BRN");
  check("WTI row updated with valid data_type ('delayed', not an invented value)", wti.data_type === "delayed", wti.data_type);
  check("WTI last_updated stamped from the fixture's observation date", wti.last_updated.startsWith(latestDate), wti.last_updated);
  check("WTI price is a finite positive number", Number.isFinite(wti.price) && wti.price > 0, String(wti.price));
  check("BRN row also updated", brn.data_type === "delayed" && brn.last_updated.startsWith(latestDate));
  check("Dubai Crude row untouched (not an EIA target)", parsedPrices.prices.find((p) => p.ticker === "DUB").data_type === "manual");

  const parsedBalance = JSON.parse(afterFirstBalance);
  const usRow = parsedBalance.stocks.find((r) => r.metric === "US commercial crude stocks");
  const cushingRow = parsedBalance.stocks.find((r) => r.metric === "Cushing (WTI delivery hub)");
  check("US commercial crude stocks row updated", usRow.data_type === "delayed", usRow.data_type);
  check("Cushing stocks row updated", cushingRow.data_type === "delayed", cushingRow.data_type);
  check(
    "Cushing 'note' (hand-authored commentary) preserved verbatim",
    cushingRow.note === "Approaching operational minimums; supportive for WTI timespreads."
  );
  check("OECD industry stocks row untouched (not an EIA target)", parsedBalance.stocks.find((r) => r.metric === "OECD industry stocks").data_type === "manual");

  // --- Idempotency: identical upstream data re-run produces byte-identical output ---
  const res2 = runUpdateScript({ dataDir, fixtureDir: freshDir });
  check("second run against identical fixtures also exits 0", res2.status === 0, `status=${res2.status}`);
  const afterSecond = await readFile(join(dataDir, "market-prices.json"), "utf8");
  const afterSecondBalance = await readFile(join(dataDir, "balance-engine.json"), "utf8");
  check("idempotent re-run: market-prices.json is byte-identical", afterSecond === afterFirst);
  check("idempotent re-run: balance-engine.json is byte-identical", afterSecondBalance === afterFirstBalance);

  await rm(dataDir, { recursive: true, force: true });

  // --- --dry-run makes no changes ---
  const dryDir = await makeScratchDataDir("dryrun");
  const dryBefore = await readFile(join(dryDir, "market-prices.json"), "utf8");
  const dryRes = runUpdateScript({ dataDir: dryDir, fixtureDir: freshDir, extraArgs: ["--dry-run"] });
  check("--dry-run exits 0", dryRes.status === 0, `status=${dryRes.status}`);
  const dryAfter = await readFile(join(dryDir, "market-prices.json"), "utf8");
  check("--dry-run leaves market-prices.json untouched", dryAfter === dryBefore);
  await rm(dryDir, { recursive: true, force: true });

  // --- Refuse-to-write: 1 of 4 series fails validation ---
  const brokenDir = join(tmpdir(), `eia-verify-broken-fixtures-${process.pid}-${Date.now()}`);
  await mkdir(brokenDir, { recursive: true });
  await cp(join(freshDir, "RWTC.json"), join(brokenDir, "RWTC.json"));
  await cp(join(freshDir, "RBRTE.json"), join(brokenDir, "RBRTE.json"));
  await cp(join(freshDir, "WCESTUS1.json"), join(brokenDir, "WCESTUS1.json"));
  await cp(join(FIXTURES_MALFORMED, "all_null_values.json"), join(brokenDir, "WCESTOK1.json"));

  const brokenDataDir = await makeScratchDataDir("broken");
  const brokenBeforePrices = await readFile(join(brokenDataDir, "market-prices.json"), "utf8");
  const brokenBeforeBalance = await readFile(join(brokenDataDir, "balance-engine.json"), "utf8");
  const brokenRes = runUpdateScript({ dataDir: brokenDataDir, fixtureDir: brokenDir });
  check("update-eia-data.mjs exits non-zero when 1/4 series is unusable", brokenRes.status !== 0, `status=${brokenRes.status}`);
  const brokenAfterPrices = await readFile(join(brokenDataDir, "market-prices.json"), "utf8");
  const brokenAfterBalance = await readFile(join(brokenDataDir, "balance-engine.json"), "utf8");
  check("refused write leaves market-prices.json byte-identical (all-or-nothing)", brokenAfterPrices === brokenBeforePrices);
  check("refused write leaves balance-engine.json byte-identical (all-or-nothing)", brokenAfterBalance === brokenBeforeBalance);
  await rm(brokenDataDir, { recursive: true, force: true });
  await rm(brokenDir, { recursive: true, force: true });

  // --- Missing API key: clear config error, non-zero exit, no writes ---
  const nokeyDir = await makeScratchDataDir("nokey");
  const nokeyBefore = await readFile(join(nokeyDir, "market-prices.json"), "utf8");
  const nokeyRes = spawnSync(process.execPath, [join(SCRIPT_DIR, "update-eia-data.mjs")], {
    encoding: "utf8",
    env: { ...process.env, EIA_API_KEY: "", EIA_DATA_DIR: nokeyDir, EIA_FIXTURE_DIR: freshDir },
  });
  check("missing EIA_API_KEY exits non-zero", nokeyRes.status !== 0, `status=${nokeyRes.status}`);
  check(
    "missing EIA_API_KEY error points to where to get a free key",
    /eia\.gov\/opendata\/register/i.test(nokeyRes.stderr + nokeyRes.stdout)
  );
  const nokeyAfter = await readFile(join(nokeyDir, "market-prices.json"), "utf8");
  check("missing EIA_API_KEY leaves data untouched", nokeyAfter === nokeyBefore);
  await rm(nokeyDir, { recursive: true, force: true });

  await rm(freshDir, { recursive: true, force: true });
}

// ============================================================================
// Summary
// ============================================================================
console.log(`\n${"=".repeat(72)}`);
console.log(`RESULT: ${pass} passed, ${fail} failed (${pass + fail} checks total)`);
console.log("=".repeat(72));
process.exitCode = fail > 0 ? 1 : 0;
