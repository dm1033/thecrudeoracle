/** Visible price badge. Age is measured from the EIA trade date, in UTC days. */
export const PRICE_STALE_AFTER_DAYS = 7;

export function priceAgeDays(lastUpdated: string, now = Date.now()): number | null {
  const day = lastUpdated.slice(0, 10);
  const parsed = Date.parse(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed)) return null;
  return Math.floor((now - parsed) / 86_400_000);
}

export function priceIsStale(lastUpdated: string, now = Date.now()): boolean {
  const age = priceAgeDays(lastUpdated, now);
  return age !== null && age > PRICE_STALE_AFTER_DAYS;
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
