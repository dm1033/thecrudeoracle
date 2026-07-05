import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/dashboard", priority: 0.9, changeFrequency: "daily" },
  { path: "/premium-dashboard", priority: 0.8, changeFrequency: "daily" },
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
  { path: "/crude-oil-prices", priority: 0.9, changeFrequency: "daily" },
  { path: "/gas-lng", priority: 0.8, changeFrequency: "daily" },
  { path: "/opec-supply-risk", priority: 0.8, changeFrequency: "daily" },
  { path: "/uk-energy-security", priority: 0.7, changeFrequency: "weekly" },
  { path: "/north-sea", priority: 0.7, changeFrequency: "weekly" },
  { path: "/oil-truth", priority: 0.7, changeFrequency: "monthly" },
  { path: "/research-library", priority: 0.7, changeFrequency: "weekly" },
  { path: "/subscribe", priority: 0.9, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms-of-use", priority: 0.2, changeFrequency: "yearly" },
  { path: "/financial-disclaimer", priority: 0.2, changeFrequency: "yearly" },
  { path: "/data-disclaimer", priority: 0.2, changeFrequency: "yearly" },
  { path: "/subscription-terms", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((r) => ({
    url: `${SITE.url}${r.path === "/" ? "" : r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
