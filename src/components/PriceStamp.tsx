"use client";

import { useEffect, useState } from "react";
import { formatPriceDate, priceIsStale } from "@/lib/price-stamp";

/**
 * The date line is in the first render so it is visible without waiting on
 * the effect. The stale flag is applied at view time, matching FreshnessBadge,
 * so a cached page still flags a trade date once it is more than 7 days old.
 */
export default function PriceStamp({
  lastUpdated,
  sourceLabel,
}: {
  lastUpdated: string;
  sourceLabel: string;
}) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    setStale(priceIsStale(lastUpdated));
  }, [lastUpdated]);

  const date = formatPriceDate(lastUpdated);

  return (
    <div className="mt-3 rounded-md border border-ink-600 bg-ink-950/70 px-2.5 py-2 text-xs leading-relaxed text-steel-200">
      <p>
        Last updated <time dateTime={lastUpdated.slice(0, 10)} className="font-semibold text-white">{date}</time>
        {" · "}
        Source: <span className="font-semibold text-white">{sourceLabel}</span>
      </p>
      {sourceLabel === "EIA" ? (
        <p className="mt-1 text-[11px] text-steel-400">
          EIA daily spot, trade date {date}, published with a lag of several days.
        </p>
      ) : null}
      {stale ? (
        <p className="mt-1 font-bold uppercase tracking-wide text-risk" role="status">
          Stale — more than 7 days old
        </p>
      ) : null}
    </div>
  );
}
