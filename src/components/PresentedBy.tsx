import { AdvertiseCtaLink, SponsoredLink } from "@/components/analytics-events";
import JsonLd from "@/components/JsonLd";
import { sponsorSlotOffer } from "@/lib/rate-card";
import { sharedSponsorPrice, sponsorSlotFromHref } from "@/lib/sponsor-slots";

/**
 * Sponsor slot. An empty placement is a Sponsor this card that links to /advertise.
 * A booked placement uses the sponsor URL with rel="sponsored".
 */
export default function PresentedBy({
  sponsor,
  location,
  enquireHref = "/advertise",
}: {
  sponsor?: { name: string; href: string } | null;
  location: string;
  enquireHref?: string;
}) {
  const slot = sponsorSlotFromHref(enquireHref);
  const price = slot?.price ?? sharedSponsorPrice();
  return (
    <aside aria-label="Sponsored placement" className="rounded-lg border border-brass/50 bg-surface-1 p-6 sm:p-8">
      <p className="eyebrow">Sponsored</p>
      <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">Advertisement</p>
      {sponsor ? (
        <>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-muted">Presented by</p>
          <SponsoredLink href={sponsor.href} className="mt-1 inline-block font-serif text-2xl text-ink-primary underline">
            {sponsor.name}
          </SponsoredLink>
        </>
      ) : (
        <>
          <h2 className="mt-4 font-serif text-3xl text-ink-primary">Sponsor this</h2>
          {price ? <p className="mt-2 font-mono text-lg text-brass">{price}</p> : null}
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-secondary">
            {slot ? `This placement appears on ${slot.placement}.` : "This placement is listed on the advertise page."}
          </p>
          <AdvertiseCtaLink href={enquireHref} location={location} className="btn-primary mt-5">
            Sponsor this
          </AdvertiseCtaLink>
        </>
      )}
      <p className="mt-4 max-w-xl text-xs leading-relaxed text-ink-muted">
        A sponsor does not see or change the prices or the note. Sponsored content stays labelled and apart from the editorial. Not financial advice.
      </p>
      {slot ? <JsonLd data={{ "@context": "https://schema.org", ...sponsorSlotOffer(slot) }} /> : null}
    </aside>
  );
}
