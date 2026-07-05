import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import newsData from "../../../../data/news-to-barrels.json";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";

export const metadata: Metadata = pageMeta(
  "News-to-Barrels AI — Event Impact in Barrels, Not Headlines",
  "Module 4 of The Crude Oracle trader toolkit: AI-assisted analysis that converts oil market news into estimated barrel impact — affected capacity, the full impact chain across crude, products, cracks and differentials, and an honest confidence grade.",
  "/tools/news-to-barrels"
);

interface EventImpact {
  market: string;
  direction: string;
  effect: string;
}

interface NewsEvent {
  id: string;
  date: string;
  headline: string;
  event_type: string;
  region: string;
  status: string;
  affected_capacity: string;
  capacity_type: string;
  duration_estimate: string;
  impacts: EventImpact[];
  confidence: string;
  confidence_note: string;
  watch: string;
  source: string;
  source_url: string;
  last_updated: string;
  data_type: string;
}

const events = newsData.events as NewsEvent[];

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-gain/15 text-gain",
  medium: "bg-risk/15 text-risk",
  low: "bg-steel-500/15 text-steel-400",
};

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-gain/15 text-gain",
  developing: "bg-risk/15 text-risk",
  resolved: "bg-steel-500/15 text-steel-400",
};

const DIRECTION_STYLE: Record<string, { glyph: string; cls: string }> = {
  bullish: { glyph: "▲", cls: "text-gain" },
  bearish: { glyph: "▼", cls: "text-loss" },
  neutral: { glyph: "—", cls: "text-steel-500" },
};

const PIPELINE = [
  { step: "1 · Ingest", detail: "Event captured from public reporting" },
  { step: "2 · Classify", detail: "Outage, policy, sanction, weather, infrastructure" },
  { step: "3 · Size", detail: "Affected capacity in kb/d from public data" },
  { step: "4 · Map", detail: "Impact chain: crude → products → cracks → diffs → freight" },
  { step: "5 · Grade", detail: "Confidence plus what would change the call" },
];

function EventCard({ e }: { e: NewsEvent }) {
  const conf = CONFIDENCE_STYLE[e.confidence] ?? CONFIDENCE_STYLE.low;
  const status = STATUS_STYLE[e.status] ?? STATUS_STYLE.developing;
  return (
    <article className="card">
      <header className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-steel-300">
          {e.event_type}
        </span>
        <span className="rounded bg-navy-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-steel-300">
          {e.region}
        </span>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status}`}>
          {e.status}
        </span>
        <span className="ml-auto font-mono text-[11px] text-steel-500">{e.date}</span>
      </header>

      <h3 className="mt-3 text-base font-semibold text-white">Event: {e.headline}</h3>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-gold-600/40 bg-navy-900/30 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Affected capacity
          </div>
          <div className="num mt-0.5 text-xl font-bold text-gold-400">{e.affected_capacity}</div>
          <div className="text-[11px] text-steel-500">{e.capacity_type}</div>
        </div>
        <div className="rounded border border-ink-700 bg-ink-900 p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
            Duration estimate
          </div>
          <div className="mt-0.5 text-sm font-semibold text-steel-300">{e.duration_estimate}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-steel-500">
          Likely impact
        </div>
        <ul className="mt-2 space-y-2">
          {e.impacts.map((impact) => {
            const d = DIRECTION_STYLE[impact.direction] ?? DIRECTION_STYLE.neutral;
            return (
              <li key={impact.market} className="flex gap-2 text-sm leading-relaxed">
                <span aria-hidden className={`mt-0.5 text-xs ${d.cls}`}>{d.glyph}</span>
                <span>
                  <span className="font-semibold text-steel-300">{impact.market}:</span>{" "}
                  <span className="text-steel-400">{impact.effect}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <span className={`rounded px-2 py-1 text-xs font-bold uppercase tracking-wide ${conf}`}>
          Confidence: {e.confidence}
        </span>
        <p className="min-w-[200px] flex-1 text-xs leading-relaxed text-steel-500">{e.confidence_note}</p>
      </div>

      <p className="mt-3 rounded border border-ink-700 bg-ink-900 p-3 text-xs leading-relaxed text-steel-400">
        <span className="font-semibold text-gold-500">Watch: </span>
        {e.watch}
      </p>

      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-2 text-[11px] text-steel-500">
        <span>
          Source:{" "}
          <a href={e.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-400">
            {e.source}
          </a>
        </span>
        <span>Updated: {e.last_updated}</span>
        <span className="rounded bg-steel-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-steel-400">
          {e.data_type}
        </span>
      </footer>
    </article>
  );
}

function NewsContent() {
  return (
    <div className="space-y-10">
      <section aria-label="How the pipeline works">
        <div className="grid gap-2 rounded-lg border border-ink-700 bg-ink-900 p-4 sm:grid-cols-5">
          {PIPELINE.map((p) => (
            <div key={p.step} className="rounded border border-ink-700 bg-ink-850 p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-gold-500">{p.step}</div>
              <p className="mt-1 text-[11px] leading-relaxed text-steel-500">{p.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="events-h">
        <h2 id="events-h" className="h2">
          Active event board
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-steel-500">
          Newest first. Events stay on the board until resolved; confidence and impact chains are
          revised as facts firm up.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      </section>

      <div className="card text-xs leading-relaxed text-steel-500">
        <p>
          <strong className="text-steel-300">Methodology:</strong> {newsData.meta.methodology}
        </p>
        <p className="mt-2">
          Barrel estimates are order-of-magnitude tools for thinking, not precise forecasts, and
          never a recommendation to trade. Cross-reference every event against the Balance Engine
          (does it move the balance?), the Flow Map (do the flows confirm it?) and the Curve
          Dashboard (is it priced?).
        </p>
      </div>
    </div>
  );
}

export default function NewsToBarrelsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Trader Toolkit · Module 4 · Premium"
        title="News-to-Barrels AI"
        intro="Headlines are noise until they're sized. Every market-moving event is converted into estimated barrel impact: affected capacity, the full impact chain across crude, products, cracks and differentials — and an honest confidence grade with watchpoints."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="News-to-Barrels analysis is for premium subscribers"
          preview={<EventCard e={events[0]} />}
        >
          <NewsContent />
        </PremiumGate>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ink-700 bg-ink-900 p-4 text-sm">
          <span className="text-steel-400">
            Events cross-reference the other modules: balance, flows and curve pricing.
          </span>
          <div className="flex gap-4">
            <Link href="/tools/balance-engine" className="font-semibold text-gold-400 hover:text-gold-300">
              Balance Engine →
            </Link>
            <Link href="/tools/flow-map" className="font-semibold text-gold-400 hover:text-gold-300">
              Flow Map →
            </Link>
            <Link href="/tools/curve-monitor" className="font-semibold text-gold-400 hover:text-gold-300">
              Curve Dashboard →
            </Link>
          </div>
        </div>

        <DisclaimerBlock />
      </div>
    </>
  );
}
