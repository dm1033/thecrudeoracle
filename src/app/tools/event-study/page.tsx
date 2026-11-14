import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DataMeta from "@/components/DataMeta";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { formatLongDate } from "@/lib/daily-note";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { getEventStudy, type HorizonStats, type StudyEvent, type StudyGroup } from "@/lib/event-study";

export const revalidate = 21600;

export const metadata: Metadata = pageMeta(
  "Stock report event study",
  "How WTI and the Brent-WTI spread moved in the days after the largest weekly builds and draws in US crude stocks, from about five years of EIA data. A description of the past, not a forecast.",
  "/tools/event-study"
);

const SOURCE_URL = "https://www.eia.gov/petroleum/supply/weekly/";

function signed(value: number, digits: number, suffix = ""): string {
  const text = Math.abs(value).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${text}${suffix}`;
}

function horizonLabel(horizon: number): string {
  return horizon === 0 ? "Release day" : `${horizon} trading day${horizon === 1 ? "" : "s"} later`;
}

function StatsTable({ caption, rows, digits, suffix }: { caption: string; rows: HorizonStats[]; digits: number; suffix: string }) {
  if (!rows.length) return <p className="mt-2 text-sm text-steel-500">Not enough matching prices to show this.</p>;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg border border-ink-700">
      <table className="table-dark min-w-[680px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-ink-900">
          <tr>
            <th scope="col">Measured to</th>
            <th scope="col" className="text-right">Weeks</th>
            <th scope="col" className="text-right">Median</th>
            <th scope="col" className="text-right">Average</th>
            <th scope="col" className="text-right">Lowest</th>
            <th scope="col" className="text-right">Highest</th>
            <th scope="col" className="text-right">Weeks it rose</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.horizon}>
              <th scope="row" className="font-medium text-steel-200">
                {horizonLabel(row.horizon)}
              </th>
              <td className="num text-right">{row.count}</td>
              <td className="num text-right font-semibold text-white">{signed(row.median, digits, suffix)}</td>
              <td className="num text-right">{signed(row.mean, digits, suffix)}</td>
              <td className="num text-right">{signed(row.min, digits, suffix)}</td>
              <td className="num text-right">{signed(row.max, digits, suffix)}</td>
              <td className="num text-right">
                {Math.round(row.shareUp * row.count)} of {row.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupSection({ group }: { group: StudyGroup }) {
  if (!group.events.length) return null;
  const range = group.changeRange;
  return (
    <section aria-labelledby={`${group.key}-h`} className="space-y-4">
      <div>
        <h2 id={`${group.key}-h`} className="h2">
          {group.label}
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          {group.events.length} weeks
          {range ? `, with stock changes from ${signed(range[0], 1)} to ${signed(range[1], 1)} million barrels` : ""}.
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">WTI spot, change from the day before the release</h3>
        <StatsTable caption={`${group.label}: WTI percent change`} rows={group.wti} digits={2} suffix="%" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">Brent minus WTI, change over the same days (USD/bbl)</h3>
        <StatsTable caption={`${group.label}: change in Brent minus WTI`} rows={group.spread} digits={2} suffix="" />
      </div>
    </section>
  );
}

function EventList({ title, events }: { title: string; events: StudyEvent[] }) {
  if (!events.length) return null;
  const cell = (value: number | undefined, suffix: string) =>
    value == null ? <span className="text-steel-500">n/a</span> : <span className="num">{signed(value, 2, suffix)}</span>;
  return (
    <details className="rounded-lg border border-ink-700 bg-ink-900 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-gold-400">{title}</summary>
      <div className="mt-3 overflow-x-auto">
        <table className="table-dark min-w-[640px]">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col">Week ending</th>
              <th scope="col">Usual release date</th>
              <th scope="col" className="text-right">Stock change (mb)</th>
              <th scope="col" className="text-right">WTI, release day</th>
              <th scope="col" className="text-right">WTI, 5 days later</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.weekEnding}>
                <th scope="row" className="whitespace-nowrap font-medium text-steel-200">
                  {formatLongDate(event.weekEnding)}
                </th>
                <td className="whitespace-nowrap">{formatLongDate(event.releaseDate)}</td>
                <td className="num text-right">{signed(event.stockChange, 1)}</td>
                <td className="text-right">{cell(event.wtiPct[0], "%")}</td>
                <td className="text-right">{cell(event.wtiPct[5], "%")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default async function EventStudyPage() {
  const study = await getEventStudy();
  const builds = study?.groups.find((group) => group.key === "builds");
  const draws = study?.groups.find((group) => group.key === "draws");

  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 10"
        title="Stock Report Event Study"
        intro="What WTI and the Brent-WTI spread did in the days after the largest weekly builds and draws in US commercial crude stocks. It describes the past sample. It is not a forecast."
      />
      <div className="container-site space-y-10 py-10">
        <aside aria-label="Read this first" className="rounded-lg border border-risk/50 bg-risk/15 p-4">
          <p className="text-sm font-bold uppercase tracking-widest text-risk">A description of the past, not a forecast</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-200">
            Prices move for many reasons on any day. This page cannot separate the stock report from everything else
            that happened, and it does not know what the market expected before each report, which is usually what
            prices react to. The groups are small. Do not read the figures as what will happen next time.
          </p>
        </aside>

        {study ? (
          <>
            <section aria-label="Sample" className="card text-sm leading-relaxed text-steel-300">
              <p>
                <span className="font-semibold text-white">{study.weeks} weeks</span> of EIA data, from the week ending{" "}
                {formatLongDate(study.firstWeek)} to the week ending {formatLongDate(study.lastWeek)}. The largest{" "}
                {study.groupSize} builds and the largest {study.groupSize} draws are compared with all weeks.
              </p>
              <p className="mt-2 text-xs text-steel-500">Fetched {formatLondonTimestamp(study.fetchedAt)}.</p>
              <DataMeta
                source="EIA Weekly Petroleum Status Report and EIA daily spot prices"
                sourceUrl={SOURCE_URL}
                lastUpdated={`${study.lastWeek}T00:00:00Z`}
                dataType="delayed"
                staleAfterHours={24 * 21}
              />
            </section>

            {study.groups.map((group) => (
              <GroupSection key={group.key} group={group} />
            ))}

            <section aria-label="The weeks used" className="space-y-3">
              <h2 className="h2">The weeks behind the figures</h2>
              {builds ? <EventList title={`The ${builds.events.length} largest builds`} events={builds.events} /> : null}
              {draws ? <EventList title={`The ${draws.events.length} largest draws`} events={draws.events} /> : null}
            </section>
          </>
        ) : (
          <section className="max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5 text-sm leading-relaxed text-steel-300">
            <p className="text-lg font-semibold text-white">Event study: not loaded</p>
            <p className="mt-2 text-steel-400">
              EIA&apos;s price and stock history could not be read for this page. No figure is shown until it can.
            </p>
          </section>
        )}

        <section aria-labelledby="method-h" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="method-h" className="text-base font-semibold text-white">
            How the figures are worked out
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Stocks are EIA&apos;s weekly US ending stocks of crude oil excluding the Strategic Petroleum Reserve. The
              change is one week&apos;s figure minus the week before.
            </li>
            <li>
              EIA&apos;s figure is for the week ending Friday and is normally published the following Wednesday. That
              Wednesday is used as the release date for every week. Holiday weeks are published a day late and are
              not adjusted, so a few release-day figures are a day early.
            </li>
            <li>
              Each move is measured from the last EIA spot price before the release date to the price on the release
              day, and one, three and five trading days later. Prices are EIA&apos;s daily Cushing WTI and Europe Brent
              spot prices.
            </li>
            <li>
              &quot;Weeks it rose&quot; counts the weeks where the figure was above zero. With groups this small, a
              split such as 14 of 26 is not different from chance.
            </li>
            <li>
              A stock change is not a surprise. The market&apos;s reaction depends on what was expected, and no free
              public record of those expectations exists, so this page does not use one.
            </li>
            <li>Nothing here is modelled, simulated or projected forward. The site publishes no scenarios or price forecasts.</li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">See the latest stock report and how unusual its change was.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/eia-weekly" className="font-semibold text-gold-400 hover:text-gold-300">
              EIA weekly →
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
