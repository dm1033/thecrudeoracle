import type { PublishedPrices } from "@/lib/published-prices";

function asOfDate(iso: string): string {
  return iso.slice(0, 10);
}

/** Prominent as-of line for a price board. EIA prints use the observation period, not the fetch time. */
export default function PriceFreshness({ feed }: { feed: PublishedPrices }) {
  const manualLeft = feed.prices.some((price) => price.data_type !== "delayed");
  return (
    <div className="mt-2 max-w-3xl space-y-1 text-sm leading-relaxed text-steel-300">
      {feed.eia && feed.eiaUpdated ? (
        <p>
          Brent and WTI as of <time dateTime={feed.eiaUpdated}>{asOfDate(feed.eiaUpdated)}</time>. EIA daily spot, trade
          date {asOfDate(feed.eiaUpdated)}, published with a lag of several days. Last updated {asOfDate(feed.eiaUpdated)}{" "}
          · Source: EIA.
          {manualLeft ? (
            <>
              {" "}
              Other marks as of <time dateTime={feed.manualUpdated}>{asOfDate(feed.manualUpdated)}</time> are desk
              placeholders, not exchange prints.
            </>
          ) : null}
        </p>
      ) : (
        <p>
          As of <time dateTime={feed.manualUpdated}>{asOfDate(feed.manualUpdated)}</time>. Desk marks. This is not a live
          exchange feed.
        </p>
      )}
      <p>Information only, not investment advice.</p>
    </div>
  );
}
