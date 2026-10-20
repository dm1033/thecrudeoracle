import type { MarketPrice } from "@/lib/data";
import type { PublishedPrices } from "@/lib/published-prices";
import { formatPriceDate } from "@/lib/price-stamp";

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function signedPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function liveEia(price: MarketPrice | undefined): price is MarketPrice {
  return Boolean(price && price.data_type === "delayed" && /EIA/i.test(price.source));
}

/**
 * Neutral sentences from the prices actually on the board.
 * No level from the July desk file, and no valuation language.
 */
export function spotDeskNote(feed: PublishedPrices): string[] {
  const brent = feed.prices.find((price) => price.ticker === "BRN");
  const wti = feed.prices.find((price) => price.ticker === "WTI");
  const hub = feed.prices.find((price) => price.ticker === "HH");
  const lines: string[] = [];

  if (liveEia(brent) && liveEia(wti)) {
    const spread = Math.round((brent.price - wti.price) * 100) / 100;
    const side = spread >= 0 ? "Brent above WTI" : "WTI above Brent";
    lines.push(
      `Brent last printed at ${money(brent.price)} per barrel on ${formatPriceDate(brent.last_updated)} and WTI at ${money(wti.price)} per barrel on ${formatPriceDate(wti.last_updated)}. These are EIA daily spot prices, series RBRTE and RWTC.`
    );
    lines.push(
      `On those prints the Brent–WTI difference is ${money(Math.abs(spread))} per barrel (${side}). Brent is ${signedPct(brent.daily_change)} from the previous EIA daily print and WTI is ${signedPct(wti.daily_change)}.`
    );
  } else {
    lines.push("A current EIA spot print is not loaded for Brent and WTI, so no crude price is stated in this note.");
  }

  if (liveEia(hub)) {
    lines.push(
      `Henry Hub natural gas last printed at ${money(hub.price)} per MMBtu on ${formatPriceDate(hub.last_updated)} (EIA series RNGWHHD).`
    );
  } else {
    lines.push("Henry Hub is not loaded from EIA on this view, so no gas price is stated.");
  }

  lines.push(
    "EIA publishes these daily spots with a lag of several days after the trade date. Dubai, UK NBP and Dutch TTF are not shown."
  );
  lines.push("Information only, not investment advice.");
  return lines;
}
