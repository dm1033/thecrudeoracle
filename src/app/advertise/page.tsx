import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import PageHeader from "@/components/PageHeader";
import { AdvertiseCtaLink, TrackOnMount } from "@/components/analytics-events";
import SlotBooking from "@/components/SlotBooking";
import SponsorEnquiryForm from "@/components/SponsorEnquiryForm";
import JsonLd from "@/components/JsonLd";
import { RATE_PACKAGES, sponsorOffersJsonLd } from "@/lib/rate-card";
import { SITE } from "@/lib/site";
import { SPONSOR_SLOTS } from "@/lib/sponsor-slots";

export const metadata: Metadata = pageMeta(
  "Advertise",
  "Every sponsorship slot on The Crude Oracle is $100 per month (USD). Sponsored content is labelled Sponsored.",
  "/advertise",
);

const MAILTO = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Sponsorship enquiry")}`;

export default function AdvertisePage() {
  return (
    <>
      <TrackOnMount name="advertise_view" />
      <JsonLd data={sponsorOffersJsonLd()} />
      <PageHeader
        eyebrow="Sponsorship"
        title="Advertise"
        intro="Every sponsorship slot is $100 per month (USD)."
      />
      <div className="container-site space-y-10 py-10">
        <div className="prose-dark max-w-3xl">
          <p>
            Sponsorship enquiries:{" "}
            <AdvertiseCtaLink href={MAILTO} location="advertise_intro">
              {SITE.contactEmail}
            </AdvertiseCtaLink>
            . Say who you are, which slot you want, and how many months you have
            in mind.
          </p>
          <p>
            Every slot is $100 per month, paid monthly in advance, and a sponsor
            can cancel at any time with no notice period. The site does not
            publish traffic, subscriber or revenue numbers, and these prices are
            not market data. The same inventory is on the{" "}
            <Link href="/media-kit">media kit</Link>, which is the page to
            print.
          </p>
        </div>

        <section aria-labelledby="slots-h">
          <h2 id="slots-h" className="h2">
            Slots
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            Every slot is $100 per month. Five slots have a placement today and
            can be booked. The others stay on the card so the price is visible,
            and show Not yet placed until their page or email exists. Ask about
            any of them with the form below. The slot is already selected.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {SPONSOR_SLOTS.filter((slot) => slot.available).map((slot) => (
              <article key={slot.id} id={slot.id} className="card scroll-mt-32 border-brass/40">
                <p className="eyebrow">Sponsored · Advertisement</p>
                <h3 className="mt-3 font-serif text-2xl text-ink-primary">Sponsor this</h3>
                <p className="mt-2 font-mono text-lg text-brass">{slot.price}</p>
                <p className="mt-3 text-sm font-semibold text-ink-primary">{slot.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-steel-400">Appears on {slot.placement}.</p>
                <div className="mt-4">
                  <SlotBooking slot={slot} />
                </div>
              </article>
            ))}
          </div>
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
                  <tr key={slot.id} id={slot.available ? undefined : slot.id}>
                    <th scope="row" className="font-medium text-steel-200">
                      {slot.name}
                      <span className="mt-1 block text-xs font-normal text-steel-500">
                        {slot.description}
                      </span>
                    </th>
                    <td>{slot.placement}</td>
                    <td className="whitespace-nowrap">{slot.price}</td>
                    <td>
                      <SlotBooking slot={slot} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 max-w-3xl text-sm text-steel-400">
            Sponsor this, on an open card, opens one Stripe Payment Link shared
            by every slot. The slot is attached to the payment, so you do not
            type the slot name at checkout. The amount is the $100 per month on
            that card. After payment, use Send artwork and details. That email
            is how the name, link and artwork reach the desk. Every placement
            on the site is labelled Sponsored.
          </p>
        </section>

        <SponsorEnquiryForm slots={SPONSOR_SLOTS} source="advertise" />

        <section aria-labelledby="packages-h">
          <h2 id="packages-h" className="h2">
            Packages
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-steel-400">
            Each slot in a package is $100 per month. The figure on the card is
            the sum of the slots named. A package that includes a slot not yet
            placed starts once that placement exists. Use the enquiry form and
            choose the package in the message.
          </p>
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

        <div className="prose-dark max-w-3xl">
          <h2>Labels and review</h2>
          <p>
            Every sponsored placement is labelled <strong>Sponsored</strong>, or
            &ldquo;Presented by [name] (sponsor)&rdquo;, on the page and in the
            email. Links use <code>rel=&quot;sponsored&quot;</code>. Sponsored
            content is kept visually separate from the prices and the editorial
            note.
          </p>
          <p>
            Advertisements that invite people to trade or invest — including
            brokers, funds and promotions of listed-company shares — are
            financial promotions and are subject to review before they run. This
            page is not legal advice and it is not an offer of terms.
          </p>

          <h2>What a sponsor does not get</h2>
          <p>
            Sponsors do not see copy, data or charts before publication, and
            they do not influence what the desk writes. That rule is the{" "}
            <Link href="/editorial-policy">editorial policy</Link>.
          </p>
          <p>
            <AdvertiseCtaLink href={MAILTO} location="advertise_footer">
              Email a sponsorship enquiry
            </AdvertiseCtaLink>
          </p>
        </div>
      </div>
    </>
  );
}
