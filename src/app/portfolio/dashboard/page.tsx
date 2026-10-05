import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import portfolioData from "../../../../data/virtual-portfolio.json";
import type { FundFile } from "@/lib/paper-fund";
import PageHeader from "@/components/PageHeader";
import PaperTradingDisclaimer from "@/components/PaperTradingDisclaimer";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import {
  ActiveTrades,
  Committee,
  FundChart,
  OpportunityTable,
  PerformanceBlock,
  RulesAndBrief,
  TradingDesk,
  WeeklyReportBlock,
} from "@/components/paper-fund/DeskSections";

const fund = portfolioData as FundFile;

export const metadata: Metadata = pageMeta(
  "Oracle Trading Desk — $10M Paper Fund",
  "Live paper-fund desk: NAV, open risk, weekly ranking, investment committee and the permanent performance record. Virtual capital only.",
  "/portfolio/dashboard",
);

export default function PortfolioDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Oracle Trading Desk · Paper capital only"
        title={fund.meta.name}
        intro={fund.meta.objective}
      />
      <div className="container-site space-y-12 py-10">
        <PaperTradingDisclaimer />
        <TradingDesk fund={fund} />
        <FundChart fund={fund} />
        <ActiveTrades positions={fund.positions} />
        <OpportunityTable rows={fund.opportunities} />
        <WeeklyReportBlock fund={fund} />
        <Committee fund={fund} />

        <section aria-labelledby="journal-h">
          <h2 id="journal-h" className="h2">
            Decision journal
          </h2>
          <p className="mt-1 text-sm text-steel-500">
            Written at the decision. Later weeks can add a comment. They cannot replace this text.
          </p>
          <div className="mt-4 space-y-4">
            {fund.trade_log.map((t) => (
              <article key={t.trade_id} className="card">
                <header className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-gold-400">{t.trade_id}</span>
                  <span className="text-xs text-steel-500">{t.timestamp ?? t.date}</span>
                  <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-bold uppercase text-steel-300">{t.decision}</span>
                  <span className="ml-auto text-[11px] text-steel-400">{t.confidence}</span>
                </header>
                <h3 className="mt-2 text-base font-semibold text-white">{t.asset}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-300">{t.thesis}</p>
                <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-steel-500">Evidence in favour</dt>
                    <dd className="mt-1 text-steel-400">{t.supporting_data}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-loss">Why it could be wrong</dt>
                    <dd className="mt-1 text-steel-400">{t.why_it_could_be_wrong}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-steel-500">Stop / target</dt>
                    <dd className="mt-1 text-steel-300">{t.stop_loss} · {t.target}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold uppercase tracking-wide text-steel-500">Invalidation</dt>
                    <dd className="mt-1 text-steel-400">{t.invalidation}</dd>
                  </div>
                </dl>
                <p className="mt-3 border-t border-ink-700 pt-2 text-[11px] text-steel-500">Sources: {t.sources.join(" · ")}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="alloc-h">
          <h2 id="alloc-h" className="h2">
            Allocation
          </h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[640px]">
              <caption className="sr-only">Target sleeves against actual exposure</caption>
              <thead className="bg-ink-900">
                <tr>
                  <th scope="col">Sleeve</th>
                  <th scope="col" className="text-right">Target</th>
                  <th scope="col" className="text-right">Actual</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {fund.allocation.map((a) => (
                  <tr key={a.category}>
                    <td className="font-medium text-steel-300">{a.category}</td>
                    <td className="num text-right">{a.target_pct}%</td>
                    <td className="num text-right text-white">{a.actual_pct}%</td>
                    <td className="text-xs">{a.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="brief-h">
          <h2 id="brief-h" className="h2">
            {fund.daily_brief.title}
          </h2>
          <div className="mt-4 card">
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {fund.daily_brief.sections.map((s) => (
                <div key={s.n}>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gold-500">
                    {s.n} · {s.label}
                  </h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-steel-400">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PerformanceBlock fund={fund} />
        <RulesAndBrief fund={fund} />

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/portfolio/report" className="font-semibold text-gold-400 hover:text-gold-300">
            Formal week report →
          </Link>
          <Link href="/portfolio/archive" className="font-semibold text-gold-400 hover:text-gold-300">
            Archive →
          </Link>
          <Link href="/portfolio" className="font-semibold text-gold-400 hover:text-gold-300">
            Public summary →
          </Link>
        </div>
        <PaperTradingDisclaimer />
        <DisclaimerBlock />
      </div>
    </>
  );
}
