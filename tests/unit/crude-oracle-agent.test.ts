import { describe, expect, it } from "vitest";
import {
  CRUDE_ORACLE_INTERACTIVE_FOOTER,
  CRUDE_ORACLE_MANDATORY_DISCLAIMER,
  CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
  CRUDE_ORACLE_PROMPT_VERSION,
  buildMarketSnapshotTable,
  classifyQueryTopic,
  generateDeskLeadResponse,
  inferSessionFocus,
  isPersonalizedAdviceRequest,
} from "@/lib/crude-oracle-agent";
import { getPublishedPrices, resetPublishedPricesCache } from "@/lib/published-prices";

describe("CrudeOracle Investment Agent — Master System Prompt (v2026-10-30)", () => {
  it("pins the 2026-10-30 prompt version and mandatory operating rules", () => {
    expect(CRUDE_ORACLE_PROMPT_VERSION).toBe("2026-10-30");
    expect(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT).toContain("You are CrudeOracle, the Desk Lead");
    expect(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT).toContain("Always fetch fresh data first.");
    expect(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT).toContain("Cite everything.");
    expect(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT).toContain(CRUDE_ORACLE_MANDATORY_DISCLAIMER);
    expect(CRUDE_ORACLE_MASTER_SYSTEM_PROMPT).toContain(CRUDE_ORACLE_INTERACTIVE_FOOTER);
  });

  it("detects personalised advice requests and politely declines while providing an analytical framework", async () => {
    expect(isPersonalizedAdviceRequest("Should I buy BP or Shell today?")).toBe(true);
    expect(isPersonalizedAdviceRequest("How should I allocate my pension into oil stocks?")).toBe(true);
    expect(isPersonalizedAdviceRequest("Give me the latest EIA crude inventory print")).toBe(false);

    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const res = generateDeskLeadResponse("Should I buy XOM right now?", feed, []);
    expect(res.topic).toBe("advice_refusal");
    expect(res.reply).toContain("I don’t give personalised investment advice");
    expect(res.reply).toContain("regulated financial adviser");
    expect(res.reply).toContain(CRUDE_ORACLE_MANDATORY_DISCLAIMER);
    expect(res.reply).toContain(CRUDE_ORACLE_INTERACTIVE_FOOTER);
  });

  it("classifies trader queries across inventories, geopolitics, equities, positioning, scenarios, and gas/LNG", () => {
    expect(classifyQueryTopic("Latest EIA crude inventories and Cushing draw")).toBe("inventories");
    expect(classifyQueryTopic("Deep dive on Hormuz and Red Sea Houthi risk")).toBe("geopolitics");
    expect(classifyQueryTopic("Equity impacts on XOM, CVX, SHEL and OFS names")).toBe("equities");
    expect(classifyQueryTopic("Check CFTC COT managed money positioning and diesel cracks")).toBe("positioning");
    expect(classifyQueryTopic("Scenario analysis if OPEC cuts another 500 kb/d")).toBe("scenarios");
    expect(classifyQueryTopic("Henry Hub and JKM LNG winter spread")).toBe("gas_lng");
    expect(classifyQueryTopic("Give me today's crude & gas market snapshot and key drivers.")).toBe("snapshot");
  });

  it("produces the standard 7-part response structure with cited sources, timestamps, bull/bear cases, invalidation, and disclaimer", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const res = generateDeskLeadResponse(
      "Give me today's crude & gas market snapshot and key drivers.",
      feed,
      []
    );

    expect(res.reply).toContain("### 1. Market Snapshot");
    expect(res.reply).toContain("| Asset | Price | Δ (d/d · w/w) | As-of | Source & Type |");
    expect(res.reply).toContain("Brent Crude (BRN)");
    expect(res.reply).toContain("WTI Crude (WTI)");
    expect(res.reply).toContain("### 2. What Moved / Drivers");
    expect(res.reply).toContain("### 3. Desk View");
    expect(res.reply).toContain("Bull Case");
    expect(res.reply).toContain("Bear Case");
    expect(res.reply).toContain("Explicit Invalidation");
    expect(res.reply).toContain("### 4. Watchpoints & Invalidation");
    expect(res.reply).toContain("### 5. Investment Implications");
    expect(res.reply).toContain("### 6. Sources & Freshness");
    expect(res.reply).toContain(CRUDE_ORACLE_MANDATORY_DISCLAIMER);
    expect(res.reply).toContain(CRUDE_ORACLE_INTERACTIVE_FOOTER);
  });

  it("never types a market figure into the reply: no price targets, conviction labels or fixed levels", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const queries = [
      "Give me today's crude & gas market snapshot and key drivers.",
      "Latest EIA crude inventories and Cushing draw",
      "Deep dive on Hormuz and Red Sea Houthi risk",
      "Equity impacts on XOM, CVX, SHEL and OFS names",
      "Check CFTC COT managed money positioning and diesel cracks",
      "Scenario analysis if OPEC cuts another 500 kb/d",
      "Henry Hub and JKM LNG winter spread",
      "Should I buy XOM right now?",
    ];
    const banned = [
      "Conviction:",
      "Confidence: High",
      "Confidence: Medium",
      "$79.50",
      "$71.00",
      "$78–$84",
      "$70–$74",
      "$60/bbl",
      "$11.90",
      "$12/MMBtu",
      "WS 68",
      "24.0 mb",
      "27.5 mb",
      "+185k",
      "65th",
      "82nd percentile",
      "+$0.45/bbl",
      "+$2.10/bbl",
      "512 rigs",
      "93.4%",
      "The tape is firm",
    ];
    for (const query of queries) {
      const { reply } = generateDeskLeadResponse(query, feed, []);
      for (const text of banned) expect(reply, `"${text}" in reply to: ${query}`).not.toContain(text);
      expect(reply).toContain("not current");
      expect(reply, "a months-old event must not be raised as an active alert").not.toContain("ACTIVE PHYSICAL EVENT");
      expect(reply).toContain(CRUDE_ORACLE_MANDATORY_DISCLAIMER);
    }
  });

  it("withholds placeholder prices and prints older than 30 days, as the price cards do", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const stale = feed.prices.map((p) => ({ ...p, data_type: "manual", source: "desk", last_updated: "2026-01-01T00:00:00Z", price: 123.45, daily_change: 9.87 }));
    const snap = buildMarketSnapshotTable(stale);
    expect(snap.tableMarkdown).not.toContain("123.45");
    expect(snap.tableMarkdown).toContain("withheld");
    expect(snap.alertLine ?? "").not.toContain("9.87");
    const placeholder = feed.prices.map((p) => ({ ...p, data_type: "API placeholder", last_updated: new Date().toISOString(), price: 123.45 }));
    expect(buildMarketSnapshotTable(placeholder).tableMarkdown).not.toContain("123.45");
  });

  it("stamps every hand-entered figure as a dated desk record", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const { reply } = generateDeskLeadResponse("Latest EIA crude inventories and Cushing draw", feed, []);
    const stockLines = reply.split("\n").filter((line) => line.startsWith("- **") && line.includes(" mb "));
    expect(stockLines.length).toBeGreaterThan(0);
    for (const line of stockLines) expect(line).toMatch(/desk record as of \d{4}-\d{2}-\d{2}/);
  });

  it("surfaces an ALERT line when a price moves >= 2% or a confirmed physical outage is active", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const spiked = feed.prices.map((p) =>
      p.ticker === "BRN" ? { ...p, daily_change: 3.45, data_type: "delayed", last_updated: new Date().toISOString() } : p
    );
    const snap = buildMarketSnapshotTable(spiked);
    expect(snap.alertLine).toContain("**ALERT:**");
    expect(snap.alertLine).toContain("+3.45% d/d");
  });

  it("tracks session focus across multi-turn conversation history", () => {
    const focus = inferSessionFocus(
      [{ role: "user", content: "Tell me about Henry Hub and JKM LNG cargoes" }],
      "What are the watchpoints?"
    );
    expect(focus).toBe("Gas & LNG");
  });
});
