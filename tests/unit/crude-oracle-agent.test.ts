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

  it("surfaces an ALERT line when a price moves >= 2% or a confirmed physical outage is active", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const spiked = feed.prices.map((p) =>
      p.ticker === "BRN" ? { ...p, daily_change: 3.45 } : p
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
