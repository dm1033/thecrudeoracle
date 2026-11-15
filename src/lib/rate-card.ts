import { SPONSOR_SLOTS } from "@/lib/sponsor-slots";

/** Indicative founding rates. Every figure is a starting point, not a quote and not a traffic claim. */
export const RATE_SLOTS: { slot: string; where: string; from: string }[] = SPONSOR_SLOTS.map((slot) => ({
  slot: slot.name,
  where: slot.placement,
  from: slot.price,
}));

export const RATE_PACKAGES: { name: string; includes: string; from: string }[] = [
  {
    name: "A. Three founding sponsors",
    includes: "Price board; a category takeover plus Friday positioning; the daily note primary plus EIA inventory day.",
    from: "$1,050/week",
  },
  {
    name: "B. One anchor plus fill",
    includes:
      "A site-wide presenting partner across the price board, the daily note and EIA inventory day; two calculator slots; the calendar; two listings.",
    from: "$1,000/week",
  },
  {
    name: "C. North Sea-heavy",
    includes: "North Sea / UK energy security takeover; the price board; the daily note primary; Friday positioning.",
    from: "$1,000/week",
  },
];
