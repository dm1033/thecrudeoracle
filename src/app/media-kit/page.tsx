import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import AudienceMetrics from "@/components/AudienceMetrics";
import DisclaimerBlock from "@/components/DisclaimerBlock";
import SlotBooking from "@/components/SlotBooking";
import JsonLd from "@/components/JsonLd";
import { RATE_PACKAGES, sponsorOffersJsonLd } from "@/lib/rate-card";
import { SPONSOR_SLOTS } from "@/lib/sponsor-slots";
import { pageMeta } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta(
  "Media kit",
  "What The Crude Oracle is, who it is for, and the sponsorship inventory. Every slot is $100 per month (USD). No audience numbers are published until they are measured.",
  "/media-kit",
);

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Media kit enquiry")}`;

export default function MediaKitPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sponsorship"
        title="Media kit"
        intro="What the site is, who it is written for, and the sponsorship inventory. Every slot is $100 per month (USD). Audience counts stay off this page until they are measured."
      />
      <JsonLd data={sponsorOffersJsonLd()} />
      <div className="print-sheet container-site space-y-10 py-10">
        <p className="no-print text-sm text-steel-500">
          This page is laid out for printing. Use the browser print command for
          a PDF.
        </p>

        <section className="prose-dark max-w-3xl" aria-labelledby="what-h">
          <h2 id="what-h">What the site is</h2>
          <p>
            {SITE.name} is a free oil and gas intelligence site. It publishes a
            daily morning note of EIA spot prices for Brent, WTI and Henry Hub,
            a Wednesday page for the EIA Weekly Petroleum Status Report, and
            longer notes on crude, gas, OPEC supply risk, UK energy security and
            the North Sea.
          </p>
          <p>
            Prices on the morning note and the weekly stocks page come from the
            U.S. Energy Information Administration Open Data API. EIA posts
            the crude and Henry Hub daily spots once a week, with the
            Weekly Petroleum Status Report. The weekly stocks report is
            released on Wednesday for the week ending the previous Friday, or
            on Thursday when a US federal holiday moves it. Figures are
            labelled with the series id, the date and a delayed-data badge.
          </p>
          <p>
            {SITE.name} is not authorised or regulated by the Financial Conduct
            Authority. It is not financial advice, and it is not a
            recommendation to buy, sell or hold any commodity, security or fund.
          </p>
        </section>

        <section aria-labelledby="audience-h">
          <h2 id="audience-h" className="h2">
            Audience
          </h2>
          <div className="prose-dark mt-3 max-w-3xl">
            <p>
              The site is written for people who already follow crude, refined
              products, gas and energy security: investors, traders, analysts
              and energy professionals who want the EIA print and a short note,
              rather than a general news feed. It is in British English. It does
              not claim a geographic or professional census of its readers.
            </p>
            <p>
              Measured audience figures are not on this page. The block below
              reads a config and stays hidden while those fields are empty.
              Nothing here is an estimate.
            </p>
          </div>
          <AudienceMetrics />
        </section>

        <section aria-labelledby="inventory-h">
          <h2 id="inventory-h" className="h2">
            Inventory
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            The same rate card as the <Link href="/advertise">advertise</Link>{" "}
            page. Every slot is $100 per month (USD). None of the prices is
            based on a published audience figure. Five slots have a placement
            today and can be booked. A sponsor can cancel at any time. The
            others show Not open, so the price is visible before that page or
            email exists. A package that includes a slot not yet open starts
            once that placement exists.
          </p>
          <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
            <table className="table-dark min-w-[760px]">
              <caption className="sr-only">
                Sponsorship slots at $100 per month
              </caption>
              <thead>
                <tr>
                  <th scope="col">Slot</th>
                  <th scope="col">Where</th>
                  <th scope="col">Price</th>
                  <th scope="col">Book</th>
                </tr>
              </thead>
              <tbody>
                {SPONSOR_SLOTS.map((slot) => (
                  <tr key={slot.id} id={slot.id}>
                    <th scope="row" className="font-medium text-steel-200">
                      {slot.name}
                    </th>
                    <td>{slot.placement}</td>
                    <td className="whitespace-nowrap">{slot.price}</td>
                    <td className="no-print">
                      <SlotBooking slot={slot} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {RATE_PACKAGES.map((pack) => (
              <article key={pack.name} className="card">
                <h3 className="text-base font-semibold text-white">
                  {pack.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-steel-400">
                  {pack.includes}
                </p>
                <p className="mt-4 text-sm font-semibold text-gold-400">
                  {pack.price}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="prose-dark max-w-3xl" aria-labelledby="labels-h">
          <h2 id="labels-h">Labelling and independence</h2>
          <p>
            Sponsored placements are labelled <strong>Sponsored</strong> and{" "}
            <strong>Advertisement</strong>. A booked slot is also introduced as
            &ldquo;Presented by&rdquo;. Links on those placements use{" "}
            <code>rel=&quot;sponsored&quot;</code>. The placement sits apart
            from the prices and the editorial note.
          </p>
          <p>
            Sponsors do not see copy, data or charts before publication, and
            they do not choose topics. That rule is the{" "}
            <Link href="/editorial-policy">editorial policy</Link>. A correction
            is handled under the{" "}
            <Link href="/corrections">corrections policy</Link>.
          </p>
          <p>
            Advertisements that invite people to trade or invest are financial
            promotions. They are reviewed before they run. This page is not
            legal advice and it is not an offer of terms.
          </p>
        </section>

        <section className="prose-dark max-w-3xl" aria-labelledby="contact-h">
          <h2 id="contact-h">Contact</h2>
          <p>
            Sponsorship and media enquiries:{" "}
            <a href={MAILTO}>{SITE.contactEmail}</a>. Say who you are, which
            slot you want, and the period you have in mind.
          </p>
          <p>Not financial advice.</p>
        </section>

        <DisclaimerBlock />
      </div>
    </>
  );
}
