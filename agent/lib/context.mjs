import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { ROOT } from "./env.mjs";

// Pull a compact, source-labelled snapshot from the site's JSON data layer so
// dry-run drafts are grounded in the same numbers the public site renders.
function readJson(rel) {
  const file = path.join(ROOT, rel);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function gatherContext() {
  const prices = readJson("data/market-prices.json");
  const signals = readJson("data/dashboard-signals.json");

  const lines = [];
  const priceRows = Array.isArray(prices)
    ? prices
    : Array.isArray(prices?.prices)
      ? prices.prices
      : [];
  for (const p of priceRows.slice(0, 8)) {
    if (!p) continue;
    const name = p.asset ?? p.name ?? p.label ?? "?";
    const price = p.price ?? p.value ?? "?";
    const unit = p.currency ? ` ${p.currency}` : "";
    const dc = p.daily_change ?? p.daily ?? p.change_daily ?? p.day;
    const daily = dc == null ? "" : `${Number(dc) > 0 ? "+" : ""}${dc}% d/d`;
    const src = p.source ?? p.src ?? "unlabelled";
    const type = p.data_type ?? p.type ?? "indicative";
    lines.push(`- ${name}: ${price}${unit}${daily ? ` (${daily})` : ""} [source: ${src}; type: ${type}]`);
  }

  const sig = signals?.signals ?? signals ?? {};
  const bottom =
    signals?.bottom_line ??
    signals?.daily_bottom_line ??
    signals?.meta?.bottom_line ??
    sig?.bottom_line ??
    null;

  return {
    generatedAt: new Date().toISOString(),
    priceLines: lines,
    bottomLine: bottom,
    hasPrices: lines.length > 0,
    text: [
      "Price snapshot (site data layer):",
      ...(lines.length ? lines : ["- (no market-prices.json rows found)"]),
      bottom ? `\nPrior bottom line: ${typeof bottom === "string" ? bottom : JSON.stringify(bottom)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
