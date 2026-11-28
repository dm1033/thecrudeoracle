import { briefings, type Briefing } from "@/lib/data";
import { getDailyFeed, type SpotHistory } from "@/lib/daily-feed";
import { buildDailyNote, formatLongDate, noteDates, type PricePoint } from "@/lib/daily-note";
import { FEED_TYPE, FEED_URL } from "@/lib/seo";
import { SITE } from "@/lib/site";

/** The about-page editor line, unchanged. */
export const EDITOR_LINE = "David John Miller CEng";

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate: Date;
  description: string;
  category: "Daily note" | "Daily briefing";
}

interface NoteHistory {
  brent: readonly PricePoint[];
  wti: readonly PricePoint[];
  henryHub: readonly PricePoint[] | null;
}

function xmlText(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** One item per Brent trade date that can be built from the prints. No invented rows. */
export function rssItemsForNotes(history: NoteHistory | null): RssItem[] {
  if (!history || history.brent.length === 0 || history.wti.length === 0) return [];
  const items: RssItem[] = [];
  for (const date of noteDates(history.brent)) {
    const note = buildDailyNote({
      asOf: date,
      brent: history.brent,
      wti: history.wti,
      henryHub: history.henryHub,
      exact: true,
    });
    if (!note) continue;
    const link = `${SITE.url}/daily/${note.date}`;
    items.push({
      title: `Daily morning note, ${formatLongDate(note.date)}`,
      link,
      guid: link,
      pubDate: new Date(`${note.date}T00:00:00Z`),
      description: note.summary.join(" "),
      category: "Daily note",
    });
  }
  return items;
}

/** Archived editions on /daily-briefing. The fragment matches the article id on that page. */
export function rssItemsForBriefings(rows: readonly Briefing[]): RssItem[] {
  const items: RssItem[] = [];
  for (const briefing of rows) {
    if (briefing.status !== "published") continue;
    const parsed = new Date(briefing.last_updated);
    if (Number.isNaN(parsed.getTime())) continue;
    const link = `${SITE.url}/daily-briefing#briefing-${briefing.date}`;
    items.push({
      title: briefing.headline,
      link,
      guid: link,
      pubDate: parsed,
      description: briefing.oil_summary,
      category: "Daily briefing",
    });
  }
  return items;
}

export function renderRss(items: readonly RssItem[]): string {
  const ordered = [...items].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const editor = `${SITE.contactEmail} (${EDITOR_LINE})`;
  const lastBuild = ordered[0] ? `    <lastBuildDate>${xmlText(ordered[0].pubDate.toUTCString())}</lastBuildDate>\n` : "";
  const body = ordered
    .map(
      (item) => `    <item>
      <title>${xmlText(item.title)}</title>
      <link>${xmlText(item.link)}</link>
      <guid isPermaLink="true">${xmlText(item.guid)}</guid>
      <pubDate>${xmlText(item.pubDate.toUTCString())}</pubDate>
      <category>${xmlText(item.category)}</category>
      <description>${xmlText(item.description)}</description>
    </item>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlText(`${SITE.name} — weekday morning oil brief`)}</title>
    <link>${xmlText(SITE.url)}</link>
    <description>${xmlText(
      "Weekday morning notes and archived daily briefings. Figures are delayed public data. Information only, not financial advice."
    )}</description>
    <language>en-GB</language>
${lastBuild}    <managingEditor>${xmlText(editor)}</managingEditor>
    <webMaster>${xmlText(editor)}</webMaster>
    <atom:link href="${xmlText(FEED_URL)}" rel="self" type="${xmlText(FEED_TYPE)}"/>
${body}
  </channel>
</rss>
`;
}

/**
 * Daily notes when the EIA read succeeds, plus the archived briefings either way.
 * A failed or missing read leaves the notes out. This does not throw.
 */
export async function buildRssDocument(): Promise<string> {
  let history: SpotHistory | null = null;
  try {
    const feed = await getDailyFeed();
    history = feed?.history ?? null;
  } catch {
    history = null;
  }
  return renderRss([...rssItemsForNotes(history), ...rssItemsForBriefings(briefings)]);
}
