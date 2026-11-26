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
              className="btn-primary px-3 py-2 text-xs"
              rel="sponsored noopener"
              target="_blank"
              aria-describedby={noteId}
            >
              Sponsor this
            </a>
            <p id={noteId} className="max-w-[18rem] text-xs leading-snug text-steel-500">
              {slotCheckoutNote(slot)}
            </p>
          </>
        ) : (
          <AdvertiseCtaLink href={checkout.href} location={`book_${slot.id}`} className="btn-primary px-3 py-2 text-xs">
            Sponsor this
          </AdvertiseCtaLink>
        )
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">Not yet placed</span>
      )}
      {slot.available ? (
        <a href={artwork} className="text-xs font-semibold text-steel-300 underline decoration-ink-600 underline-offset-2 hover:text-gold-400">
          Send artwork and details
        </a>
      ) : null}
    </div>
  );
}
