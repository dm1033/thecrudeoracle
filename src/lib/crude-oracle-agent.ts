/**
 * CrudeOracle Investment Agent — Master System Prompt & Desk Lead Engine
 * For Onscreen Bot Deployment | Version 30 Oct 2026
 */

import { getMarketSnapshot } from "@/lib/market-snapshot";
import { watchlistCompanies, companyIntel, type MarketPrice } from "@/lib/data";
import type { CurveFeed } from "@/lib/curve";
import type { DashboardCards, DataCard } from "@/lib/dashboard-cards";
import { isSampleInstrument } from "@/lib/sample-marks";
import type { PublishedPrices } from "@/lib/published-prices";
import { LICENSED_DATA_REQUIRED, isPlaceholderPrice, priceFigureShown, priceFigureTooOld } from "@/lib/price-stamp";

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

/**
 * Figures the bot may quote beyond the price board, all read from public
 * feeds at request time. Anything that did not load is absent, and the bot
 * then says nothing about it.
 */
export interface DeskData {
  cards: DashboardCards;
  curve: CurveFeed | null;
}

export const EMPTY_DESK_DATA: DeskData = { cards: { supply: [], demand: [], context: [] }, curve: null };

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
  // "crude & gas market snapshot" is the opening prompt: it must not be read as a gas-only question.
  if (/\bmarket\s+snapshot\b/.test(q)) return "snapshot";
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
  // Same rule as the price cards: no figure for a placeholder or a print older than 30 days.
  const bigMover = rows.find((p) => priceFigureShown(p) && Math.abs(p.daily_change) >= 2.0);
  let alertLine: string | null = null;
  if (bigMover) {
    const dir = bigMover.daily_change > 0 ? "surged" : "dropped";
    alertLine = `> **ALERT:** **${bigMover.asset} (${bigMover.ticker})** ${dir} **${bigMover.daily_change > 0 ? "+" : ""}${bigMover.daily_change.toFixed(2)}% d/d** to **$${bigMover.price.toFixed(2)}** (as of ${formatAsOf(bigMover.last_updated)}, ${bigMover.source}).`;
  }

  const lines = [
    "| Asset | Price | Δ (d/d · w/w) | As-of | Source & Type |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((p) =>
      priceFigureShown(p)
        ? `| **${p.asset} (${p.ticker})** | **${formatPriceCell(p)}** | ${formatDeltaCell(p)} | ${formatAsOf(p.last_updated)} | ${p.source} _(${p.data_type})_ |`
        : `| **${p.asset} (${p.ticker})** | ${isPlaceholderPrice(p) ? LICENSED_DATA_REQUIRED : "withheld – last print is over 30 days old"} | n/a | ${formatAsOf(p.last_updated)} | ${p.source} _(${p.data_type})_ |`
    ),
  ];

  return {
    tableMarkdown: lines.join("\n"),
    alertLine,
  };
}

/** NYMEX WTI managed money from the automated CFTC pull; nothing is said when it has not loaded. */
function cftcWtiLine(): string | null {
  const row = getMarketSnapshot().cftc.rows[0];
  if (!row) return null;
  const n = (value: number) => value.toLocaleString("en-GB");
  const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "-" : ""}${n(Math.abs(value))}`;
  const change =
    row.netChange == null || row.previousReportDate == null
      ? ""
      : `, ${signed(row.netChange)} vs ${row.previousReportDate}`;
  return `NYMEX WTI managed money: net ${signed(row.net)} contracts${change}; long ${n(row.long)}, short ${n(row.short)} (CFTC Disaggregated COT as of ${row.reportDate}, delayed)`;
}

function cftcWtiBullet(): string[] {
  const line = cftcWtiLine();
  return line ? [`- **WTI positioning (CFTC print):** ${line}.`] : [];
}

function cardLine(card: DataCard): string {
  return `${card.label}: ${card.value}. ${card.detail} [${card.sourceName}, as of ${card.asOf.slice(0, 10)}, ${card.dataType}]`;
}

function spreadLines(curve: CurveFeed | null): string[] {
  if (!curve) return [];
  return curve.spreads.map((spread) => {
    const change = spread.change == null ? "" : `, ${spread.change > 0 ? "+" : ""}${spread.change.toFixed(2)} on the day before`;
    return `${spread.label}: $${spread.latest.value.toFixed(2)}/bbl${change}. ${spread.method} [worked from EIA daily spot prices for ${spread.latest.date}, delayed]`;
  });
}

const NOT_LOADED = "- Not loaded. Say nothing about this section and quote no figure for it.";

export function buildDeskContextBlock(feed: PublishedPrices, data: DeskData = EMPTY_DESK_DATA): string {
  const { tableMarkdown } = buildMarketSnapshotTable(feed.prices);
  const list = (lines: string[]) => (lines.length ? lines.map((line) => `- ${line}`).join("\n") : NOT_LOADED);
  const cftc = cftcWtiLine();

  return [
    `Feed status: EIA live overlay = ${feed.eia ? `YES (as of ${feed.eiaUpdated})` : `NO (using published desk marks as of ${feed.manualUpdated})`}`,
    "Only the figures below are verified. Quote no other figure. There is no event, outage, tanker or OPEC-decision feed: do not describe any such event as current.",
    "",
    "### Prices",
    tableMarkdown,
    "",
    "### Supply: US stocks (EIA weekly) and production (EIA Short-Term Energy Outlook)",
    list(data.cards.supply.map(cardLine)),
    "",
    "### Demand (EIA Short-Term Energy Outlook)",
    list(data.cards.demand.map(cardLine)),
    "",
    "### Spreads and cracks (EIA daily spot prices)",
    list(spreadLines(data.curve)),
    "",
    "### Positioning, news coverage and macro",
    list([...(cftc ? [cftc] : []), ...data.cards.context.map(cardLine)]),
  ].join("\n");
}

/**
 * The canned Desk Bot reply.
 *
 * Rule for everything below: no market figure is ever typed into the text.
 * Each number is read from a data record at request time and printed with
 * that record's own date, source and data type, so an old record reads as
 * old. Scenario text names conditions, never price levels, and carries no
 * conviction label. A line with no record behind it is left out.
 */

function cardBullets(cards: DataCard[]): string[] {
  return cards.map(
    (card) => `- **${card.label}:** ${card.value}. ${card.detail} — ${card.sourceName}, as of ${formatAsOf(card.asOf)}, ${card.dataType}.`
  );
}

function spreadBullets(curve: CurveFeed | null): string[] {
  return spreadLines(curve).map((line) => {
    const split = line.indexOf(":");
    return `- **${line.slice(0, split)}:**${line.slice(split + 1)}`;
  });
}

function only(cards: DataCard[], ids: string[]): DataCard[] {
  return ids.flatMap((id) => cards.filter((card) => card.id === id));
}

function priceBullet(p: MarketPrice | undefined): string[] {
  if (!p || !priceFigureShown(p)) return [];
  return [
    `- **${p.asset} (${p.ticker}):** ${formatPriceCell(p)}, ${formatDeltaCell(p)} — as of ${formatAsOf(p.last_updated)}, ${p.source}, ${p.data_type}.`,
  ];
}

const DESK_VIEW: string[] = [
  `### 3. Desk View`,
  `- **Bull Case (conditions, not a forecast):** Weekly EIA prints keep showing commercial crude and Cushing draws, prompt timespreads stay backwardated, and a confirmed supply or refining disruption lasts longer than first reported.`,
  `- **Bear Case (conditions, not a forecast):** Stocks start building, prompt timespreads weaken toward contango, producers add supply faster than demand absorbs it, and speculative length is cut.`,
  `- **Explicit Invalidation:** Either case is dropped when the next primary print contradicts it — check the latest EIA weekly stocks and the CFTC positioning print against the dates shown above before relying on any line here. I give no price target and no conviction level.`,
];

const WATCHPOINTS: string[] = [
  `### 4. Watchpoints & Invalidation`,
  `- **EIA Weekly Petroleum Status Report (Wednesdays 10:30 ET):** commercial crude, Cushing, gasoline and distillate stock changes.`,
  `- **CFTC Commitments of Traders (Fridays 15:30 ET):** managed-money long, short and net in NYMEX WTI.`,
  `- **EIA Short-Term Energy Outlook (monthly):** world production, consumption and OPEC spare capacity estimates, which EIA revises.`,
];

export function generateDeskLeadResponse(
  query: string,
  feed: PublishedPrices,
  history: AgentChatMessage[] = [],
  data: DeskData = EMPTY_DESK_DATA
): AgentResponsePayload {
  const topic = classifyQueryTopic(query);
  const focus = inferSessionFocus(history, query);
  const { tableMarkdown, alertLine } = buildMarketSnapshotTable(feed.prices);

  const brent = feed.prices.find((p) => p.ticker === "BRN");
  const wti = feed.prices.find((p) => p.ticker === "WTI");
  const hh = feed.prices.find((p) => p.ticker === "HH");
  const spreadBullet =
    brent && wti && priceFigureShown(brent) && priceFigureShown(wti)
      ? [
          `- **Brent–WTI spread:** $${(brent.price - wti.price).toFixed(2)}/bbl, from the two prices above (as of ${formatAsOf(brent.last_updated)}, ${brent.source}).`,
        ]
      : [];

  const freshnessBanner = feed.eia
    ? `Live EIA Open Data spot overlay active (latest print **${formatAsOf(feed.eiaUpdated ?? feed.manualUpdated)}**; EIA daily spot series publish with a 1–3 business-day lag).`
    : `No live EIA API key configured in this environment — last known published desk marks shown as of **${formatAsOf(feed.manualUpdated)}** (delayed/manual).`;
  const recordsBanner = `Every figure above is read from a public feed when you ask, and carries that feed's own date and source. A feed that did not load is left out and no stored figure takes its place. I hold no event, outage or tanker feed, so I describe none.`;
  const { supply, demand, context } = data.cards;
  const stockCards = only(supply, ["us-crude", "cushing"]);
  const newsCards = only(context, ["supply-news"]);

  const footer = [
    `---`,
    `**Disclaimer:** ${CRUDE_ORACLE_MANDATORY_DISCLAIMER}`,
    ``,
    `**${CRUDE_ORACLE_INTERACTIVE_FOOTER}**`,
  ];
  const payload = (sections: string[]): AgentResponsePayload => ({
    reply: sections.join("\n\n"),
    topic,
    focus,
    model: "crude-oracle-desk-lead-v1",
    eiaLive: feed.eia,
    promptVersion: CRUDE_ORACLE_PROMPT_VERSION,
    quickOptions: CRUDE_ORACLE_QUICK_PROMPTS,
  });

  if (topic === "advice_refusal") {
    return payload([
      `### Desk Policy — Analytical Framework Only (No Personalised Advice)`,
      `I don’t give personalised investment advice, portfolio allocations, or buy/sell/hold instructions. You need a regulated financial adviser for capital allocation decisions. What I **will** give you is the framework, the published figures with their dates, and the conditions to test your own thesis against.`,
      `### 1. Market Snapshot`,
      ...(alertLine ? [alertLine, ""] : []),
      tableMarkdown,
      `### 2. What Moved / Drivers`,
      ...spreadBullet,
      ...cardBullets(stockCards),
      ...cftcWtiBullet(),
      ...DESK_VIEW.map((line) => (line === `### 3. Desk View` ? `### 3. Desk View (Framework & Scenarios)` : line)),
      ...WATCHPOINTS,
      `- **Questions for your own research:** What is your time horizon, and are you analysing flat price, timespreads, or energy equities?`,
      `### 5. Sources & Freshness`,
      `- ${freshnessBanner}`,
      `- ${recordsBanner}`,
      ...footer,
    ]);
  }

  const sections: string[] = [];

  // 1. Market Snapshot
  sections.push(
    `### 1. Market Snapshot`,
    `Session focus: **${focus}**.`,
    ...(alertLine ? [alertLine] : []),
    tableMarkdown
  );

  // 2. What Moved / Drivers
  if (topic === "inventories") {
    sections.push(
      `### 2. What Moved / Drivers (Inventories & Balance)`,
      ...cardBullets(supply),
      ...cardBullets(only(demand, ["steo-patc_world", "steo-patc_oecd", "steo-patc_non_oecd"])),
      ...(supply.length ? [] : [`- **Not loaded:** the EIA stock and balance figures could not be read just now, so I quote none.`])
    );
  } else if (topic === "geopolitics") {
    sections.push(
      `### 2. What Moved / Drivers (Geopolitics & Supply Risk)`,
      ...cardBullets(newsCards),
      ...cardBullets(only(supply, ["steo-cops_opec", "steo-copr_opec"])),
      `- **Not on file:** I hold no feed of outages, attacks, sanctions or OPEC decisions, so I report none as current. The news figure above counts coverage; it does not measure risk. Check official and operator sources for events.`
    );
  } else if (topic === "positioning") {
    sections.push(
      `### 2. What Moved / Drivers (Curve, Cracks & Positioning)`,
      ...cftcWtiBullet(),
      ...spreadBullets(data.curve),
      ...(data.curve?.spreads.length ? [] : cardBullets(only(demand, ["crack-321"]))),
      `- **Not on file:** positioning in Brent and products, and any futures curve. Those need licensed exchange data, so I quote none.`
    );
  } else if (topic === "gas_lng") {
    sections.push(
      `### 2. What Moved / Drivers (Gas & LNG)`,
      ...priceBullet(hh),
      `- **Not on file:** I hold no licensed JKM or TTF price and no LNG feedgas series, so I quote none. Check the exchange or the IEA Gas Market Report directly.`
    );
  } else {
    sections.push(
      `### 2. What Moved / Drivers`,
      ...priceBullet(brent),
      ...priceBullet(wti),
      ...spreadBullet,
      ...cardBullets(stockCards),
      ...cftcWtiBullet(),
      ...cardBullets(only(supply, ["steo-cops_opec"])),
      ...cardBullets(newsCards)
    );
  }

  // 3–4. Desk View and Watchpoints
  sections.push(...DESK_VIEW, ...WATCHPOINTS);

  // 5. Investment Implications
  if (topic === "equities" || topic === "scenarios") {
    // Sample and placeholder names are withheld here as they are on the watchlist pages.
    const watchSample = watchlistCompanies.filter((w) => !isSampleInstrument([w.ticker, w.company, w.investment_theme])).slice(0, 4);
    const intelSample = companyIntel.filter((c) => !isSampleInstrument([c.ticker, c.company, c.catalyst])).slice(0, 2);
    sections.push(
      `### 5. Investment Implications (Scenario-Framed — Monitored Names, Not Recommendations)`,
      ...(watchSample.length
        ? [
            `- **Names on the watchlist:** ${watchSample.map((w) => `${w.company} (${w.ticker}, ${w.exchange}) — theme: _${w.investment_theme}_; risk: _${w.risk}_`).join(" | ")} (as of ${watchSample[0].last_updated}, ${watchSample[0].source}, ${watchSample[0].data_type}).`,
          ]
        : []),
      ...(intelSample.length
        ? [
            `- **Company notes on file:** ${intelSample.map((c) => `**${c.company} (${c.ticker})** — catalyst: _${c.catalyst}_; key risk: _${c.risk}_ (as of ${c.last_updated})`).join(" | ")}.`,
          ]
        : []),
      ...(watchSample.length || intelSample.length
        ? []
        : [`- **No names on file:** no company is published on the watchlist at present, so I list none.`]),
      `- **How to read these:** They are monitored names with a stated theme and risk, not buy or sell ideas. I quote no price sensitivity or break-even for any company.`
    );
  } else {
    sections.push(
      `### 5. Investment Implications (Scenario Framework)`,
      `- **Structure vs flat price:** A prompt spread backed by drawing stocks is better supported than one that is not. Compare the spreads on the Curve, Spreads & Cracks page with the stock prints above, by date.`,
      `- **Equity read-through:** See the Watchlist and Company Intel pages for monitored names; ask me for "equity impacts" to list them here.`
    );
  }

  // 6. Sources & Freshness
  sections.push(
    `### 6. Sources & Freshness`,
    `- **Prices:** ${freshnessBanner}`,
    `- **Other figures:** ${recordsBanner}`
  );

  // 7. Mandatory Disclaimer & Interactive Footer
  sections.push(...footer);

  return payload(sections);
}
