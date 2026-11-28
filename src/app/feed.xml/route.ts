import { buildRssDocument } from "@/lib/rss";

/** Same window as the daily note. A request serves the cached document. */
export const revalidate = 7200;

export async function GET() {
  const xml = await buildRssDocument();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=7200, stale-while-revalidate=86400",
    },
  });
}
