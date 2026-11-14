import Link from "next/link";
import { formatLongDate } from "@/lib/daily-note";

/**
 * Shown at the top of a page whose content was written by hand and is no
 * longer updated. The owner's rule: stale data must be visibly marked.
 */
export default function ArchiveNotice({ what, lastUpdated, why }: { what: string; lastUpdated: string; why: string }) {
  return (
    <aside aria-label="Archive notice" className="rounded-lg border border-risk/50 bg-risk/15 p-4">
      <p className="text-sm font-bold uppercase tracking-widest text-risk">
        Archive: not current. Last updated {formatLongDate(lastUpdated.slice(0, 10))}
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-200">
        {what} below are sample entries written by hand and have not been updated since that date. {why} They show
        how the method works. They do not describe today&apos;s market and are not investment advice.
      </p>
      <p className="mt-2 text-sm text-steel-300">
        For current figures see{" "}
        <Link href="/tools/what-changed" className="font-semibold text-gold-400 hover:text-gold-300">
          What Changed
        </Link>{" "}
        and the{" "}
        <Link href="/tools/public-data-monitor" className="font-semibold text-gold-400 hover:text-gold-300">
          Public Data Monitor
        </Link>
        .
      </p>
    </aside>
  );
}
