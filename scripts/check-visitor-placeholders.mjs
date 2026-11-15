#!/usr/bin/env node
/**
 * Fails when a file that is rendered to visitors contains "placeholder"
 * or "API placeholder".
 *
 * Scope is the published price board, the public-data monitor, the sponsor
 * inventory and the advertising config. Sample watchlist and company files
 * are withheld by the pages that read them, so they are not in this list.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  "data/market-prices.json",
  "data/market_snapshot.json",
  "data/sponsor-slots.json",
  "data/advertising.json",
  "public/data/oracle_intelligence.json",
];

const PATTERN = /api placeholder|\bplaceholder\b/i;
let failed = false;

for (const file of FILES) {
  const text = readFileSync(join(process.cwd(), file), "utf8");
  if (PATTERN.test(text)) {
    console.error(`${file} contains placeholder text that visitors must not see`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log(`Checked ${FILES.length} visitor-facing data files.`);
