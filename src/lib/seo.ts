import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** Build consistent per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const url = `${SITE.url}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE.name}`,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_GB",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE.name}`,
      description,
    },
  };
}
