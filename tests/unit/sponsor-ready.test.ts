import { describe, expect, it } from "vitest";
import { AUDIENCE_METRICS, filledAudienceMetrics } from "@/lib/audience";
import { EIA_SERIES, isThousandBarrelUnits, type EiaSeriesDef } from "@/lib/eia";
import { RATE_SLOTS } from "@/lib/rate-card";

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
});
