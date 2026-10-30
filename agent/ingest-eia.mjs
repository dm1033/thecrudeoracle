import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { get, requireUsable, resolvePath } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import {
  EIA_SERIES,
  getWtiSpot,
  getBrentSpot,
  getUsCommercialCrudeStocks,
  getCushingStocks,
} from "../src/lib/eia.ts";

// EIA Open Data series powering the site's WTI/Brent spot + crude stocks.
// Uses EIA_SERIES from src/lib/eia.ts (including W_EPC0_SAX_YCUOK_MBBL for Cushing).
const SERIES = [
  { id: EIA_SERIES.WTI_SPOT.seriesId, label: "WTI spot (Cushing) $/bbl", fetch: () => getWtiSpot() },
  { id: EIA_SERIES.BRENT_SPOT.seriesId, label: "Brent spot (Europe) $/bbl", fetch: () => getBrentSpot() },
  {
    id: EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS.seriesId,
    label: "US commercial crude stocks (mbbl)",
    fetch: () => getUsCommercialCrudeStocks(),
  },
  {
    id: EIA_SERIES.CUSHING_CRUDE_STOCKS.seriesId,
    label: "Cushing crude stocks (mbbl)",
    fetch: () => getCushingStocks(),
  },
];

export async function ingestEia() {
  const key = requireUsable("EIA_API_KEY", "free key: https://www.eia.gov/opendata/register.php");
  process.env.EIA_API_KEY = key;
  const out = { fetchedAt: new Date().toISOString(), dataType: "delayed", source: "EIA Open Data", series: [] };
  for (const s of SERIES) {
    log.info(`Fetching EIA series ${s.id}…`);
    const res = await s.fetch();
    out.series.push({ id: s.id, label: s.label, period: res.latest.date, value: res.latest.value });
  }
  const dir = resolvePath(get("OUTBOX_DIR", "./outbox"));
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `eia-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify(out, null, 2) + "\n", "utf8");
  log.info(`Wrote ${path.relative(resolvePath("."), file)} (${out.series.length} series).`);
  return { file, out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestEia().catch((err) => {
    if (err.code === "MISSING_SECRET" || err.code === "HOST_NOT_ALLOWED") {
      log.error(err.message);
      process.exit(2);
    }
    log.error(err.stack || String(err));
    process.exit(1);
  });
}
