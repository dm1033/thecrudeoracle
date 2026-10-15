import type { Metadata } from "next";
import { SITE } from "@/lib/site";

const OG_IMAGE = {
  url: "/images/brand-compass.jpg",
  width: 1200,
  height: 655,
  alt: SITE.name,
};

/**
 * Page titles that already name the brand stay absolute, so the root template
 * (`%s | The Crude Oracle`) does not append the brand a second time.
 * A trailing " — The Crude Oracle" is stripped and left to the template.
 */
export function pageTitle(title: string): { title: Metadata["title"]; social: string } {
  let clean = title.trim();
  const suffixes = [` | ${SITE.name}`, ` — ${SITE.name}`, ` - ${SITE.name}`];
  for (const suffix of suffixes) {
    if (clean.endsWith(suffix)) clean = clean.slice(0, -suffix.length).trim();
  }
  if (clean.includes(SITE.name)) {
    return { title: { absolute: clean }, social: clean };
  }
  return { title: clean, social: `${clean} | ${SITE.name}` };
}

/** Build consistent per-page metadata: title, description, canonical, Open Graph, Twitter. */
export function pageMeta(title: string, description: string, path: string): Metadata {
  const url = `${SITE.url}${path}`;
  const named = pageTitle(title);
  return {
    title: named.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: named.social,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_GB",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: named.social,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
