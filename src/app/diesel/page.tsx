import type { Metadata } from "next";
import Link from "next/link";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { CrackChart, StocksChart, UtilizationSpark } from "@/components/diesel/DieselCharts";
import PaddSchematic from "@/components/diesel/PaddSchematic";
import { getDieselPage } from "@/lib/diesel-desk";
import {
  CRACK_321_FORMULA,
  CRACK_BRENT_FORMULA,
  CRACK_WTI_FORMULA,
  GASOIL_CRACK_FORMULA,
  MODEL_RULES,
} from "@/lib/diesel-series";
import { DIESEL_SETUPS } from "@/lib/diesel-setups";
import { pageMeta } from "@/lib/seo";
import type { DarkRow, PaddRow } from "@/lib/diesel-assemble";

export const metadata: Metadata = pageMeta(
  "Diesel desk — ULSD, gasoil, the crack",
  "US distillate stocks, diesel demand, refinery runs and the ULSD crack. Daily model forecast from public EIA prints. Not a buy ticket.",
  "/diesel",
);

function n(value: number | null | undefined, digits: number): string {
  if (value == null || Number.isNaN(value)) return "TBC";
  return value.toFixed(digits);
}

function signed(value: number | null, digits: number): string {
  if (value == null) return "TBC";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}`;
}

function reason(dark: DarkRow[], id: string): string {
  return dark.find((row) => row.id === id)?.reason ?? "Unconfirmed. Left dark.";
}

function Tape({
  label,
  value,
  stamp,
  dark = false,
}: {
  label: string;
  value: string;
  stamp: string;
  dark?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${dark ? "border-dashed border-ink-600 bg-ink-900" : "border-ink-700 bg-ink-850"}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-steel-500">{label}</p>
      <p className={`num mt-1 text-xl font-bold ${dark ? "uppercase text-steel-500" : "text-white"}`}>{value}</p>
      <p className="mt-1 text-[11px] leading-snug text-steel-500">{stamp}</p>
    </div>
  );
}

function paddChange(row: PaddRow): string {
  if (row.wowMb == null) return "TBC";
  const word = row.wowMb < 0 ? "draw" : row.wowMb > 0 ? "build" : "flat";
  return `${signed(row.wowMb, 3)} mb ${word}`;
}

export default function DieselPage() {
  const { view, forecast } = getDieselPage();
  const bias = forecast.forecast.bias;
  const biasClass = bias === "Tight" ? "text-risk" : bias === "Loose" ? "text-gain" : "text-steel-300";
  const padd1 = view.padd.find((row) => row.id === "WDISTP11");
  const coverTight =
    view.daysOfCover != null && view.coverMedian != null && view.daysOfCover < view.coverMedian;

  const setupPrint: Record<string, string> = {
    outright: `Week ending ${view.asOf ?? "TBC"}: stocks ${n(view.stocksMb, 3)} mb against a five-year average of ${n(view.fiveYearAvgMb, 3)} mb. Days of cover ${n(view.daysOfCover, 1)} against a three-year median of ${n(view.coverMedian, 1)}. ${view.belowFiveYear ? "Stocks sit under the five-year." : "Stocks are above the five-year average."} ${coverTight ? "Cover is compressed." : "Cover is not under the median."}`,
    crack: `Utilization ${n(view.utilization, 1)}%. Gross inputs ${n(view.grossInputsKb, 0)} kb/d. Distillate yield ${n(view.yieldPct, 1)}%. NYH ULSD spot crack versus WTI ${n(view.crackWti, 2)} $/bbl on ${view.crackAsOf ?? "TBC"}.`,
    winter: `PADD 1 ${n(padd1?.stocksMb, 3)} mb for the week ending ${padd1?.asOf ?? "TBC"}. ${view.padd1SeasonalLow ? "That is a seasonal low for this ISO week." : "That is not a seasonal low for this ISO week."} Heating season on the East Coast is October through March.`,
  };

  return (
    <>
      <header className="border-b border-ink-700 bg-ink-900">
        <div className="container-site py-8 sm:py-10">
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3">
              <p className="eyebrow">Middle distillates</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Diesel is the short product.
              </h1>
              <p className="mt-3 inline-flex rounded border border-gold-600/50 bg-ink-950 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-300">
                Print, not a ticket. Delayed marks. Not for execution.
              </p>
              <p className={`mt-4 text-lg font-semibold ${biasClass}`}>
                {forecast.forecast.rule}
              </p>
              <p className="mt-1 text-xs text-steel-500">
                Model run {forecast.runAtUtc} · {forecast.runAtLondon}. Next EIA window {forecast.nextWindow}
                {view.nextReleaseDate ? ` · file date ${view.nextReleaseDate}` : ""}. Week ending {view.asOf ?? "TBC"}.
              </p>
            </div>
            <section id="forecast" aria-labelledby="forecast-h" className="mt-6 rounded-lg border border-gold-600/40 bg-ink-950 p-4 lg:col-span-2 lg:mt-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-400">MODEL</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">{forecast.forecast.confidence} confidence</p>
              </div>
              <h2 id="forecast-h" className={`mt-2 text-2xl font-bold ${biasClass}`}>
                {bias}
              </h2>
              <p className="mt-1 text-sm text-steel-300">
                Crack bias <span className="font-semibold text-white">{forecast.forecast.crackBias}</span>
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-steel-400">
                <li>{forecast.forecast.supply}</li>
                <li>{forecast.forecast.demand}</li>
                <li>{forecast.forecast.refining}</li>
              </ul>
              <p className="mt-3 text-sm text-steel-300">{forecast.forecast.flip}</p>
              <p className="mt-3 text-sm leading-relaxed text-white">{forecast.forecast.line}</p>
              <p className="mt-3 text-[11px] text-steel-500">
                Sources {forecast.sources.join(", ")}. Next window {forecast.nextWindow}.
              </p>
              <details className="mt-3 text-xs leading-relaxed text-steel-500">
                <summary className="cursor-pointer font-semibold text-steel-300">Method. The rule, in the open.</summary>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {MODEL_RULES.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
              </details>
            </section>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-steel-300">
            {view.belowFiveYear
              ? "Distillate is the short product. Crude is not the story. Stocks sit under the five-year. The crack is the expression. This is a print, not a ticket."
              : `Distillate is the short product. Stocks are ${n(view.stocksMb, 1)} mb against a five-year average of ${n(view.fiveYearAvgMb, 1)} mb for this week. The crack is the expression. This is a print, not a ticket.`}
          </p>

          {view.fail ? (
            <p className="mt-4 rounded border border-risk/50 bg-loss/15 px-3 py-2 text-sm text-steel-300" role="status">
              Last pull failed. Showing the last good print. {view.fail}
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tape
              label="NYH ULSD spot"
              value={view.nyh ? `$${view.nyh.value.toFixed(3)}` : "TBC"}
              stamp={
                view.nyh
                  ? `EIA ${view.nyh.id} · $/gal · as of ${view.nyh.period}`
                  : "EER_EPD2DXL0_PF4_Y35NY_DPG dark"
              }
              dark={!view.nyh}
            />
            <Tape
              label="USGC ULSD spot"
              value={view.usgc ? `$${view.usgc.value.toFixed(3)}` : "TBC"}
              stamp={
                view.usgc
                  ? `EIA ${view.usgc.id} · $/gal · as of ${view.usgc.period}`
                  : "EER_EPD2DXL0_PF4_RGC_DPG dark"
              }
              dark={!view.usgc}
            />
            <Tape label="HO front" value="dark" stamp={reason(view.dark, "HO")} dark />
            <Tape label="ICE LS gasoil" value="dark" stamp={reason(view.dark, "ICE_GASOIL")} dark />
            <Tape
              label="ULSD crack vs WTI"
              value={view.crackWti == null ? "TBC" : `${view.crackWti.toFixed(2)} $/bbl`}
              stamp={`${CRACK_WTI_FORMULA} · as of ${view.crackAsOf ?? "TBC"}`}
              dark={view.crackWti == null}
            />
            <Tape
              label="ULSD crack vs Brent"
              value={view.crackBrent == null ? "TBC" : `${view.crackBrent.toFixed(2)} $/bbl`}
              stamp={`${CRACK_BRENT_FORMULA} · as of ${view.crackAsOf ?? "TBC"}`}
              dark={view.crackBrent == null}
            />
            <Tape
              label="US on-highway diesel"
              value={view.retail ? `$${view.retail.value.toFixed(3)}` : "TBC"}
              stamp={
                view.retail
                  ? `EIA ${view.retail.id} · $/gal · week of ${view.retail.period}`
                  : "EMD_EPD2D_PTE_NUS_DPG dark"
              }
              dark={!view.retail}
            />
            <Tape
              label="USGC crack vs WTI"
              value={view.crackUsgcWti == null ? "TBC" : `${view.crackUsgcWti.toFixed(2)} $/bbl`}
              stamp="(USGC ULSD $/gal × 42) − WTI $/bbl · EER_EPD2DXL0_PF4_RGC_DPG − RWTC"
              dark={view.crackUsgcWti == null}
            />
          </div>
        </div>
      </header>

      <div className="container-site space-y-10 py-8">
        <section aria-labelledby="supply-h" className="space-y-4">
          <h2 id="supply-h" className="h2">
            Supply
          </h2>
          <p className="max-w-3xl text-sm text-steel-400">
            WPSR heartbeat is Wednesday 10:30 ET, for the week ending the prior Friday. I date the print by the week ending, {view.asOf ?? "TBC"}. Release date {view.releaseDate ?? "TBC"}.
          </p>
          <StocksChart points={view.charts.stocks} />
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="card">
              <h3 className="h3">Days of cover</h3>
              <p className="num mt-2 text-3xl font-bold text-white">{n(view.daysOfCover, 1)}</p>
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                Ending stocks {n(view.stocksThousand, 0)} thousand barrels ÷ trailing four-week average product supplied {n(view.suppliedAvg4, 0)} kb/d. Same unit. Three-year median {n(view.coverMedian, 1)} days. WDISTUS1 and WDIUPUS2.
              </p>
            </article>
            <article className="card">
              <h3 className="h3">Sulfur split</h3>
              <ul className="mt-2 space-y-1 text-sm text-steel-400">
                {view.sulfur.map((row) => (
                  <li key={row.id} className="flex justify-between gap-3">
                    <span>{row.label}</span>
                    <span className="num text-white">
                      {n(row.mb, 3)} mb · {row.share == null ? "TBC" : `${(row.share * 100).toFixed(1)}%`}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-steel-500">
                WD0ST_NUS_1, WD1ST_NUS_1, WDGSTUS1. Thousand barrels ÷ 1,000. The three grades sum to {n(view.sulfurSumThousand == null ? null : view.sulfurSumThousand / 1000, 3)} mb. WDISTUS1 is {n(view.stocksMb, 3)} mb. The barrel gap is rounding.
              </p>
            </article>
            <article className="card">
              <h3 className="h3">Distillate exports</h3>
              <p className="num mt-2 text-3xl font-bold text-white">{n(view.exportsKb, 0)} <span className="text-base font-semibold text-steel-400">kb/d</span></p>
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                WDIEXUS2, week ending {view.asOf ?? "TBC"}. The Gulf is the export refinery centre. Exports are the demand valve on the USGC barrel.
              </p>
            </article>
          </div>

          <div className="overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[720px]">
              <caption className="sr-only">PADD distillate stocks, million barrels</caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Region</th>
                  <th scope="col">Series</th>
                  <th scope="col" className="text-right">Stocks mb</th>
                  <th scope="col" className="text-right">Week on week</th>
                  <th scope="col" className="text-right">Year ago</th>
                </tr>
              </thead>
              <tbody>
                {view.padd.map((row) => (
                  <tr key={row.id}>
                    <th scope="row" className="font-medium text-steel-300">
                      {row.name}
                      {row.stress ? <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-gold-400">Stress book</span> : null}
                    </th>
                    <td className="num text-xs">{row.id}</td>
                    <td className="num text-right text-white">{n(row.stocksMb, 3)}</td>
                    <td className={`num text-right ${row.wowMb != null && row.wowMb < 0 ? "text-loss" : "text-gain"}`}>{paddChange(row)}</td>
                    <td className="num text-right">
                      {n(row.yearAgoMb, 3)}
                      <span className="ml-2 text-[11px] text-steel-500">{row.yearAgoPeriod ?? ""}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-steel-500">EIA thousand barrels ÷ 1,000. As-of {view.asOf ?? "TBC"}. Table 4 stocks.</p>

          <details className="card">
            <summary className="cursor-pointer text-sm font-semibold text-white">PADD 1 disclosure — New England, Central Atlantic, Lower Atlantic</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="table-dark min-w-[640px]">
                <thead>
                  <tr>
                    <th scope="col">Sub-PADD</th>
                    <th scope="col">Series</th>
                    <th scope="col" className="text-right">Stocks mb</th>
                    <th scope="col" className="text-right">Week on week</th>
                    <th scope="col" className="text-right">Year ago</th>
                  </tr>
                </thead>
                <tbody>
                  {view.subPadd.map((row) => (
                    <tr key={row.id}>
                      <th scope="row" className="font-medium text-steel-300">{row.name}</th>
                      <td className="num text-xs">{row.id}</td>
                      <td className="num text-right text-white">{n(row.stocksMb, 3)}</td>
                      <td className="num text-right">{paddChange(row)}</td>
                      <td className="num text-right">{n(row.yearAgoMb, 3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <PaddSchematic rows={view.padd} />
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="card border-dashed">
              <h3 className="h3">Europe — ARA</h3>
              <p className="mt-2 text-sm font-bold uppercase text-steel-500">dark</p>
              <p className="mt-2 text-xs text-steel-500">{reason(view.dark, "ARA")}</p>
            </article>
            <article className="card border-dashed">
              <h3 className="h3">Asia — Singapore</h3>
              <p className="mt-2 text-sm font-bold uppercase text-steel-500">dark</p>
              <p className="mt-2 text-xs text-steel-500">{reason(view.dark, "SINGAPORE")}</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="demand-h" className="space-y-4">
          <h2 id="demand-h" className="h2">
            Demand
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-steel-400">
            Product supplied is my demand proxy. It is the weekly WPSR figure, in kb/d. It is not metered end-use. Heating season sits on PADD 1 from October through March. Freight and agriculture pull distillate year-round in PADD 2 and PADD 3. I am not running a degree-day model on this print.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="card">
              <h3 className="h3">Product supplied</h3>
              <p className="num mt-2 text-3xl font-bold text-white">
                {n(view.productSupplied, 0)} <span className="text-base font-semibold text-steel-400">kb/d</span>
              </p>
              <p className="mt-1 text-[11px] text-steel-500">WDIUPUS2 · week ending {view.asOf ?? "TBC"} · proxy, not metered end-use</p>
              <table className="table-dark mt-3">
                <caption className="sr-only">Recent distillate product supplied</caption>
                <thead>
                  <tr>
                    <th scope="col">Week ending</th>
                    <th scope="col" className="text-right">kb/d</th>
                  </tr>
                </thead>
                <tbody>
                  {view.suppliedRecent.map((row) => (
                    <tr key={row.period}>
                      <td>{row.period}</td>
                      <td className="num text-right text-white">{row.value.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
            <article className="card space-y-3">
              <h3 className="h3">Dark on this run</h3>
              <p className="text-sm text-steel-400">
                Monthly EIA product supplied would be the cleaner demand proxy. I do not have a confirmed monthly series id on this run, so that line stays <span className="font-semibold uppercase">dark</span>.
              </p>
              <p className="text-sm text-steel-400">
                Export pull is {n(view.exportsKb, 0)} kb/d, WDIEXUS2. USGC stocks are the barrel that can leave.
              </p>
              <p className="text-sm text-steel-400">
                <span className="font-semibold uppercase text-steel-500">World balance dark.</span> {reason(view.dark, "IEA_BALANCE")}
              </p>
            </article>
          </div>
        </section>

        <section aria-labelledby="refining-h" className="space-y-4">
          <h2 id="refining-h" className="h2">
            Refining
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <article className="card">
              <h3 className="h3">Gross inputs</h3>
              <p className="num mt-2 text-3xl font-bold text-white">
                {n(view.grossInputsKb, 0)} <span className="text-base font-semibold text-steel-400">kb/d</span>
              </p>
              <p className="mt-2 text-xs text-steel-500">WGIRIUS2 · week ending {view.asOf ?? "TBC"}</p>
            </article>
            <article className="card">
              <h3 className="h3">Utilization</h3>
              <p className="num mt-2 text-3xl font-bold text-white">{n(view.utilization, 1)}%</p>
              <UtilizationSpark points={view.charts.utilization} />
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                WPULEUS3. Operable crude distillation capacity {n(view.operableKb, 0)} thousand barrels per calendar day, WOCLEUS2. That capacity is the EIA footnote under the utilization rate.
              </p>
            </article>
            <article className="card">
              <h3 className="h3">Distillate yield</h3>
              <p className="num mt-2 text-3xl font-bold text-white">{n(view.yieldPct, 1)}%</p>
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                Production {n(view.productionKb, 0)} kb/d, WDIRPUS2, divided by gross inputs. Yield moves when the barrel is pointed at diesel — hydrocracker and coker — rather than gasoline in the FCC.
              </p>
            </article>
          </div>
          <CrackChart daily={view.charts.crack1y} weekly={view.charts.crack5y} />
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="card border-dashed">
              <h3 className="h3">Gasoil crack</h3>
              <p className="mt-2 text-sm font-bold uppercase text-steel-500">dark</p>
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                {GASOIL_CRACK_FORMULA}. The 7.45 converts tonnes to barrels. {reason(view.dark, "ICE_GASOIL")}
              </p>
            </article>
            <article className="card">
              <h3 className="h3">3-2-1</h3>
              <p className="mt-2 text-sm leading-relaxed text-steel-300">{CRACK_321_FORMULA}</p>
              <p className="mt-2 text-xs leading-relaxed text-steel-500">
                I state the formula here. I do not rebuild the crack board. The indicative product-crack sample stays on the curve monitor. RBOB is not in this free book, so I do not print a 3-2-1 number.
              </p>
              <Link href="/tools/curve-monitor" className="mt-3 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
                Curve monitor →
              </Link>
            </article>
          </div>
        </section>

        <section aria-labelledby="trade-h" className="card">
          <h2 id="trade-h" className="h2">
            How the desk expresses it.
          </h2>
          <p className="mt-2 text-sm text-steel-400">Illustrative. Not a recommendation. No size. No order.</p>
          <ol className="mt-4 space-y-4">
            {DIESEL_SETUPS.map((setup, index) => (
              <li key={setup.id} className="rounded-lg border border-ink-700 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gold-500">Setup {index + 1}</p>
                <h3 className="mt-1 text-base font-semibold text-white">{setup.title}</h3>
                <p className="mt-2 text-sm text-steel-300">
                  <span className="font-semibold text-white">Print. </span>
                  {setupPrint[setup.id]}
                </p>
                <p className="mt-2 text-sm text-steel-300">
                  <span className="font-semibold text-white">Expression. </span>
                  {setup.expression}
                </p>
                <p className="mt-1 text-xs text-steel-500">{setup.when}</p>
                <p className="mt-2 text-sm text-steel-300">
                  <span className="font-semibold text-white">Invalidation. </span>
                  {setup.invalidation}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-steel-500">
            Winter versus spring HO calendar: dark. No free delayed settle series is in this repo, so the curve stays blank. The $10,000,000 paper book watched the HO crack and holds no HO line.
          </p>
        </section>

        {view.news.length > 0 ? (
          <section aria-labelledby="news-h">
            <h2 id="news-h" className="h2">
              News to the desk
            </h2>
            <ul className="mt-4 space-y-3">
              {view.news.map((item) => (
                <li key={item.url} className="card">
                  <a href={item.url} className="font-semibold text-gold-400 hover:text-gold-300" rel="noreferrer" target="_blank">
                    {item.title}
                  </a>
                  <p className="mt-1 text-[11px] text-steel-500">
                    {item.source} · {item.time}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="sources-h">
          <h2 id="sources-h" className="h2">
            Sources
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[760px]">
              <caption className="sr-only">Diesel desk sources</caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Source</th>
                  <th scope="col">Cadence</th>
                  <th scope="col">Last print</th>
                  <th scope="col">Next window</th>
                  <th scope="col">Used for</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href="https://www.eia.gov/petroleum/supply/weekly/">EIA WPSR</a>
                  </td>
                  <td>Weekly, Wednesday 10:30 ET</td>
                  <td className="num">{view.asOf ?? "TBC"}</td>
                  <td>{view.nextReleaseDate ?? "TBC"} · 10:30 ET</td>
                  <td>Stocks, product supplied, production, exports, runs, utilization. Tables 4 and 6.</td>
                </tr>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href={view.nyh?.sourceUrl ?? "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm"}>EIA spots</a>
                  </td>
                  <td>Daily navigator file</td>
                  <td className="num">{view.nyh?.period ?? "TBC"}</td>
                  <td>{view.spotsNext ?? "TBC"}</td>
                  <td>NYH and USGC ULSD, WTI, Brent. The spot crack legs.</td>
                </tr>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href="https://www.eia.gov/petroleum/gasdiesel/">EIA retail diesel</a>
                  </td>
                  <td>Weekly Gasoline and Diesel Fuel Update</td>
                  <td className="num">{view.retail?.period ?? "TBC"}</td>
                  <td>{view.retailNext ?? "TBC"}</td>
                  <td>US on-highway diesel, EMD_EPD2D_PTE_NUS_DPG.</td>
                </tr>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href="https://www.eia.gov/outlooks/steo/">EIA STEO</a>
                  </td>
                  <td>Monthly</td>
                  <td>dark</td>
                  <td>TBC</td>
                  <td>{reason(view.dark, "STEO")}</td>
                </tr>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href="https://www.cmegroup.com/markets/energy/refined-products/heating-oil.html">CME HO</a>
                  </td>
                  <td>Delayed, if the desk already has it</td>
                  <td>dark</td>
                  <td>TBC</td>
                  <td>{reason(view.dark, "HO")}</td>
                </tr>
                <tr>
                  <td>
                    <a className="text-gold-400 hover:text-gold-300" href="https://www.ice.com/products/243/Low-Sulphur-Gasoil-Futures">ICE gasoil</a>
                  </td>
                  <td>Delayed, if the desk already has it</td>
                  <td>dark</td>
                  <td>TBC</td>
                  <td>{reason(view.dark, "ICE_GASOIL")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs leading-relaxed text-steel-500">
          Commentary only. Not financial advice. Capital at risk. Verify every print against the primary source.
        </p>
        <DisclaimerBlock />
      </div>
    </>
  );
}
