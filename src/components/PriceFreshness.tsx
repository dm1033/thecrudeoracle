import type { PublishedPrices } from "@/lib/published-prices";

function asOfDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Prominent as-of line for a price board. EIA prints use the observation period, not the fetch time. */
export default function PriceFreshness({ feed }: { feed: PublishedPrices }) {
  return (
    <div className="mt-2 max-w-3xl space-y-1 text-sm leading-relaxed text-steel-300">
      {feed.eia && feed.eiaUpdated ? (
        <p>
          Brent and WTI as of <time dateTime={feed.eiaUpdated}>{asOfDate(feed.eiaUpdated)}</time>. EIA daily spot, trade
          date {asOfDate(feed.eiaUpdated)}, published with a lag of several days. Last updated {asOfDate(feed.eiaUpdated)}{" "}
          · Source: EIA. JKM and the ICE US Dollar Index are not shown. Both need a licence.
        </p>
      ) : (
        <p>A current EIA spot print is not loaded, so no desk price is shown. This is not an exchange feed.</p>
      )}
      <p>Information only, not investment advice.</p>
    </div>
  );
}
