import type { PublishedPrices } from "@/lib/published-prices";

function asOfDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Prominent as-of line for a price board. EIA prints use the observation period, not the fetch time. */
export default function PriceFreshness({ feed }: { feed: PublishedPrices }) {
  if (feed.eia && feed.eiaUpdated) {
    return (
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-300">
        Brent and WTI as of <time dateTime={feed.eiaUpdated}>{asOfDate(feed.eiaUpdated)}</time> (delayed EIA spot).
        Other prices as of <time dateTime={feed.manualUpdated}>{asOfDate(feed.manualUpdated)}</time> (manual desk marks).
      </p>
    );
  }

  return (
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-300">
      As of <time dateTime={feed.manualUpdated}>{asOfDate(feed.manualUpdated)}</time>. Manual desk marks. This is not a
      live exchange feed.
    </p>
  );
}
