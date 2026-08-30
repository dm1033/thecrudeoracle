import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import FreshnessBadge from "@/components/FreshnessBadge";

// FreshnessBadge computes its age inside a useEffect (it deliberately runs
// at view time, not build time — see the component's own comment), so
// every assertion here has to `waitFor` the effect to flush rather than
// read the DOM synchronously after render().

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

describe("FreshnessBadge", () => {
  it("renders no badge for fresh data (well within the threshold)", async () => {
    const { container } = render(<FreshnessBadge lastUpdated={hoursAgoIso(1)} staleAfterHours={96} />);
    // Give the effect a tick to run, then assert it stayed empty.
    await waitFor(() => expect(container).toBeDefined());
    await new Promise((r) => setTimeout(r, 0));
    expect(container.textContent).toBe("");
    expect(screen.queryByText(/stale/i)).toBeNull();
  });

  it("renders a stale badge once data is older than the threshold", async () => {
    render(<FreshnessBadge lastUpdated={hoursAgoIso(200)} staleAfterHours={96} />);
    const badge = await screen.findByText(/stale — last verified/i);
    expect(badge.textContent).toMatch(/8d ago/); // 200h / 24 = 8.33 -> floor 8
  });

  it("uses singular 'day' for exactly one day stale", async () => {
    // staleAfterHours=20, 25h old -> ageHours=25 (>20, so stale) and
    // Math.floor(25/24)=1 day.
    render(<FreshnessBadge lastUpdated={hoursAgoIso(25)} staleAfterHours={20} />);
    const badge = await screen.findByText(/stale — last verified/i);
    expect(badge.textContent).toContain("1d ago");
    expect(badge.textContent).not.toContain("1ds ago");
  });

  it("boundary: data just under the threshold is NOT marked stale (uses strict >)", async () => {
    // A hair under the 96h threshold, with enough margin (~36s) to absorb
    // the real wall-clock time that elapses between building this ISO
    // string and the component's own Date.now() read in its effect —
    // testing exactly at 96h is flaky for that reason.
    render(<FreshnessBadge lastUpdated={hoursAgoIso(95.99)} staleAfterHours={96} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/stale/i)).toBeNull();
  });

  it("boundary: one hour past the threshold IS marked stale", async () => {
    render(<FreshnessBadge lastUpdated={hoursAgoIso(97)} staleAfterHours={96} />);
    await screen.findByText(/stale/i);
  });

  it("respects a custom staleAfterHours (e.g. the 720h/30-day threshold used for research notes)", async () => {
    const { unmount } = render(<FreshnessBadge lastUpdated={hoursAgoIso(100)} staleAfterHours={720} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/stale/i)).toBeNull();
    unmount();

    render(<FreshnessBadge lastUpdated={hoursAgoIso(800)} staleAfterHours={720} />);
    await screen.findByText(/stale/i);
  });

  it("degrades safely (renders nothing, does not throw) for a malformed date string", async () => {
    expect(() => render(<FreshnessBadge lastUpdated="not-a-real-date" />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/stale/i)).toBeNull();
  });

  it("degrades safely for an empty string date", async () => {
    expect(() => render(<FreshnessBadge lastUpdated="" />)).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/stale/i)).toBeNull();
  });

  it("degrades safely for a date far enough in the future that age would be negative", async () => {
    // Date.parse succeeds, but (Date.now() - parsed) is negative, so
    // ageHours is negative and must never exceed staleAfterHours.
    const future = new Date(Date.now() + 48 * 3_600_000).toISOString();
    render(<FreshnessBadge lastUpdated={future} staleAfterHours={96} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText(/stale/i)).toBeNull();
  });

  it("the stale badge title attribute names the exact age for accessibility/tooltip", async () => {
    render(<FreshnessBadge lastUpdated={hoursAgoIso(240)} staleAfterHours={96} />); // 10 days
    const badge = await screen.findByText(/stale — last verified/i);
    expect(badge.getAttribute("title")).toMatch(/not been re-verified for 10 days/);
  });
});
