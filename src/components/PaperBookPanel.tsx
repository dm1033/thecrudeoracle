"use client";

import Link from "next/link";
import portfolioData from "../../data/virtual-portfolio.json";
import type { FundFile } from "@/lib/paper-fund";
import { pct, toneClass, usd } from "@/lib/paper-fund";
import EquityCurve from "@/components/paper-fund/EquityCurve";

const fund = portfolioData as FundFile;
const { account, meta } = fund;
const totalPl = account.realised_pl + account.unrealised_pl;
const top = fund.opportunities[0];

const statement = [
  ["Opening value", usd(account.starting_value), meta.inception],
  ["Realised P&L", usd(account.realised_pl, true), `${account.closed_trades} closed`],
  ["Open P&L", usd(account.unrealised_pl, true), `${account.open_positions} open`],
  ["Closing value", usd(account.current_value), account.last_updated.slice(0, 10)],
  ["Cash", usd(account.cash_balance), `${account.cash_pct}% of NAV`],
] as const;

export default function PaperBookPanel() {
  return (
    <section className="border-b border-ink-700 bg-ink-900" id="paper-book">
      <div className="container-site py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Paper trading · USD · virtual capital</p>
            <h2 className="h2 mt-1">The $10,000,000 paper fund</h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-steel-500">{fund.meta.week} · {account.last_updated.slice(0, 10)}</p>
            <Link href="/portfolio/dashboard" className="mt-1 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
              Trading desk →
            </Link>
          </div>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-400">
          Inception {meta.inception}. NAV {usd(account.current_value)} ({pct(account.return_pct)}). Week 41 opened the ledger and did not open a position. The best-ranked idea, {top.market}, scored {top.confidence} and stayed on the watchlist.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">NAV</p>
            <p className="mt-2 text-2xl font-bold text-white">{usd(account.current_value)}</p>
            <p className="mt-1 text-xs text-steel-500">from {usd(account.starting_value)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Result</p>
            <p className={`mt-2 text-2xl font-bold ${toneClass(totalPl)}`}>{usd(totalPl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">{pct(account.return_pct)} since inception</p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Realised</p>
            <p className={`mt-2 text-2xl font-bold ${toneClass(account.realised_pl)}`}>{usd(account.realised_pl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">{account.closed_trades} closed</p>
          </div>
          <div className="card text-center">
            <p className="text-xs uppercase tracking-widest text-steel-500">Still open</p>
            <p className={`mt-2 text-2xl font-bold ${toneClass(account.unrealised_pl)}`}>{usd(account.unrealised_pl, true)}</p>
            <p className="mt-1 text-xs text-steel-500">{account.open_positions} positions</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <EquityCurve points={fund.equity_curve} starting={account.starting_value} />
          <div className="card">
            <p className="text-sm font-semibold text-white">Ledger</p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-steel-500">Same virtual account</p>
            <table className="mt-3 w-full text-sm">
              <caption className="sr-only">Statement of the virtual USD paper fund</caption>
              <tbody>
                {statement.map(([label, value, detail]) => (
                  <tr key={label} className="border-t border-ink-700">
                    <th scope="row" className="py-2 pr-3 text-left font-medium text-steel-400">
                      {label}
                    </th>
                    <td className="num py-2 text-right font-semibold text-white">{value}</td>
                    <td className="hidden py-2 pl-3 text-right text-xs text-steel-500 sm:table-cell">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] leading-relaxed text-steel-500">
              Marked {account.last_updated.slice(0, 10)}. A flat NAV is the result of a no-trade week, not a missing update. Simulated performance is not a promise of future results.
            </p>
            <Link href="/portfolio/report" className="mt-3 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
              Read the week 41 report →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
