import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import PaperBookDashboard from "@/components/PaperBookDashboard";
import dashboard from "../../../paper-book/report/dashboard.json";

export const metadata: Metadata = pageMeta(
  "Crude Oracle Paper Book — an AI crude desk, timestamped before the market grades it",
  "A forward-only, simulated crude oil book run by AI analyst agents with a deterministic risk check, a no-AI baseline and a public, timestamped decision log. Paper trading only. Not investment advice.",
  "/paper-book"
);

const PROCESS = [
  ["Collect and freeze", "EIA stocks, CFTC positioning, timestamped headlines and NYMEX bars are saved exactly as the agents will see them, with a SHA-256 manifest."],
  ["Four analysts", "Fundamentals, positioning, news and technical agents each read only the frozen data for their role and must state what would change their mind."],
  ["Bull versus bear", "Two researchers argue the strongest honest case each way from the four reports. No new data."],
  ["PM proposes, code disposes", "The PM agent emits 0–3 trades as strict JSON. Deterministic risk code sizes, accepts or rejects each one and logs the reason. The model never touches the order API."],
  ["Commit and timestamp", "The decision file is committed, pushed and anchored with OpenTimestamps before any order is sent."],
  ["Baseline control", "A plain trend-plus-carry sleeve runs on the same schedule through the same risk code. The only claim made is AI sleeves versus baseline."],
] as const;

export default function PaperBookPage() {
  return (
    <>
      <PageHeader
        eyebrow="Simulated paper trading · No client money · Not investment advice"
        title="Crude Oracle Paper Book"
        intro="A forward-only AI crude desk where every trade's reasoning is timestamped before the market grades it, and it has to beat a plain systematic baseline to earn its keep."
      />
      <div className="container-site space-y-10 py-10">
        <aside aria-label="Paper book disclaimer" className="rounded-lg border border-risk/60 bg-risk/5 p-4 text-xs leading-relaxed text-steel-400">
          <p className="font-bold uppercase tracking-wide text-risk">Simulated paper trading — no client money</p>
          <p className="mt-2">{dashboard.disclaimer} This page is a capability demonstration and research process. It is not a fund, it is not open to investment, and nothing here is an offer or a personal recommendation. No live exchange prices are shown; all figures are the book&apos;s own settlement-based marks.</p>
        </aside>

        <section aria-labelledby="pb-process-h">
          <h2 id="pb-process-h" className="h2">The process is the product</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-300">
            Most AI trading demos are backtests the model has already memorised. This one runs forward only, inputs frozen, model pinned, decisions timestamped, measured against a no-AI control.
          </p>
          <ol className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PROCESS.map(([title, body], i) => (
              <li key={title} className="card">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gold-500">Step {i + 1}</div>
                <h3 className="mt-1 font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-steel-300">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12px] text-steel-500">
            Pre-registered rules, risk limits and every decision file are public in the repository under <code className="text-steel-300">paper-book/</code>. See also the{" "}
            <Link href="/portfolio" className="text-gold-500 underline-offset-2 hover:underline">virtual portfolio</Link>.
          </p>
        </section>

        <PaperBookDashboard />
      </div>
    </>
  );
}
