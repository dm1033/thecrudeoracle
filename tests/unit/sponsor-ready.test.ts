import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { AUDIENCE_METRICS, filledAudienceMetrics } from "@/lib/audience";
import { EIA_SERIES, isThousandBarrelUnits, type EiaSeriesDef } from "@/lib/eia";
import { RATE_PACKAGES, RATE_SLOTS, sponsorOffersJsonLd, sponsorSlotOffer } from "@/lib/rate-card";
import { SPONSOR_SLOTS } from "@/lib/sponsor-slots";
import { SITE } from "@/lib/site";

describe("EIA series mapping", () => {
  it("keeps Brent and WTI as unconverted dollar-per-barrel spot series", () => {
    for (const series of [EIA_SERIES.BRENT_SPOT, EIA_SERIES.WTI_SPOT] as EiaSeriesDef[]) {
      expect(series.route).toBe("petroleum/pri/spt");
      expect(series.frequency).toBe("daily");
      expect(series.expectedUnits).toBe("$/BBL");
      expect(series.unitConversion).toBeUndefined();
    }
    expect(EIA_SERIES.BRENT_SPOT.seriesId).toBe("RBRTE");
    expect(EIA_SERIES.WTI_SPOT.seriesId).toBe("RWTC");
  });

  it("reads weekly stocks in thousand barrels from petroleum/stoc/wstk", () => {
    expect(EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS.seriesId).toBe("WCESTUS1");
    expect(EIA_SERIES.US_GASOLINE_STOCKS.seriesId).toBe("WGTSTUS1");
    expect(EIA_SERIES.US_DISTILLATE_STOCKS.seriesId).toBe("WDISTUS1");
    expect(EIA_SERIES.CUSHING_CRUDE_STOCKS.seriesId).toBe("W_EPC0_SAX_YCUOK_MBBL");
    for (const series of [
      EIA_SERIES.US_COMMERCIAL_CRUDE_STOCKS,
      EIA_SERIES.US_GASOLINE_STOCKS,
      EIA_SERIES.US_DISTILLATE_STOCKS,
      EIA_SERIES.CUSHING_CRUDE_STOCKS,
    ]) {
      expect(series.route).toBe("petroleum/stoc/wstk");
      expect(series.unitConversion?.(1000)).toBe(1);
    }
    expect(isThousandBarrelUnits("MBBL")).toBe(true);
    expect(isThousandBarrelUnits("$/BBL")).toBe(false);
  });
});

describe("audience metrics", () => {
  it("hides empty metrics and shows only a filled value", () => {
    expect(filledAudienceMetrics(AUDIENCE_METRICS)).toEqual([]);
    expect(
      filledAudienceMetrics([
        { id: "readers", label: "Readers", value: null, asOf: null },
        { id: "subscribers", label: "Newsletter subscribers", value: "  ", asOf: null },
        { id: "open-rate", label: "Email open rate", value: "measured later", asOf: "2026-10-29" },
      ]).map((metric) => metric.id)
    ).toEqual(["open-rate"]);
  });
});

describe("rate card", () => {
  it("keeps the EIA inventory day slot on the shared card", () => {
    expect(RATE_SLOTS.some((slot) => slot.slot === "EIA inventory day, presented by")).toBe(true);
  });

  it("prices every slot and package in USD per month", () => {
    expect(RATE_SLOTS.every((slot) => slot.price === "$100/month")).toBe(true);
    expect(RATE_PACKAGES.map((pack) => [pack.name, pack.price])).toEqual([
      ["A. Three founding sponsors", "$500/month"],
      ["B. One anchor plus fill", "$800/month"],
      ["C. North Sea-heavy", "$400/month"],
    ]);
  });

  it("publishes a JSON-LD offer of 100 USD per month for every slot", () => {
    const graph = sponsorOffersJsonLd()["@graph"];
    expect(graph).toHaveLength(SPONSOR_SLOTS.length);
    for (const slot of SPONSOR_SLOTS) {
      expect(sponsorSlotOffer(slot)).toMatchObject({
        "@type": "Offer",
        name: slot.name,
        url: `${SITE.url}/advertise#${slot.id}`,
        price: "100",
        priceCurrency: "USD",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "100", priceCurrency: "USD", unitText: "month", unitCode: "MON" },
      });
    }
    expect(graph.every((offer) => offer.price === "100" && offer.priceCurrency === "USD")).toBe(true);
  });

  it("drops weekly sponsor prices from the public rate copy", () => {
    const files = [
      "data/sponsor-slots.json",
      "public/llms.txt",
      "src/app/advertise/page.tsx",
      "src/app/media-kit/page.tsx",
      "src/app/subscribe/page.tsx",
      "src/components/PresentedBy.tsx",
      "src/lib/rate-card.ts",
    ];
    for (const file of files) {
      const text = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(/\$[0-9,]+\s*\/\s*week/i);
      expect(text, file).not.toMatch(/per week/i);
      expect(text, file).not.toMatch(/indicative rate/i);
    }
    const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
    expect(llms).toContain("Every sponsorship slot is $100 per month (USD)");
    expect(llms).toContain("Every slot is $100 per month (USD)");
  });
});
