import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { assembleForecast, buildDieselView, type DieselCache, type DieselView, type ForecastFile } from "./diesel-assemble";

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(process.cwd(), "data", name), "utf8")) as T;
}

export function readDieselCache(): DieselCache {
  return readJson<DieselCache>("diesel-cache.json");
}

export function getDieselPage(): { view: DieselView; forecast: ForecastFile } {
  const cache = readDieselCache();
  const forecastPath = path.join(process.cwd(), "data", "diesel-forecast.json");
  const stored = existsSync(forecastPath) ? readJson<ForecastFile>("diesel-forecast.json") : null;
  const forecast =
    stored && stored.cacheFetchedAt === cache.fetchedAt ? stored : assembleForecast(cache, cache.fetchedAt);
  return { view: buildDieselView(cache), forecast };
}
