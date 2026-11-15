import { AdvertiseCtaLink } from "@/components/analytics-events";
import { slotArtworkMailto, slotCheckout, type SponsorSlot } from "@/lib/sponsor-slots";
import { SITE } from "@/lib/site";

/** Book control for one inventory row. Stripe when a Payment Link is set, otherwise the enquiry email. */
export default function SlotBooking({ slot }: { slot: SponsorSlot }) {
  const checkout = slotCheckout(slot, SITE.contactEmail);
  const artwork = slotArtworkMailto(slot, SITE.contactEmail);
  return (
    <div className="flex flex-col items-start gap-2">
      {slot.available ? (
        checkout.external ? (
          <a href={checkout.href} className="text-sm font-semibold text-gold-400 hover:text-gold-300" rel="sponsored noopener" target="_blank">
            Book this slot
          </a>
        ) : (
          <AdvertiseCtaLink href={checkout.href} location={`book_${slot.id}`} className="text-sm font-semibold text-gold-400 hover:text-gold-300">
            Book this slot
          </AdvertiseCtaLink>
        )
      ) : (
        <span className="text-sm text-steel-500">Not open</span>
      )}
      <a href={artwork} className="text-xs font-semibold text-steel-300 underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
        Send artwork and details
      </a>
    </div>
  );
}
