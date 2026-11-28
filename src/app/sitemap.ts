import type { MetadataRoute } from "next";
import { ROUTE_LASTMOD } from "@/lib/content-dates";
import { listDailyNoteDates } from "@/lib/daily-feed";
import { isNoteDate } from "@/lib/daily-note";
import { SITE } from "@/lib/site";

/** Same window as the daily note. Dated note URLs refresh with that read. */
export const revalidate = 7200;

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/daily", priority: 0.9, changeFrequency: "daily" },
  { path: "/eia-weekly", priority: 0.9, changeFrequency: "weekly" },
  { path: "/calendar", priority: 0.6, changeFrequency: "weekly" },
  { path: "/dashboard", priority: 0.9, changeFrequency: "daily" },
  { path: "/desk-bot", priority: 0.9, changeFrequency: "daily" },
  { path: "/daily-briefing", priority: 0.9, changeFrequency: "daily" },
  { path: "/watchlist", priority: 0.8, changeFrequency: "weekly" },
  { path: "/company-intelligence", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/balance-engine", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/flow-map", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/curve-monitor", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/news-to-barrels", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/positioning", priority: 0.8, changeFrequency: "weekly" },
  { path: "/tools/hypothesis-builder", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/public-data-monitor", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/what-changed", priority: 0.8, changeFrequency: "daily" },
  { path: "/tools/supply-news", priority: 0.7, changeFrequency: "daily" },
  { path: "/tools/event-study", priority: 0.7, changeFrequency: "weekly" },
  { path: "/portfolio", priority: 0.9, changeFrequency: "daily" },
  { path: "/portfolio/dashboard", priority: 0.8, changeFrequency: "daily" },
  { path: "/paper-book", priority: 0.9, changeFrequency: "daily" },
  { path: "/crude-oil-prices", priority: 0.9, changeFrequency: "daily" },
  { path: "/gas-lng", priority: 0.8, changeFrequency: "daily" },
  { path: "/opec-supply-risk", priority: 0.8, changeFrequency: "daily" },
  { path: "/uk-energy-security", priority: 0.7, changeFrequency: "weekly" },
  { path: "/north-sea", priority: 0.7, changeFrequency: "weekly" },
  { path: "/oil-truth", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research-library", priority: 0.7, changeFrequency: "weekly" },
  { path: "/subscribe", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/advertise", priority: 0.4, changeFrequency: "monthly" },
  { path: "/media-kit", priority: 0.4, changeFrequency: "monthly" },
  { path: "/corrections", priority: 0.3, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-use", priority: 0.2, changeFrequency: "yearly" },
  { path: "/financial-disclaimer", priority: 0.2, changeFrequency: "yearly" },
  { path: "/data-disclaimer", priority: 0.2, changeFrequency: "yearly" },
  { path: "/data-sources", priority: 0.6, changeFrequency: "monthly" },
  { path: "/editorial-policy", priority: 0.3, changeFrequency: "yearly" },
];

export function sitemapEntries(noteDates: readonly string[]): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10);
  const entries: MetadataRoute.Sitemap = ROUTES.map((route) => {
    const stamp = route.path === "/daily" || route.path === "/eia-weekly" ? `${today}T00:00:00Z` : ROUTE_LASTMOD[route.path];
    return {
      url: `${SITE.url}${route.path === "/" ? "" : route.path}`,
      ...(stamp ? { lastModified: new Date(stamp) } : {}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });
  const seen = new Set(entries.map((entry) => entry.url));
  for (const date of noteDates) {
    if (!isNoteDate(date)) continue;
    const url = `${SITE.url}/daily/${date}`;
    if (seen.has(url)) continue;
    seen.add(url);
    entries.push({
      url,
      lastModified: new Date(`${date}T00:00:00Z`),
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dates = await listDailyNoteDates().catch(() => [] as string[]);
  return sitemapEntries(dates);
}
