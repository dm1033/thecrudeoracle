import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { briefings, latestBriefing, type Briefing } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import { BrentWtiChart } from "@/components/charts/Charts";

export const metadata: Metadata = pageMeta(
  "Daily Briefing — Crude Oil Market Intelligence",
  "The Crude Oracle Daily Briefing: oil price summary, gas signal, supply risk, demand, OPEC update, inventories, geopolitical risk, energy equities and the bottom line — every trading day.",
  "/daily-briefing"
);

const SECTIONS: { key: keyof Briefing; label: string }[] = [
  { key: "oil_summary", label: "1 · Oil price summary" },
  { key: "gas_summary", label: "2 · Gas market signal" },
  { key: "supply_risk", label: "3 · Supply risk" },
  { key: "demand_signal", label: "4 · Demand signal" },
  { key: "opec_note", label: "5 · OPEC / producer update" },
  { key: "inventory_signal", label: "6 · Inventory signal" },
  { key: "geopolitical_risk", label: "7 · Geopolitical risk" },
  { key: "equities_to_watch", label: "8 · Energy equities to watch" },
  { key: "uk_energy_note", label: "9 · UK / North Sea note" },
  { key: "one_chart", label: "10 · One chart to watch" },
];

function BriefingArticle({ briefing, latest }: { briefing: Briefing; latest?: boolean }) {
  return (
    <article className="card p-6 sm:p-8">
      <header className="border-b border-ink-700 pb-5">
        <p className="eyebrow">The Crude Oracle Daily Briefing — {briefing.date}</p>
        <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">{briefing.headline}</h2>
        <p className="mt-2 text-xs text-steel-500">
          Published {briefing.last_updated.slice(0, 10)} · Status: {briefing.status} · Manual
          editorial update
        </p>
      </header>

      <div className="mt-6 space-y-6">
        {SECTIONS.map(({ key, label }) => (
          <section key={key}>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500">{label}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-steel-300">{String(briefing[key])}</p>
            {key === "one_chart" && latest && (
              <div className="mt-4">
                <BrentWtiChart />
              </div>
            )}
          </section>
        ))}

        <section className="rounded-lg border border-gold-600/40 bg-navy-900/30 p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gold-500">
            11 · Bottom line
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-steel-200">{briefing.bottom_line}</p>
        </section>

        <footer className="border-t border-ink-700 pt-4 text-xs text-steel-500">
          <span className="font-semibold">Sources: </span>
          {briefing.sources.map((s, i) => (
            <span key={s.name}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-400">
                {s.name}
              </a>
            </span>
          ))}
        </footer>
      </div>
    </article>
  );
}

export default function DailyBriefingPage() {
  const archive = briefings.slice(1);
  return (
    <>
      <PageHeader
        eyebrow="Premium · Updated Every Trading Day"
        title="The Crude Oracle Daily Briefing"
        intro="Eleven concise sections covering the entire crude complex — written for people who make decisions, not people with time to waste."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="Daily briefings are for premium subscribers"
          preview={
            <div className="space-y-3">
              <p className="eyebrow">The Crude Oracle Daily Briefing — {latestBriefing.date}</p>
              <h2 className="text-xl font-bold text-white">{latestBriefing.headline}</h2>
              <p className="text-sm text-steel-400">{latestBriefing.oil_summary}</p>
              <p className="text-sm text-steel-400">{latestBriefing.gas_summary}</p>
            </div>
          }
        >
          <div className="space-y-8">
            <BriefingArticle briefing={latestBriefing} latest />
            {archive.length > 0 && (
              <section>
                <h2 className="h2">Recent briefings</h2>
                <div className="mt-4 space-y-6">
                  {archive.map((b) => (
                    <BriefingArticle key={b.date} briefing={b} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </PremiumGate>
        <DisclaimerBlock />
      </div>
    </>
  );
}
