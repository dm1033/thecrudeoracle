import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Advertise",
  "Indicative sponsorship slots and founding packages for The Crude Oracle. Prices are marked from and are not a quote. Sponsored content is labelled Sponsored.",
  "/advertise"
);

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Sponsorship enquiry")}`;

const SLOTS: { slot: string; where: string; from: string }[] = [
  { slot: "Price board, presented by", where: "Homepage and price cards", from: "$200/week" },
  { slot: "Daily note, primary", where: "Five sends a week, when the note is running", from: "$150/week" },
  { slot: "Daily note, secondary", where: "Footer of that email", from: "$50/week" },
  { slot: "EIA inventory day, presented by", where: "Wednesday page, email and social card", from: "$100/week" },
  { slot: "Friday positioning, presented by", where: "Friday pages", from: "$100/week" },
  { slot: "Monthly balances digest", where: "Monthly digest", from: "$75/week" },
  { slot: "North Sea / UK energy security takeover", where: "That section and related articles", from: "$150/week" },
  { slot: "LNG, gas and shipping takeover", where: "That section and related articles", from: "$100/week" },
  { slot: "Calculator sponsor, each", where: "Calculator pages, once they exist", from: "$40/week" },
  { slot: "Release calendar, presented by", where: "Calendar page", from: "$50/week" },
  { slot: "Embeddable widget co-brand", where: "Third-party embeds, once they exist", from: "$100/week" },
  { slot: "Social card sponsor", where: "Social charts", from: "$50/week" },
  { slot: "Jobs or events listing", where: "A listing, when that page exists", from: "$50 per listing" },
  { slot: "Sunday week-ahead email", where: "One weekly send", from: "$75/week" },
];

const PACKAGES: { name: string; includes: string; from: string }[] = [
  {
    name: "A. Three founding sponsors",
    includes: "Price board; a category takeover plus Friday positioning; the daily note primary plus EIA inventory day.",
    from: "$1,050/week",
  },
  {
    name: "B. One anchor plus fill",
    includes: "A site-wide presenting partner across the price board, the daily note and EIA inventory day; two calculator slots; the calendar; two listings.",
    from: "$1,000/week",
  },
  {
    name: "C. North Sea-heavy",
    includes: "North Sea / UK energy security takeover; the price board; the daily note primary; Friday positioning.",
    from: "$1,000/week",
  },
];

export default function AdvertisePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sponsorship"
        title="Advertise"
        intro="Indicative founding rates. Every price is marked from. None of them is a quote, and none of them is based on a published audience figure."
      />
      <div className="container-site space-y-10 py-10">
        <div className="prose-dark max-w-3xl">
          <p>
            Sponsorship enquiries: <a href={MAILTO}>{SITE.contactEmail}</a>. Say who you are, which
            slot you want, and the period you have in mind.
          </p>
          <p>
            These figures are indicative starting points for a site that does not publish traffic,
            subscriber or revenue numbers. They are assumptions to test with buyers, invoiced monthly
            in advance on an 8–12 week minimum if a founding rate is agreed. They are not market data.
          </p>
        </div>

        <section aria-labelledby="slots-h">
          <h2 id="slots-h" className="h2">
            Slots
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            The low end of each indicative range. A slot that is not on the site yet is listed so the
            rate is visible before that page exists.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[640px]">
              <caption className="sr-only">Indicative sponsorship slots</caption>
              <thead>
                <tr>
                  <th scope="col">Slot</th>
                  <th scope="col">Where</th>
                  <th scope="col">From</th>
                </tr>
              </thead>
              <tbody>
                {SLOTS.map((row) => (
                  <tr key={row.slot}>
                    <th scope="row" className="font-medium text-steel-200">
                      {row.slot}
                    </th>
                    <td>{row.where}</td>
                    <td className="whitespace-nowrap">from {row.from}, indicative</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="packages-h">
          <h2 id="packages-h" className="h2">
            Packages
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            Illustrative combinations of the slot prices above. The weekly totals are indicative, not a quote.
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {PACKAGES.map((pack) => (
              <article key={pack.name} className="card">
                <h3 className="text-base font-semibold text-white">{pack.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-400">{pack.includes}</p>
                <p className="mt-4 text-sm font-semibold text-gold-400">from {pack.from}, indicative</p>
              </article>
            ))}
          </div>
        </section>

        <div className="prose-dark max-w-3xl">
          <h2>Labels and review</h2>
          <p>
            Every sponsored placement is labelled <strong>Sponsored</strong>, or &ldquo;Presented by
            [name] (sponsor)&rdquo;, on the page and in the email. Links use <code>rel=&quot;sponsored&quot;</code>.
            Sponsored content is kept visually separate from the prices and the editorial note.
          </p>
          <p>
            Advertisements that invite people to trade or invest — including brokers, funds and
            promotions of listed-company shares — are financial promotions and are subject to review
            before they run. This page is not legal advice and it is not an offer of terms.
          </p>

          <h2>What a sponsor does not get</h2>
          <p>
            Sponsors do not see copy, data or charts before publication, and they do not influence
            what the desk writes. That rule is the <Link href="/editorial-policy">editorial policy</Link>.
          </p>
          <p>
            <a href={MAILTO}>Email a sponsorship enquiry</a>
          </p>
        </div>
      </div>
    </>
  );
}
