import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import DataMeta from "@/components/DataMeta";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { formatSteoMonth, getSteoFeed, type SteoRow } from "@/lib/steo";

export const revalidate = 7200;

export const metadata: Metadata = pageMeta(
  "Global oil balance engine",
  "World oil supply, demand and stocks from the EIA Short-Term Energy Outlook: the latest estimated month, the same month a year earlier and EIA's forecast. Public data, dated and sourced. Not financial advice.",
  "/tools/balance-engine"
);

const STEO_URL = "https://www.eia.gov/outlooks/steo/";

/** A month's data is still current until the STEO after next has had time to publish. */
const STALE_AFTER_HOURS = 24 * 75;

function amount(value: number): string {
  const digits = Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 100 ? 1 : 2;
  return value.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function signed(value: number): string {
  const text = amount(Math.abs(value));
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function Group({ title, accent, rows }: { title: string; accent: string; rows: SteoRow[] }) {
  if (!rows.length) return null;
  return (
    <section aria-label={title}>
      <div className="flex items-center gap-2">
        <span aria-hidden className={`h-3 w-1 rounded-full ${accent}`} />
        <h2 className="h2">{title}</h2>
      </div>
      <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
        <table className="table-dark min-w-[760px]">
          <caption className="sr-only">{title}: EIA Short-Term Energy Outlook series</caption>
          <thead className="bg-ink-900">
            <tr>
              <th scope="col">Series</th>
              <th scope="col" className="text-right">Latest estimate</th>
              <th scope="col" className="text-right">Year earlier</th>
              <th scope="col" className="text-right">Change on year</th>
              <th scope="col" className="text-right">EIA forecast</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" className="max-w-[320px] font-medium text-steel-200">
                  {row.description}
                  <span className="mt-0.5 block text-[10px] font-normal text-steel-500">
                    <span className="font-mono">{row.id}</span> · {row.unit}
                  </span>
                </th>
                <td className="whitespace-nowrap text-right">
                  <span className="num font-semibold text-white">{amount(row.latest.value)}</span>
                  <span className="mt-0.5 block text-[10px] text-steel-500">{formatSteoMonth(row.latest.period)}</span>
                </td>
                <td className="whitespace-nowrap text-right">
                  {row.yearAgo ? (
                    <>
                      <span className="num">{amount(row.yearAgo.value)}</span>
                      <span className="mt-0.5 block text-[10px] text-steel-500">{formatSteoMonth(row.yearAgo.period)}</span>
                    </>
                  ) : (
                    <span className="text-steel-500">n/a</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-right">
                  {row.changeOnYear == null ? (
                    <span className="text-steel-500">n/a</span>
                  ) : (
                    <span className="num">{signed(row.changeOnYear)}</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-right">
                  {row.forecast ? (
                    <>
                      <span className="num">{amount(row.forecast.value)}</span>
                      <span className="mt-0.5 block text-[10px] text-steel-500">{formatSteoMonth(row.forecast.period)}</span>
                    </>
                  ) : (
                    <span className="text-steel-500">n/a</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function BalanceEnginePage() {
  const feed = await getSteoFeed();
  const supply = feed?.rows.filter((row) => row.role === "world_supply" || row.role === "supply") ?? [];
  const demand = feed?.rows.filter((row) => row.role === "world_demand" || row.role === "demand") ?? [];
  const stocks = feed?.rows.filter((row) => row.role === "stocks") ?? [];
  const balance = feed?.balance ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 1"
        title="Global Balance Engine"
        intro="World oil supply, demand and stocks on one screen, taken from the U.S. Energy Information Administration's Short-Term Energy Outlook. Each line shows the latest estimated month, the same month a year earlier and EIA's own forecast."
      />
      <div className="container-site space-y-10 py-10">
        {feed ? (
          <>
            {balance ? (
              <section
                aria-label="World balance"
                className="rounded-lg border border-gold-600/40 bg-gradient-to-r from-navy-900 to-ink-900 p-5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-steel-500">
                  EIA estimate for {formatSteoMonth(balance.period)}
                </p>
                <dl className="mt-3 grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">World supply</dt>
                    <dd className="num mt-1 text-2xl font-bold text-white">{amount(balance.supply)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">World demand</dt>
                    <dd className="num mt-1 text-2xl font-bold text-white">{amount(balance.demand)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
                      Supply minus demand
                    </dt>
                    <dd className="num mt-1 text-2xl font-bold text-white">{signed(balance.balance)}</dd>
                    <dd className="mt-0.5 text-[11px] text-steel-400">
                      {balance.balance > 0
                        ? "Supply above demand: stocks implied to build"
                        : balance.balance < 0
                          ? "Demand above supply: stocks implied to draw"
                          : "Supply and demand level"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] text-steel-500">
                  In {balance.unit}. The difference is our subtraction of EIA&apos;s two figures; EIA&apos;s own stock
                  change can differ because of rounding and statistical adjustments.
                </p>
              </section>
            ) : null}

            <Group title="Supply" accent="bg-gold-500" rows={supply} />
            <Group title="Demand" accent="bg-gain" rows={demand} />
            <Group title="Stocks" accent="bg-risk" rows={stocks} />

            <div>
              <p className="text-xs text-steel-500">Fetched {formatLondonTimestamp(feed.fetchedAt)}.</p>
              <DataMeta
                source="EIA Short-Term Energy Outlook"
                sourceUrl={STEO_URL}
                lastUpdated={`${feed.asOf}-01T00:00:00Z`}
                dataType="delayed"
                staleAfterHours={STALE_AFTER_HOURS}
              />
            </div>
          </>
        ) : (
          <section className="max-w-3xl rounded-lg border border-ink-700 bg-ink-900 p-5 text-sm leading-relaxed text-steel-300">
            <p className="text-lg font-semibold text-white">World balance: not loaded</p>
            <p className="mt-2 text-steel-400">
              The EIA Short-Term Energy Outlook could not be read for this page. No supply, demand or stock figure is
              shown until it can.
            </p>
          </section>
        )}

        <section aria-labelledby="read-h" className="card text-sm leading-relaxed text-steel-400">
          <h2 id="read-h" className="text-base font-semibold text-white">
            How to read this page
          </h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5">
            <li>
              Every figure is EIA&apos;s. Months before the current one are EIA estimates, which EIA revises; the
              forecast column is EIA&apos;s forecast for three months after the latest estimate. Neither is a forecast
              by The Crude Oracle.
            </li>
            <li>Series names and units are shown as EIA publishes them, with the EIA series code beneath.</li>
            <li>
              The outlook is published once a month, so this page moves monthly. Weekly US stocks are on the{" "}
              <Link href="/eia-weekly" className="underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
                EIA weekly page
              </Link>
              .
            </li>
            <li>
              Lines this page used to carry as sample values are no longer shown, because no free public feed exists
              for them: sanctioned-barrel exports, unplanned outages, floating storage, China and India crude imports,
              and global refinery runs.
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">See what moved most in the latest data.</span>
          <div className="flex flex-wrap gap-4">
            <Link href="/tools/what-changed" className="font-semibold text-gold-400 hover:text-gold-300">
              What Changed →
            </Link>
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
