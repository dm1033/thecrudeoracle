import type { PublishedPrices } from "@/lib/published-prices";
import { spotDeskNote } from "@/lib/desk-note";

/** Factual note from the current EIA prints. The July desk file is not rendered. */
export default function BottomLineCard({ feed }: { feed: PublishedPrices }) {
  const lines = spotDeskNote(feed);
  return (
    <div className="card border-gold-600/40">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gold-500">From the latest prints</h3>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-steel-300">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
