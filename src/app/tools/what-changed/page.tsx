import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import FreshnessBadge from "@/components/FreshnessBadge";
import { formatLongDate } from "@/lib/daily-note";
import { getMonitorFeedWithLiveEia } from "@/lib/monitor-live";
import { num } from "@/lib/oracle-intelligence";
import { SIZE_LABEL, whatChanged, type ChangeItem, type ChangeSize } from "@/lib/what-changed";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "What changed in the oil market data",
  "The latest move in oil prices, US crude stocks, futures positioning, the dollar and real yields, ranked by how unusual each is against its own history. Delayed public data. Not financial advice.",
  "/tools/what-changed"
);

const SIZE_STYLE: Record<ChangeSize, string> = {
  unusual: "bg-risk/20 text-risk",
  larger: "bg-gold-500/15 text-gold-400",
  usual: "bg-steel-500/15 text-steel-300",
  unknown: "bg-ink-700 text-steel-400",
};

function Row({ item }: { item: ChangeItem }) {
  const arrow = item.direction === "up" ? "▲" : item.direction === "down" ? "▼" : "■";
  return (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white">
            <Link href={item.href} className="hover:text-gold-400">
              {item.label}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-steel-300">
            <span className="num font-semibold text-white">{item.level}</span>
            <span className="mx-2 text-steel-600" aria-hidden>
              ·
            </span>
            <span className="num">
              <span aria-hidden className="mr-1 text-[10px] text-steel-500">
                {arrow}
              </span>
              {item.change}
            </span>
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${SIZE_STYLE[item.size]}`}>
            {SIZE_LABEL[item.size]}
          </span>
          {item.vsUsual != null && item.compared != null ? (
            <p className="mt-1 text-[11px] text-steel-500">
              <span className="num">{Math.abs(item.vsUsual).toFixed(1)}×</span> its usual {item.cadence} move, over{" "}
              {item.compared} earlier {item.cadence === "daily" ? "days" : "weeks"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>
          {formatLongDate(item.asOf)} against {formatLongDate(item.previousDate)}
        </span>
        <span>
          Source:{" "}
          {item.sourceUrl ? (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
            >
              {item.sourceName}
            </a>
          ) : (
            item.sourceName
          )}
        </span>
        <span className="rounded bg-risk/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-risk">delayed</span>
        <FreshnessBadge lastUpdated={`${item.asOf.slice(0, 10)}T00:00:00Z`} staleAfterHours={item.cadence === "daily" ? 192 : 288} />
      </div>
    </li>
  );
}

export default async function WhatChangedPage() {
  const feed = await getMonitorFeedWithLiveEia();
  const items = whatChanged(feed);
  const newsRatio = feed.news.status === "ok" ? num(feed.news.values, "share_last_24h_vs_7d_average") : null;

  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 8"
        title="What Changed"
        intro="The latest move in each public series we track, biggest first. Size is judged against that series' own history, so a one-dollar day in crude and a five-million-barrel week in stocks are measured on the same scale."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="changes-h">
          <h2 id="changes-h" className="h2">
            Latest moves, ranked
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-steel-500">
            Each line compares the newest print with the one before it. All data is delayed: daily series by one to
            three business days, weekly series by up to a week and a half.
          </p>
          {items.length ? (
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-steel-300">
              <p className="font-semibold text-white">Nothing to compare yet</p>
              <p className="mt-1 text-steel-400">
                No series has both a latest and a previous print loaded. No figure is shown until one has.
              </p>
            </div>
          )}
        </section>

        {newsRatio != null && feed.news.status === "ok" ? (
          <section aria-labelledby="attention-h" className="card">
            <h2 id="attention-h" className="text-base font-semibold text-white">
              News attention
            </h2>
            <p className="mt-2 text-sm text-steel-300">
              Online coverage of oil-supply chokepoints and OPEC over the last 24 hours ran at{" "}
              <span className="num font-semibold text-white">{newsRatio.toFixed(2)}×</span> its seven-day average, as of{" "}
              {formatLongDate(feed.news.asOf)}. This measures how much is being written, not how much is happening.
            </p>
            <p className="mt-2 text-xs text-steel-500">
              Source: {feed.news.sourceName}.{" "}
              <Link href="/tools/public-data-monitor" className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
                Search terms and headlines
              </Link>
            </p>
          </section>
        ) : null}

        <section aria-labelledby="method-h" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="method-h" className="text-base font-semibold text-white">
            How the ranking works
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              For each series we take the latest change and divide it by the typical size of that series&apos; earlier
              changes (their standard deviation): up to 250 trading days for daily series, up to 52 weeks for weekly
              ones.
            </li>
            <li>
              Under 1× is labelled within its usual range, 1× to 2× larger than usual, and 2× or more unusually large.
              A series with fewer than 20 earlier changes is not rated.
            </li>
            <li>The label describes size only. It does not say a move is good or bad, and it is not a forecast.</li>
            <li>
              A series appears only when both its latest and previous prints were fetched from the source. Nothing is
              estimated.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">The levels behind these moves are on the monitor.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/public-data-monitor" className="font-semibold text-gold-400 hover:text-gold-300">
              Public Data Monitor →
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
