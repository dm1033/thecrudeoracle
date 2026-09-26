import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { get, requireUsable, resolvePath } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import { guardedFetch } from "./lib/allowlist.mjs";

// EIA Open Data series powering the site's WTI/Brent spot + crude stocks.
const SERIES = {
  RWTC: "WTI spot (Cushing) $/bbl",
  RBRTE: "Brent spot (Europe) $/bbl",
  WCESTUS1: "US commercial crude stocks (kbbl)",
  WCESTOK1: "Cushing crude stocks (kbbl)",
};

async function fetchSeries(id, key) {
  const url = `https://api.eia.gov/v2/seriesid/${id}?api_key=${encodeURIComponent(key)}`;
  const res = await guardedFetch(url);
  if (!res.ok) throw new Error(`EIA ${id} failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  const rows = json?.response?.data;
  if (!Array.isArray(rows) || rows.length === 0) throw new Error(`EIA ${id}: no data`);
  const latest = rows[0];
  return { id, label: SERIES[id], period: latest.period, value: latest.value };
}

export async function ingestEia() {
  const key = requireUsable("EIA_API_KEY", "free key: https://www.eia.gov/opendata/register.php");
  const out = { fetchedAt: new Date().toISOString(), dataType: "delayed", source: "EIA Open Data", series: [] };
  for (const id of Object.keys(SERIES)) {
    log.info(`Fetching EIA series ${id}…`);
    out.series.push(await fetchSeries(id, key));
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
