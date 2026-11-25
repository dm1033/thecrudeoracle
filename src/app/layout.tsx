import type { Metadata } from "next";
import { JetBrains_Mono, Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import AdvertisingScripts from "@/components/AdvertisingScripts";
import TerminalChrome, { type TapeCell } from "@/components/shell/TerminalChrome";
import { getMarketSnapshot } from "@/lib/market-snapshot";
import { priceFigureShown } from "@/lib/price-stamp";
import { getPublishedPrices } from "@/lib/published-prices";
import { SITE } from "@/lib/site";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jakarta",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
    locale: "en_GB",
    images: [{ url: "/og-logo.jpg", width: 1200, height: 1200, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images: ["/og-logo.jpg"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

const orgId = `${SITE.url}/#organization`;

const siteSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": orgId,
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/icon-192.png`,
        width: 192,
        height: 192,
      },
      description: SITE.description,
      email: SITE.contactEmail,
      sameAs: [SITE.xProfile],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      name: SITE.name,
      url: SITE.url,
      description: SITE.description,
      inLanguage: "en-GB",
      publisher: { "@id": orgId },
    },
  ],
};

function money(value: number): string {
  return value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function signed(value: number, digits = 2): string {
  const text = value.toFixed(digits);
  return value > 0 ? `+${text}` : text;
}

async function tape(): Promise<TapeCell[]> {
  const [feed, snapshot] = await Promise.all([getPublishedPrices(), Promise.resolve(getMarketSnapshot())]);
  const quote = (ticker: string) => {
    const price = feed.prices.find((item) => item.ticker === ticker);
    return price && priceFigureShown(price) ? price : null;
  };
  const brent = quote("BRN");
  const wti = quote("WTI");
  const henry = quote("HH");
  const stocks = snapshot.eia.rows[0] ?? null;
  const cot = snapshot.cftc.rows[0] ?? null;
  const cells: TapeCell[] = [
    { label: "BRN", value: brent ? money(brent.price) : "—", delta: brent ? signed(brent.daily_change) : null },
    { label: "WTI", value: wti ? money(wti.price) : "—", delta: wti ? signed(wti.daily_change) : null },
    {
      label: "BRN-WTI",
      value: brent && wti ? money(brent.price - wti.price) : "—",
      delta: null,
    },
    { label: "HH", value: henry ? money(henry.price) : "—", delta: henry ? signed(henry.daily_change) : null },
    {
      label: "US CRUDE STKS",
      value: stocks ? `${stocks.millionBarrels.toFixed(1)} mb` : "—",
      delta: stocks?.changeMillionBarrels == null ? null : signed(stocks.changeMillionBarrels, 1),
    },
    {
      label: "WTI MM NET",
      value: cot ? cot.net.toLocaleString("en-GB") : "—",
      delta: cot?.netChange == null ? null : signed(cot.netChange, 0),
    },
  ];
  return cells;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cells = await tape();
  return (
    <html lang="en-GB" className={`${newsreader.variable} ${jakarta.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-brass focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-canvas"
        >
          Skip to main content
        </a>
        <TerminalChrome tape={cells}>
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </TerminalChrome>
        <Footer />
        <JsonLd data={siteSchema} />
        <Analytics />
        <SpeedInsights />
        <AdvertisingScripts />
      </body>
    </html>
  );
}
