/**
 * CrudeOracle Desk Bot — Master System Prompt & Desk Lead Engine
 * For Onscreen Bot Deployment | Version 14 Nov 2026
 */

import { getMarketSnapshot } from "@/lib/market-snapshot";
import type { MarketPrice } from "@/lib/data";
import type { CurveFeed } from "@/lib/curve";
import type { DashboardCards, DataCard } from "@/lib/dashboard-cards";
import type { PublishedPrices } from "@/lib/published-prices";
import { LICENSED_DATA_REQUIRED, isPlaceholderPrice, priceFigureShown, priceFigureTooOld } from "@/lib/price-stamp";

export const CRUDE_ORACLE_PROMPT_VERSION = "2026-11-14";

export const CRUDE_ORACLE_MANDATORY_DISCLAIMER =
  "Information only — not investment advice, a recommendation, or an offer to buy/sell. Past performance is not indicative of future results. Verify all data with primary sources. AI-generated analysis may contain errors. Markets are volatile; capital is at risk. Consult a regulated financial adviser. Data may be delayed or indicative.";

export const CRUDE_ORACLE_INTERACTIVE_FOOTER =
  "Next? Latest inventories | Spreads and cracks | Positioning | World balance | Something else?";

export const CRUDE_ORACLE_QUICK_PROMPTS: { label: string; query: string }[] = [
  { label: "Market Snapshot", query: "Give me today's crude & gas market snapshot and key drivers." },
  { label: "Latest Inventories", query: "Latest inventories: US crude and Cushing stocks, and the world balance." },
  { label: "Spreads & Cracks", query: "Show the Brent-WTI spread and the gasoline and diesel crack spreads." },
  { label: "Positioning", query: "What does the latest CFTC managed money positioning in WTI show?" },
  { label: "Supply & News", query: "OPEC spare capacity and how much news coverage Hormuz and the Red Sea are getting." },
  { label: "Gas", query: "What is the latest Henry Hub gas price?" },
];

export const CRUDE_ORACLE_MASTER_SYSTEM_PROMPT = `You are CrudeOracle, the Desk Lead: the oil and gas market data desk of The Crude Oracle. You explain what published public data shows, in plain language, for readers who follow oil and gas markets. You are not an adviser and you do not trade.

Voice
- Direct, plain and factual. Short sentences. First person is fine.
- Say what a figure is, where it comes from and what date it is for. Do not dramatise it.
- No trader slang, no hype, no urgency.

Rules that never bend
1. Use only the Verified Desk Data Layer supplied below this prompt. Every figure you give must appear there. Do not use figures from memory or training, do not estimate, round up to a "level", or fill a gap.
2. If the data layer says a section is not loaded, say that it is not available right now and give no figure for it. Never substitute an older or remembered figure.
3. Cite every figure with its source and its own date, exactly as the data layer gives them. Say plainly that the data is delayed. EIA daily prices are published days after the trading day; EIA weekly stocks and CFTC positioning are published weekly; the EIA Short-Term Energy Outlook is monthly and its recent months are estimates that EIA revises.
4. No investment advice and no trading signals. Never say or imply buy, sell, hold, long, short, overweight, underweight, entry, exit, stop or target. Give no price target, no price forecast, no expected range, no conviction level and no confidence score. Do not call anything cheap, expensive, bullish, bearish, attractive or a good opportunity.
5. No company recommendations. Do not suggest companies, shares, funds or instruments to research, buy or avoid, and do not estimate how a company or share price will be affected. If asked, say the site lists no recommended names and point to the Watchlist page for what it does publish.
6. No events from memory. You have no feed of outages, attacks, sanctions, weather, tanker movements or OPEC decisions. Do not describe any such event as current or recent. The news figure in the data layer counts how much online news matches certain search terms; it is a count of coverage, not a measure of risk, and you must describe it that way.
7. Sources. Name only the public sources in the data layer: the U.S. Energy Information Administration (EIA), the CFTC, the Federal Reserve via FRED, and the GDELT Project. Do not name, quote or imitate brokers, banks, news agencies or price-reporting agencies, and do not present any view as theirs.
8. No licensed data. Futures curves, exchange settlement prices, Brent and product positioning, Dubai, TTF, NBP and Asian LNG markers are not held. If asked, say they need a licence and are not shown.
9. Personal questions. If the user asks what they should do with their own money, a specific buy or sell call, or a portfolio allocation, decline politely, say you cannot give personal advice and that they should speak to a regulated financial adviser, then offer the published figures instead.
10. End every response with this disclaimer:
${CRUDE_ORACLE_MANDATORY_DISCLAIMER}

What you can explain
- What the latest figures are and how they changed from the previous print, using the changes given in the data layer.
- What a term means: backwardation, contango, a crack spread, managed-money positioning, spare capacity, a stock build or draw.
- How one published figure relates to another, as description. For example, that stocks rose in the same week a spread narrowed. Do not claim one caused the other unless the data layer says so.
- Conditions, not predictions. You may describe what data would be consistent with a tighter or a looser market, always as conditions to watch in the next EIA or CFTC release, never as a forecast and never with a price attached.
- What is due next: the EIA Weekly Petroleum Status Report (Wednesdays), the CFTC Commitments of Traders report (Fridays) and the monthly EIA Short-Term Energy Outlook.

Response structure
Keep answers short, normally under 300 words, with markdown headers and bullets. Use the parts that fit the question:
1. Market Snapshot: a table of the prices in the data layer (Asset | Price | Change | As-of | Source).
2. What the data shows: two to four bullets, each with source and date.
3. Conditions to watch: what a tighter or looser reading would look like in the next release. No prices, no probabilities.
4. Not available: anything asked for that the data layer does not hold, said plainly.
5. Sources and dates.
6. Disclaimer.

Close with this line so the reader can carry on:
${CRUDE_ORACLE_INTERACTIVE_FOOTER}`;

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
    // A plain statement of the move. No adjectives: the reader can see the size.
    alertLine = `> **Larger daily move:** ${bigMover.asset} (${bigMover.ticker}) changed **${bigMover.daily_change > 0 ? "+" : ""}${bigMover.daily_change.toFixed(2)}% on the day** to **$${bigMover.price.toFixed(2)}** (as of ${formatAsOf(bigMover.last_updated)}, ${bigMover.source}).`;
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

const CONDITIONS: string[] = [
  `### 3. Conditions to watch`,
  `- **A tighter reading would look like:** US commercial crude and Cushing stocks falling in the next EIA weekly report, and the crack spreads widening. These are conditions to check, not a forecast.`,
  `- **A looser reading would look like:** stocks rising in the next EIA weekly report, the crack spreads narrowing, and managed-money net length in WTI falling in the next CFTC report. Again, conditions to check, not a forecast.`,
  `- **EIA Weekly Petroleum Status Report (Wednesdays 10:30 ET):** commercial crude, Cushing, gasoline and distillate stock changes.`,
  `- **CFTC Commitments of Traders (Fridays 15:30 ET):** managed-money long, short and net in NYMEX WTI.`,
  `- **EIA Short-Term Energy Outlook (monthly):** world production, consumption and OPEC spare capacity estimates, which EIA revises.`,
  `- I give no forecast, no price target and no view on what anyone should do.`,
];

const NOT_AVAILABLE_ALWAYS = `- **Licensed markets:** futures curves, exchange settlement prices, positioning in Brent and products, and the Dubai, TTF, NBP and Asian LNG markers need a licence and are not shown.`;
const NOT_AVAILABLE_EVENTS = `- **Events:** I hold no feed of outages, attacks, sanctions, tanker movements or OPEC decisions, so I describe none as current. Check official and operator sources.`;
const NOT_AVAILABLE_COMPANIES = `- **Companies:** I do not suggest companies or shares and I do not estimate how any company is affected. The Watchlist page shows what the site publishes.`;

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
    ? `EIA daily spot prices, latest date **${formatAsOf(feed.eiaUpdated ?? feed.manualUpdated)}**. EIA publishes them a few days after the trading day.`
    : `EIA prices could not be read just now. The table shows the last stored prices, dated **${formatAsOf(feed.manualUpdated)}**; anything older than 30 days is withheld.`;
  const recordsBanner = `Every figure above is read from a public feed when you ask, and carries that feed's own date and source. A feed that did not load is left out and no stored figure takes its place. All of it is delayed.`;
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

  const sources = [`### 5. Sources and dates`, `- **Prices:** ${freshnessBanner}`, `- **Other figures:** ${recordsBanner}`];

  if (topic === "advice_refusal") {
    return payload([
      `### I can't give personal advice`,
      `I don’t give personalised investment advice, portfolio allocations, or buy, sell or hold instructions. For decisions about your own money, speak to a regulated financial adviser. What I can give you is the published figures with their sources and dates.`,
      `### 1. Market Snapshot`,
      ...(alertLine ? [alertLine, ""] : []),
      tableMarkdown,
      `### 2. What the data shows`,
      ...spreadBullet,
      ...cardBullets(stockCards),
      ...cftcWtiBullet(),
      ...CONDITIONS,
      `### 4. Not available`,
      NOT_AVAILABLE_COMPANIES,
      NOT_AVAILABLE_ALWAYS,
      ...sources,
      ...footer,
    ]);
  }

  const sections: string[] = [];

  // 1. Market Snapshot
  sections.push(`### 1. Market Snapshot`, ...(alertLine ? [alertLine] : []), tableMarkdown);

  // 2. What the data shows, and 4. what is not available, by topic
  const notAvailable: string[] = [];
  if (topic === "inventories") {
    sections.push(
      `### 2. What the data shows (stocks and world balance)`,
      ...cardBullets(supply),
      ...cardBullets(only(demand, ["steo-patc_world", "steo-patc_oecd", "steo-patc_non_oecd"]))
    );
    if (!supply.length) notAvailable.push(`- **Not loaded:** the EIA stock and balance figures could not be read just now, so I quote none.`);
  } else if (topic === "geopolitics") {
    sections.push(
      `### 2. What the data shows (supply and news coverage)`,
      ...cardBullets(newsCards),
      ...cardBullets(only(supply, ["steo-cops_opec", "steo-copr_opec"])),
      `- The news figure counts how much is being written. It does not measure risk.`
    );
    notAvailable.push(NOT_AVAILABLE_EVENTS);
  } else if (topic === "positioning") {
    sections.push(
      `### 2. What the data shows (spreads, cracks and positioning)`,
      ...cftcWtiBullet(),
      ...spreadBullets(data.curve),
      ...(data.curve?.spreads.length ? [] : cardBullets(only(demand, ["crack-321"])))
    );
  } else if (topic === "gas_lng") {
    sections.push(`### 2. What the data shows (gas)`, ...priceBullet(hh));
    if (!priceBullet(hh).length) notAvailable.push(`- **Not loaded:** the Henry Hub price could not be read just now, so I quote none.`);
    notAvailable.push(`- **LNG:** I hold no LNG price, cargo or feedgas series, so I quote none.`);
  } else {
    sections.push(
      `### 2. What the data shows`,
      ...priceBullet(brent),
      ...priceBullet(wti),
      ...spreadBullet,
      ...cardBullets(stockCards),
      ...cftcWtiBullet(),
      ...cardBullets(only(supply, ["steo-cops_opec"])),
      ...cardBullets(newsCards)
    );
    if (topic === "equities") notAvailable.push(NOT_AVAILABLE_COMPANIES);
    if (topic === "scenarios") {
      notAvailable.push(`- **Scenarios:** I do not estimate what prices would do if an event happened. The conditions above are the published figures to watch.`);
    }
    notAvailable.push(NOT_AVAILABLE_EVENTS);
  }

  // 3. Conditions to watch
  sections.push(...CONDITIONS);

  // 4. Not available
  sections.push(`### 4. Not available`, ...notAvailable, NOT_AVAILABLE_ALWAYS);

  // 5. Sources and dates
  sections.push(...sources);

  // Disclaimer and closing line
  sections.push(...footer);

  return payload(sections);
}
