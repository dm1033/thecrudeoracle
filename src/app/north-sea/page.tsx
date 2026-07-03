import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { watchlistCompanies } from "@/lib/data";
import PageHeader from "@/components/PageHeader";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SubscribeCTA from "@/components/SubscribeCTA";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = pageMeta(
  "North Sea / UKCS — Basin Intelligence",
  "North Sea and UK Continental Shelf intelligence: production outlook, fiscal regime, decommissioning, M&A and the listed companies exposed to the basin.",
  "/north-sea"
);

const THEMES = [
  {
    title: "Mature basin economics",
    body: "The UKCS is a late-life basin: high-quality infrastructure, declining volumes, rising unit costs. Value now comes from operating efficiency, tie-backs and consolidation rather than frontier exploration.",
  },
  {
    title: "Fiscal regime",
    body: "Windfall taxation and allowance design are the dominant valuation variable for UKCS producers. Fiscal stability — or the lack of it — sets the basin's cost of capital.",
  },
  {
    title: "Decommissioning",
    body: "Decommissioning liabilities are a structural feature of late-life assets, shaping M&A structures, RBL capacity and which companies can hold which assets.",
  },
  {
    title: "Consolidation and M&A",
    body: "Scale helps in a mature basin. Expect continued consolidation among independents, asset swaps, and private capital participation where public markets discount the basin heavily.",
  },
  {
    title: "Electrification and emissions",
    body: "Platform electrification and emissions intensity increasingly determine which assets keep licence-to-operate advantages and which face earlier cessation of production.",
  },
  {
    title: "Transition re-use",
    body: "Infrastructure, reservoirs and skills have second lives: carbon storage, hydrogen and offshore wind all draw on UKCS capability — and on the same investors.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Is the North Sea finished as an investment theme?",
    a: "No — but it has changed. The basin is mature, so the investment case rests on cash generation, consolidation and fiscal clarity rather than growth. Deep discounts to net asset value can emerge when policy uncertainty peaks; whether they close is the central debate we track.",
  },
  {
    q: "What is the UKCS?",
    a: "The UK Continental Shelf — the offshore area where the UK licenses oil and gas activity, regulated by the North Sea Transition Authority. It spans the North Sea, West of Shetland and smaller basins.",
  },
  {
    q: "Which companies are exposed?",
    a: "Exposure ranges from majors with legacy hubs to focused independents and AIM-listed explorers. Our watchlist tracks representative UKCS names with thesis, catalysts and risks — as monitored names, not recommendations.",
  },
];

export default function NorthSeaPage() {
  const ukcsNames = watchlistCompanies.filter(
    (c) => c.category === "North Sea / UKCS" || c.country === "United Kingdom"
  );

  return (
    <>
      <PageHeader
        eyebrow="Basin Coverage · UKCS"
        title="North Sea / UKCS"
        intro="Dedicated coverage of the UK Continental Shelf: production outlook, fiscal regime, decommissioning, consolidation and the listed companies priced off the basin."
      />
      <div className="container-site space-y-10 py-10">
        <section aria-labelledby="themes-h">
          <h2 id="themes-h" className="h2">
            The six themes that drive UKCS value
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <div key={t.title} className="card card-hover">
                <h3 className="h3">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-500">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="names-h" className="card">
          <h2 id="names-h" className="h3">
            UK-exposed names on the watchlist
          </h2>
          <ul className="mt-3 space-y-2">
            {ukcsNames.map((c) => (
              <li key={c.ticker} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                <span className="font-semibold text-white">{c.company}</span>
                <span className="font-mono text-xs text-steel-500">
                  {c.ticker} · {c.exchange}
                </span>
                <span className="text-steel-400">{c.investment_theme}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-steel-500">
            Full thesis, catalysts and risks on the{" "}
            <Link href="/watchlist" className="text-gold-400 underline">
              Investment Watchlist
            </Link>{" "}
            (premium). Watchlist, not recommendations.
          </p>
        </section>

        <section className="card">
          <h2 className="h3">Primary sources</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a href="https://www.nstauthority.co.uk/" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline decoration-gold-600/40 hover:text-gold-300">
                North Sea Transition Authority — production, licensing and reserves data
              </a>
            </li>
            <li>
              <a href="https://www.gov.uk/government/organisations/department-for-energy-security-and-net-zero" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline decoration-gold-600/40 hover:text-gold-300">
                UK DESNZ — energy statistics and policy publications
              </a>
            </li>
            <li>
              <a href="https://www.londonstockexchange.com/news" target="_blank" rel="noopener noreferrer" className="text-gold-400 underline decoration-gold-600/40 hover:text-gold-300">
                LSE RNS — company announcements
              </a>
            </li>
          </ul>
        </section>

        <FAQ items={FAQ_ITEMS} />
        <SubscribeCTA
          heading="The North Sea, covered like it matters"
          body="Premium members receive UKCS fiscal analysis, company intelligence on basin names and a UK / North Sea note in every daily briefing."
        />
        <DisclaimerBlock />
      </div>
    </>
  );
}
