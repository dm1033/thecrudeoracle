import portfolio from "../../data/virtual-portfolio.json";

const SAMPLE_TICKER = /^SMPL-/i;
const SAMPLE_MARK = /\(\s*sample\s*\)|\(\s*placeholder\s*\)/i;

/** True when a ticker or label is a desk sample (SMPL-*) or marked (sample) / (placeholder). */
export function isSampleInstrument(parts: Array<string | undefined | null>): boolean {
  return parts.some((part) => !!part && (SAMPLE_TICKER.test(part) || SAMPLE_MARK.test(part)));
}

type BookLine = { ticker?: string; asset?: string };

const bookLines: BookLine[] = [...portfolio.positions, ...portfolio.closed_trades];

/**
 * The fund is shown only when every open line and closed trade is a real mark.
 * A mixed book is withheld: account totals include sample profit, and recomputing
 * them would invent a result.
 */
export const PAPER_FUND_PUBLISHED =
  bookLines.length > 0 && bookLines.every((line) => !isSampleInstrument([line.ticker, line.asset]));
