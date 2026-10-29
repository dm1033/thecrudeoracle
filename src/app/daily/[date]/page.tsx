import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DailyNoteView, { DailyNoteUnavailable } from "@/components/DailyNoteView";
import { loadDailyNote } from "@/lib/daily-feed";
import { formatLongDate, isNoteDate } from "@/lib/daily-note";
import { upcomingReleases } from "@/lib/release-calendar";
import { pageMeta } from "@/lib/seo";

export const revalidate = 7200;
export const dynamicParams = true;

export function generateStaticParams(): { date: string }[] {
  return [];
}

export function generateMetadata({ params }: { params: { date: string } }): Metadata {
  const path = isNoteDate(params.date) ? `/daily/${params.date}` : "/daily";
  const title = isNoteDate(params.date) ? `Daily morning note, ${formatLongDate(params.date)}` : "Daily morning note";
  return pageMeta(
    title,
    "EIA daily spot for Brent (RBRTE), WTI (RWTC) and Henry Hub (RNGWHHD) on this trade date, with day-on-day, week-on-week and month-on-month changes. Information only, not investment advice.",
    path,
    { dynamicImage: true }
  );
}

export default async function DailyArchivePage({ params }: { params: { date: string } }) {
  if (!isNoteDate(params.date)) notFound();
  const result = await loadDailyNote(params.date);
  if (result.status === "unavailable") return <DailyNoteUnavailable date={params.date} />;
  if (result.status !== "ready") notFound();
  return (
    <DailyNoteView
      note={result.note}
      fetchedAt={result.fetchedAt}
      fallback={result.fallback}
      archiveDates={result.archiveDates}
      releases={upcomingReleases(new Date(`${result.note.date}T12:00:00Z`))}
      canonicalPath={`/daily/${result.note.date}`}
      releasesLabel="Releases from this trade date"
    />
  );
}
