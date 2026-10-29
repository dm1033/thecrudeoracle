import { getPublishedPrices } from "@/lib/published-prices";
import { formatLongDate } from "@/lib/daily-note";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "The Crude Oracle — latest EIA Brent and WTI";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 7200;

export default async function Image() {
  const feed = await getPublishedPrices().catch(() => null);
  const brent = feed?.prices.find((price) => price.ticker === "BRN");
  const wti = feed?.prices.find((price) => price.ticker === "WTI");
  const loaded = Boolean(feed?.eia && feed.eiaUpdated && brent && wti);
  return renderOgCard({
    title: "Brent and WTI",
    dateLine: loaded && feed?.eiaUpdated ? `Latest EIA print: ${formatLongDate(feed.eiaUpdated)}` : "Latest EIA print: not loaded",
    rows: loaded && brent && wti
      ? [
          { label: "Brent", value: `$${brent.price.toFixed(2)}`, detail: "RBRTE · USD/bbl" },
          { label: "WTI", value: `$${wti.price.toFixed(2)}`, detail: "RWTC · USD/bbl" },
        ]
      : [],
    footnote: "EIA Open Data · delayed · Not financial advice",
  });
}
