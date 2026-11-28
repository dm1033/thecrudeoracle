import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { briefings } from "@/lib/data";
import { buildRssDocument, EDITOR_LINE, renderRss, rssItemsForBriefings, rssItemsForNotes, type RssItem } from "@/lib/rss";
import { FEED_URL } from "@/lib/seo";
import { SITE } from "@/lib/site";

const history = {
  brent: [
    { date: "2026-07-13", value: 79 },
    { date: "2026-07-14", value: 80 },
  ],
  wti: [
    { date: "2026-07-13", value: 75 },
    { date: "2026-07-14", value: 76 },
  ],
  henryHub: null,
};

describe("rss", () => {
  it("includes a daily note built from the prints it was given", () => {
    const items = rssItemsForNotes(history);
    expect(items.map((item) => item.link)).toEqual([
      `${SITE.url}/daily/2026-07-14`,
      `${SITE.url}/daily/2026-07-13`,
    ]);
    expect(items[0]?.description).toContain("EIA RBRTE");
    expect(items[0]?.description).toContain("80.00");
    expect(items[0]?.description).toContain("not investment advice");
    expect(items[0]?.pubDate).toEqual(new Date("2026-07-14T00:00:00Z"));
    expect(items[0]?.description.toLowerCase()).not.toMatch(/\blive\b/);
  });

  it("includes each published briefing with its last update", () => {
    const items = rssItemsForBriefings(briefings);
    expect(items.length).toBe(briefings.filter((briefing) => briefing.status === "published").length);
    expect(items[0]?.link).toBe(`${SITE.url}/daily-briefing#briefing-${briefings[0]?.date}`);
    expect(items[0]?.title).toBe(briefings[0]?.headline);
    expect(items[0]?.pubDate.toISOString()).toBe(new Date(briefings[0]?.last_updated ?? "").toISOString());
  });

  it("escapes text and names the editor line exactly", () => {
    const item: RssItem = {
      title: "Tom & Jerry <desk>",
      link: `${SITE.url}/daily/2026-07-14`,
      guid: `${SITE.url}/daily/2026-07-14`,
      pubDate: new Date("2026-07-14T00:00:00Z"),
      description: `5 > 4 & "quoted"`,
      category: "Daily note",
    };
    const xml = renderRss([item]);
    expect(xml).toContain("Tom &amp; Jerry &lt;desk&gt;");
    expect(xml).toContain("5 &gt; 4 &amp; &quot;quoted&quot;");
    expect(xml).not.toContain("<desk>");
    expect(xml).toContain(`(${EDITOR_LINE})`);
    expect(xml).toContain(EDITOR_LINE);
    expect(EDITOR_LINE).toBe("David John Miller CEng");
    expect(xml).toContain(`href="${FEED_URL}"`);
    expect(xml.toLowerCase()).not.toMatch(/\blive\b/);
  });

  it("still publishes archived briefings when EIA is unset", async () => {
    const saved = process.env.EIA_API_KEY;
    const savedAlt = process.env.EIA_API;
    delete process.env.EIA_API_KEY;
    delete process.env.EIA_API;
    const xml = await buildRssDocument();
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).toContain("/daily-briefing#briefing-");
    expect(xml).toContain("David John Miller CEng");
    expect(xml.toLowerCase()).not.toMatch(/\blive\b/);
    if (saved === undefined) delete process.env.EIA_API_KEY;
    else process.env.EIA_API_KEY = saved;
    if (savedAlt === undefined) delete process.env.EIA_API;
    else process.env.EIA_API = savedAlt;
  });

  it("keeps pages on the two-hour prerender", () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
    for (const path of ["src/app/page.tsx", "src/app/layout.tsx", "src/app/sitemap.ts", "src/app/feed.xml/route.ts"]) {
      const source = read(path);
      expect(source, path).toContain("export const revalidate = 7200");
      expect(source, path).not.toContain("force-dynamic");
    }
    expect(read("src/app/page.tsx")).toContain("Free weekday morning oil brief");
    expect(read("src/app/layout.tsx")).toContain("verification: { google: googleVerification }");
    expect(read("src/app/about/page.tsx")).toContain(">David John Miller CEng<");
    expect(read("src/lib/eia.ts")).toContain("export const DEFAULT_TIMEOUT_MS = 4_000");
    expect(read("src/lib/eia.ts")).toContain("export const DEFAULT_MAX_RETRIES = 0");
  });
});
