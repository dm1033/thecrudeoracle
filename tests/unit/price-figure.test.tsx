import { describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import MarketCard from "@/components/MarketCard";
import { isPlaceholderPrice, LICENSED_DATA_REQUIRED, priceFigureShown, priceFigureTooOld } from "@/lib/price-stamp";
import type { MarketPrice } from "@/lib/data";

afterEach(() => {
  cleanup();
});

const NOW = Date.parse("2026-11-02T12:00:00Z");

function price(partial: Partial<MarketPrice> & Pick<MarketPrice, "ticker" | "price" | "data_type" | "source" | "last_updated">): MarketPrice {
  return {
    asset: partial.asset ?? partial.ticker,
    currency: "USD/bbl",
    daily_change: 0.93,
    weekly_change: 1.85,
    monthly_change: 0.4,
    trend: "up",
    source_url: "https://www.eia.gov/",
    ...partial,
  };
}

describe("price figures", () => {
  it("hides a placeholder even when the stored date is recent", () => {
    const mark = price({
      asset: "LNG Asia Marker (JKM proxy)",
      ticker: "JKM*",
      price: 11.9,
      currency: "USD/MMBtu",
      data_type: "API placeholder",
      source: "API placeholder — licensed assessment required",
      last_updated: "2026-11-01T00:00:00Z",
    });
    expect(isPlaceholderPrice(mark)).toBe(true);
    expect(priceFigureShown(mark, NOW)).toBe(false);
  });

  it("hides a print older than 30 days and keeps one at 30 days", () => {
    const stale = price({
      ticker: "BRN",
      price: 79.15,
      data_type: "manual",
      source: "ICE via EIA (indicative)",
      last_updated: "2026-07-15T07:00:00Z",
    });
    const boundary = price({
      ticker: "WTI",
      price: 103.37,
      data_type: "delayed",
      source: "EIA Open Data API — WTI",
      last_updated: "2026-10-03T12:00:00Z",
    });
    const older = price({
      ticker: "HH",
      price: 2.76,
      data_type: "delayed",
      source: "EIA Open Data API — Henry Hub",
      last_updated: "2026-10-02T12:00:00Z",
    });
    expect(priceFigureTooOld(stale.last_updated, NOW)).toBe(true);
    expect(priceFigureShown(stale, NOW)).toBe(false);
    expect(priceFigureShown(boundary, NOW)).toBe(true);
    expect(priceFigureShown(older, NOW)).toBe(false);
  });
});

describe("MarketCard", () => {
  it("prints no number for the JKM and DXY placeholders", () => {
    const { container, unmount } = render(
      <MarketCard
        price={price({
          asset: "LNG Asia Marker (JKM proxy)",
          ticker: "JKM*",
          price: 11.9,
          currency: "USD/MMBtu",
          daily_change: 1.54,
          data_type: "API placeholder",
          source: "API placeholder — licensed assessment required",
          last_updated: "2026-07-15T07:00:00Z",
        })}
      />
    );
    expect(container.textContent).toContain(LICENSED_DATA_REQUIRED);
    expect(container.textContent).not.toContain("11.9");
    expect(container.textContent).not.toContain("1.54");
    unmount();

    const dxy = render(
      <MarketCard
        price={price({
          asset: "US Dollar Index",
          ticker: "DXY*",
          price: 103.4,
          currency: "index",
          daily_change: -0.19,
          data_type: "API placeholder",
          source: "API placeholder (e.g. Alpha Vantage / Polygon.io)",
          last_updated: "2026-07-15T07:00:00Z",
        })}
      />
    );
    expect(dxy.container.textContent).toContain(LICENSED_DATA_REQUIRED);
    expect(dxy.container.textContent).not.toContain("103.4");
    expect(screen.queryByText(/15 Jul 2026/)).toBeNull();
  });

  it("prints a fresh EIA Brent figure and withholds a July desk mark", () => {
    const fresh = render(
      <MarketCard
        price={price({
          asset: "Brent Crude",
          ticker: "BRN",
          price: 123.1,
          data_type: "delayed",
          source: "EIA Open Data API — Europe Brent Spot Price FOB ($/bbl)",
          last_updated: new Date(Date.now() - 2 * 86_400_000).toISOString(),
        })}
      />
    );
    expect(fresh.container.textContent).toContain("123.1");
    expect(fresh.container.textContent).toContain("EIA");
    fresh.unmount();

    const stale = render(
      <MarketCard
        price={price({
          asset: "Brent Crude",
          ticker: "BRN",
          price: 79.15,
          data_type: "manual",
          source: "ICE via EIA (indicative)",
          last_updated: "2026-07-15T07:00:00Z",
        })}
      />
    );
    expect(stale.container.textContent).toBe("");
    expect(stale.container.textContent).not.toContain("79.15");
  });
});
