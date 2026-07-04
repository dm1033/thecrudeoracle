import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
        <section aria-labelledby="featured-h" className="overflow-hidden rounded-xl border border-gold-600/40 bg-gradient-to-br from-navy-900 to-ink-900 lg:flex">
          <div className="relative aspect-video lg:aspect-auto lg:w-1/2">
            <Image
              src="/images/reserves-infographic.png"
              alt="Preview of the Energy Reserves and Years Remaining report: proven oil, gas and coal reserves and depletion horizons"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-left-top"
            />
          </div>
          <div className="p-6 sm:p-8 lg:w-1/2">
            <p className="eyebrow">Featured Report · Free Download</p>
            <h2 id="featured-h" className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Energy Reserves and Years Remaining
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-steel-400">
              How much oil, gas and coal is actually left — and why reserves-to-production ratios
              are an economic signal, not a countdown clock. Reserve concentration by country,
              depletion horizons, the production-to-reserves paradox and what carbon constraints
              mean for asset values.
            </p>
            <p className="mt-3 text-xs text-steel-500">
              PDF report · Figures are indicative — verify against primary sources (Energy
              Institute Statistical Review, EIA). Not investment advice.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="/reports/energy-reserves-and-years-remaining.pdf"
                download
                className="btn-primary"
              >
                Download the report (PDF)
              </a>
              <Link href="/oil-truth" className="btn-secondary">
                Read Oil Truth first
              </Link>
            </div>
          </div>
        </section>

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
