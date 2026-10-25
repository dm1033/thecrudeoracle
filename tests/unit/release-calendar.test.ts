import { describe, expect, it } from "vitest";
import { isUsFederalHoliday, upcomingReleases } from "@/lib/release-calendar";

describe("US federal holidays", () => {
  it("marks the holidays that move the Wednesday EIA release", () => {
    expect(isUsFederalHoliday("2026-11-11")).toBe(true);
    expect(isUsFederalHoliday("2027-01-18")).toBe(true);
    expect(isUsFederalHoliday("2026-11-26")).toBe(true);
    expect(isUsFederalHoliday("2026-10-28")).toBe(false);
    expect(isUsFederalHoliday("2027-07-04")).toBe(false);
    expect(isUsFederalHoliday("2027-07-05")).toBe(true);
  });
});

describe("upcoming releases", () => {
  it("converts the 28 Oct 2026 EIA release to 14:30 UK during the clock-change week", () => {
    const [eia, rigs, cot] = upcomingReleases(new Date("2026-10-25T12:00:00Z"));
    expect(eia.whenEt).toBe("Wed 28 Oct 2026, 10:30 ET");
    expect(eia.whenUk).toBe("Wed 28 Oct 2026, 14:30 UK");
    expect(rigs.whenEt).toBe("Fri 30 Oct 2026, 13:00 ET");
    expect(rigs.whenUk).toBe("Fri 30 Oct 2026, 17:00 UK");
    expect(rigs.detail).toContain("does not republish rig-count figures");
    expect(cot.whenEt).toBe("Fri 30 Oct 2026, 15:30 ET");
    expect(cot.whenUk).toBe("Fri 30 Oct 2026, 19:30 UK");
    expect(rigs.href).toBe("https://rigcount.bakerhughes.com/");
  });

  it("is 15:30 UK once the US has returned to standard time", () => {
    const [eia] = upcomingReleases(new Date("2026-10-28T15:00:00Z"));
    expect(eia.whenEt).toBe("Wed 4 Nov 2026, 10:30 ET");
    expect(eia.whenUk).toBe("Wed 4 Nov 2026, 15:30 UK");
    const [, rigs] = upcomingReleases(new Date("2026-11-02T15:00:00Z"));
    expect(rigs.whenEt).toBe("Fri 6 Nov 2026, 13:00 ET");
    expect(rigs.whenUk).toBe("Fri 6 Nov 2026, 18:00 UK");
  });

  it("moves EIA to Thursday when Wednesday or Monday is a US holiday", () => {
    const veterans = upcomingReleases(new Date("2026-11-08T15:00:00Z"))[0];
    expect(veterans.whenEt).toBe("Thu 12 Nov 2026, 10:30 ET");
    expect(veterans.whenUk).toBe("Thu 12 Nov 2026, 15:30 UK");

    const mlk = upcomingReleases(new Date("2027-01-17T15:00:00Z"))[0];
    expect(mlk.whenEt).toBe("Thu 21 Jan 2027, 10:30 ET");

    const thanksgivingWeek = upcomingReleases(new Date("2026-11-23T15:00:00Z"))[0];
    expect(thanksgivingWeek.whenEt).toBe("Wed 25 Nov 2026, 10:30 ET");
  });
});
