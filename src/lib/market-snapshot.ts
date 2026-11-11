import snapshotJson from "../../data/market_snapshot.json";

/**
 * data/market_snapshot.json is written by scripts/fetch_oil_data.py on a
 * GitHub Actions schedule, not by hand. This module reads it defensively:
 * anything that is not a well-formed row is dropped, never repaired or
 * guessed, so a bad write shows as "no data" rather than a wrong figure.
 */

export interface CftcRow {
  reportDate: string;
  contract: string;
  openInterest: number;
  long: number;
  short: number;
  spreading: number;
  net: number;
  /** Net minus the previous report's net; null when there is no earlier report. */
  netChange: number | null;
  previousReportDate: string | null;
}

export interface EiaStockRow {
  weekEnding: string;
  thousandBarrels: number;
  millionBarrels: number;
  /** This week minus the previous published week, in million barrels. */
  changeMillionBarrels: number | null;
  previousWeekEnding: string | null;
}

export interface SnapshotSection<T> {
  /** When the automated job last fetched this section successfully (UTC ISO), or null. */
  fetchedAt: string | null;
  /** Newest first. */
  rows: T[];
}

export interface MarketSnapshot {
  cftc: SnapshotSection<CftcRow>;
  eia: SnapshotSection<EiaStockRow> & { series: string };
}

export const EIA_SNAPSHOT_SERIES = "WCESTUS1";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isCount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function timestamp(value: unknown): string | null {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
}

function rowsOf(section: unknown): unknown[] {
  return isRecord(section) && Array.isArray(section.rows) ? section.rows : [];
}

/** Sort newest first and keep one row per date. */
function newestFirst<T>(rows: T[], dateOf: (row: T) => string): T[] {
  const seen = new Set<string>();
  return [...rows]
    .sort((a, b) => dateOf(b).localeCompare(dateOf(a)))
    .filter((row) => {
      const key = dateOf(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function parseMarketSnapshot(raw: unknown): MarketSnapshot {
  const root = isRecord(raw) ? raw : {};
  const cftcSection = root.cftc_wti_managed_money;
  const eiaSection = root.eia_us_crude_stocks;

  const cftcBase = newestFirst(
    rowsOf(cftcSection).flatMap((row) => {
      if (!isRecord(row)) return [];
      const { report_date, open_interest, managed_money_long, managed_money_short, managed_money_spreading } = row;
      if (
        !isDate(report_date) ||
        !isCount(open_interest) ||
        !isCount(managed_money_long) ||
        !isCount(managed_money_short) ||
        !isCount(managed_money_spreading)
      ) {
        return [];
      }
      return [
        {
          reportDate: report_date,
          contract: typeof row.contract === "string" ? row.contract : "",
          openInterest: open_interest,
          long: managed_money_long,
          short: managed_money_short,
          spreading: managed_money_spreading,
          // Recomputed here rather than trusted from the file.
          net: managed_money_long - managed_money_short,
        },
      ];
    }),
    (row) => row.reportDate
  );
  const cftcRows: CftcRow[] = cftcBase.map((row, index) => {
    const previous = cftcBase[index + 1];
    return {
      ...row,
      netChange: previous ? row.net - previous.net : null,
      previousReportDate: previous ? previous.reportDate : null,
    };
  });

  const eiaBase = newestFirst(
    rowsOf(eiaSection).flatMap((row) => {
      if (!isRecord(row)) return [];
      const { period, series, value_thousand_bbl } = row;
      // Only the commercial (ex-SPR) series is shown; a different series is never relabelled.
      if (!isDate(period) || series !== EIA_SNAPSHOT_SERIES || !isCount(value_thousand_bbl) || value_thousand_bbl === 0) {
        return [];
      }
      return [{ weekEnding: period, thousandBarrels: value_thousand_bbl }];
    }),
    (row) => row.weekEnding
  );
  const eiaRows: EiaStockRow[] = eiaBase.map((row, index) => {
    const previous = eiaBase[index + 1];
    return {
      ...row,
      millionBarrels: row.thousandBarrels / 1000,
      changeMillionBarrels: previous ? (row.thousandBarrels - previous.thousandBarrels) / 1000 : null,
      previousWeekEnding: previous ? previous.weekEnding : null,
    };
  });

  return {
    cftc: {
      fetchedAt: isRecord(cftcSection) ? timestamp(cftcSection.updated_at_utc) : null,
      rows: cftcRows,
    },
    eia: {
      fetchedAt: isRecord(eiaSection) ? timestamp(eiaSection.updated_at_utc) : null,
      rows: eiaRows,
      series: EIA_SNAPSHOT_SERIES,
    },
  };
}

export function getMarketSnapshot(): MarketSnapshot {
  return parseMarketSnapshot(snapshotJson);
}
