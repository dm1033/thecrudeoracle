import { AdvertiseCtaLink } from "@/components/analytics-events";
import { slotArtworkMailto, slotCheckout, slotCheckoutNote, type SponsorSlot } from "@/lib/sponsor-slots";
import { SITE } from "@/lib/site";

/** Book control for one inventory row. Stripe when a Payment Link is set, otherwise the enquiry email. */
export default function SlotBooking({ slot }: { slot: SponsorSlot }) {
  const checkout = slotCheckout(slot, SITE.contactEmail);
  const artwork = slotArtworkMailto(slot, SITE.contactEmail);
  const noteId = `book-note-${slot.id}`;
  return (
    <div className="flex flex-col items-start gap-2">
      {slot.available ? (
        checkout.external ? (
          <>
            <a
              href={checkout.href}
              className="text-sm font-semibold text-gold-400 hover:text-gold-300"
              rel="sponsored noopener"
              target="_blank"
              aria-describedby={noteId}
            >
              Book this slot
            </a>
            <p id={noteId} className="max-w-[16rem] text-xs leading-snug text-steel-500">
              {slotCheckoutNote(slot)}
            </p>
          </>
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
