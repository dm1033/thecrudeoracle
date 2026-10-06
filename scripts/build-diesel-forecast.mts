import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assembleForecast, type DieselCache } from "../src/lib/diesel-assemble";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = path.join(root, "data", "diesel-cache.json");
const outPath = path.join(root, "data", "diesel-forecast.json");
const cache = JSON.parse(readFileSync(cachePath, "utf8")) as DieselCache;
const runAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const forecast = assembleForecast(cache, runAt);
writeFileSync(outPath, `${JSON.stringify(forecast, null, 2)}\n`);
console.log(
  `wrote ${outPath} bias=${forecast.forecast.bias} crack=${forecast.forecast.crackBias} confidence=${forecast.forecast.confidence} asOf=${forecast.input.asOf}`,
);
