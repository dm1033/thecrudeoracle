import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import DataMeta from "@/components/DataMeta";
import PresentedBy from "@/components/PresentedBy";
import JsonLd from "@/components/JsonLd";
import { getEiaWeekly, type WeeklyStockLine } from "@/lib/eia-weekly";
import { formatLongDate } from "@/lib/daily-note";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "EIA weekly petroleum stocks",
  "US crude, gasoline, distillate and Cushing stocks from the EIA Weekly Petroleum Status Report, with the week-on-week change. Delayed public data. Not financial advice.",
  "/eia-weekly",
  { dynamicImage: true }
);

function signed(value: number): string {
  const text = value.toFixed(3);
  return value > 0 ? `+${text}` : text;
}

function StockTable({ lines }: { lines: WeeklyStockLine[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
      <table className="table-dark min-w-[720px]">
        <caption className="sr-only">EIA weekly petroleum stocks</caption>
        <thead>
          <tr>
            <th scope="col">Series</th>
            <th scope="col">Week ending</th>
            <th scope="col">Stocks</th>
            <th scope="col">Week on week</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.seriesId}>
              <th scope="row" className="font-medium text-steel-200">
                <a href={line.sourceUrl} className="hover:text-gold-400">
                  {line.name}
                </a>
                <span className="mt-0.5 block font-mono text-[10px] font-normal text-steel-500">{line.seriesId}</span>
              </th>
              <td className="whitespace-nowrap">{formatLongDate(line.weekEnding)}</td>
              <td className="num whitespace-nowrap text-white">
                {line.millionBarrels.toFixed(3)}
                <span className="mt-0.5 block text-[10px] text-steel-500">million barrels</span>
                <span className="mt-0.5 block text-[10px] text-steel-500">
                  {line.thousandBarrels.toLocaleString("en-GB")} thousand barrels
                </span>
              </td>
              <td>
                {line.changeMillionBarrels == null || line.previousWeekEnding == null ? (
                  <span className="text-steel-500">n/a</span>
                ) : (
                  <span className={`num ${line.changeMillionBarrels > 0 ? "text-gain" : line.changeMillionBarrels < 0 ? "text-loss" : "text-steel-300"}`}>
                    {signed(line.changeMillionBarrels)}
                    <span className="mt-0.5 block text-[10px] font-sans text-steel-500">
                      million barrels vs {formatLongDate(line.previousWeekEnding)}
                    </span>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function EiaWeeklyPage() {
  const feed = await getEiaWeekly();
  return (
    <>
      <PageHeader
        eyebrow="Wednesday report"
        title="EIA weekly petroleum stocks"
        intro="US crude, gasoline, distillate and Cushing from the EIA Weekly Petroleum Status Report. Stocks are thousand barrels in the API and million barrels on this page."
      />
      <div className="container-site space-y-8 py-10">
        {feed ? (
          <>
            <section className="rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-steel-300" aria-label="Latest EIA print">
              <p className="text-lg font-semibold text-white">Latest EIA print: {formatLongDate(feed.report.weekEnding)}</p>
              <p className="mt-2">
                The Weekly Petroleum Status Report is released on Wednesday at 10:30 a.m. US Eastern, for the week
                ending the previous Friday. The date above is that week-ending date, not the Wednesday this page was
                opened. A US holiday can move the release.
              </p>
              <p className="mt-2 text-xs text-steel-500">
                Fetched {formatLondonTimestamp(feed.report.fetchedAt)}. Source: U.S. Energy Information Administration,
                Open Data API, petroleum/stoc/wstk.
                {feed.fallback ? " This is the last successful read. A newer read did not succeed." : ""}
              </p>
            </section>
            <section aria-labelledby="stocks-h">
              <h2 id="stocks-h" className="h2">
                Stocks
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-steel-400">
                Week on week is this week minus the previous published week, in million barrels. A missing prior week
                is left blank. Crude is commercial stocks excluding the Strategic Petroleum Reserve.
              </p>
              <StockTable lines={feed.report.lines} />
              <DataMeta
                source="EIA Weekly Petroleum Status Report"
                sourceUrl="https://www.eia.gov/petroleum/supply/weekly/"
                lastUpdated={`${feed.report.weekEnding}T00:00:00Z`}
                dataType="delayed"
                staleAfterHours={288}
              />
            </section>
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "Dataset",
                name: `EIA weekly petroleum stocks, week ending ${feed.report.weekEnding}`,
                description:
                  "US commercial crude, total gasoline, distillate and Cushing stocks from the EIA Weekly Petroleum Status Report.",
                url: `${SITE.url}/eia-weekly`,
                temporalCoverage: feed.report.weekEnding,
                isAccessibleForFree: true,
                license: "https://www.eia.gov/about/copyrights_reuse.php",
                creator: {
                  "@type": "Organization",
                  name: "U.S. Energy Information Administration",
                  url: "https://www.eia.gov/",
                },
                variableMeasured: feed.report.lines.map((line) => ({
                  "@type": "PropertyValue",
                  name: line.name,
                  propertyID: line.seriesId,
                  unitText: "million barrels",
                  value: line.millionBarrels,
                })),
              }}
            />
          </>
        ) : (
          <section className="max-w-3xl space-y-4">
            <p className="text-lg font-semibold text-white">Latest EIA print: not loaded</p>
            <p className="text-sm leading-relaxed text-steel-300">
              EIA weekly stocks are not available for this page. No crude, gasoline, distillate or Cushing figure is
              shown.
            </p>
            <p className="text-sm text-steel-400">
              Series used when the feed is up: WCESTUS1, WGTSTUS1, WDISTUS1 and W_EPC0_SAX_YCUOK_MBBL, on
              petroleum/stoc/wstk. The report is published on Wednesdays.
            </p>
            <Link href="/data-sources" className="text-sm font-semibold text-gold-400 hover:text-gold-300">
              Data sources
            </Link>
          </section>
        )}
        <PresentedBy location="eia_weekly_sponsor" />
        <p className="text-sm font-medium text-steel-200">Not financial advice.</p>
        <DisclaimerBlock />
      </div>
    </>
  );
}
