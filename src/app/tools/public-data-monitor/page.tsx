import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PublicDataMonitor from "@/components/PublicDataMonitor";
import { getMonitorFeedWithLiveEia } from "@/lib/monitor-live";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Public data monitor",
  "Oil market figures from free public sources on one screen: EIA spot prices and stocks, CFTC futures positioning, the Federal Reserve dollar index and real yields, EU gas storage and news volume. Delayed data. Not financial advice.",
  "/tools/public-data-monitor"
);

const SOURCES = [
  {
    name: "U.S. Energy Information Administration",
    url: "https://www.eia.gov/opendata/",
    what: "Daily spot prices and weekly petroleum stocks. US government public-domain data.",
  },
  {
    name: "Commodity Futures Trading Commission",
    url: "https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm",
    what: "Commitments of Traders. US government public-domain data, published weekly.",
  },
  {
    name: "Federal Reserve Board, via FRED",
    url: "https://fred.stlouisfed.org/",
    what: "Broad dollar index (DTWEXBGS) and 10-year inflation-indexed Treasury yield (DFII10).",
  },
  {
    name: "Gas Infrastructure Europe, AGSI+",
    url: "https://agsi.gie.eu/",
    what: "Aggregate EU gas storage, reported by storage operators.",
  },
  {
    name: "The GDELT Project",
    url: "https://www.gdeltproject.org/",
    what: "Share of monitored online news matching a fixed keyword list, and links to matching articles.",
  },
];

export default async function PublicDataMonitorPage() {
  const feed = await getMonitorFeedWithLiveEia();
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 11"
        title="Public Data Monitor"
        intro="The figures a market desk checks first, taken only from free public sources and refreshed automatically. Every card shows the date of its data and where it came from. A card with nothing behind it says so."
      />
      <div className="container-site space-y-10 py-10">
        <PublicDataMonitor feed={feed} />

        <section aria-labelledby="pdm-method" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="pdm-method" className="text-base font-semibold text-white">
            How to read this page
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>All data is delayed. Nothing here is a live exchange price.</li>
            <li>
              A scheduled job fetches each source up to four times a day; EIA figures are also read directly when the
              page is rebuilt, every two hours. A card keeps its last successful fetch until a
              newer one arrives, and is marked stale when its data is older than the source&apos;s normal cycle.
            </li>
            <li>
              No figure is estimated or filled in. Freight rates, licensed benchmarks and exchange volatility indices are
              not shown because they are not free to republish.
            </li>
            <li>
              Statistics describe what has happened. Nothing on this page is a signal, a forecast or a recommendation to
              buy or sell.
            </li>
          </ul>
          <h3 className="mt-5 text-sm font-semibold text-white">Sources</h3>
          <ul className="mt-2 space-y-1.5">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-steel-200 underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
                >
                  {source.name}
                </a>
                <span className="text-steel-500"> — {source.what}</span>
              </li>
            ))}
          </ul>
          {feed.notice ? <p className="mt-4 text-xs text-steel-500">{feed.notice}</p> : null}
          <p className="mt-2 text-xs text-steel-500">
            The underlying file is public at{" "}
            <a href="/data/oracle_intelligence.json" className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
              /data/oracle_intelligence.json
            </a>
            .
          </p>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">Longer histories sit on the dedicated pages.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/eia-weekly" className="font-semibold text-gold-400 hover:text-gold-300">
              EIA weekly stocks →
            </Link>
            <Link href="/tools/positioning" className="font-semibold text-gold-400 hover:text-gold-300">
              CFTC positioning →
            </Link>
            <Link href="/tools" className="font-semibold text-gold-400 hover:text-gold-300">
              All tools →
            </Link>
          </div>
        </div>

        <p className="text-sm font-medium text-steel-200">Not financial advice.</p>
        <DisclaimerBlock />
      </div>
    </>
  );
}
