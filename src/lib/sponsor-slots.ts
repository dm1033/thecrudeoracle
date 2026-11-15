import slotsFile from "../../data/sponsor-slots.json";

export interface SponsorSlot {
  id: string;
  name: string;
  description: string;
  placement: string;
  /** Published indicative figure, already including its unit, such as "$200/week". */
  price: string;
  period: string;
  /** Stripe Payment Link. Empty until David creates one. Never invent a URL. */
  stripePaymentLink: string;
  available: boolean;
}

export const SPONSOR_SLOTS: SponsorSlot[] = slotsFile.slots;

const STRIPE_LINK = /^https:\/\/\S+$/;

export interface SlotCheckout {
  href: string;
  /** True when the href is a Stripe Payment Link. False when it is the enquiry mailto. */
  external: boolean;
}

/** Payment Link when one is set. Otherwise the existing sponsorship enquiry address. */
export function slotCheckout(slot: SponsorSlot, contactEmail: string): SlotCheckout {
  const link = slot.stripePaymentLink.trim();
  if (slot.available && STRIPE_LINK.test(link)) return { href: link, external: true };
  const subject = encodeURIComponent(`Sponsorship enquiry: ${slot.name}`);
  return { href: `mailto:${contactEmail}?subject=${subject}`, external: false };
}

/** After payment: sponsor name, URL and artwork, in a prefilled email. */
export function slotArtworkMailto(slot: SponsorSlot, contactEmail: string): string {
  const subject = encodeURIComponent(`Sponsor artwork and details: ${slot.name}`);
  const body = encodeURIComponent(
    `Slot: ${slot.name} (${slot.id})\nPlacement: ${slot.placement}\n\nSponsor name:\nURL:\nArtwork notes:\n`
  );
  return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
}
