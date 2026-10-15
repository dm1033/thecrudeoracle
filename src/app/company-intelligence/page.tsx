import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { companyIntel, type CompanyIntel } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import PremiumGate from "@/components/PremiumGate";
import FreshnessBadge from "@/components/FreshnessBadge";
import { DataTypeBadge } from "@/components/DataMeta";
import { isSampleInstrument } from "@/lib/sample-marks";

export const metadata: Metadata = pageMeta(
  "Company Intelligence — Oil & Gas Equity Research Notes",
  "Structured company intelligence on oil and gas equities: production exposure, reserves, financial health, valuation context, management and catalysts — with sources.",
  "/company-intelligence"
);

const FIELDS: { key: keyof CompanyIntel; label: string }[] = [
  { key: "production_exposure", label: "Production exposure" },
  { key: "reserves_note", label: "Reserves" },
  { key: "financial_health_note", label: "Financial health" },
  { key: "valuation_note", label: "Valuation context" },
  { key: "management_note", label: "Management" },
  { key: "catalyst", label: "Catalysts" },
  { key: "risk", label: "Key risks" },
];

function IntelCard({ c }: { c: CompanyIntel }) {
  return (
    <article className="card p-6">
      <header className="border-b border-ink-700 pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-white">{c.company}</h2>
          <span className="font-mono text-xs text-steel-500">
            {c.ticker} · {c.exchange} · {c.country}
          </span>
        </div>
        <p className="mt-2 text-sm text-steel-400">{c.description}</p>
      </header>
      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-gold-500">{label}</dt>
            <dd className="mt-0.5 text-sm leading-relaxed text-steel-400">{String(c[key])}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded border border-ink-700 bg-ink-900 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-steel-500">Latest update</p>
        <p className="mt-1 text-sm text-steel-300">{c.latest_update}</p>
      </div>
      <footer className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-700 pt-3 text-[11px] text-steel-500">
        <span className="font-semibold">Sources:</span>
        {c.sources.map((s) => (
          <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gold-400">
            {s.name}
          </a>
        ))}
        <span>· Updated: {c.last_updated}</span>
        <DataTypeBadge dataType={c.data_type} />
        <FreshnessBadge lastUpdated={c.last_updated} staleAfterHours={720} />
        <span className="rounded bg-risk/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-risk">
          Research note, not a recommendation
        </span>
      </footer>
    </article>
  );
}

const publishedIntel = companyIntel.filter(
  (c) => !isSampleInstrument([c.ticker, c.company, c.description, c.latest_update])
);

export default function CompanyIntelligencePage() {
  return (
    <>
      <PageHeader
        eyebrow="Structured Research Notes"
        title="Company Intelligence"
        intro="Structured notes on monitored oil and gas companies. Sample and placeholder profiles are not shown. Each published note carries sources and a last-updated stamp, and none of them is a recommendation."
      />
      <div className="container-site space-y-10 py-10">
        <PremiumGate
          title="Company intelligence is for premium subscribers"
          preview={publishedIntel[0] ? <IntelCard c={publishedIntel[0]} /> : undefined}
        >
          {publishedIntel.length === 0 ? (
            <p className="max-w-3xl text-sm leading-relaxed text-steel-400">
              No company notes are published. Profiles labelled as samples or placeholders are
              withheld until the desk replaces them with real marks.
            </p>
          ) : (
            <div className="space-y-6">
              {publishedIntel.map((c) => (
                <IntelCard key={c.ticker} c={c} />
              ))}
            </div>
          )}
        </PremiumGate>
        <DisclaimerBlock />
      </div>
    </>
  );
}
