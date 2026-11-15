import { SPONSOR_SLOTS, type SponsorSlot } from "@/lib/sponsor-slots";
import { SITE } from "@/lib/site";

/** Published slot prices. Every figure is the monthly rate, in USD. */
export const RATE_SLOTS: { slot: string; where: string; price: string }[] = SPONSOR_SLOTS.map((slot) => ({
  slot: slot.name,
  where: slot.placement,
  price: slot.price,
}));

/**
 * Packages name existing slots. "A category takeover" is priced as the North Sea
 * takeover; the LNG takeover is the same monthly price. Repeated ids are bought
 * more than once (two calculator slots, two listings).
 */
const PACKAGE_DEFS: { name: string; includes: string; slotIds: string[] }[] = [
  {
    name: "A. Three founding sponsors",
    includes: "Price board; a category takeover plus Friday positioning; the daily note primary plus EIA inventory day.",
    slotIds: ["price-board", "north-sea", "friday-positioning", "daily-note-primary", "eia-inventory-day"],
  },
  {
    name: "B. One anchor plus fill",
    includes:
      "A site-wide presenting partner across the price board, the daily note and EIA inventory day; two calculator slots; the calendar; two listings.",
    slotIds: [
      "price-board",
      "daily-note-primary",
      "eia-inventory-day",
      "calculator",
      "calculator",
      "release-calendar",
      "jobs-events",
      "jobs-events",
    ],
  },
  {
    name: "C. North Sea-heavy",
    includes: "North Sea / UK energy security takeover; the price board; the daily note primary; Friday positioning.",
    slotIds: ["north-sea", "price-board", "daily-note-primary", "friday-positioning"],
  },
];

function usdPerMonth(price: string): number {
  const match = price.match(/^\$([0-9]+(?:,[0-9]{3})*)\/month$/);
  if (!match) throw new Error(`Sponsor price must be monthly USD, got ${price}`);
  return Number(match[1].replace(/,/g, ""));
}

function sumMonthly(slotIds: string[]): string {
  const total = slotIds.reduce((sum, id) => {
    const slot = SPONSOR_SLOTS.find((item) => item.id === id);
    if (!slot) throw new Error(`Unknown sponsor slot ${id}`);
    if (slot.period !== "month") throw new Error(`Slot ${id} is not priced per month`);
    return sum + usdPerMonth(slot.price);
  }, 0);
  return `$${total.toLocaleString("en-US")}/month`;
}

export const RATE_PACKAGES: { name: string; includes: string; price: string }[] = PACKAGE_DEFS.map((pack) => ({
  name: pack.name,
  includes: pack.includes,
  price: sumMonthly(pack.slotIds),
}));

/** schema.org Offer for one slot. Price and period come from the slot record. */
export function sponsorSlotOffer(slot: SponsorSlot) {
  const amount = String(usdPerMonth(slot.price));
  return {
    "@type": "Offer",
    name: slot.name,
    description: `${slot.placement}. ${slot.price}.`,
    url: `${SITE.url}/advertise#${slot.id}`,
    price: amount,
    priceCurrency: "USD",
    availability: slot.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: amount,
      priceCurrency: "USD",
      unitText: "month",
      unitCode: "MON",
    },
    seller: { "@type": "Organization", name: SITE.name, url: SITE.url },
  };
}

/** One Offer per sponsorship slot, for the advertise page and the media kit. */
export function sponsorOffersJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": SPONSOR_SLOTS.map((slot) => sponsorSlotOffer(slot)),
  };
}
