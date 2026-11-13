import { dateAt, num, type MonitorFeed, type MonitorModule } from "@/lib/oracle-intelligence";

/**
 * "What changed": the latest move in each public series the monitor holds,
 * with how that move compares with the series' own earlier moves.
 *
 * Every figure comes straight from the monitor feed. `vsUsual` is the latest
 * change divided by the standard deviation of the earlier changes in the same
 * series, so 1 is an ordinary-sized move and 2 is about twice the usual. It
 * describes size only: it says nothing about direction being good or bad and
 * is not a forecast.
 */

export type ChangeSize = "unusual" | "larger" | "usual" | "unknown";

export interface ChangeItem {
  id: string;
  label: string;
  cadence: "daily" | "weekly";
  /** Latest level, already formatted with its unit. */
  level: string;
  /** Latest change, signed, already formatted with its unit. */
  change: string;
  direction: "up" | "down" | "flat";
  asOf: string;
  previousDate: string;
  vsUsual: number | null;
  compared: number | null;
  size: ChangeSize;
  sourceName: string;
  sourceUrl: string | null;
  /** Page on this site with the longer history. */
  href: string;
}

export function sizeOf(vsUsual: number | null): ChangeSize {
  if (vsUsual == null) return "unknown";
  const magnitude = Math.abs(vsUsual);
  if (magnitude >= 2) return "unusual";
  if (magnitude >= 1) return "larger";
  return "usual";
}

export const SIZE_LABEL: Record<ChangeSize, string> = {
  unusual: "Unusually large",
  larger: "Larger than usual",
  usual: "Within its usual range",
  unknown: "Not enough history to compare",
};

function signed(value: number, digits: number): string {
  const text = Math.abs(value).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

interface Spec {
  id: string;
  label: string;
  cadence: "daily" | "weekly";
  module: MonitorModule;
  levelPath: string;
  asOfPath: string | null;
  changePath: string;
  previousPath: string;
  vsUsualPath: string;
  comparedPath: string;
  digits: number;
  level: (value: number) => string;
  unit: string;
  href: string;
}

function build(spec: Spec): ChangeItem | null {
  if (spec.module.status !== "ok") return null;
  const values = spec.module.values;
  const level = num(values, spec.levelPath);
  const change = num(values, spec.changePath);
  const previousDate = dateAt(values, spec.previousPath);
  const asOf = spec.asOfPath ? dateAt(values, spec.asOfPath) : spec.module.asOf;
  if (level == null || change == null || !previousDate || !asOf) return null;
  const vsUsual = num(values, spec.vsUsualPath);
  return {
    id: spec.id,
    label: spec.label,
    cadence: spec.cadence,
    level: spec.level(level),
    change: `${signed(change, spec.digits)} ${spec.unit}`,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
    asOf,
    previousDate,
    vsUsual,
    compared: vsUsual == null ? null : num(values, spec.comparedPath),
    size: sizeOf(vsUsual),
    sourceName: spec.module.sourceName,
    sourceUrl: spec.module.sourceUrl,
    href: spec.href,
  };
}

export function whatChanged(feed: MonitorFeed): ChangeItem[] {
  const price = (id: string, label: string, key: string, levelPath: string, datePath: string, unit: string): Spec => ({
    id,
    label,
    cadence: "daily",
    module: feed.prices,
    levelPath,
    asOfPath: datePath,
    changePath: `changes.${key}.change`,
    previousPath: `changes.${key}.previous_date`,
    vsUsualPath: `changes.${key}.vs_usual`,
    comparedPath: `changes.${key}.changes_compared`,
    digits: 2,
    level: (value) => `$${value.toFixed(2)}/${unit}`,
    unit: `$/${unit}`,
    href: "/crude-oil-prices",
  });
  const stock = (id: string, label: string, key: string): Spec => ({
    id,
    label,
    cadence: "weekly",
    module: feed.inventories,
    levelPath: `${key}.million_barrels`,
    asOfPath: `${key}.week_ending`,
    changePath: `${key}.change_million_barrels`,
    previousPath: `${key}.previous_week_ending`,
    vsUsualPath: `${key}.change_vs_usual`,
    comparedPath: `${key}.changes_compared`,
    digits: 1,
    level: (value) => `${value.toFixed(1)} mb`,
    unit: "mb",
    href: "/eia-weekly",
  });
  const macro = (id: string, label: string, key: string, levelPath: string, datePath: string, level: (v: number) => string, unit: string): Spec => ({
    id,
    label,
    cadence: "daily",
    module: feed.macro,
    levelPath,
    asOfPath: datePath,
    changePath: `${key}_change.change`,
    previousPath: `${key}_change.previous_date`,
    vsUsualPath: `${key}_change.vs_usual`,
    comparedPath: `${key}_change.changes_compared`,
    digits: 2,
    level,
    unit,
    href: "/tools/public-data-monitor",
  });

  const specs: Spec[] = [
    price("brent", "Brent spot", "brent", "brent_usd_bbl", "brent_date", "bbl"),
    price("wti", "WTI spot", "wti", "wti_usd_bbl", "wti_date", "bbl"),
    { ...price("henry-hub", "Henry Hub gas", "henry_hub", "henry_hub_usd_mmbtu", "henry_hub_date", "MMBtu"), href: "/gas-lng" },
    stock("us-crude", "US commercial crude stocks", "us_commercial_crude"),
    stock("cushing", "Cushing crude stocks", "cushing"),
    {
      id: "wti-positioning",
      label: "WTI managed-money net position",
      cadence: "weekly",
      module: feed.positioning,
      levelPath: "managed_money_net",
      asOfPath: null,
      changePath: "net_change",
      previousPath: "previous_report_date",
      vsUsualPath: "net_change_vs_usual",
      comparedPath: "net_changes_compared",
      digits: 0,
      level: (value) => `${signed(value, 0)} contracts`,
      unit: "contracts",
      href: "/tools/positioning",
    },
    macro("dollar", "Broad dollar index", "broad_dollar", "broad_dollar_index", "broad_dollar_date", (v) => v.toFixed(2), "index points"),
    macro("real-yield", "10-year real yield", "real_yield_10y", "real_yield_10y_pct", "real_yield_date", (v) => `${v.toFixed(2)}%`, "percentage points"),
  ];

  const items = specs.flatMap((spec) => {
    const item = build(spec);
    return item ? [item] : [];
  });
  // Biggest move relative to its own history first; series with no comparison last.
  return items.sort((a, b) => {
    const left = a.vsUsual == null ? -1 : Math.abs(a.vsUsual);
    const right = b.vsUsual == null ? -1 : Math.abs(b.vsUsual);
    return right - left || a.label.localeCompare(b.label);
  });
}

/** The newest data date among the items, for the sitemap. */
export function whatChangedLastData(items: ChangeItem[]): string | null {
  return items.map((item) => new Date(item.asOf).toISOString()).sort().at(-1) ?? null;
}
