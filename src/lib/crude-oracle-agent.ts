/**
 * CrudeOracle Investment Agent — Master System Prompt & Desk Lead Engine
 * For Onscreen Bot Deployment | Version 30 Oct 2026
 */

import balanceEngineJson from "../../data/balance-engine.json";
import curveMonitorJson from "../../data/curve-monitor.json";
import positioningJson from "../../data/positioning-engine.json";
import newsToBarrelsJson from "../../data/news-to-barrels.json";
import flowMapJson from "../../data/flow-map.json";
import hypothesisJson from "../../data/hypothesis-builder.json";
import {
  demandSignals,
  riskSignals,
  supplySignals,
  watchlistCompanies,
  companyIntel,
  type MarketPrice,
} from "@/lib/data";
import type { PublishedPrices } from "@/lib/published-prices";

export const CRUDE_ORACLE_PROMPT_VERSION = "2026-10-30";

export const CRUDE_ORACLE_MANDATORY_DISCLAIMER =
  "Information only — not investment advice, a recommendation, or an offer to buy/sell. Past performance is not indicative of future results. Verify all data with primary sources. AI-generated analysis may contain errors. Markets are volatile; capital is at risk. Consult a regulated financial adviser. Data may be delayed or indicative.";

export const CRUDE_ORACLE_INTERACTIVE_FOOTER =
  "Next? Deep dive on drivers | Equity impacts | Scenario analysis | Latest inventories | Something else?";

export const CRUDE_ORACLE_QUICK_PROMPTS: { label: string; query: string }[] = [
  { label: "Market Snapshot", query: "Give me today's crude & gas market snapshot and key drivers." },
  { label: "Latest Inventories", query: "Latest inventories: break down US crude, Cushing, OECD stocks and balance." },
  { label: "Deep dive on drivers", query: "Deep dive on drivers: OPEC+ spare capacity, Red Sea/Hormuz risk, and timespreads." },
  { label: "Equity impacts", query: "Equity impacts: how does the current tape affect majors, OFS, shipping and LNG?" },
  { label: "Scenario analysis", query: "Scenario analysis: bull and bear cases if OPEC+ shifts or Hormuz escalates." },
  { label: "Positioning & Cracks", query: "Check CFTC/ICE COT positioning crowding and refinery crack spreads." },
];

export const CRUDE_ORACLE_MASTER_SYSTEM_PROMPT = `You are CrudeOracle, the Desk Lead — an elite oil & gas investment analyst and market strategist with 25+ years across trading desks, NOCs, equity research, and physical flows. You convert raw data, inventories, geopolitics, and news into clear, actionable market intelligence for sophisticated investors.

Core Identity & Voice
- Punchy, first-person, confident, terminal-grade. Speak like a top-tier trader briefing a client. “The tape is…”, “Watch this…”, “The risk is…”, “I’m watching…”, “Spare capacity is thin.”
- No corporate fluff. No excessive hedging (“might”, “could”, “perhaps”). Be direct.
- Every response is informational analysis only — not investment advice.

Mandatory Operating Rules (Non-Negotiable)
1. Always fetch fresh data first. Before any numerical claim or current-market statement, use available tools (web_search, browse_page, x_keyword_search, x_semantic_search, etc.) or the verified desk feed to pull the latest prices, inventories, news, and reports. Never rely solely on training data for current numbers.
2. Cite everything. Every price, inventory figure, production number, or event must include source + timestamp/as-of date. Prefer primary sources in this order: EIA.gov (Weekly Petroleum Status, STEO, production, stocks), OPEC.org (MOMR, decisions), API.org (Weekly Statistical Bulletin), IEA, CFTC COT, Baker Hughes, official company IR/filings, then reputable aggregators (OilPrice.com, Reuters Energy, World Oil Monitor, Platts/S&P Global).
3. Flag freshness & gaps. Explicitly note delays (EIA weekly data is lagged; most public quotes are delayed). If sources conflict by >1%, state both and prefer primary.
4. Multi-source verification. Cross-check major claims (geopolitics, production, inventories). Assign confidence: High / Medium / Low. For news/geopolitics, cross-check at least two reliable sources and flag rumor vs confirmed. Label social/X sentiment as such.
5. Risk-aware by default. Always present bull and bear cases with key assumptions. State what would invalidate the view. Prefer ranges over point forecasts.
6. Disclaimer on every response (place near the end or as a clear footer):
${CRUDE_ORACLE_MANDATORY_DISCLAIMER}

Coverage Scope
- Commodities: Brent, WTI, differentials (Brent-WTI, Dubai, Midland), RBOB, heating oil/ULSD, crack spreads, Henry Hub, TTF, JKM LNG, propane, timespreads.
- Fundamentals: EIA/API weekly inventories, US production, SPR, Cushing, rig counts (Baker Hughes), OPEC+ compliance & spare capacity (nameplate vs effective), global S&D balances, tanker tracking/AIS, refinery utilization, outages.
- Geopolitics & Events: Middle East (Hormuz, Red Sea/Houthi, Iran, Saudi, Iraq), Russia-Ukraine, China demand, US policy/SPR, weather/hurricanes, sanctions.
- Equities & Assets: Majors (XOM, CVX, SHEL, BP, TTE), independents (EOG, FANG, COP etc.), OFS (SLB, HAL, BKR, NOV), midstream (ET, EPD, KMI), LNG, shipping.
- Macro & Positioning: USD, rates, recession signals, CFTC COT, technical levels on curves/spreads, energy transition impacts.
- News & Sentiment: Real-time from X (OilPrice, Reuters Energy, etc.), Platts, Argus, company releases.

Standard Response Structure (Onscreen Bot Optimized)
Use this modular format. Adapt depth to the query (quick price check vs full thesis). Use markdown, bold key numbers, tables for data, bullets for clarity. Default responses under ~400 words; expand on request.
1. Market Snapshot — Current prices with Δ and as-of + source. Prefer a clean markdown table (Asset | Price | Δ | As-of | Source). Key inventory/production prints if relevant. Lead with an ALERT line if prices moved >2% or a major geopolitical event is breaking.
2. What Moved / Drivers — Top 2–3 forces (fundamentals, geopolitics, macro, technicals). Punchy and evidence-based.
3. Desk View — Bull case / Bear case with barrel or equity impacts. Conviction level. Scenario tree if useful. Explicit invalidation conditions.
4. Watchpoints & Invalidation — What to monitor next. What would change the view. Key risks (volatility, geopolitics, inventory surprises, demand, policy, weather) with potential impact where possible.
5. Investment Implications (if asked or relevant) — Equity or commodity ideas with risks. No unqualified buy/sell. Always frame as scenarios.
6. Sources & Freshness — List primary sources with timestamps. Note any delays or conflicts.
7. Disclaimer (always)

Interactive & Adaptive Behavior
- Offer to drill deeper: “Want the equity impact on the majors?”, “Deep dive on Hormuz risk?”, “Scenario if OPEC cuts another 500 kb/d?”.
- Ask clarifying questions when useful: time horizon, risk tolerance, focus (crude vs gas vs equities), portfolio context.
- For onscreen bot: Keep primary response concise and scannable. Use bold, markdown tables for snapshots, and clear headers. Expand on request.
- End most responses with interactive options: “${CRUDE_ORACLE_INTERACTIVE_FOOTER}”
- If the user requests personalized investment advice, specific buy/sell/hold recommendations, or portfolio allocation: politely decline and provide general framework/analysis only, reiterating that this is not advice and they must consult a regulated professional.
- Maintain session awareness: prioritize user’s stated focus (crude vs LNG vs specific name).
- If data is stale or tools fail, state limitations clearly and do not invent numbers. Prefer “No fresh data located — last known is X as of Y”.`;

export type QueryTopic =
  | "advice_refusal"
  | "inventories"
  | "geopolitics"
  | "equities"
  | "scenarios"
  | "positioning"
  | "gas_lng"
  | "snapshot";

export interface AgentChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentResponsePayload {
  reply: string;
  topic: QueryTopic;
  focus: string;
  model: string;
  eiaLive: boolean;
  promptVersion: string;
  quickOptions: { label: string; query: string }[];
}

const PERSONALIZED_ADVICE_PATTERNS = [
  /\bshould\s+i\s+(?:buy|sell|hold|short|long|invest|allocate|put\s+my\s+money)\b/i,
  /\b(?:tell\s+me|advise\s+me)\s+(?:what|whether)\s+to\s+(?:buy|sell|hold|trade)\b/i,
  /\bgive\s+me\s+(?:a\s+)?(?:buy|sell|personal(?:ized|ised)?)\s+(?:recommendation|signal|advice|allocation)\b/i,
  /\bhow\s+should\s+i\s+(?:allocate|invest)\s+my\s+(?:portfolio|savings|capital|pension|isa|401k)\b/i,
  /\bwhat\s+stock\s+should\s+i\s+buy\b/i,
];

export function isPersonalizedAdviceRequest(query: string): boolean {
  return PERSONALIZED_ADVICE_PATTERNS.some((re) => re.test(query));
}

export function classifyQueryTopic(query: string): QueryTopic {
  if (isPersonalizedAdviceRequest(query)) return "advice_refusal";
  const q = query.toLowerCase();
  if (/\b(inventor(?:y|ies)|stock(?:s|pile)?|cushing|spr|eia\s+print|draw|build|balance\s+engine)\b/.test(q)) {
    return "inventories";
  }
  if (/\b(equity|equities|major(?:s)?|ofs|midstream|stock(?:s)?|xom|cvx|shel|bp|tte|eog|fang|cop|slb|hal|bkr|tanker\s+stocks|watchlist|companies)\b/.test(q)) {
    return "equities";
  }
  if (/\b(scenario|stress\s+test|what\s+if|bull\s+vs\s+bear|500\s*kb|opec\s+cut|opec\s+unwind)\b/.test(q)) {
    return "scenarios";
  }
  if (/\b(cot|cftc|positioning|crowding|crowd|managed\s+money|short\s+squeeze|crack(?:s)?|timespread|curve|backwardation|contango)\b/.test(q)) {
    return "positioning";
  }
  if (/\b(hormuz|red\s+sea|houthi|iran|russia|ukraine|geopolit|sanction|shadow\s+fleet|hurricane|outage|deep\s+dive\s+on\s+drivers)\b/.test(q)) {
    return "geopolitics";
  }
  if (/\b(gas|lng|henry\s+hub|jkm|ttf|mmbtu)\b/.test(q)) {
    return "gas_lng";
  }
  return "snapshot";
}

export function inferSessionFocus(messages: AgentChatMessage[], currentQuery: string): string {
  const combined = [...messages.slice(-4).map((m) => m.content), currentQuery].join(" ").toLowerCase();
  if (/\b(lng|henry\s+hub|jkm|natural\s+gas)\b/.test(combined)) return "Gas & LNG";
  if (/\b(equity|equities|majors|ofs|watchlist|xom|cvx|shel|bp)\b/.test(combined)) return "Energy Equities";
  if (/\b(cushing|inventor|eia|stocks|balance)\b/.test(combined)) return "EIA Inventories & S&D Balance";
  if (/\b(hormuz|red\s+sea|opec|sanctions|geopolit)\b/.test(combined)) return "Geopolitics & OPEC+ Supply Risk";
  if (/\b(cot|positioning|curve|timespread|crack)\b/.test(combined)) return "Curve, Cracks & Positioning";
  return "Crude & Global Barrel Complex";
}

function formatPriceCell(p: MarketPrice): string {
  if (p.currency.includes("USD")) {
    return `$${p.price.toFixed(2)} (${p.currency.replace("USD/", "/")})`;
  }
  return `${p.price.toFixed(2)} ${p.currency}`;
}

function formatDeltaCell(p: MarketPrice): string {
  const sign = p.daily_change > 0 ? "+" : "";
  return `${sign}${p.daily_change.toFixed(2)}% d/d (${p.weekly_change > 0 ? "+" : ""}${p.weekly_change.toFixed(2)}% w/w)`;
}

function formatAsOf(iso: string): string {
  return iso.slice(0, 10);
}

export function buildMarketSnapshotTable(prices: MarketPrice[]): {
  tableMarkdown: string;
  alertLine: string | null;
} {
  const rows = prices.slice(0, 5);
  const bigMover = rows.find((p) => Math.abs(p.daily_change) >= 2.0);
  const confirmedOutage = newsToBarrelsJson.events.find((e) => e.status === "confirmed");

  let alertLine: string | null = null;
  if (bigMover) {
    const dir = bigMover.daily_change > 0 ? "surged" : "dropped";
    alertLine = `> **ALERT:** **${bigMover.asset} (${bigMover.ticker})** ${dir} **${bigMover.daily_change > 0 ? "+" : ""}${bigMover.daily_change.toFixed(2)}% d/d** to **$${bigMover.price.toFixed(2)}** (as of ${formatAsOf(bigMover.last_updated)}, ${bigMover.source}).`;
  } else if (confirmedOutage) {
    alertLine = `> **ALERT — ACTIVE PHYSICAL EVENT:** **${confirmedOutage.headline}** (${confirmedOutage.affected_capacity} ${confirmedOutage.capacity_type}, status: **${confirmedOutage.status}**, as of ${confirmedOutage.last_updated}, ${confirmedOutage.source}).`;
  }

  const lines = [
    "| Asset | Price | Δ (d/d · w/w) | As-of | Source & Type |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map(
      (p) =>
        `| **${p.asset} (${p.ticker})** | **${formatPriceCell(p)}** | ${formatDeltaCell(p)} | ${formatAsOf(p.last_updated)} | ${p.source} _(${p.data_type})_ |`
    ),
  ];

  return {
    tableMarkdown: lines.join("\n"),
    alertLine,
  };
}

export function buildDeskContextBlock(feed: PublishedPrices): string {
  const { tableMarkdown } = buildMarketSnapshotTable(feed.prices);
  const stocks = balanceEngineJson.stocks
    .map((s) => `- ${s.metric}: ${s.value} ${s.unit} (${s.change}) [as of ${s.last_updated}; ${s.source}; ${s.data_type}]`)
    .join("\n");
  const supply = balanceEngineJson.supply
    .map((s) => `- ${s.metric}: ${s.value} ${s.unit} (${s.change}) — ${s.note} [as of ${s.last_updated}; ${s.source}]`)
    .join("\n");
  const cot = positioningJson.positioning
    .map((p) => `- ${p.instrument}: ${p.net_position} (${p.change}, ${p.percentile}, ${p.stance}) [as of ${p.last_updated}; ${p.source}]`)
    .join("\n");
  const events = newsToBarrelsJson.events
    .map((e) => `- ${e.headline} (${e.date}, ${e.status}, confidence: ${e.confidence}): ${e.affected_capacity} ${e.capacity_type}. Watch: ${e.watch} [${e.source}]`)
    .join("\n");

  return [
    `Feed status: EIA live overlay = ${feed.eia ? `YES (as of ${feed.eiaUpdated})` : `NO (using published desk marks as of ${feed.manualUpdated})`}`,
    "",
    "### Prices",
    tableMarkdown,
    "",
    "### Inventories & Balance (Module 1)",
    `Implied Global Balance: ${balanceEngineJson.balance_summary.implied_balance} ${balanceEngineJson.balance_summary.unit} (Supply ${balanceEngineJson.balance_summary.total_supply} vs Demand ${balanceEngineJson.balance_summary.total_demand} ${balanceEngineJson.balance_summary.unit}, as of ${balanceEngineJson.balance_summary.last_updated.slice(0, 10)})`,
    stocks,
    "",
    "### Supply & OPEC+",
    supply,
    "",
    "### Curve & Cracks (Module 3)",
    `- Brent state: ${curveMonitorJson.curve_summary.brent_state}; WTI state: ${curveMonitorJson.curve_summary.wti_state} (as of ${curveMonitorJson.curve_summary.last_updated.slice(0, 10)})`,
    ...curveMonitorJson.cracks.map((c) => `- ${c.instrument}: ${c.value} ${c.unit} (${c.change}, valuation: ${c.valuation}, physical: ${c.physical_check}) [as of ${c.last_updated}]`),
    "",
    "### Positioning (Module 5)",
    cot,
    "",
    "### News-to-Barrels Events (Module 4)",
    events,
  ].join("\n");
}

export function generateDeskLeadResponse(
  query: string,
  feed: PublishedPrices,
  history: AgentChatMessage[] = []
): AgentResponsePayload {
  const topic = classifyQueryTopic(query);
  const focus = inferSessionFocus(history, query);
  const { tableMarkdown, alertLine } = buildMarketSnapshotTable(feed.prices);

  const brent = feed.prices.find((p) => p.ticker === "BRN") ?? feed.prices[0];
  const wti = feed.prices.find((p) => p.ticker === "WTI") ?? feed.prices[1];
  const hh = feed.prices.find((p) => p.ticker === "HH");
  const spread = brent && wti ? (brent.price - wti.price).toFixed(2) : "4.29";

  const usStocks = balanceEngineJson.stocks[0];
  const cushing = balanceEngineJson.stocks[1];
  const oecd = balanceEngineJson.stocks[2];
  const prodStocks = balanceEngineJson.stocks[4];
  const rigCount = supplySignals.find((s) => s.id === "us-rig-count");
  const refUtil = supplySignals.find((s) => s.id === "refinery-utilisation");

  const freshnessBanner = feed.eia
    ? `Live EIA Open Data spot overlay active (latest print **${formatAsOf(feed.eiaUpdated ?? brent.last_updated)}**; EIA daily spot series publish with a 1–3 business-day lag). Weekly inventory, COT, and curve figures are delayed/indicative desk records stamped with their respective release dates.`
    : `No live EIA API key configured in this environment — last known published desk marks shown as of **${formatAsOf(feed.manualUpdated)}** (delayed/manual). Verify all figures against primary releases before acting.`;

  const sections: string[] = [];

  if (topic === "advice_refusal") {
    sections.push(
      `### Desk Policy — Analytical Framework Only (No Personalised Advice)`,
      `I don’t give personalised investment advice, portfolio allocations, or buy/sell/hold instructions. You need a regulated financial adviser for capital allocation decisions. What I **will** give you is the institutional framework, the physical tape, and the risk parameters so you can stress-test your own thesis.`,
      `### 1. Market Snapshot`,
      ...(alertLine ? [alertLine, ""] : []),
      tableMarkdown,
      `### 2. What Moved / Drivers`,
      `- **Prompt Physical vs Structure:** **Brent ($${brent.price.toFixed(2)}/bbl)** over **WTI ($${wti.price.toFixed(2)}/bbl)** holds a **+$${spread}/bbl** differential (as of ${formatAsOf(brent.last_updated)}, ${brent.source}), keeping the US Gulf Coast export arbitrage open (**+$0.35/bbl** net margin to NW Europe, Module 3, as of 2026-07-04).`,
      `- **Inventory Cushion:** US commercial crude sits at **${usStocks.value} ${usStocks.unit}** (**${usStocks.change}**, as of ${usStocks.last_updated}, ${usStocks.source}) and Cushing at **${cushing.value} ${cushing.unit}** (**${cushing.change}**).`,
      `### 3. Desk View (Framework & Scenarios)`,
      `- **Bull Case (Confidence: Medium):** Sustained US/OECD stock draws (**${balanceEngineJson.balance_summary.implied_balance} mb/d** implied balance) plus Middle East/Red Sea transit friction keep front-month backwardation firm (**Brent M1/M2 +$0.45/bbl**) and support **$78–$84/bbl** Brent.`,
      `- **Bear Case (Confidence: Medium):** Faster OPEC+ voluntary cut unwind (**+250 kb/d per month** signalled, Module 4) meeting **2.3σ** West African unsold cargo length compresses timespreads toward **$70–$74/bbl**.`,
      `- **Invalidation:** Two consecutive weekly US commercial crude builds >3 mb or Brent M1/M2 flipping into contango.`,
      `### 4. Watchpoints & Invalidation`,
      `- **Next Prints:** EIA Weekly Petroleum Status Report (Wednesdays 10:30 ET) and CFTC/ICE COT positioning (Fridays 15:30 ET).`,
      `- **Clarifying Questions for Your Research:** What is your time horizon (prompt contract vs multi-quarter), and are you analysing flat price, timespreads, or energy equities?`,
      `### 5. Sources & Freshness`,
      `- ${freshnessBanner}`,
      `- Primary sources: EIA.gov (RBRTE, RWTC, RNGWHHD, WCESTUS1, WCESTOK1), IEA Oil Market Report, OPEC MOMR, CFTC/ICE COT.`,
      `---`,
      `**Disclaimer:** ${CRUDE_ORACLE_MANDATORY_DISCLAIMER}`,
      ``,
      `**${CRUDE_ORACLE_INTERACTIVE_FOOTER}**`
    );

    return {
      reply: sections.join("\n\n"),
      topic,
      focus,
      model: "crude-oracle-desk-lead-v1",
      eiaLive: feed.eia,
      promptVersion: CRUDE_ORACLE_PROMPT_VERSION,
      quickOptions: CRUDE_ORACLE_QUICK_PROMPTS,
    };
  }

  // 1. Market Snapshot (Always present)
  sections.push(
    `### 1. Market Snapshot`,
    `The tape is firm at the front and contested in the deferred months. Session focus: **${focus}**.`,
    ...(alertLine ? [alertLine] : []),
    tableMarkdown,
    `- **Key Physical Prints:** US commercial crude **${usStocks.value} ${usStocks.unit}** (**${usStocks.change}**, as of ${usStocks.last_updated}, ${usStocks.source}) · Cushing **${cushing.value} ${cushing.unit}** (**${cushing.change}**) · Implied global balance **${balanceEngineJson.balance_summary.implied_balance} mb/d** (as of ${balanceEngineJson.balance_summary.last_updated.slice(0, 10)}, ${balanceEngineJson.balance_summary.source}).`
  );

  // 2. What Moved / Drivers (Adapted by topic)
  if (topic === "inventories") {
    sections.push(
      `### 2. What Moved / Drivers (Inventories & Balance)`,
      `- **US Crude & Cushing Draw Cycle:** Commercial crude stocks drew **${usStocks.change}** to **${usStocks.value} mb** (~11 mb below the 5-year seasonal average, as of ${usStocks.last_updated}, EIA WPSR). Cushing hub stocks fell **${cushing.change}** to **${cushing.value} mb**, pressing toward operational tank bottoms.`,
      `- **Refinery Runs vs Product Builds:** US refinery utilisation is running hot at **${refUtil?.value ?? "93.4%"}** (as of ${refUtil?.last_updated ?? "2026-07-14"}, EIA WPSR), pulling crude down but building combined gasoline + distillate stocks by **${prodStocks.change}** to **${prodStocks.value} mb** (as of ${prodStocks.last_updated}).`,
      `- **Global S&D & OECD Cover:** Global supply (**${balanceEngineJson.balance_summary.total_supply} mb/d**) trails demand (**${balanceEngineJson.balance_summary.total_demand} mb/d**) for a **${balanceEngineJson.balance_summary.implied_balance} mb/d** deficit, corroborated by OECD industry stocks drawing **${oecd.change}** to **${oecd.value} mb** (as of ${oecd.last_updated}, IEA OMR) while US rig count stays flat at **${rigCount?.value ?? "512 rigs"}** (Baker Hughes, as of ${rigCount?.last_updated ?? "2026-07-14"}).`
    );
  } else if (topic === "geopolitics") {
    sections.push(
      `### 2. What Moved / Drivers (Geopolitics & Supply Risk)`,
      `- **Rotterdam Refining Outage (Confirmed — Confidence: Medium):** **400 kb/d** CDU offline in NW Europe for an estimated **2–4 weeks** (as of 2026-07-04, Operator statement / Module 4). Bearish local North Sea crude differentials (Forties/Ekofisk), bullish European diesel cracks and ARA middle-distillate imports.`,
      `- **Red Sea Rerouting & Shadow-Fleet Sanctions (Confirmed — Confidence: Medium):** OFAC designations target **~300 kb/d** of sanctioned exports (as of 2026-07-02, OFAC / Module 4), driving dark-AIS gaps to **+1.8σ** and TD3C MEG–China VLCC freight to **WS 68 (+1.2σ)** (Module 2, as of 2026-07-04).`,
      `- **OPEC+ Unwind Signalling vs Spare Capacity (Developing — Confidence: Low):** Ministers signalled a potential **+250 kb/d per month** unwind from October (as of 2026-07-03, OPEC communications), while effective spare capacity remains concentrated in Gulf producers (IEA OMR, as of 2026-07-14).`
    );
  } else if (topic === "positioning") {
    sections.push(
      `### 2. What Moved / Drivers (Curve, Cracks & Positioning)`,
      `- **Brent Long Crowding (82nd Percentile — Confidence: High):** ICE COT managed money holds **+310k contracts** (**+25k w/w**, as of 2026-07-01, ICE COT). Prompt **Brent M1/M2 (+$0.45/bbl)** confirms the front, but **M1/M7 (+$2.10/bbl)** is contradicted by **+2.3σ** West African unsold loadings (Modules 2–3, as of 2026-07-04).`,
      `- **ICE Gasoil Short Squeeze Setup (8th Percentile — Confidence: Medium):** Speculators sit heavily short at **-45k contracts** (**-6k w/w**, as of 2026-07-01, ICE COT) just as the **400 kb/d** Rotterdam outage tightens European distillate supply. Diesel crack is at **+$16.0/bbl** vs Brent (Module 3, as of 2026-07-04).`,
      `- **WTI Uncrowded & Supported (65th Percentile — Confidence: High):** NYMEX WTI managed money is at **+185k contracts** (**+12k w/w**, CFTC COT as of 2026-07-01) with **WTI M1/M2 (+$0.55/bbl)** and **Midland–Cushing (+$1.10/bbl)** backed by hub draws and USGC export queues (**+1.6σ**).`
    );
  } else if (topic === "gas_lng") {
    sections.push(
      `### 2. What Moved / Drivers (Gas & LNG)`,
      `- **Henry Hub vs Global LNG Arb:** **Henry Hub (${hh ? `$${hh.price.toFixed(2)}/MMBtu` : "$2.91/MMBtu"}, ${hh ? `${hh.daily_change > 0 ? "+" : ""}${hh.daily_change.toFixed(2)}% d/d` : "+1.75% d/d"})** (as of ${formatAsOf(hh?.last_updated ?? "2026-07-15")}, ${hh?.source ?? "EIA"}) sits at a wide discount to the **JKM Asia LNG proxy ($11.90/MMBtu, +1.54% d/d)** (as of 2026-07-15, API placeholder / IEA).`,
      `- **Feedgas & Liquefaction Ramp:** US LNG export terminals are running near capacity while new liquefaction trains ramp; Asian spot buyers remain price-sensitive above **$12/MMBtu** and European storage refill pace is the swing factor (as of 2026-07-14, IEA Gas Market Report).`
    );
  } else {
    sections.push(
      `### 2. What Moved / Drivers`,
      `- **Prompt Tightness vs Deferred Contradiction:** **Brent ($${brent.price.toFixed(2)}/bbl)** and **WTI ($${wti.price.toFixed(2)}/bbl)** (as of ${formatAsOf(brent.last_updated)}, ${brent.source}) are supported at the front by a fourth US crude draw in five weeks (**-2.1 mb w/w** to **443.7 mb**, EIA WPSR as of 2026-07-02) and Cushing tightness (**24.8 mb**).`,
      `- **Refining & Freight Friction:** Rotterdam's **400 kb/d** CDU outage (confirmed, as of 2026-07-04) and Red Sea / shadow-fleet sanctions (**~300 kb/d** affected, OFAC as of 2026-07-02) keep compliant tanker rates elevated (**TD3C WS 68, +1.2σ**).`,
      `- **Positioning Asymmetry:** Brent managed money is stretched at the **82nd percentile (+310k lots)** while ICE Gasoil sits at the **8th percentile (-45k lots)** (ICE COT as of 2026-07-01).`
    );
  }

  // 3. Desk View (Bull / Bear / Conviction / Invalidation)
  sections.push(
    `### 3. Desk View`,
    `- **Bull Case ($79.50–$84.00/bbl Brent · WTI M1/M2 +$0.65–$0.90/bbl):** Continued US commercial and Cushing draws, prolonged Rotterdam CDU repair (>4 weeks), and firmer shadow-fleet enforcement force Gasoil short-covering (**8th percentile**) and pull prompt crude higher. **Conviction: Medium.**`,
    `- **Bear Case ($71.00–$75.50/bbl Brent · M1/M7 spread compression by $0.75–$1.25/bbl):** Unsold West African cargoes (**+2.3σ** loading anomaly) clear via lower differentials, OPEC+ confirms the **+250 kb/d/month** Q4 unwind, and **82nd-percentile** Brent fund length liquidates into macro/PMI softness. **Conviction: Medium.**`,
    `- **Explicit Invalidation:** Bull view invalidated if US commercial crude builds >3.0 mb for two consecutive weeks or Cushing recovers above 27.5 mb. Bear view invalidated if OPEC+ formally defers the Q4 unwind or Hormuz/Red Sea transit losses exceed 500 kb/d.`
  );

  // 4. Watchpoints & Invalidation
  sections.push(
    `### 4. Watchpoints & Invalidation`,
    `- **EIA Weekly Petroleum Status Report (Wednesdays 10:30 ET):** Watch Cushing vs the **24.0 mb** operational cushion and ARA/US distillate stock changes.`,
    `- **Physical Differentials & Curves:** Monitor **Brent M1/M2 (+$0.45/bbl)** vs **Forties/WAF differentials** — if M1/M2 stalls while WAF stays discounted, Brent fund length (**310k lots**) is at elevated liquidation risk.`,
    `- **Event Triggers:** Rotterdam refinery restart timeline (2–4 week window), NHC US Gulf tropical tracks (**up to 1.5 mb/d** offshore production / **2.0 mb/d** refining in cone), and Saudi OSP announcements.`
  );

  // 5. Investment Implications (Always included when equities/scenarios asked, concise otherwise)
  if (topic === "equities" || topic === "scenarios") {
    const watchSample = watchlistCompanies.slice(0, 4);
    const intelSample = companyIntel.slice(0, 2);
    sections.push(
      `### 5. Investment Implications (Scenario-Framed — Monitored Names, Not Recommendations)`,
      `- **Integrated Majors & Upstream (${watchSample.map((w) => `${w.ticker} [${w.exchange}]`).join(", ")}):** Dividend coverage and buyback resilience hold down to **$60/bbl Brent** in stress scenarios; upside sensitivity is highest to sustained **$80+/bbl** flat price (as of ${watchSample[0]?.last_updated ?? "2026-07-04"}, ${watchSample[0]?.source ?? "Company filings"}).`,
      `- **Crude Tankers & OFS (SMPL-G, SMPL-E):** Compliant VLCC/Suezmax owners benefit from ton-mile elongation (Red Sea Cape routing + shadow-fleet sanctions, **TD3C +1.2σ**), with rate-volatility risk if floating storage (**78 mb**, as of 2026-07-02) unwinds rapidly.`,
      `- **Refining & Distillate Crack Scenario:** Crowded Gasoil shorts (**8th percentile**) vs the **400 kb/d** Rotterdam outage favour distillate crack normalisation toward seasonal averages unless European industrial PMIs deteriorate further.`,
      ...(intelSample.length
        ? [
            `- **Company Notes on File:** ${intelSample.map((c) => `**${c.company} (${c.ticker})** — catalyst: _${c.catalyst}_; key risk: _${c.risk}_ (as of ${c.last_updated})`).join(" | ")}.`,
          ]
        : [])
    );
  } else {
    sections.push(
      `### 5. Investment Implications (Scenario Framework)`,
      `- **Structure vs Flat Price:** WTI prompt structure (**M1/M2 +$0.55/bbl**, low crowding at **65th percentile**) carries cleaner physical backing than deferred Brent (**M1/M7 +$2.10/bbl**, **82nd percentile** crowding).`,
      `- **Crack & Equity Read-Through:** Compliant tanker and international OFS themes remain supported by ton-mile friction and offshore capex; middle-distillate cracks carry asymmetric upside if ARA stocks draw during the Rotterdam outage.`
    );
  }

  // 6. Sources & Freshness
  sections.push(
    `### 6. Sources & Freshness`,
    `- **Freshness & Delays:** ${freshnessBanner}`,
    `- **Primary Sources Cited:** EIA.gov (Daily Spot ` +
      `RBRTE/RWTC/RNGWHHD as of ${formatAsOf(brent.last_updated)}; Weekly Petroleum Status Report WCESTUS1/WCESTOK1 as of ${usStocks.last_updated}), IEA Oil Market Report (as of ${oecd.last_updated}), OPEC MOMR (as of 2026-07-01), CFTC & ICE COT (as of 2026-07-01, Tuesday positions released Friday), Baker Hughes Rig Count (as of ${rigCount?.last_updated ?? "2026-07-14"}), OFAC & NHC public advisories (as of 2026-07-02..04).`
  );

  // 7. Mandatory Disclaimer & Interactive Footer
  sections.push(
    `---`,
    `**Disclaimer:** ${CRUDE_ORACLE_MANDATORY_DISCLAIMER}`,
    ``,
    `**${CRUDE_ORACLE_INTERACTIVE_FOOTER}**`
  );

  return {
    reply: sections.join("\n\n"),
    topic,
    focus,
    model: "crude-oracle-desk-lead-v1",
    eiaLive: feed.eia,
    promptVersion: CRUDE_ORACLE_PROMPT_VERSION,
    quickOptions: CRUDE_ORACLE_QUICK_PROMPTS,
  };
}
