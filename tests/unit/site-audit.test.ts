import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { pageMeta, pageTitle } from "@/lib/seo";
import { isValidEmail, newsletterConfig } from "@/lib/newsletter";
import { getPublishedPrices, resetPublishedPricesCache } from "@/lib/published-prices";
import { SITE } from "@/lib/site";

describe("page titles", () => {
  it("strips a trailing brand so the layout template does not repeat it", () => {
    expect(pageTitle("About — The Crude Oracle")).toEqual({
      title: "About",
      social: "About | The Crude Oracle",
    });
    expect(pageTitle("Contact — The Crude Oracle").title).toBe("Contact");
  });

  it("keeps a title that already leads with the brand as an absolute title", () => {
    const title = "The Crude Oracle — Daily Brent & WTI Oil Intelligence (Free)";
    expect(pageTitle(title)).toEqual({ title: { absolute: title }, social: title });
    const meta = pageMeta(title, "Daily oil intelligence.", "/");
    expect(meta.title).toEqual({ absolute: title });
    expect(meta.openGraph?.title).toBe(title);
  });
});

describe("robots.txt rules", () => {
  it("allows the named answer-engine bots and still blocks private paths", () => {
    const rules = robots().rules;
    const list = Array.isArray(rules) ? rules : [rules];
    const agents = list.flatMap((rule) => (Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent]));
    for (const bot of ["*", "GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"]) {
      expect(agents).toContain(bot);
    }
    for (const rule of list) {
      const disallow = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
      expect(disallow).toEqual(expect.arrayContaining(["/admin", "/account", "/payment/"]));
    }
  });
});

describe("sitemap lastmod", () => {
  const entries = sitemap();

  it("uses content dates, and drops the retired premium routes", () => {
    const home = entries.find((entry) => entry.url === SITE.url);
    const fund = entries.find((entry) => entry.url === `${SITE.url}/portfolio`);
    const book = entries.find((entry) => entry.url === `${SITE.url}/paper-book`);
    const about = entries.find((entry) => entry.url === `${SITE.url}/about`);
    expect(home?.lastModified).toEqual(new Date("2026-07-15T07:00:00Z"));
    expect(fund?.lastModified).toEqual(new Date("2026-07-04T07:00:00Z"));
    expect(book?.lastModified).toEqual(new Date("2026-10-08T06:18:54.557178+00:00"));
    expect(about?.lastModified).toBeUndefined();
    expect(entries.some((entry) => entry.url.includes("/premium-dashboard"))).toBe(false);
    expect(entries.some((entry) => entry.url.endsWith("/login"))).toBe(false);
    expect(entries.some((entry) => entry.url.includes("/subscription-terms"))).toBe(false);
    const stamps = entries.map((entry) => (entry.lastModified ? new Date(entry.lastModified).toISOString() : ""));
    expect(new Set(stamps.filter(Boolean)).size).toBeGreaterThan(2);
  });
});

describe("newsletter config", () => {
  it("stays unconfigured until a real provider key is present", () => {
    expect(newsletterConfig({}).provider).toBe("unconfigured");
    expect(newsletterConfig({ NEWSLETTER_PROVIDER: "beehiiv", BEEHIIV_API_KEY: "replace_me" }).provider).toBe(
      "unconfigured",
    );
    expect(
      newsletterConfig({
        NEWSLETTER_PROVIDER: "buttondown",
        BUTTONDOWN_API_KEY: "bd_test",
      }),
    ).toEqual({ provider: "buttondown", apiKey: "bd_test" });
  });

  it("accepts a normal email and rejects an empty one", () => {
    expect(isValidEmail("reader@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });
});

describe("published prices", () => {
  it("keeps the desk marks when EIA_API_KEY is not set", async () => {
    const saved = process.env.EIA_API_KEY;
    const savedAlt = process.env.EIA_API;
    delete process.env.EIA_API_KEY;
    delete process.env.EIA_API;
    resetPublishedPricesCache();
    const feed = await getPublishedPrices();
    expect(feed.eia).toBe(false);
    expect(feed.manualUpdated).toBe("2026-07-15T07:00:00Z");
    expect(feed.prices.find((price) => price.ticker === "BRN")?.data_type).toBe("manual");
    if (saved === undefined) delete process.env.EIA_API_KEY;
    else process.env.EIA_API_KEY = saved;
    if (savedAlt === undefined) delete process.env.EIA_API;
    else process.env.EIA_API = savedAlt;
  });
});
