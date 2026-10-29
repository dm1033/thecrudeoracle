import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import AudienceMetrics from "@/components/AudienceMetrics";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import { RATE_PACKAGES, RATE_SLOTS } from "@/lib/rate-card";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Media kit",
  "What The Crude Oracle is, who it is for, the sponsorship inventory, and how sponsored placements are labelled. No audience numbers are published until they are measured.",
  "/media-kit"
);

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Media kit enquiry")}`;

export default function MediaKitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sponsorship"
        title="Media kit"
        intro="What the site is, who it is written for, and the indicative inventory. Audience counts stay off this page until they are measured."
      />
      <div className="print-sheet container-site space-y-10 py-10">
        <p className="no-print text-sm text-steel-500">This page is laid out for printing. Use the browser print command for a PDF.</p>

        <section className="prose-dark max-w-3xl" aria-labelledby="what-h">
          <h2 id="what-h">What the site is</h2>
          <p>
            {SITE.name} is a free oil and gas intelligence site. It publishes a daily morning note of EIA spot prices
            for Brent, WTI and Henry Hub, a Wednesday page for the EIA Weekly Petroleum Status Report, and longer
            notes on crude, gas, OPEC supply risk, UK energy security and the North Sea.
          </p>
          <p>
            Prices on the morning note and the weekly stocks page come from the U.S. Energy Information Administration
            Open Data API. EIA daily spots print one to two business days after the trade date. The weekly stocks
            report is released on Wednesday for the week ending the previous Friday. Figures are labelled with the
            series id, the date and a delayed-data badge.
          </p>
          <p>
            {SITE.name} is not authorised or regulated by the Financial Conduct Authority. It is not financial advice,
            and it is not a recommendation to buy, sell or hold any commodity, security or fund.
          </p>
        </section>

        <section aria-labelledby="audience-h">
          <h2 id="audience-h" className="h2">
            Audience
          </h2>
          <div className="prose-dark mt-3 max-w-3xl">
            <p>
              The site is written for people who already follow crude, refined products, gas and energy security:
              investors, traders, analysts and energy professionals who want the EIA print and a short note, rather
              than a general news feed. It is in British English. It does not claim a geographic or professional
              census of its readers.
            </p>
            <p>
              Measured audience figures are not on this page. The block below reads a config and stays hidden while
              those fields are empty. Nothing here is an estimate.
            </p>
          </div>
          <AudienceMetrics />
        </section>

        <section aria-labelledby="inventory-h">
          <h2 id="inventory-h" className="h2">
            Inventory
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            The same indicative rate card as the <Link href="/advertise">advertise</Link> page. Every price is marked
            from. None of them is a quote, and none of them is based on a published audience figure. A slot that is
            not on the site yet is listed so the rate is visible before that page exists.
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
                {RATE_SLOTS.map((row) => (
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
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {RATE_PACKAGES.map((pack) => (
              <article key={pack.name} className="card">
                <h3 className="text-base font-semibold text-white">{pack.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-400">{pack.includes}</p>
                <p className="mt-4 text-sm font-semibold text-gold-400">from {pack.from}, indicative</p>
              </article>
            ))}
          </div>
        </section>

        <section className="prose-dark max-w-3xl" aria-labelledby="labels-h">
          <h2 id="labels-h">Labelling and independence</h2>
          <p>
            Sponsored placements are labelled <strong>Sponsored</strong> and <strong>Advertisement</strong>. A booked
            slot is also introduced as &ldquo;Presented by&rdquo;. Links on those placements use{" "}
            <code>rel=&quot;sponsored&quot;</code>. The placement sits apart from the prices and the editorial note.
          </p>
          <p>
            Sponsors do not see copy, data or charts before publication, and they do not choose topics. That rule is
            the <Link href="/editorial-policy">editorial policy</Link>. A correction is handled under the{" "}
            <Link href="/corrections">corrections policy</Link>.
          </p>
          <p>
            Advertisements that invite people to trade or invest are financial promotions. They are reviewed before
            they run. This page is not legal advice and it is not an offer of terms.
          </p>
        </section>

        <section className="prose-dark max-w-3xl" aria-labelledby="contact-h">
          <h2 id="contact-h">Contact</h2>
          <p>
            Sponsorship and media enquiries: <a href={MAILTO}>{SITE.contactEmail}</a>. Say who you are, which slot you
            want, and the period you have in mind.
          </p>
          <p>Not financial advice.</p>
        </section>

        <DisclaimerBlock />
      </div>
    </>
  );
}
