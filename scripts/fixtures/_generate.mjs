// One-off generator for the realistic "valid" EIA v2 fixtures checked into
// scripts/fixtures/valid/. Not part of the runtime path — run manually with
// `node scripts/fixtures/_generate.mjs` only if the fixtures need regenerating.
// Kept for transparency about how the sample numbers were derived (synthetic,
// shaped on plausible 2026 WTI/Brent/stock ranges — NOT real observed data).
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "valid");

function businessDaysBackFrom(startIso, count) {
  const dates = [];
  const d = new Date(`${startIso}T00:00:00Z`);
  while (dates.length < count) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return dates; // newest-first
}

function buildDailyFixture({ seriesId, seriesDesc, product, productName, area, areaName, startPrice, startIso, days }) {
  const dates = businessDaysBackFrom(startIso, days);
  // Deterministic pseudo-random walk so the fixture is reproducible.
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let price = startPrice;
  const rows = dates.map((date, i) => {
    if (i > 0) price += (rand() - 0.5) * 1.6;
    return {
      period: date,
      duoarea: area,
      "area-name": areaName,
      product,
      "product-name": productName,
      process: "PS0",
      "process-name": "Spot Price",
      series: seriesId,
      "series-description": seriesDesc,
      value: Math.round(price * 100) / 100,
      units: "$/BBL",
    };
  });
  return {
    response: {
      total: String(rows.length),
      dateFormat: "YYYY-MM-DD",
      frequency: "daily",
      data: rows,
      description: seriesDesc,
    },
    request: { command: `/petroleum/pri/spt/data/`, params: { frequency: "daily", facets: { series: [seriesId] } } },
    apiVersion: "2.1.8",
  };
}

function buildWeeklyStockFixture({ seriesId, seriesDesc, area, areaName, startValueMb, startIso, weeks }) {
  const dates = [];
  const d = new Date(`${startIso}T00:00:00Z`);
  for (let i = 0; i < weeks; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 7);
  }
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  let valueMb = startValueMb;
  const rows = dates.map((date, i) => {
    if (i > 0) valueMb += (rand() - 0.55) * 3.2; // slight net-draw bias, like the sample data
    return {
      period: date,
      duoarea: area,
      "area-name": areaName,
      product: "EPC0",
      "product-name": "Crude Oil",
      process: "SAE",
      "process-name": "Ending Stocks excluding SPR",
      series: seriesId,
      "series-description": seriesDesc,
      value: Math.round(valueMb * 1000), // thousand barrels, as EIA reports it
      units: "MBBL",
    };
  });
  return {
    response: {
      total: String(rows.length),
      dateFormat: "YYYY-MM-DD",
      frequency: "weekly",
      data: rows,
      description: seriesDesc,
    },
    request: { command: `/petroleum/stoc/wstk/data/`, params: { frequency: "weekly", facets: { series: [seriesId] } } },
    apiVersion: "2.1.8",
  };
}

const wti = buildDailyFixture({
  seriesId: "RWTC",
  seriesDesc: "Cushing, OK WTI Spot Price FOB",
  product: "EPCWTI",
  productName: "WTI",
  area: "NUS",
  areaName: "NUS",
  startPrice: 74.86,
  startIso: "2026-08-28",
  days: 45,
});

const brent = buildDailyFixture({
  seriesId: "RBRTE",
  seriesDesc: "Europe Brent Spot Price FOB",
  product: "EPCBRENT",
  productName: "Brent",
  area: "NEUR",
  areaName: "Europe",
  startPrice: 79.15,
  startIso: "2026-08-28",
  days: 45,
});

const usStocks = buildWeeklyStockFixture({
  seriesId: "WCESTUS1",
  seriesDesc: "Weekly U.S. Ending Stocks excluding SPR of Crude Oil",
  area: "NUS",
  areaName: "NUS",
  startValueMb: 441.6,
  startIso: "2026-08-22",
  weeks: 6,
});

const cushing = buildWeeklyStockFixture({
  seriesId: "WCESTOK1",
  seriesDesc: "Weekly Cushing, OK Ending Stocks of Crude Oil",
  area: "R30",
  areaName: "Cushing, OK",
  startValueMb: 24.2,
  startIso: "2026-08-22",
  weeks: 6,
});

writeFileSync(join(outDir, "RWTC.json"), JSON.stringify(wti, null, 2) + "\n");
writeFileSync(join(outDir, "RBRTE.json"), JSON.stringify(brent, null, 2) + "\n");
writeFileSync(join(outDir, "WCESTUS1.json"), JSON.stringify(usStocks, null, 2) + "\n");
writeFileSync(join(outDir, "WCESTOK1.json"), JSON.stringify(cushing, null, 2) + "\n");

console.log("Wrote fixtures to", outDir);
