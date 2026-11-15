import { AdvertiseCtaLink, SponsoredLink } from "@/components/analytics-events";
import JsonLd from "@/components/JsonLd";
import { sponsorSlotOffer } from "@/lib/rate-card";
import { sharedSponsorPrice, sponsorSlotFromHref } from "@/lib/sponsor-slots";

/**
 * Sponsor slot. Unbooked placements say "Your brand here" and link to /advertise.
 * Booked placements use the sponsor URL with rel="sponsored".
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
    <aside aria-label="Presented by" className="rounded-lg border border-dashed border-gold-600/70 bg-ink-900 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Sponsored</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-steel-500">Advertisement</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-steel-400">Presented by</p>
      {sponsor ? (
        <SponsoredLink href={sponsor.href} className="mt-1 inline-block text-lg font-semibold text-white underline">
          {sponsor.name}
        </SponsoredLink>
      ) : (
        <>
          <AdvertiseCtaLink href={enquireHref} location={location} rel="sponsored" className="mt-1 inline-block text-lg font-semibold text-white underline">
            Your brand here
          </AdvertiseCtaLink>
          {price ? <p className="mt-2 text-sm font-semibold text-gold-400">{price}</p> : null}
          <p className="mt-1 text-xs leading-relaxed text-steel-500">Enquire to book this placement.</p>
        </>
      )}
      <p className="mt-3 text-xs leading-relaxed text-steel-500">
        A sponsor does not see or change the prices or the note. Not financial advice.
      </p>
      {slot ? <JsonLd data={{ "@context": "https://schema.org", ...sponsorSlotOffer(slot) }} /> : null}
    </aside>
  );
}
