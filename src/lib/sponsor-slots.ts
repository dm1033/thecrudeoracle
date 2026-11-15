import slotsFile from "../../data/sponsor-slots.json";

export interface SponsorSlot {
  id: string;
  name: string;
  description: string;
  placement: string;
  /** Published indicative figure, already including its unit, such as "$200/week". */
  price: string;
  period: string;
  /** Stripe Payment Link. One link is shared by every slot. */
  stripePaymentLink: string;
  available: boolean;
}

export const SPONSOR_SLOTS: SponsorSlot[] = slotsFile.slots;

const STRIPE_LINK = /^https:\/\/\S+$/;
/** Stripe drops a client_reference_id that is not alphanumeric, a dash or an underscore, or that is longer than 200 characters. */
const CLIENT_REFERENCE_MAX = 200;

export interface SlotCheckout {
  href: string;
  /** True when the href is a Stripe Payment Link. False when it is the enquiry mailto. */
  external: boolean;
}

/**
 * Slot id in the form a Payment Link will keep.
 * Invalid characters become dashes. An empty result means the parameter must be omitted.
 */
export function slotClientReferenceId(slotId: string): string | null {
  const cleaned = slotId
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, CLIENT_REFERENCE_MAX);
  return cleaned.length > 0 ? cleaned : null;
}

/** Append client_reference_id so one shared Payment Link still records which slot was booked. */
function withClientReferenceId(link: string, slotId: string): string {
  const reference = slotClientReferenceId(slotId);
  if (!reference) return link;
  try {
    const url = new URL(link);
    url.searchParams.set("client_reference_id", reference);
    return url.toString();
  } catch {
    return link;
  }
}

/** Payment Link when one is set. Otherwise the existing sponsorship enquiry address. */
export function slotCheckout(slot: SponsorSlot, contactEmail: string): SlotCheckout {
  const link = slot.stripePaymentLink.trim();
  if (slot.available && STRIPE_LINK.test(link)) {
    return { href: withClientReferenceId(link, slot.id), external: true };
  }
  const subject = encodeURIComponent(`Sponsorship enquiry: ${slot.name}`);
  return { href: `mailto:${contactEmail}?subject=${subject}`, external: false };
}

/** Buyer-facing reminder. The shared link cannot name the slot or the amount by itself. */
export function slotCheckoutNote(slot: Pick<SponsorSlot, "name">): string {
  return `At checkout, enter the slot name (${slot.name}) and amount shown.`;
}

/** After payment: sponsor name, URL and artwork, in a prefilled email. */
export function slotArtworkMailto(slot: SponsorSlot, contactEmail: string): string {
  const subject = encodeURIComponent(`Sponsor artwork and details: ${slot.name}`);
  const body = encodeURIComponent(
    `Slot: ${slot.name} (${slot.id})\nPlacement: ${slot.placement}\n\nSponsor name:\nURL:\nArtwork notes:\n`
  );
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}
