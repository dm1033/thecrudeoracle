import { getEiaWeekly } from "@/lib/eia-weekly";
import { formatLongDate } from "@/lib/daily-note";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "The Crude Oracle — EIA weekly petroleum stocks";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 7200;

function mb(value: number): string {
  return value.toFixed(3);
}

export default async function Image() {
  const feed = await getEiaWeekly().catch(() => null);
  if (!feed) {
    return renderOgCard({
      title: "EIA weekly stocks",
      dateLine: "Latest EIA print: not loaded",
      rows: [],
      footnote: "Weekly Petroleum Status Report · Not financial advice",
    });
  }
  return renderOgCard({
    title: "EIA weekly stocks",
    dateLine: `Latest EIA print: ${formatLongDate(feed.report.weekEnding)}`,
    rows: feed.report.lines.map((line) => ({
      label: line.name,
      value: mb(line.millionBarrels),
      detail: line.changeMillionBarrels == null ? "million bbl" : `WoW ${line.changeMillionBarrels > 0 ? "+" : ""}${line.changeMillionBarrels.toFixed(3)} mb`,
    })),
    footnote: "EIA WPSR · million barrels · Not financial advice",
  });
}
