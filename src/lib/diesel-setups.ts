/** Illustrative expressions. Scenarios. No size. No order. */

export interface DieselSetup {
  id: string;
  title: string;
  expression: string;
  when: string;
  invalidation: string;
}

export const DIESEL_SETUPS: DieselSetup[] = [
  {
    id: "outright",
    title: "Outright distillate",
    expression: "Long NYMEX HO",
    when: "When stocks sit under the five-year band and days of cover compress.",
    invalidation: "Stocks rebuild into the band, or product supplied rolls over.",
  },
  {
    id: "crack",
    title: "Crack, not crude",
    expression: "Long HO / short CL. One barrel of product against one barrel of crude.",
    when: "When the shortage is in refining and crude is well supplied.",
    invalidation:
      "Utilization rebounds and the crack mean-reverts, or a crude outage reprices the complex.",
  },
  {
    id: "winter",
    title: "Seasonal winter bid",
    expression: "Long the winter HO calendar against spring, or long the crack into the season.",
    when: "When PADD 1 stocks are low into October–March.",
    invalidation: "A warm NOAA run and a PADD 1 rebuild.",
  },
];
