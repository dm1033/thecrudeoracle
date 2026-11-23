/**
 * Hours after the newest EIA spot trade date before a current print is called stale.
 * RBRTE and RWTC are posted weekly with the petroleum report. A Tuesday trade
 * date is about eight days old at the next Wednesday release, and about ten
 * days old when that release moves to Thursday. Ten days covers that window.
 * A missed week still flags. Measured from midnight UTC on the trade date.
 */
export const EIA_SPOT_STALE_AFTER_HOURS = 24 * 10;

/** Whole days matching `EIA_SPOT_STALE_AFTER_HOURS`. Age is the EIA trade date, in UTC. */
export const PRICE_STALE_AFTER_DAYS = EIA_SPOT_STALE_AFTER_HOURS / 24;

export function priceAgeDays(lastUpdated: string, now = Date.now()): number | null {
  const day = lastUpdated.slice(0, 10);
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((now - parsed) / 86_400_000);
}

export function priceIsStale(lastUpdated: string, now = Date.now()): boolean {
  const day = lastUpdated.slice(0, 10);
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed)) return false;
  return (now - parsed) / 3_600_000 > EIA_SPOT_STALE_AFTER_HOURS;
}

/** Calendar date in en-GB, pinned to UTC so the trade date does not shift overnight. */
export function formatPriceDate(lastUpdated: string): string {
  const day = lastUpdated.slice(0, 10);
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed)) return day;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function priceSourceLabel(price: { source: string; data_type: string }): string {
  if (price.data_type === "delayed" && /EIA/i.test(price.source)) return "EIA";
  if (price.data_type === "API placeholder") return "placeholder";
  return "desk mark";
}

/** A card must not show a number once the print is older than this. */
export const PRICE_FIGURE_MAX_AGE_DAYS = 30;

export const LICENSED_DATA_REQUIRED = "not available – licensed data required";

export function isPlaceholderPrice(price: { source: string; data_type: string }): boolean {
  return price.data_type === "API placeholder" || /placeholder/i.test(price.source);
}

export function priceFigureTooOld(lastUpdated: string, now = Date.now()): boolean {
  const age = priceAgeDays(lastUpdated, now);
  return age === null || age > PRICE_FIGURE_MAX_AGE_DAYS;
}

/** True when a card may print the number. Placeholders and prints older than 30 days may not. */
export function priceFigureShown(
  price: { source: string; data_type: string; last_updated: string },
  now = Date.now()
): boolean {
  return !isPlaceholderPrice(price) && !priceFigureTooOld(price.last_updated, now);
}
