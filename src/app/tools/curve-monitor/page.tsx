import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DataMeta from "@/components/DataMeta";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SpreadHistoryChart from "@/components/charts/SpreadHistoryChart";
import { formatLongDate } from "@/lib/daily-note";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { getCurveFeed, type CurvePoint } from "@/lib/curve";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Oil curve, spreads and cracks",
  "Brent and WTI spot prices, the Brent-WTI spread, New York Harbor gasoline and diesel cracks and the 3-2-1 crack, worked from EIA public data with every date shown. Not financial advice.",
  "/tools/curve-monitor"
);

const SPOT_URL = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm";
const FUTURES_URL = "https://www.eia.gov/dnav/pet/pet_pri_fut_s1_d.htm";

/** EIA posts daily spot prices some days in arrears, so allow for that before calling them stale. */
const STALE_AFTER_HOURS = 24 * 12;

function amount(value: number, digits = 2): string {
  return value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function signed(value: number, digits = 2): string {
  const text = amount(Math.abs(value), digits);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function Dated({ point, digits = 2 }: { point: CurvePoint | null; digits?: number }) {
  if (!point) return <span className="text-steel-500">n/a</span>;
  return (
    <>
      <span className="num">{amount(point.value, digits)}</span>
      <span className="mt-0.5 block text-[10px] text-steel-500">{formatLongDate(point.date)}</span>
    </>
  );
}

function Heading({ title, accent }: { title: string; accent: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden className={`h-3 w-1 rounded-full ${accent}`} />
      <h2 className="h2">{title}</h2>
    </div>
  );
}

export default async function CurveMonitorPage() {
  const feed = await getCurveFeed();
  const futures = feed?.futures ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 3"
        title="Curve, Spreads & Cracks"
        intro="Crude and product prices side by side, and the spreads between them, worked from the daily prices the U.S. Energy Information Administration publishes. Every figure carries its own date."
      />
      <div className="container-site space-y-10 py-10">
        {feed ? (
          <>
            {feed.spreads.length ? (
              <section aria-label="Spreads" className="space-y-4">
                <Heading title="Spreads and cracks" accent="bg-gold-500" />
                <div className="overflow-x-auto rounded-lg border border-ink-700">
                  <table className="table-dark min-w-[720px]">
                    <caption className="sr-only">Spreads worked from EIA daily spot prices, in US dollars a barrel</caption>
                    <thead className="bg-ink-900">
                      <tr>
                        <th scope="col">Spread (USD/bbl)</th>
                        <th scope="col" className="text-right">Latest</th>
                        <th scope="col" className="text-right">Change on day before</th>
                        <th scope="col" className="text-right">About a month earlier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feed.spreads.map((row) => (
                        <tr key={row.key}>
                          <th scope="row" className="max-w-[340px] font-medium text-steel-200">
                            {row.label}
                            <span className="mt-0.5 block text-[10px] font-normal text-steel-500">{row.method}</span>
                          </th>
                          <td className="whitespace-nowrap text-right font-semibold text-white">
                            <Dated point={row.latest} />
                          </td>
                          <td className="whitespace-nowrap text-right">
                            {row.change == null ? <span className="text-steel-500">n/a</span> : <span className="num">{signed(row.change)}</span>}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            <Dated point={row.monthAgo} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <SpreadHistoryChart rows={feed.history} />
              </section>
            ) : null}

            {feed.spots.length ? (
              <section aria-label="Spot prices" className="space-y-4">
                <Heading title="Spot prices" accent="bg-gain" />
                <div className="overflow-x-auto rounded-lg border border-ink-700">
                  <table className="table-dark min-w-[720px]">
                    <caption className="sr-only">EIA daily spot prices</caption>
                    <thead className="bg-ink-900">
                      <tr>
                        <th scope="col">Series</th>
                        <th scope="col" className="text-right">Latest</th>
                        <th scope="col" className="text-right">Change on day before</th>
                        <th scope="col" className="text-right">About a month earlier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feed.spots.map((row) => {
                        const digits = row.unit.toUpperCase().includes("GAL") ? 3 : 2;
                        return (
                          <tr key={row.id}>
                            <th scope="row" className="max-w-[340px] font-medium text-steel-200">
                              {row.description}
                              <span className="mt-0.5 block text-[10px] font-normal text-steel-500">
                                <span className="font-mono">{row.id}</span> · {row.unit}
                              </span>
                            </th>
                            <td className="whitespace-nowrap text-right font-semibold text-white">
                              <Dated point={row.latest} digits={digits} />
                            </td>
                            <td className="whitespace-nowrap text-right">
                              {row.change == null ? (
                                <span className="text-steel-500">n/a</span>
                              ) : (
                                <span className="num">{signed(row.change, digits)}</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap text-right">
                              <Dated point={row.monthAgo} digits={digits} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div>
                  <p className="text-xs text-steel-500">Fetched {formatLondonTimestamp(feed.fetchedAt)}.</p>
                  <DataMeta
                    source="EIA spot prices"
                    sourceUrl={SPOT_URL}
                    lastUpdated={`${feed.spots.map((row) => row.latest.date).sort().at(-1)}T00:00:00Z`}
                    dataType="delayed"
                    staleAfterHours={STALE_AFTER_HOURS}
                  />
                </div>
              </section>
            ) : null}

            <section aria-label="WTI futures curve" className="space-y-4">
              <Heading title="WTI futures, contracts 1 to 4" accent="bg-risk" />
              {futures ? (
                <>
                  <div className="overflow-x-auto rounded-lg border border-ink-700">
                    <table className="table-dark min-w-[640px]">
                      <caption className="sr-only">NYMEX WTI futures contracts as published by EIA for {formatLongDate(futures.date)}</caption>
                      <thead className="bg-ink-900">
                        <tr>
                          <th scope="col">Series</th>
                          <th scope="col" className="text-right">Settlement, {formatLongDate(futures.date)}</th>
                          <th scope="col" className="text-right">Change on day before</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futures.contracts.map((row) => (
                          <tr key={row.id}>
                            <th scope="row" className="font-medium text-steel-200">
                              {row.description}
                              <span className="mt-0.5 block text-[10px] font-normal text-steel-500">
                                <span className="font-mono">{row.id}</span> · {row.unit}
                              </span>
                            </th>
                            <td className="num text-right font-semibold text-white">{amount(row.value)}</td>
                            <td className="text-right">
                              {row.change == null ? <span className="text-steel-500">n/a</span> : <span className="num">{signed(row.change)}</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {futures.nearMinusFar != null && futures.farContract != null ? (
                    <p className="text-sm text-steel-300">
                      Contract 1 minus contract {futures.farContract}:{" "}
                      <span className="num font-semibold text-white">{signed(futures.nearMinusFar)}</span> USD/bbl.{" "}
                      {futures.nearMinusFar > 0
                        ? "The near contract is priced above the later one (backwardation)."
                        : futures.nearMinusFar < 0
                          ? "The near contract is priced below the later one (contango)."
                          : "The near and later contracts are level."}
                    </p>
                  ) : null}
                  <DataMeta
                    source="EIA NYMEX futures prices"
                    sourceUrl={FUTURES_URL}
                    lastUpdated={`${futures.date}T00:00:00Z`}
                    dataType="delayed"
                    staleAfterHours={STALE_AFTER_HOURS}
                  />
                </>
              ) : (
                <div className="max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5 text-sm leading-relaxed text-steel-400">
                  <p className="font-semibold text-white">Futures curve: not shown</p>
                  <p className="mt-2">
                    {feed.futuresLastDate
                      ? `EIA's public futures series was last updated for ${formatLongDate(feed.futuresLastDate)}, which is too old to show as a current curve.`
                      : "EIA's public futures series could not be read."}{" "}
                    Current futures prices are exchange data that needs a licence, so no curve is shown here rather than
                    an out-of-date one.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5 text-sm leading-relaxed text-steel-300">
            <p className="text-lg font-semibold text-white">Prices and spreads: not loaded</p>
            <p className="mt-2 text-steel-400">
              EIA&apos;s daily prices could not be read for this page. No price or spread is shown until they can.
            </p>
          </section>
        )}

        <section aria-labelledby="read-h" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="read-h" className="text-base font-semibold text-white">
            How to read this page
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Prices are EIA&apos;s, with EIA&apos;s own series names, codes and units. EIA posts daily spot prices a
              few days after the trading day, so the latest date is not today.
            </li>
            <li>
              Each spread is our subtraction of two EIA prices for the same day. A day is left out if either price is
              missing. Product prices are quoted per gallon and multiplied by 42 to give dollars a barrel.
            </li>
            <li>
              A crack is the price of a product less the price of crude. It is a rough guide to refining margins, not a
              measure of any refinery&apos;s actual margin.
            </li>
            <li>
              Lines this page used to carry as sample values are no longer shown, because no free public feed exists
              for them: the Brent forward curve, Brent timespreads, Midland and other grade differentials, the jet
              crack and freight-adjusted arbitrage.
            </li>
            <li>The page describes prices. It does not rate anything as cheap or expensive and gives no trading view.</li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">See supply, demand and what moved most in the latest data.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/balance-engine" className="font-semibold text-gold-400 hover:text-gold-300">
              Balance Engine →
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
