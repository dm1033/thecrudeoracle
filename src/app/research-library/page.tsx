import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { researchNotes } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";

export const metadata: Metadata = pageMeta(
  "Research Library — Oil & Gas Deep Dives",
  "The Crude Oracle research library: deep-dive notes on crude supply, LNG, shipping, UK energy security and oil market education. Free primers plus a premium archive.",
  "/research-library"
);

export default function ResearchLibraryPage() {
  const published = researchNotes.filter((n) => n.status === "published");
  const free = published.filter((n) => n.access === "free");
  const premium = published.filter((n) => n.access === "premium");

  return (
    <>
      <PageHeader
        eyebrow="Research Archive"
        title="Research Library"
        intro="Deep-dive research notes on the themes that drive the energy complex. Free primers are open to everyone; the full archive is part of The Crude Oracle Premium."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="free-h">
          <h2 id="free-h" className="h2">
            Free primers
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {free.map((n) => (
              <article key={n.id} className="card card-hover">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">{n.category}</span>
                  <span className="rounded bg-gain/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gain">
                    Free
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-white">{n.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{n.summary}</p>
                <p className="mt-3 text-[11px] text-steel-500">
                  {n.date} · {n.reading_time} · Sources: {n.sources.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="prem-h">
          <h2 id="prem-h" className="h2">
            Premium archive
          </h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {premium.map((n) => (
              <article key={n.id} className="card card-hover relative">
                <div className="flex items-center justify-between gap-2">
                  <span className="eyebrow">{n.category}</span>
                  <span className="rounded bg-gold-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-400">
                    Premium
                  </span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-white">{n.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{n.summary}</p>
                <p className="mt-3 text-[11px] text-steel-500">
                  {n.date} · {n.reading_time} · Sources: {n.sources.join(", ")}
                </p>
                <p className="mt-3 text-xs text-steel-500">
                  <Link href="/subscribe" className="text-gold-400 underline">
                    Subscribe to read the full note →
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </section>

        <SubscribeCTA
          heading="Unlock the full research archive"
          body="Every premium note, every framework, every deep dive — plus new research added continuously."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
