import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DataMeta from "@/components/DataMeta";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import CoverageChart from "@/components/charts/CoverageChart";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { getMonitorFeed, headlines, newsTerms, newsTimeline, num } from "@/lib/oracle-intelligence";

export const metadata: Metadata = pageMeta(
  "Oil supply-route news monitor",
  "How much of the world's online news mentions Hormuz, the Red Sea, Suez, OPEC quotas and Libyan oilfields, against the last seven days. A count of coverage from the GDELT Project, not a risk rating.",
  "/tools/supply-news"
);

/** GDELT's seven-day series ends a day or two before the fetch, so allow for that. */
const STALE_AFTER_HOURS = 72;

function pct(value: number): string {
  return `${value.toFixed(3)}%`;
}

function compare(ratio: number): string {
  if (ratio >= 1.5) return "Well above its weekly average";
  if (ratio > 1.05) return "Above its weekly average";
  if (ratio >= 0.95) return "About its weekly average";
  if (ratio > 0.5) return "Below its weekly average";
  return "Well below its weekly average";
}

export default function SupplyNewsPage() {
  const news = getMonitorFeed().news;
  const values = news.status === "ok" ? news.values : null;
  const ratio = values ? num(values, "share_last_24h_vs_7d_average") : null;
  const last = values ? num(values, "share_last_24h_pct") : null;
  const week = values ? num(values, "share_7d_average_pct") : null;
  const timeline = values ? newsTimeline(values) : [];
  const terms = values ? newsTerms(values) : [];
  const items = values ? headlines(values) : [];
  const searchTerms =
    values && Array.isArray(values.search_terms) ? values.search_terms.filter((t): t is string => typeof t === "string") : [];

  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 7"
        title="Supply-Route News Monitor"
        intro="How much of the world's online news is talking about the main oil supply routes and OPEC quotas, compared with the last seven days. It counts coverage. It does not rate risk."
      />
      <div className="container-site space-y-10 py-10">
        {news.status === "ok" && ratio != null ? (
          <>
            <section aria-label="Coverage now" className="rounded-lg border border-gold-600/40 bg-gradient-to-r from-navy-900 to-ink-900 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-steel-500">All search terms together</p>
              <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">Last 24 hours vs 7-day average</dt>
                  <dd className="num mt-1 text-2xl font-bold text-white">{ratio.toFixed(2)}×</dd>
                  <dd className="mt-0.5 text-[11px] text-steel-400">{compare(ratio)}</dd>
                </div>
                {last != null ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">Share of coverage, last 24 hours</dt>
                    <dd className="num mt-1 text-2xl font-bold text-white">{pct(last)}</dd>
                  </div>
                ) : null}
                {week != null ? (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">Share of coverage, 7-day average</dt>
                    <dd className="num mt-1 text-2xl font-bold text-white">{pct(week)}</dd>
                  </div>
                ) : null}
              </dl>
              {searchTerms.length ? (
                <p className="mt-3 text-[11px] text-steel-500">Search terms: {searchTerms.join(" · ")}. English-language sources.</p>
              ) : null}
              {news.fetchedUtc ? <p className="mt-1 text-[11px] text-steel-500">Fetched {formatLondonTimestamp(news.fetchedUtc)}.</p> : null}
              <DataMeta
                source={news.sourceName}
                sourceUrl={news.sourceUrl ?? undefined}
                lastUpdated={news.asOf}
                dataType="delayed"
                staleAfterHours={STALE_AFTER_HOURS}
              />
            </section>

            <CoverageChart points={timeline} />

            <section aria-labelledby="terms-h">
              <h2 id="terms-h" className="h2">
                By search term
              </h2>
              {terms.length ? (
                <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
                  <table className="table-dark min-w-[640px]">
                    <caption className="sr-only">Share of online news coverage for each search term</caption>
                    <thead className="bg-ink-900">
                      <tr>
                        <th scope="col">Search term</th>
                        <th scope="col" className="text-right">Last 24 hours</th>
                        <th scope="col" className="text-right">7-day average</th>
                        <th scope="col" className="text-right">Last 24 hours vs average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {terms.map((row) => (
                        <tr key={row.term}>
                          <th scope="row" className="font-medium text-steel-200">
                            {row.term}
                          </th>
                          <td className="num text-right">{pct(row.last24hPct)}</td>
                          <td className="num text-right">{pct(row.weekAveragePct)}</td>
                          <td className="text-right">
                            <span className="num font-semibold text-white">{row.ratio.toFixed(2)}×</span>
                            <span className="mt-0.5 block text-[10px] text-steel-500">{compare(row.ratio)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-steel-400">
                  The breakdown by search term did not load on the last update, so only the combined figure is shown.
                </p>
              )}
            </section>

            <section aria-labelledby="heads-h">
              <h2 id="heads-h" className="h2">
                Recent matched headlines
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-steel-500">
                Matched by keyword, one per publisher, newest first. They are links to other publishers&apos; reporting
                and are not checked, summarised or endorsed by The Crude Oracle.
              </p>
              {items.length ? (
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.url} className="card text-sm leading-snug">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="font-medium text-steel-100 underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
                      >
                        {item.title}
                      </a>
                      <span className="mt-1 block text-[11px] text-steel-500">
                        {item.domain} · first seen {formatLondonTimestamp(item.seenUtc)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm text-steel-400">
                  No headlines loaded on the last update.
                </p>
              )}
            </section>
          </>
        ) : (
          <section className="max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5 text-sm leading-relaxed text-steel-300">
            <p className="text-lg font-semibold text-white">News coverage: not loaded</p>
            <p className="mt-2 text-steel-400">
              The GDELT Project feed could not be read on the last update
              {news.status === "not_loaded" && news.reason ? ` (${news.reason})` : ""}. No figure is shown until it can.
            </p>
          </section>
        )}

        <section aria-labelledby="read-h" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="read-h" className="text-base font-semibold text-white">
            How to read this page
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              The figures come from the GDELT Project, which monitors online news worldwide. A share of 0.050% means
              that about one article in two thousand matched the search terms.
            </li>
            <li>
              This is a count of how much is being written. More coverage does not mean more risk, and a quiet week
              does not mean less. An anniversary, a conference or one widely copied story can move it.
            </li>
            <li>
              Matching is by keyword in English-language sources, so unrelated stories that use the same words are
              counted too.
            </li>
            <li>
              The site does not publish a geopolitical risk rating. No free public feed measures risk, and this page
              does not try to.
            </li>
            <li>The data refreshes up to four times a day. The latest point is usually one to two days old, and its date is shown above.</li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">See what the supply figures themselves show.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/opec-supply-risk" className="font-semibold text-gold-400 hover:text-gold-300">
              OPEC and supply figures →
            </Link>
            <Link href="/tools/what-changed" className="font-semibold text-gold-400 hover:text-gold-300">
              What Changed →
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
