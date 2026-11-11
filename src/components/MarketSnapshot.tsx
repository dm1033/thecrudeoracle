import DataMeta from "@/components/DataMeta";
import { formatLongDate } from "@/lib/daily-note";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import { getMarketSnapshot } from "@/lib/market-snapshot";

/**
 * Tables for data/market_snapshot.json, the file the scheduled GitHub Actions
 * job writes from the public EIA and CFTC APIs. When a section has not been
 * fetched yet, the table is replaced by a plain statement that no figure is
 * shown. Nothing is filled in by hand.
 */

const CFTC_URL = "https://publicreporting.cftc.gov/d/72hh-3qpy";
const EIA_URL = "https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=WCESTUS1&f=W";

function contracts(value: number): string {
  return value.toLocaleString("en-GB");
}

function signedContracts(value: number): string {
  const text = Math.abs(value).toLocaleString("en-GB");
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : "0";
}

function signedBarrels(value: number): string {
  const text = Math.abs(value).toFixed(3);
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function tone(value: number): string {
  return value > 0 ? "text-gain" : value < 0 ? "text-loss" : "text-steel-300";
}

function NotLoaded({ what, detail }: { what: string; detail: string }) {
  return (
    <div className="mt-4 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm leading-relaxed text-steel-300">
      <p className="font-semibold text-white">{what}: not loaded yet</p>
      <p className="mt-1 text-steel-400">{detail} No figure is shown until it has.</p>
    </div>
  );
}

export function CftcManagedMoneySnapshot() {
  const { cftc } = getMarketSnapshot();
  const latest = cftc.rows[0];

  return (
    <section aria-labelledby="cftc-snapshot-h">
      <h2 id="cftc-snapshot-h" className="h2">
        CFTC print: WTI managed money
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-steel-500">
        Managed-money futures positions in NYMEX WTI (contract 067651) from the CFTC Disaggregated
        Commitments of Traders report, pulled automatically each Friday. Positions are as of the
        Tuesday shown and released the following Friday, so this is delayed data. Net is long minus
        short, in contracts.
      </p>
      {latest ? (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[720px]">
              <caption className="sr-only">
                NYMEX WTI managed-money positions by CFTC report date, newest first
              </caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Report date</th>
                  <th scope="col" className="text-right">Long</th>
                  <th scope="col" className="text-right">Short</th>
                  <th scope="col" className="text-right">Net</th>
                  <th scope="col" className="text-right">Net change</th>
                  <th scope="col" className="text-right">Spreading</th>
                  <th scope="col" className="text-right">Open interest</th>
                </tr>
              </thead>
              <tbody>
                {cftc.rows.map((row) => (
                  <tr key={row.reportDate}>
                    <th scope="row" className="whitespace-nowrap font-medium text-steel-200">
                      {formatLongDate(row.reportDate)}
                    </th>
                    <td className="num whitespace-nowrap text-right">{contracts(row.long)}</td>
                    <td className="num whitespace-nowrap text-right">{contracts(row.short)}</td>
                    <td className="num whitespace-nowrap text-right font-semibold text-white">
                      {signedContracts(row.net)}
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {row.netChange == null ? (
                        <span className="text-steel-500">n/a</span>
                      ) : (
                        <span className={`num ${tone(row.netChange)}`}>{signedContracts(row.netChange)}</span>
                      )}
                    </td>
                    <td className="num whitespace-nowrap text-right">{contracts(row.spreading)}</td>
                    <td className="num whitespace-nowrap text-right">{contracts(row.openInterest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-steel-500">
            Net change is against the previous report in this table. A larger net long is not a
            forecast and not a signal to trade.
            {cftc.fetchedAt ? ` Fetched ${formatLondonTimestamp(cftc.fetchedAt)}.` : ""}
          </p>
          <DataMeta
            source="CFTC Disaggregated Commitments of Traders, futures only"
            sourceUrl={CFTC_URL}
            lastUpdated={`${latest.reportDate}T00:00:00Z`}
            dataType="delayed"
            staleAfterHours={288}
          />
        </>
      ) : (
        <NotLoaded
          what="CFTC WTI managed-money positions"
          detail="The automated Friday pull from the CFTC public reporting API has not completed."
        />
      )}
    </section>
  );
}

export function EiaCrudeStocksSnapshot() {
  const { eia } = getMarketSnapshot();
  const latest = eia.rows[0];

  return (
    <section aria-labelledby="eia-snapshot-h">
      <h2 id="eia-snapshot-h" className="h2">
        Commercial crude stocks: recent weeks
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-steel-400">
        US commercial crude stocks excluding the Strategic Petroleum Reserve (EIA series {eia.series}),
        pulled automatically each Wednesday after the Weekly Petroleum Status Report. Week on week is
        against the previous week in this table.
      </p>
      {latest ? (
        <>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark">
              <caption className="sr-only">
                US commercial crude stocks by week ending, newest first
              </caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Week ending</th>
                  <th scope="col" className="text-right">Million barrels</th>
                  <th scope="col" className="text-right">Week on week</th>
                </tr>
              </thead>
              <tbody>
                {eia.rows.map((row) => (
                  <tr key={row.weekEnding}>
                    <th scope="row" className="whitespace-nowrap font-medium text-steel-200">
                      {formatLongDate(row.weekEnding)}
                    </th>
                    <td className="num whitespace-nowrap text-right text-white">{row.millionBarrels.toFixed(3)}</td>
                    <td className="whitespace-nowrap text-right">
                      {row.changeMillionBarrels == null ? (
                        <span className="text-steel-500">n/a</span>
                      ) : (
                        <span className={`num ${tone(row.changeMillionBarrels)}`}>
                          {signedBarrels(row.changeMillionBarrels)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {eia.fetchedAt ? (
            <p className="mt-2 text-xs text-steel-500">Fetched {formatLondonTimestamp(eia.fetchedAt)}.</p>
          ) : null}
          <DataMeta
            source="EIA Weekly Petroleum Status Report"
            sourceUrl={EIA_URL}
            lastUpdated={`${latest.weekEnding}T00:00:00Z`}
            dataType="delayed"
            staleAfterHours={288}
          />
        </>
      ) : (
        <NotLoaded
          what="Recent-weeks crude stocks history"
          detail="The automated Wednesday pull from the EIA Open Data API has not completed."
        />
      )}
    </section>
  );
}
