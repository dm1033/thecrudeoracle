import { describe, expect, it } from "vitest";
import {
  CRUDE_ORACLE_INTERACTIVE_FOOTER,
  CRUDE_ORACLE_MANDATORY_DISCLAIMER,
  CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
  CRUDE_ORACLE_PROMPT_VERSION,
  buildDeskContextBlock,
  buildMarketSnapshotTable,
  classifyQueryTopic,
  generateDeskLeadResponse,
  inferSessionFocus,
  isPersonalizedAdviceRequest,
  type DeskData,
} from "@/lib/crude-oracle-agent";
import type { DataCard } from "@/lib/dashboard-cards";
import { getPublishedPrices, resetPublishedPricesCache } from "@/lib/published-prices";

describe("CrudeOracle Desk Bot — master system prompt and reply engine", () => {
  it("pins the prompt version and the rules the model must follow", () => {
    expect(CRUDE_ORACLE_PROMPT_VERSION).toBe("2026-11-14");
    const prompt = CRUDE_ORACLE_MASTER_SYSTEM_PROMPT;
    expect(prompt).toContain("You are CrudeOracle, the Desk Lead");
    expect(prompt).toContain("Use only the Verified Desk Data Layer");
    expect(prompt).toContain("No investment advice and no trading signals.");
    expect(prompt).toContain("No company recommendations.");
    expect(prompt).toContain("No events from memory.");
    expect(prompt).toContain("regulated financial adviser");
    expect(prompt).toContain(CRUDE_ORACLE_MANDATORY_DISCLAIMER);
    expect(prompt).toContain(CRUDE_ORACLE_INTERACTIVE_FOOTER);
  });

  it("does not ask the model for signals, tools it lacks or third-party sources", () => {
    const prompt = CRUDE_ORACLE_MASTER_SYSTEM_PROMPT;
    for (const text of [
      "Reuters",
      "Platts",
      "Argus",
      "Bloomberg",
      "OilPrice",
      "web_search",
      "x_keyword_search",
      "Conviction level.",
      "Equity or commodity ideas",
      "Assign confidence",
      "top-tier trader",
      "The tape is",
      "XOM",
    ]) {
      expect(prompt, text).not.toContain(text);
    }
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

  it("produces the same structure the master prompt asks a model for, with sources, dates and the disclaimer", async () => {
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
    expect(res.reply).toContain("### 2. What the data shows");
    expect(res.reply).toContain("### 3. Conditions to watch");
    expect(res.reply).toContain("A tighter reading would look like");
    expect(res.reply).toContain("A looser reading would look like");
    expect(res.reply).toContain("### 4. Not available");
    expect(res.reply).toContain("### 5. Sources and dates");
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
      "Bull Case",
      "Bear Case",
      "Desk View",
      "Investment Implications",
      "equity impacts",
      "ALERT",
      "surged",
      "dropped",
      "Session focus",
      "thesis",
    ];
    for (const query of queries) {
      const { reply } = generateDeskLeadResponse(query, feed, []);
      for (const text of banned) expect(reply, `"${text}" in reply to: ${query}`).not.toContain(text);
      expect(reply, "no hand-entered July record may be quoted").not.toContain("desk record");
      expect(reply).not.toContain("SMPL-");
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

  it("quotes live feed figures with their own source and date, and nothing when a feed is absent", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const card = (id: string, label: string, value: string): DataCard => ({
      id,
      label,
      value,
      detail: "Change on the previous report: +4.7 mb.",
      sourceName: "EIA Weekly Petroleum Status Report",
      sourceUrl: null,
      asOf: "2026-11-06",
      dataType: "delayed",
      staleAfterHours: 240,
      href: "/eia-weekly",
    });
    const data: DeskData = {
      cards: {
        supply: [card("us-crude", "US commercial crude stocks", "414.4 mb")],
        demand: [],
        context: [{ ...card("supply-news", "Oil supply-route news coverage", "0.74× its 7-day average"), sourceName: "The GDELT Project, DOC 2.0 API", asOf: "2026-11-12T07:00:00Z" }],
      },
      curve: {
        spots: [],
        spreads: [
          {
            key: "crack_321",
            label: "3-2-1 crack against WTI",
            method: "Two barrels of gasoline plus one of diesel, divided by three, minus WTI spot, same day.",
            latest: { date: "2026-11-11", value: 36.86 },
            previous: { date: "2026-11-10", value: 36.86 },
            change: 0,
            monthAgo: null,
          },
        ],
        history: [],
        futures: null,
        futuresLastDate: null,
        asOf: "2026-11-11",
        fetchedAt: "2026-11-14T00:00:00Z",
      },
    };

    const stocks = generateDeskLeadResponse("Latest EIA crude inventories and Cushing draw", feed, [], data).reply;
    expect(stocks).toContain("- **US commercial crude stocks:** 414.4 mb. Change on the previous report: +4.7 mb. — EIA Weekly Petroleum Status Report, as of 2026-11-06");

    const risk = generateDeskLeadResponse("Deep dive on Hormuz and Red Sea Houthi risk", feed, [], data).reply;
    expect(risk).toContain("0.74× its 7-day average");
    expect(risk).toContain("I hold no feed of outages, attacks, sanctions, tanker movements or OPEC decisions");
    expect(risk).toContain("It does not measure risk.");

    const cracks = generateDeskLeadResponse("Check CFTC COT managed money positioning and diesel cracks", feed, [], data).reply;
    expect(cracks).toContain("- **3-2-1 crack against WTI:** $36.86/bbl");
    expect(cracks).toContain("worked from EIA daily spot prices for 2026-11-11");

    const context = buildDeskContextBlock(feed, data);
    expect(context).toContain("US commercial crude stocks: 414.4 mb.");
    expect(context).toContain("do not describe any such event as current");

    const empty = generateDeskLeadResponse("Latest EIA crude inventories and Cushing draw", feed, []).reply;
    expect(empty).toContain("could not be read just now, so I quote none");
    expect(empty).not.toContain(" mb ");
    expect(buildDeskContextBlock(feed)).toContain("Not loaded. Say nothing about this section");
  });

  it("states a daily move of 2% or more plainly, without alarm words", async () => {
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    const spiked = feed.prices.map((p) =>
      p.ticker === "BRN" ? { ...p, daily_change: 3.45, data_type: "delayed", last_updated: new Date().toISOString() } : p
    );
    const snap = buildMarketSnapshotTable(spiked);
    expect(snap.alertLine).toContain("**Larger daily move:**");
    expect(snap.alertLine).toContain("changed **+3.45% on the day**");
    expect(snap.alertLine).not.toMatch(/ALERT|surged|dropped|plunged|soared/);
  });

  it("tracks session focus across multi-turn conversation history", () => {
    const focus = inferSessionFocus(
      [{ role: "user", content: "Tell me about Henry Hub and JKM LNG cargoes" }],
      "What are the watchpoints?"
    );
    expect(focus).toBe("Gas & LNG");
  });
});
