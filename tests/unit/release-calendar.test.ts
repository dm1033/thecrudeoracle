import { describe, expect, it } from "vitest";
import { calendarReleases, isUsFederalHoliday, nextEiaSpotUpdate, upcomingReleases } from "@/lib/release-calendar";

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

describe("CFTC holiday schedule", () => {
  it("uses CFTC's published Monday 30 Nov 2026 instead of Friday 27 Nov", () => {
    const cot = upcomingReleases(new Date("2026-11-23T15:00:00Z")).find((event) => event.id === "cftc-cot");
    expect(cot?.whenEt).toBe("Mon 30 Nov 2026, 15:30 ET");
    expect(cot?.whenUk).toBe("Mon 30 Nov 2026, 20:30 UK");
    expect(cot?.detail).toContain("published schedule");
    expect(cot?.whenEt).not.toContain("27 Nov");
  });

  it("uses CFTC's published Monday 28 Dec 2026 instead of Christmas Day", () => {
    const events = calendarReleases(new Date("2026-12-20T15:00:00Z"), 16);
    const cot = events.filter((event) => event.id === "cftc-cot").map((event) => event.whenEt);
    expect(cot).toContain("Mon 28 Dec 2026, 15:30 ET");
    expect(cot.some((label) => label.startsWith("Fri 25 Dec"))).toBe(false);
  });

  it("follows the published 16 Nov and 5 Jan delays, which are not Friday holidays", () => {
    const november = upcomingReleases(new Date("2026-11-13T15:00:00Z"));
    expect(november[2].whenEt).toBe("Mon 16 Nov 2026, 15:30 ET");
    const january = upcomingReleases(new Date("2026-01-02T15:00:00Z"));
    expect(january[2].whenEt).toBe("Mon 5 Jan 2026, 15:30 ET");
  });

  it("keeps a normal Friday, and moves only a holiday Friday once the published table runs out", () => {
    const july = upcomingReleases(new Date("2027-06-28T15:00:00Z"));
    expect(july[2].whenEt).toBe("Fri 2 Jul 2027, 15:30 ET");
    const christmas = upcomingReleases(new Date("2027-12-20T15:00:00Z"));
    expect(christmas[2].whenEt).toBe("Mon 27 Dec 2027, 15:30 ET");
    expect(christmas[2].detail).toContain("next business day");
  });
});

describe("Baker Hughes holiday weeks", () => {
  it("uses the Wednesday Baker Hughes posted for Thanksgiving week 2026", () => {
    const rigs = upcomingReleases(new Date("2026-11-23T15:00:00Z")).find((event) => event.id === "baker-hughes");
    expect(rigs?.whenEt).toBe("Wed 25 Nov 2026, 13:00 ET");
    expect(rigs?.whenUk).toBe("Wed 25 Nov 2026, 18:00 UK");
    expect(rigs?.detail).toContain("does not republish rig-count figures");
    expect(rigs?.whenEt).not.toContain("27 Nov");
  });

  it("uses the Wednesdays Baker Hughes posted for Christmas and New Year", () => {
    const rigs = calendarReleases(new Date("2026-12-20T15:00:00Z"), 16)
      .filter((event) => event.id === "baker-hughes")
      .map((event) => event.whenEt);
    expect(rigs).toContain("Wed 23 Dec 2026, 13:00 ET");
    expect(rigs).toContain("Wed 30 Dec 2026, 13:00 ET");
    expect(rigs.some((label) => label.includes("25 Dec") || label.includes("1 Jan"))).toBe(false);
  });

  it("does not invent a day when a later holiday Friday has no posted exception", () => {
    const rigs = calendarReleases(new Date("2027-12-20T15:00:00Z"), 10).find((event) => event.id === "baker-hughes");
    expect(rigs?.whenEt).toBe("may shift — check Baker Hughes");
    expect(rigs?.whenUk).toBe("may shift — check Baker Hughes");
    expect(rigs?.detail).toContain("may shift — check Baker Hughes");
    expect(rigs?.whenEt).not.toMatch(/\d/);
  });
});

describe("EIA spot update day", () => {
  it("is the next petroleum-report day, including a holiday Thursday", () => {
    expect(nextEiaSpotUpdate(new Date("2026-11-23T15:00:00Z"))).toEqual({
      date: "2026-11-25",
      label: "Wed 25 Nov 2026",
    });
    expect(nextEiaSpotUpdate(new Date("2026-11-08T15:00:00Z"))).toEqual({
      date: "2026-11-12",
      label: "Thu 12 Nov 2026",
    });
  });
});

describe("calendar page window", () => {
  it("lists the next Wednesday petroleum report after 15 Nov 2026, in time order", () => {
    const events = calendarReleases(new Date("2026-11-15T12:00:00Z"));
    expect(events.length).toBeGreaterThan(1);
    expect(events.map((event) => event.at)).toEqual([...events].map((event) => event.at).sort());
    const eia = events.find((event) => event.id === "eia-wpsr");
    expect(eia?.whenEt).toBe("Wed 18 Nov 2026, 10:30 ET");
    expect(events.some((event) => event.id === "cftc-cot" && event.whenEt.startsWith("Fri 20 Nov 2026"))).toBe(true);
  });

  it("keeps the 28 Dec 2026 COT report when Christmas Day falls inside the window", () => {
    const events = calendarReleases(new Date("2026-11-23T12:00:00Z"));
    const cot = events.filter((event) => event.id === "cftc-cot").map((event) => event.whenEt);
    const rigs = events.filter((event) => event.id === "baker-hughes").map((event) => event.whenEt);
    expect(cot).toContain("Mon 30 Nov 2026, 15:30 ET");
    expect(cot).toContain("Mon 28 Dec 2026, 15:30 ET");
    expect(cot.some((label) => label.includes("27 Nov") || label.includes("25 Dec"))).toBe(false);
    expect(rigs).toContain("Wed 25 Nov 2026, 13:00 ET");
    expect(rigs).toContain("Wed 23 Dec 2026, 13:00 ET");
    expect(rigs.some((label) => label.includes("27 Nov") || label.includes("25 Dec"))).toBe(false);
  });
});
