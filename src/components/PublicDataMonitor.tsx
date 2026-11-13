import type { ReactNode } from "react";
import DataMeta from "@/components/DataMeta";
import { formatLongDate } from "@/lib/daily-note";
import { formatLondonTimestamp } from "@/lib/release-calendar";
import {
  headlines,
  num,
  type MonitorFeed,
  type MonitorModule,
} from "@/lib/oracle-intelligence";

/**
 * Cards for the public-data monitor. Each card is one module of
 * public/data/oracle_intelligence.json. A module that has not loaded shows
 * the reason and no figure; a value missing from a loaded module is simply
 * not drawn. Wording is descriptive: no card tells the reader what to do.
 */

function usd(value: number, digits = 2): string {
  return `$${value.toFixed(digits)}`;
}

function signed(value: number, digits = 2): string {
  const text = Math.abs(value).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

function whole(value: number): string {
  return value.toLocaleString("en-GB");
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900 p-3">
      <dt className="text-[11px] uppercase tracking-wide text-steel-500">{label}</dt>
      <dd className="num mt-1 text-lg font-semibold text-white">{value}</dd>
      {note ? <dd className="mt-0.5 text-[11px] leading-snug text-steel-500">{note}</dd> : null}
    </div>
  );
}

function Card({
  id,
  title,
  about,
  module,
  staleAfterHours,
  needs,
  children,
}: {
  id: string;
  title: string;
  about: string;
  module: MonitorModule;
  staleAfterHours: number;
  needs?: string;
  children: (values: Record<string, unknown>) => ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="card flex flex-col">
      <h2 id={id} className="text-base font-semibold text-white">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-steel-500">{about}</p>
      {module.status === "ok" ? (
        <>
          <div className="mt-4 flex-1">{children(module.values)}</div>
          {module.fetchedUtc ? (
            <p className="mt-3 text-[11px] text-steel-500">Fetched {formatLondonTimestamp(module.fetchedUtc)}.</p>
          ) : null}
          <DataMeta
            source={module.sourceName}
            sourceUrl={module.sourceUrl ?? undefined}
            lastUpdated={module.asOf.includes("T") ? module.asOf : `${module.asOf}T00:00:00Z`}
            dataType="delayed"
            staleAfterHours={staleAfterHours}
          />
        </>
      ) : (
        <div className="mt-4 flex-1 rounded border border-ink-700 bg-ink-900 p-3 text-sm leading-relaxed text-steel-300">
          <p className="font-semibold text-white">Not loaded</p>
          <p className="mt-1 text-steel-400">
            No figure is shown. Reason: {module.reason}.{needs ? ` ${needs}` : ""}
          </p>
        </div>
      )}
    </section>
  );
}

export default function PublicDataMonitor({ feed }: { feed: MonitorFeed }) {

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card
        id="pdm-prices"
        title="Spot prices, spread and crack"
        about="EIA daily spot prices. The 3-2-1 crack is two barrels of New York Harbor gasoline plus one of diesel, less three of WTI, per barrel. EIA spot series run one to three business days behind."
        module={feed.prices}
        staleAfterHours={192}
        needs="Needs a working EIA API key on the site or in the scheduled job."
      >
        {(v) => {
          const brent = num(v, "brent_usd_bbl");
          const wti = num(v, "wti_usd_bbl");
          const spread = num(v, "brent_wti_spread_usd_bbl");
          const crack = num(v, "crack_321_usd_bbl");
          const hub = num(v, "henry_hub_usd_mmbtu");
          return (
            <dl className="grid grid-cols-2 gap-2">
              {brent != null ? <Stat label="Brent spot" value={`${usd(brent)}/bbl`} /> : null}
              {wti != null ? <Stat label="WTI spot" value={`${usd(wti)}/bbl`} /> : null}
              {spread != null ? <Stat label="Brent minus WTI" value={`${signed(spread)} $/bbl`} /> : null}
              {crack != null ? <Stat label="3-2-1 crack" value={`${usd(crack)}/bbl`} note="NY Harbor products vs WTI" /> : null}
              {hub != null ? <Stat label="Henry Hub" value={`${usd(hub)}/MMBtu`} /> : null}
            </dl>
          );
        }}
      </Card>

      <Card
        id="pdm-inventories"
        title="US crude stocks"
        about="Commercial crude excluding the Strategic Petroleum Reserve, and Cushing, from the EIA weekly report. The z-score is this week against the average and spread of the weeks counted, not a seasonal norm."
        module={feed.inventories}
        staleAfterHours={288}
        needs="Needs a working EIA API key on the site or in the scheduled job."
      >
        {(v) => (
          <dl className="grid grid-cols-2 gap-2">
            {(["us_commercial_crude", "cushing"] as const).map((key) => {
              const level = num(v, `${key}.million_barrels`);
              const change = num(v, `${key}.change_million_barrels`);
              const z = num(v, `${key}.z_score`);
              const weeks = num(v, `${key}.weeks_in_comparison`);
              const name = key === "cushing" ? "Cushing" : "US commercial";
              return level == null ? null : (
                <div key={key} className="contents">
                  <Stat
                    label={name}
                    value={`${level.toFixed(1)} mb`}
                    note={change != null ? `${signed(change, 1)} mb week on week` : undefined}
                  />
                  {z != null && weeks != null ? (
                    <Stat label={`${name} z-score`} value={signed(z)} note={`vs the last ${weeks} weeks`} />
                  ) : null}
                </div>
              );
            })}
          </dl>
        )}
      </Card>

      <Card
        id="pdm-positioning"
        title="WTI futures positioning"
        about="NYMEX WTI from the CFTC Disaggregated Commitments of Traders. Positions are as of a Tuesday and published the following Friday. Net is long minus short, in contracts."
        module={feed.positioning}
        staleAfterHours={288}
      >
        {(v) => {
          const net = num(v, "managed_money_net");
          const change = num(v, "net_change");
          const share = num(v, "managed_money_net_pct_open_interest");
          const producers = num(v, "producer_merchant_net");
          const place = num(v, "net_position_in_range_pct");
          const reports = num(v, "reports_in_range");
          return (
            <>
              <dl className="grid grid-cols-2 gap-2">
                {net != null ? (
                  <Stat
                    label="Managed money net"
                    value={signed(net, 0)}
                    note={change != null ? `${signed(change, 0)} vs previous report` : undefined}
                  />
                ) : null}
                {share != null ? <Stat label="Net, share of open interest" value={`${share.toFixed(1)}%`} /> : null}
                {producers != null ? <Stat label="Producer / merchant net" value={signed(producers, 0)} /> : null}
              </dl>
              {place != null && reports != null ? (
                <div className="mt-3">
                  <p className="text-xs text-steel-400">
                    Latest net sits {place.toFixed(0)}% of the way from the lowest to the highest net of the last{" "}
                    {reports} reports.
                  </p>
                  <div
                    className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-700"
                    role="img"
                    aria-label={`${place.toFixed(0)} percent of the range`}
                  >
                    <div className="h-full bg-gold-500" style={{ width: `${Math.min(100, Math.max(0, place))}%` }} />
                  </div>
                </div>
              ) : null}
            </>
          );
        }}
      </Card>

      <Card
        id="pdm-trend"
        title="WTI price statistics"
        about="Plain averages of the EIA daily WTI spot price. The daily move is the average absolute day-to-day change over 30 trading days. These describe the past; they are not levels to trade against."
        module={feed.prices}
        staleAfterHours={192}
        needs="Needs a working EIA API key on the site or in the scheduled job."
      >
        {(v) => {
          const wti = num(v, "wti_usd_bbl");
          const fifty = num(v, "wti_50d_average_usd_bbl");
          const twoHundred = num(v, "wti_200d_average_usd_bbl");
          const move = num(v, "wti_30d_average_daily_move_usd_bbl");
          return (
            <dl className="grid grid-cols-2 gap-2">
              {wti != null ? <Stat label="WTI spot" value={`${usd(wti)}/bbl`} /> : null}
              {fifty != null ? <Stat label="50-day average" value={`${usd(fifty)}/bbl`} /> : null}
              {twoHundred != null ? <Stat label="200-day average" value={`${usd(twoHundred)}/bbl`} /> : null}
              {move != null ? <Stat label="Average daily move" value={`${usd(move)}/bbl`} note="30 trading days" /> : null}
            </dl>
          );
        }}
      </Card>

      <Card
        id="pdm-macro"
        title="Dollar and real yields"
        about="The Federal Reserve's broad dollar index and the 10-year inflation-indexed Treasury yield. Correlations are between day-to-day changes in WTI and each series, on the days both have a print. A correlation is not a cause."
        module={feed.macro}
        staleAfterHours={192}
        
      >
        {(v) => {
          const dollar = num(v, "broad_dollar_index");
          const realYield = num(v, "real_yield_10y_pct");
          const dollarCorr = num(v, "wti_vs_broad_dollar_correlation");
          const dollarDays = num(v, "wti_vs_broad_dollar_days");
          const yieldCorr = num(v, "wti_vs_real_yield_10y_correlation");
          const yieldDays = num(v, "wti_vs_real_yield_10y_days");
          return (
            <dl className="grid grid-cols-2 gap-2">
              {dollar != null ? <Stat label="Broad dollar index" value={dollar.toFixed(2)} /> : null}
              {realYield != null ? <Stat label="10-year real yield" value={`${realYield.toFixed(2)}%`} /> : null}
              {dollarCorr != null && dollarDays != null ? (
                <Stat label="WTI vs dollar" value={signed(dollarCorr)} note={`correlation, ${dollarDays} days`} />
              ) : null}
              {yieldCorr != null && yieldDays != null ? (
                <Stat label="WTI vs real yield" value={signed(yieldCorr)} note={`correlation, ${yieldDays} days`} />
              ) : null}
            </dl>
          );
        }}
      </Card>

      <Card
        id="pdm-gas"
        title="EU gas storage"
        about="How full European Union gas storage is, from the operators' transparency platform. The daily change is in percentage points."
        module={feed.gas_storage}
        staleAfterHours={96}
        needs="Needs the AGSI_API_KEY repository secret."
      >
        {(v) => {
          const full = num(v, "eu_storage_pct_full");
          const change = num(v, "daily_change_pct_points");
          return (
            <dl className="grid grid-cols-2 gap-2">
              {full != null ? <Stat label="Storage full" value={`${full.toFixed(1)}%`} /> : null}
              {change != null ? <Stat label="Daily change" value={`${signed(change)} pts`} /> : null}
            </dl>
          );
        }}
      </Card>

      <div className="md:col-span-2 xl:col-span-3">
        <Card
          id="pdm-news"
          title="Chokepoint and OPEC news volume"
          about="How much of the world's online news coverage matched a fixed list of oil-supply search terms over the last 24 hours, against the average of the last seven days. It measures attention, not risk. Headlines are matched by keyword and are not checked or endorsed by The Crude Oracle."
          module={feed.news}
          staleAfterHours={36}
        >
          {(v) => {
            const ratio = num(v, "share_last_24h_vs_7d_average");
            const terms = Array.isArray(v.search_terms) ? v.search_terms.filter((t): t is string => typeof t === "string") : [];
            const items = headlines(v);
            return (
              <div className="grid gap-4 lg:grid-cols-3">
                <dl className="grid gap-2">
                  {ratio != null ? (
                    <Stat
                      label="Last 24 hours vs 7-day average"
                      value={`${ratio.toFixed(2)}×`}
                      note={ratio >= 1 ? "More coverage than the weekly average" : "Less coverage than the weekly average"}
                    />
                  ) : null}
                  {terms.length ? (
                    <div className="rounded border border-ink-700 bg-ink-900 p-3">
                      <dt className="text-[11px] uppercase tracking-wide text-steel-500">Search terms</dt>
                      <dd className="mt-1 text-xs leading-relaxed text-steel-300">{terms.join(" · ")}</dd>
                    </div>
                  ) : null}
                </dl>
                <div className="lg:col-span-2">
                  <h3 className="text-[11px] uppercase tracking-wide text-steel-500">Recent matched headlines</h3>
                  {items.length ? (
                    <ul className="mt-2 space-y-2">
                      {items.map((item) => (
                        <li key={item.url} className="text-sm leading-snug">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-steel-200 underline decoration-ink-600 underline-offset-2 hover:text-gold-400"
                          >
                            {item.title}
                          </a>
                          <span className="ml-2 text-[11px] text-steel-500">
                            {item.domain} · {formatLongDate(item.seenUtc)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-steel-400">No headlines were returned on the last fetch.</p>
                  )}
                </div>
              </div>
            );
          }}
        </Card>
      </div>

    </div>
  );
}
