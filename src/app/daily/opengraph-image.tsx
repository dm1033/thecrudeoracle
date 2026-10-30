import { loadDailyNote } from "@/lib/daily-feed";
import { formatLongDate } from "@/lib/daily-note";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgCard, type OgRow } from "@/lib/og-card";

export const runtime = "nodejs";
export const alt = "The Crude Oracle daily morning note — latest EIA prices";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const revalidate = 7200;

export default async function Image() {
  const result = await loadDailyNote("latest").catch(() => null);
  if (!result || result.status !== "ready") {
    return renderOgCard({
      title: "Daily morning note",
      dateLine: "Latest EIA print: not loaded",
      rows: [],
      footnote: "EIA Open Data · delayed · Not financial advice",
    });
  }
  const { note } = result;
  const rows: OgRow[] = [
    { label: "Brent", value: `$${note.brent.window.latest.value.toFixed(2)}`, detail: "RBRTE · USD/bbl" },
    { label: "WTI", value: `$${note.wti.window.latest.value.toFixed(2)}`, detail: "RWTC · USD/bbl" },
  ];
  if (note.henryHub) {
    rows.push({
      label: "Henry Hub",
      value: `$${note.henryHub.window.latest.value.toFixed(2)}`,
      detail: "RNGWHHD · USD/MMBtu",
    });
  }
  return renderOgCard({
    title: "Daily morning note",
    dateLine: `Latest EIA print: ${formatLongDate(note.date)}`,
    rows,
    footnote: "EIA Open Data · 1–2 business day lag · Not financial advice",
  });
}
