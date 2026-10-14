import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const PRIVATE = ["/admin", "/account", "/payment/"];

/** Explicit allows for the major answer-engine crawlers, with the same private paths blocked. */
const ANSWER_BOTS = ["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...ANSWER_BOTS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: PRIVATE,
      })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
