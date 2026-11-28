import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** Public RSS document. /rss.xml redirects here. */
export const FEED_PATH = "/feed.xml";
export const FEED_URL = `${SITE.url}${FEED_PATH}`;
export const FEED_TYPE = "application/rss+xml";

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
/** The document title Next will emit, including the layout brand suffix. */
export function documentTitle(title: Metadata["title"] | undefined): string {
  if (!title) return "";
  if (typeof title === "string") return `${title} | ${SITE.name}`;
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && title.default) return title.default;
  return "";
}

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

/**
 * Build consistent per-page metadata: title, description, canonical, Open Graph, Twitter.
 * `dynamicImage` leaves the image to a sibling opengraph-image file so a static
 * brand photo is not listed ahead of the generated card.
 */
export function pageMeta(
  title: string,
  description: string,
  path: string,
  options?: { dynamicImage?: boolean }
): Metadata {
  const url = `${SITE.url}${path}`;
  const named = pageTitle(title);
  const dynamicImage = options?.dynamicImage === true;
  return {
    title: named.title,
    description,
    alternates: {
      canonical: url,
      types: { [FEED_TYPE]: FEED_URL },
    },
    openGraph: {
      title: named.social,
      description,
      url,
      siteName: SITE.name,
      type: "website",
      locale: "en_GB",
      ...(dynamicImage ? {} : { images: [OG_IMAGE] }),
    },
    twitter: {
      card: "summary_large_image",
      title: named.social,
      description,
      ...(dynamicImage ? {} : { images: [OG_IMAGE.url] }),
    },
  };
}

/**
 * Google Search Console HTML-tag token. Blank, quoted-empty, and the
 * `replace_me` placeholder omit the meta tag. A pasted meta tag is reduced
 * to its content attribute. No token is invented here.
 */
export function googleSiteVerification(env: Record<string, string | undefined> = process.env): string | undefined {
  const raw = env.GOOGLE_SITE_VERIFICATION;
  if (typeof raw !== "string") return undefined;
  let token = raw.trim();
  if (
    token.length >= 2 &&
    ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'")))
  ) {
    token = token.slice(1, -1).trim();
  }
  const content = token.match(/content\s*=\s*["']([^"']+)["']/i);
  if (content?.[1]) token = content[1].trim();
  if (!token || token === "replace_me" || /[<>]/.test(token)) return undefined;
  return token;
}
