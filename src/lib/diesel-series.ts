/**
 * Distillate series confirmed against an EIA hist_xls Sourcekey
 * (or, for the sulfur ids, the dnav page `s=` parameter) on 2026-10-06.
 * Do not add an id that has not been confirmed the same way.
 * Stocks are thousand barrels. Flows are thousand barrels per day.
 * Spots are dollars per gallon or per barrel, as named.
 */

export interface DieselSeriesPin {
  id: string;
  label: string;
  unit: string;
  cadence: "weekly" | "daily";
}

export const DIESEL_SERIES: DieselSeriesPin[] = [
  { id: "WDISTUS1", label: "US distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDISTP11", label: "PADD 1 distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDISTP21", label: "PADD 2 distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDISTP31", label: "PADD 3 distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDISTP41", label: "PADD 4 distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDISTP51", label: "PADD 5 distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDIST1A1", label: "New England distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDIST1B1", label: "Central Atlantic distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDIST1C1", label: "Lower Atlantic distillate stocks", unit: "thousand barrels", cadence: "weekly" },
  { id: "WD0ST_NUS_1", label: "Distillate stocks, 15 ppm and under", unit: "thousand barrels", cadence: "weekly" },
  { id: "WD1ST_NUS_1", label: "Distillate stocks, greater than 15 to 500 ppm", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDGSTUS1", label: "Distillate stocks, greater than 500 ppm", unit: "thousand barrels", cadence: "weekly" },
  { id: "WDIUPUS2", label: "Distillate product supplied", unit: "thousand barrels per day", cadence: "weekly" },
  { id: "WDIRPUS2", label: "Refiner and blender net production of distillate", unit: "thousand barrels per day", cadence: "weekly" },
  { id: "WDIEXUS2", label: "Distillate exports", unit: "thousand barrels per day", cadence: "weekly" },
  { id: "WGIRIUS2", label: "Gross inputs into refineries", unit: "thousand barrels per day", cadence: "weekly" },
  { id: "WPULEUS3", label: "Refinery utilization", unit: "percent", cadence: "weekly" },
  { id: "WOCLEUS2", label: "Operable crude distillation capacity", unit: "thousand barrels per calendar day", cadence: "weekly" },
  { id: "EER_EPD2DXL0_PF4_Y35NY_DPG", label: "New York Harbor ULSD spot", unit: "dollars per gallon", cadence: "daily" },
  { id: "EER_EPD2DXL0_PF4_RGC_DPG", label: "US Gulf Coast ULSD spot", unit: "dollars per gallon", cadence: "daily" },
  { id: "RWTC", label: "Cushing WTI spot", unit: "dollars per barrel", cadence: "daily" },
  { id: "RBRTE", label: "Europe Brent spot", unit: "dollars per barrel", cadence: "daily" },
  { id: "EMD_EPD2D_PTE_NUS_DPG", label: "US on-highway diesel retail", unit: "dollars per gallon", cadence: "weekly" },
];

export const DIESEL_SERIES_IDS = DIESEL_SERIES.map((row) => row.id);

export const CRACK_WTI_FORMULA = "(NYH ULSD $/gal × 42) − WTI $/bbl";
export const CRACK_BRENT_FORMULA = "(NYH ULSD $/gal × 42) − Brent $/bbl";
export const GASOIL_CRACK_FORMULA = "(ICE LS gasoil $/t ÷ 7.45) − Brent $/bbl";
export const CRACK_321_FORMULA = "(2 × RBOB $/gal + 1 × ULSD $/gal) × 42 − 3 × WTI $/bbl";

export const MODEL_RULES = [
  "Tight if distillate stocks are below the five-year average for that ISO week and days of cover are below their trailing three-year median, or PADD 1 is at a seasonal low.",
  "PADD 1 is at a seasonal low when the latest stock is at or under the minimum of the same ISO week in the prior five calendar years, and at least three of those years printed.",
  "Loose if stocks are above that five-year average, days of cover are above the median, and utilization is above 90% with distillate yield not rising. Yield not rising means the latest yield is at or under the yield four weeks earlier.",
  "Balanced otherwise.",
  "Fading is scored first. The crack bias is fading if the book is loose, or if it is tight and the spot crack is at or above its 90th percentile of the last year.",
  "Supported if the book is tight and the spot crack is under its one-year median, or the book is tight and stocks are drawing while the crack is still under that 90th percentile.",
  "Otherwise the crack is two-way.",
  "Confidence is low if the WPSR release date is more than 8 days before the run, or the pull failed. Otherwise standard.",
  "Days of cover = ending stocks in thousand barrels ÷ trailing four-week average product supplied in thousand barrels per day.",
  "Distillate yield = refiner and blender net production ÷ gross inputs.",
  "The five-year band uses the prior five calendar years, same ISO week. The current year is excluded.",
  "STEO is shown as a dashed official path only after a series id is confirmed against a workbook Sourcekey. This run it is dark.",
] as const;
