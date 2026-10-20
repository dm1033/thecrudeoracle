import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";

export const metadata: Metadata = pageMeta(
  "Data sources",
  "Where each price and dataset on The Crude Oracle comes from, the licence or terms that apply, and how often it is updated.",
  "/data-sources"
);

const ROWS: { dataset: string; source: string; terms: string; frequency: string }[] = [
  {
    dataset: "Europe Brent spot (EIA series RBRTE)",
    source: "U.S. Energy Information Administration Open Data API v2, route petroleum/pri/spt. Credit: Source: U.S. EIA.",
    terms: "U.S. government work. Public domain. Free to show, chart and cite. https://www.eia.gov/opendata/",
    frequency: "Daily spot. EIA publishes the trade date with a lag of several days. A successful response is cached for 2 hours.",
  },
  {
    dataset: "WTI Cushing spot (EIA series RWTC)",
    source: "U.S. EIA Open Data API v2, route petroleum/pri/spt. Credit: Source: U.S. EIA.",
    terms: "U.S. government work. Public domain.",
    frequency: "Daily spot, same lag and 2-hour cache as Brent.",
  },
  {
    dataset: "Henry Hub natural gas spot (EIA series RNGWHHD)",
    source: "U.S. EIA Open Data API v2, route natural-gas/pri/fut. The spot series is published on that futures dataset. Credit: Source: U.S. EIA.",
    terms: "U.S. government work. Public domain.",
    frequency: "Daily spot, in $/MMBtu, with the same publication lag and 2-hour cache.",
  },
  {
    dataset: "Dubai crude",
    source: "Not shown. A Platts assessment.",
    terms: "Proprietary. A licence is required before it can be displayed. This site does not hard-code a Dubai mark.",
    frequency: "Not updated here.",
  },
  {
    dataset: "UK NBP",
    source: "Not shown. An ICE price.",
    terms: "Licensed exchange data. Not republished.",
    frequency: "Not updated here.",
  },
  {
    dataset: "Dutch TTF",
    source: "Not shown. An ICE Endex price.",
    terms: "Licensed exchange data. Not republished.",
    frequency: "Not updated here.",
  },
  {
    dataset: "LNG Asia marker (JKM) and US dollar index",
    source: "Labelled placeholders on the dashboard, when those rows are still present. They are not a live Platts or FX feed.",
    terms: "JKM is a Platts assessment and is not licensed for this site. The dollar row is not a live index feed.",
    frequency: "Not a market feed. Cards are flagged when the stored date is more than 7 days old.",
  },
  {
    dataset: "Brent vs WTI chart and Henry Hub chart",
    source: "The same EIA responses as the spot cards. No separate sample series.",
    terms: "Public domain, with the EIA credit line on the chart.",
    frequency: "Redrawn from the cached EIA history, up to the observations returned with each spot request.",
  },
  {
    dataset: "Balance engine, curve monitor, signals, briefings and other desk files",
    source: "Editorial files written for this site. The July 2026 briefings are an archive.",
    terms: "Original text. Not a licensed market-data feed, and not a recommendation.",
    frequency: "When the desk edits the file. Archive notes stay dated and are labelled stale.",
  },
];

export default function DataSourcesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sources"
        title="Data sources"
        intro="Each series on the price board, where it comes from, the terms that apply, and how often it moves."
      />
      <div className="container-site space-y-8 py-10">
        <div className="overflow-x-auto rounded-lg border border-ink-700">
          <table className="table-dark min-w-[760px]">
            <caption className="sr-only">Datasets, sources, licence terms and update frequency</caption>
            <thead>
              <tr>
                <th scope="col">Dataset</th>
                <th scope="col">Source</th>
                <th scope="col">Licence / terms</th>
                <th scope="col">Update frequency</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.dataset}>
                  <th scope="row" className="font-medium text-steel-200">
                    {row.dataset}
                  </th>
                  <td>{row.source}</td>
                  <td>{row.terms}</td>
                  <td>{row.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="prose-dark max-w-3xl">
          <p>
            EIA spot prices are the trade date, not the moment the page was fetched. A card whose trade
            date is more than 7 days old is marked stale. Information only, not investment advice.
          </p>
          <p>
            See also the <Link href="/data-disclaimer">data disclaimer</Link> and the{" "}
            <Link href="/financial-disclaimer">financial disclaimer</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
