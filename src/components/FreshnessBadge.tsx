"use client";

import { useEffect, useState } from "react";

/**
 * Automatic stale-data marking (charter quality gate: "stale data visibly
 * marked"). Computes age in the browser at view time — not at build time —
 * so a value past its freshness window is flagged even if the site hasn't
 * been redeployed. Stale values stay visible (never hidden, never replaced),
 * they are just honestly labelled.
 */
export default function FreshnessBadge({
  lastUpdated,
  staleAfterHours = 96,
}: {
  lastUpdated: string;
  staleAfterHours?: number;
}) {
  const [ageDays, setAgeDays] = useState<number | null>(null);

  useEffect(() => {
    const parsed = Date.parse(lastUpdated);
    if (Number.isNaN(parsed)) return;
    const ageHours = (Date.now() - parsed) / 3_600_000;
    if (ageHours > staleAfterHours) {
      setAgeDays(Math.floor(ageHours / 24));
    }
  }, [lastUpdated, staleAfterHours]);

  if (ageDays === null) return null;

  return (
    <span
      className="inline-block rounded bg-risk/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-risk"
      title={`This value has not been re-verified for ${ageDays} day${ageDays === 1 ? "" : "s"} — treat with care and verify with the primary source.`}
    >
      Stale — last verified {ageDays}d ago
    </span>
  );
}
