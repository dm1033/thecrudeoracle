import type { Metadata } from "next";
import DailyNoteView, { DailyNoteUnavailable } from "@/components/DailyNoteView";
import { loadDailyNote } from "@/lib/daily-feed";
import { upcomingReleases } from "@/lib/release-calendar";
import { pageMeta } from "@/lib/seo";

/** Two hours, same window as the EIA spot cache. The morning cron revalidates on top of this. */
export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Daily morning note",
  "EIA daily spot for Brent (RBRTE), WTI (RWTC) and Henry Hub (RNGWHHD), with day-on-day, week-on-week and month-on-month changes. EIA lags the trade date by one to two business days. Information only, not investment advice.",
  "/daily",
  { dynamicImage: true }
);

export default async function DailyPage() {
  const result = await loadDailyNote("latest");
  if (result.status !== "ready") return <DailyNoteUnavailable />;
  return (
    <DailyNoteView
      note={result.note}
      fetchedAt={result.fetchedAt}
      fallback={result.fallback}
      archiveDates={result.archiveDates}
      releases={upcomingReleases(new Date())}
      canonicalPath="/daily"
      releasesLabel="Next releases"
    />
  );
}
