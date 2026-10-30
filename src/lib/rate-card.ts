/** Indicative founding rates. Every figure is a starting point, not a quote and not a traffic claim. */
export const RATE_SLOTS: { slot: string; where: string; from: string }[] = [
  { slot: "Price board, presented by", where: "Homepage and price cards", from: "$200/week" },
  { slot: "Daily note, primary", where: "Five sends a week, when the note is running", from: "$150/week" },
  { slot: "Daily note, secondary", where: "Footer of that email", from: "$50/week" },
  { slot: "EIA inventory day, presented by", where: "Wednesday page, email and social card", from: "$100/week" },
  { slot: "Friday positioning, presented by", where: "Friday pages", from: "$100/week" },
  { slot: "Monthly balances digest", where: "Monthly digest", from: "$75/week" },
  { slot: "North Sea / UK energy security takeover", where: "That section and related articles", from: "$150/week" },
  { slot: "LNG, gas and shipping takeover", where: "That section and related articles", from: "$100/week" },
  { slot: "Calculator sponsor, each", where: "Calculator pages, once they exist", from: "$40/week" },
  { slot: "Release calendar, presented by", where: "Calendar page", from: "$50/week" },
  { slot: "Embeddable widget co-brand", where: "Third-party embeds, once they exist", from: "$100/week" },
  { slot: "Social card sponsor", where: "Social charts", from: "$50/week" },
  { slot: "Jobs or events listing", where: "A listing, when that page exists", from: "$50 per listing" },
  { slot: "Sunday week-ahead email", where: "One weekly send", from: "$75/week" },
];

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
