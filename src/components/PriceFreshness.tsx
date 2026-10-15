import { formatUpdated } from "@/lib/data";
import type { PublishedPrices } from "@/lib/published-prices";

/** Prominent last-updated line for a price board. */
export default function PriceFreshness({ feed }: { feed: PublishedPrices }) {
  if (feed.eia && feed.eiaUpdated) {
    return (
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-300">
        Brent and WTI last updated <time dateTime={feed.eiaUpdated}>{formatUpdated(feed.eiaUpdated)}</time> (delayed
        EIA spot). Other prices last updated <time dateTime={feed.manualUpdated}>{formatUpdated(feed.manualUpdated)}</time>{" "}
        (manual desk marks).
      </p>
    );
  }

  return (
    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-300">
      Last updated <time dateTime={feed.manualUpdated}>{formatUpdated(feed.manualUpdated)}</time>. Manual desk marks.
      This is not a live exchange feed.
    </p>
  );
}
