import type { PublishedPrices } from "@/lib/published-prices";
import { EIA_SPOT_CADENCE } from "@/lib/daily-note";
import { nextEiaSpotUpdate } from "@/lib/release-calendar";

function asOfDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Prominent as-of line for a price board. EIA prints use the observation period, not the fetch time. */
export default function PriceFreshness({ feed }: { feed: PublishedPrices }) {
  const nextSpot = feed.eia && feed.eiaUpdated ? nextEiaSpotUpdate(new Date()) : null;
  return (
    <div className="mt-2 max-w-3xl space-y-1 text-sm leading-relaxed text-steel-300">
      {feed.eia && feed.eiaUpdated && nextSpot ? (
        <p>
          Brent and WTI as of <time dateTime={feed.eiaUpdated}>{asOfDate(feed.eiaUpdated)}</time>. EIA daily spot, trade
          date {asOfDate(feed.eiaUpdated)}. {EIA_SPOT_CADENCE} Next EIA update: {nextSpot.label}. Source: EIA. JKM and
          the ICE US Dollar Index are not shown. Both need a licence.
        </p>
      ) : (
        <p>A current EIA spot print is not loaded, so no desk price is shown. This is not an exchange feed.</p>
      )}
      <p>Information only, not investment advice.</p>
    </div>
  );
}
