import { CHOKEPOINTS, chokepointById } from "@/lib/chokepoints";

export interface DeskBotTraceStep {
  step: string;
  detail: string;
  status: "ok" | "skipped" | "unavailable";
  ms: number;
}

export interface DeskBotCitation {
  id: string;
  badge: string;
  source: string;
  seriesId?: string;
  asOf: string;
  url: string | null;
  dataType: string;
  rawValue?: string;
}

export interface DeskBotArtifact {
  id: string;
  kind: "spot_spread" | "eia_seasonal" | "cftc_cot" | "opec_balance" | "gdelt_pulse" | "table";
  title: string;
  subtitle: string;
  asOf: string;
  sourceLine: string;
  csvColumns: string[];
  csvRows: Record<string, string | number | null>[];
  payload: unknown;
}

export interface DeskCommandResult {
  command: string | null;
  trace: DeskBotTraceStep[];
  citations: DeskBotCitation[];
  artifact: DeskBotArtifact | null;
}

export interface DeskCommandContext {
  prices: { ticker: string; price: number; last_updated: string; source: string; source_url?: string }[];
  cftc: { reportDate: string; long: number; short: number; net: number; netChange: number | null } | null;
  cftcPercentile: number | null;
  news: { t: string; sharePct: number }[];
  steoRows: { id: string; description: string; unit: string; period: string; value: number }[];
}

const EIA_SPOT = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm";
const CFTC = "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm";
const STEO = "https://www.eia.gov/outlooks/steo/";
const GDELT = "https://www.gdeltproject.org/";

function price(ctx: DeskCommandContext, ticker: string) {
  return ctx.prices.find((item) => item.ticker === ticker) ?? null;
}

function tableArtifact(
  id: string,
  kind: DeskBotArtifact["kind"],
  title: string,
  subtitle: string,
  asOf: string,
  sourceLine: string,
  columns: string[],
  rows: Record<string, string | number | null>[],
): DeskBotArtifact {
  return { id, kind, title, subtitle, asOf, sourceLine, csvColumns: columns, csvRows: rows, payload: { columns, rows } };
}

function spread(ctx: DeskCommandContext): DeskCommandResult {
  const brent = price(ctx, "BRN");
  const wti = price(ctx, "WTI");
  const started = Date.now();
  if (!brent || !wti) {
    return {
      command: "/spread brent-wti",
      trace: [{ step: "Read EIA Brent and WTI", detail: "One or both spot prints are not on the board.", status: "unavailable", ms: Date.now() - started }],
      citations: [],
      artifact: null,
    };
  }
  const spreadValue = brent.price - wti.price;
  const asOf = brent.last_updated.slice(0, 10);
  return {
    command: "/spread brent-wti",
    trace: [
      { step: "Read EIA RBRTE and RWTC", detail: `Shared board date ${asOf}.`, status: "ok", ms: 1 },
      { step: "Subtract WTI from Brent", detail: "No other series is filled in.", status: "ok", ms: 1 },
    ],
    citations: [
      { id: "rbrte", badge: "EIA", source: brent.source, seriesId: "RBRTE", asOf, url: brent.source_url ?? EIA_SPOT, dataType: "delayed", rawValue: String(brent.price) },
      { id: "rwtc", badge: "EIA", source: wti.source, seriesId: "RWTC", asOf: wti.last_updated.slice(0, 10), url: wti.source_url ?? EIA_SPOT, dataType: "delayed", rawValue: String(wti.price) },
    ],
    artifact: tableArtifact(
      "spread-brent-wti",
      "spot_spread",
      "Brent minus WTI",
      "Latest published EIA spots on the board. Not a forward curve.",
      asOf,
      "EIA daily spot, RBRTE and RWTC",
      ["series", "value", "as_of"],
      [
        { series: "Brent", value: brent.price, as_of: asOf },
        { series: "WTI", value: wti.price, as_of: wti.last_updated.slice(0, 10) },
        { series: "Brent-WTI", value: Math.round(spreadValue * 100) / 100, as_of: asOf },
      ],
    ),
  };
}

function cot(ctx: DeskCommandContext): DeskCommandResult {
  if (!ctx.cftc) {
    return {
      command: "/cot-extremes",
      trace: [{ step: "Read CFTC NYMEX WTI managed money", detail: "The snapshot file has no usable row.", status: "unavailable", ms: 1 }],
      citations: [],
      artifact: null,
    };
  }
  const row = ctx.cftc;
  return {
    command: "/cot-extremes",
    trace: [
      { step: "Read CFTC managed money", detail: `Report ${row.reportDate}.`, status: "ok", ms: 1 },
      {
        step: "52-week percentile",
        detail: ctx.cftcPercentile == null ? "Percentile was not in the intelligence file." : `Percentile ${ctx.cftcPercentile}.`,
        status: ctx.cftcPercentile == null ? "unavailable" : "ok",
        ms: 1,
      },
    ],
    citations: [
      {
        id: "cftc-wti",
        badge: "CFTC",
        source: "CFTC Commitments of Traders, NYMEX WTI managed money",
        seriesId: "067651",
        asOf: row.reportDate,
        url: CFTC,
        dataType: "delayed",
        rawValue: String(row.net),
      },
    ],
    artifact: tableArtifact(
      "cftc-cot",
      "cftc_cot",
      "WTI managed money",
      "Contracts from the published snapshot. Not a signal.",
      row.reportDate,
      "CFTC Commitments of Traders",
      ["field", "contracts"],
      [
        { field: "Long", contracts: row.long },
        { field: "Short", contracts: row.short },
        { field: "Net", contracts: row.net },
        { field: "Net change", contracts: row.netChange },
        { field: "52-week percentile", contracts: ctx.cftcPercentile },
      ],
    ),
  };
}

function balance(ctx: DeskCommandContext): DeskCommandResult {
  if (!ctx.steoRows.length) {
    return {
      command: "/balance-global",
      trace: [{ step: "Read EIA STEO", detail: "STEO did not load. No balance is estimated.", status: "unavailable", ms: 1 }],
      citations: [],
      artifact: null,
    };
  }
  const asOf = ctx.steoRows.map((row) => row.period).sort().at(-1) ?? "";
  return {
    command: "/balance-global",
    trace: [{ step: "Read EIA STEO rows", detail: `${ctx.steoRows.length} series on the feed.`, status: "ok", ms: 1 }],
    citations: ctx.steoRows.slice(0, 6).map((row) => ({
      id: row.id.toLowerCase(),
      badge: "STEO",
      source: row.description,
      seriesId: row.id,
      asOf: row.period,
      url: STEO,
      dataType: "delayed",
      rawValue: String(row.value),
    })),
    artifact: tableArtifact(
      "steo-balance",
      "opec_balance",
      "EIA STEO balance rows",
      "Latest estimated month on each series. Forecasts are EIA's, not this desk's.",
      asOf,
      "EIA Short-Term Energy Outlook",
      ["series", "period", "value", "unit"],
      ctx.steoRows.map((row) => ({ series: row.id, period: row.period, value: row.value, unit: row.unit })),
    ),
  };
}

function pulse(ctx: DeskCommandContext, id: string): DeskCommandResult {
  const place = chokepointById(id);
  const command = `/chokepoint ${id}`;
  if (!place) {
    return {
      command,
      trace: [{ step: "Match chokepoint", detail: `Unknown id. Known: ${CHOKEPOINTS.map((item) => item.id).join(", ")}.`, status: "unavailable", ms: 1 }],
      citations: [],
      artifact: null,
    };
  }
  return {
    command,
    trace: [
      { step: "Load reference profile", detail: place.name, status: "ok", ms: 1 },
      {
        step: "GDELT coverage pulse",
        detail: ctx.news.length ? `${ctx.news.length} points.` : "No timeline in the intelligence file.",
        status: ctx.news.length ? "ok" : "unavailable",
        ms: 1,
      },
    ],
    citations: [
      {
        id: `gdelt-${place.id}`,
        badge: "GDELT",
        source: "GDELT DOC 2.0 coverage share. Not a risk rating and not an outage feed.",
        asOf: ctx.news.at(-1)?.t.slice(0, 10) ?? "",
        url: GDELT,
        dataType: "delayed",
      },
    ],
    artifact: tableArtifact(
      `chokepoint-${place.id}`,
      "gdelt_pulse",
      place.name,
      place.note,
      ctx.news.at(-1)?.t ?? "",
      "GDELT coverage share, plus a fixed reference box",
      ["t", "share_pct"],
      ctx.news.map((point) => ({ t: point.t, share_pct: point.sharePct })),
    ),
  };
}

function eiaSummary(ctx: DeskCommandContext): DeskCommandResult {
  return {
    command: "/eia-summary",
    trace: [
      { step: "Open the weekly stocks page", detail: "Seasonal bands load only when EIA_API_KEY is set.", status: "ok", ms: 1 },
      { step: "Do not invent a stock figure", detail: "The artifact lists the spot board only.", status: "ok", ms: 1 },
    ],
    citations: ctx.prices.slice(0, 4).map((item) => ({
      id: item.ticker.toLowerCase(),
      badge: "EIA",
      source: item.source,
      asOf: item.last_updated.slice(0, 10),
      url: item.source_url ?? EIA_SPOT,
      dataType: "delayed",
      rawValue: String(item.price),
    })),
    artifact: tableArtifact(
      "eia-summary",
      "eia_seasonal",
      "Board used for the EIA summary",
      "Weekly stock bands are on /eia-weekly when the EIA read succeeds.",
      ctx.prices[0]?.last_updated.slice(0, 10) ?? "",
      "EIA published prices on this site",
      ["ticker", "price", "as_of"],
      ctx.prices.map((item) => ({ ticker: item.ticker, price: item.price, as_of: item.last_updated.slice(0, 10) })),
    ),
  };
}

/** Resolves a slash command. A normal question returns an empty command and no artifact. */
export function resolveDeskCommand(message: string, ctx: DeskCommandContext): DeskCommandResult {
  const text = message.trim().toLowerCase();
  if (!text.startsWith("/")) {
    return { command: null, trace: [], citations: [], artifact: null };
  }
  if (text.startsWith("/spread")) return spread(ctx);
  if (text.startsWith("/cot")) return cot(ctx);
  if (text.startsWith("/balance")) return balance(ctx);
  if (text.startsWith("/eia")) return eiaSummary(ctx);
  if (text.startsWith("/chokepoint")) {
    const id = text.replace("/chokepoint", "").trim().replace(/\s+/g, "-");
    return pulse(ctx, id);
  }
  return {
    command: text.split(/\s+/)[0],
    trace: [{ step: "Match command", detail: "That slash command is not on the desk.", status: "unavailable", ms: 1 }],
    citations: [],
    artifact: null,
  };
}
