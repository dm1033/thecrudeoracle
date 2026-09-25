import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Offshore hire — AI for asset desks in Cayman, Bermuda and the BVI",
  "UK-based builder of The Crude Oracle, open to employment and relocation to the Cayman Islands, Bermuda or the British Virgin Islands. The AI work is on this site.",
  "/offshore"
);

const JURISDICTIONS = [
  {
    name: "Cayman Islands",
    desks: "Fund managers, fund administrators and fiduciary firms regulated by the Cayman Islands Monetary Authority.",
    register: "https://www.cima.ky/",
    registerLabel: "CIMA",
  },
  {
    name: "Bermuda",
    desks: "Insurers, reinsurers, asset managers and the ship registry, supervised by the Bermuda Monetary Authority.",
    register: "https://www.bma.bm/",
    registerLabel: "BMA",
  },
  {
    name: "British Virgin Islands",
    desks: "Holding-company, shipping and corporate-services firms supervised by the BVI Financial Services Commission.",
    register: "https://www.bvifsc.vg/",
    registerLabel: "BVI FSC",
  },
] as const;

const CAPABILITIES = [
  {
    title: "Seaborne flow globe",
    body: "A live globe of crude and LNG routes, tankers and offshore rigs, built for a market-intelligence header.",
    href: "/",
    label: "See it on the front page",
  },
  {
    title: "Desk tools",
    body: "Balance, physical flows, curve, positioning, news-to-barrels and a hypothesis builder. Each one is labelled with its source and its limits.",
    href: "/tools",
    label: "Open the tools",
  },
  {
    title: "Daily intelligence",
    body: "Prices, supply risk, a daily briefing and a paper portfolio with the thesis written down before the trade. Commentary, not advice.",
    href: "/dashboard",
    label: "Open the dashboard",
  },
] as const;

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent(
  "Offshore hire — Cayman, Bermuda or BVI"
)}`;

export default function OffshorePage() {
  return (
    <>
      <PageHeader
        eyebrow="Employment · Relocation from the UK"
        title="AI for offshore asset desks"
        intro="Built in the UK. Available to relocate to the Cayman Islands, Bermuda or the British Virgin Islands on an employer-sponsored hire. The work is already public on this site."
      />
      <div className="container-site space-y-10 py-10">
        <section className="grid gap-4 lg:grid-cols-3">
          {JURISDICTIONS.map((place) => (
            <article key={place.name} className="card">
              <h2 className="h3">{place.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-steel-400">{place.desks}</p>
              <a
                href={place.register}
                className="mt-4 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300"
              >
                {place.registerLabel} register →
              </a>
            </article>
          ))}
        </section>

        <section>
          <p className="eyebrow">What you can inspect</p>
          <h2 className="h2 mt-1">The AI capabilities are the product</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <article key={item.title} className="card card-hover">
                <h3 className="h3">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{item.body}</p>
                <Link href={item.href} className="mt-4 inline-block text-sm font-semibold text-gold-400 hover:text-gold-300">
                  {item.label} →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="card border-gold-600/40">
          <p className="eyebrow">Terms</p>
          <h2 className="h2 mt-1">UK base. Relocation with the job.</h2>
          <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-steel-400">
            <li>Currently based in the United Kingdom.</li>
            <li>Will relocate to the hiring country: Cayman Islands, Bermuda, or the British Virgin Islands.</li>
            <li>The employer sponsors the work permit. This page is an employment enquiry, not an immigration filing.</li>
            <li>The Crude Oracle is market commentary. It is not a fund, a trust, or a vehicle for holding assets.</li>
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={MAILTO} className="btn-primary">
              Write about a role
            </a>
            <Link href="/contact" className="btn-secondary">
              Contact form
            </Link>
          </div>
          <p className="mt-4 text-xs text-steel-500">
            Email {SITE.contactEmail}. Not financial advice. Not an offer of securities.
          </p>
        </section>
      </div>
    </>
  );
}
