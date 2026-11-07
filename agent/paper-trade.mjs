import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { get, resolvePath } from "./lib/env.mjs";
import { log } from "./lib/log.mjs";
import { loadPortfolio, portfolioPath, proposeTrades, applyTrades, validate, recompute } from "./lib/portfolio.mjs";
import { publishFile } from "./publish.mjs";

function readSignals() {
  try {
    return JSON.parse(readFileSync(path.join(resolvePath("."), "data", "dashboard-signals.json"), "utf8"));
  } catch {
    return null;
  }
}

function todayStr() {
  const tz = get("CODA_TIMEZONE", "Europe/London");
  // en-CA gives YYYY-MM-DD; anchor to the configured timezone.
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, dateStyle: "short" }).format(new Date());
}

function blotter(before, after, proposal, today) {
  const lines = [
    `# CODA SIMULATED Paper-Trade Blotter — ${today}`,
    ``,
    `_Virtual capital only. Not financial, investment or trading advice. Human-reviewed via PR before any change is merged._`,
    ``,
    `## Decision`,
    proposal.reason,
    ``,
  ];
  if (proposal.trades.length) {
    lines.push(`## Proposed trades (SIMULATED)`, ``, `| Op | Ticker | Sleeve | Amount | New weight | Cap |`, `| --- | --- | --- | --- | --- | --- |`);
    for (const t of proposal.trades) {
      lines.push(`| ${t.op} | ${t.ticker} | ${t.category} | $${t.amount.toLocaleString("en-US")} | ${t.newWeightPct}% | ${t.cap}% |`);
    }
    lines.push(``);
  }
  lines.push(
    `## Account before → after`,
    ``,
    `| Field | Before | After |`,
    `| --- | --- | --- |`,
    `| Current value | $${before.account.current_value.toLocaleString("en-US")} | $${after.account.current_value.toLocaleString("en-US")} |`,
    `| Cash | $${before.account.cash_balance.toLocaleString("en-US")} (${before.account.cash_pct}%) | $${after.account.cash_balance.toLocaleString("en-US")} (${after.account.cash_pct}%) |`,
    `| Open positions | ${before.account.open_positions} | ${after.account.open_positions} |`,
    `| Realised P/L | $${before.account.realised_pl.toLocaleString("en-US")} | $${after.account.realised_pl.toLocaleString("en-US")} |`,
    ``,
    `Sources: The Crude Oracle allocation model + dashboard-signals.json (indicative). No licensed exchange data. No broker. No real money.`,
  );
  return lines.join("\n") + "\n";
}

export async function runPaperTrade({ publish = false } = {}) {
  const today = todayStr();
  log.info(`Starting CODA SIMULATED paper-trade cycle (publish=${publish}).`);

  const before = recompute(loadPortfolio(), null); // normalise derived fields for a clean diff
  const signals = readSignals();
  const proposal = proposeTrades(before, signals);

  const after = proposal.trades.length ? applyTrades(before, proposal.trades, today) : structuredClone(before);
  validate(after); // never emit an inconsistent portfolio

  const outbox = resolvePath(get("OUTBOX_DIR", "./outbox"));
  mkdirSync(outbox, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blotterFile = path.join(outbox, `paper-trade-${stamp}.md`);
  const jsonFile = path.join(outbox, `virtual-portfolio-proposed-${stamp}.json`);
  writeFileSync(blotterFile, blotter(before, after, proposal, today), "utf8");
  writeFileSync(jsonFile, JSON.stringify(after, null, 2) + "\n", "utf8");
  log.info(proposal.reason);
  log.info(`Blotter: ${path.relative(resolvePath("."), blotterFile)}`);

  let pr = null;
  if (!proposal.trades.length) {
    log.info("No trade proposed — nothing to publish.");
  } else if (publish) {
    const content = JSON.stringify(after, null, 2) + "\n";
    pr = await publishFile({
      repoRelPath: "data/virtual-portfolio.json",
      content,
      branch: `coda/paper-trade-${stamp}`,
      title: `CODA SIMULATED paper-trade proposal — ${today}`,
      body:
        "Automated **SIMULATED** paper-trade proposal from CODA (virtual capital only). " +
        "No real money, no broker. Review the blotter and diff before merging.\n\n" +
        proposal.reason +
        "\n\nNot financial, investment or trading advice.",
    });
    log.info(`Opened draft PR: ${pr.html_url}`);
  } else {
    log.info("Dry-run: proposal written to outbox. Re-run with --publish to open a draft PR (requires GITHUB_TOKEN).");
  }

  return { today, proposal, before, after, blotterFile, jsonFile, pr };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const publish = process.argv.includes("--publish");
  runPaperTrade({ publish }).catch((err) => {
    if (["MISSING_SECRET", "HOST_NOT_ALLOWED", "PORTFOLIO_INVALID"].includes(err.code)) {
      log.error(err.message);
      process.exit(2);
    }
    log.error(err.stack || String(err));
    process.exit(1);
  });
}
