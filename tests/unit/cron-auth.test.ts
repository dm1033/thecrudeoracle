import { describe, expect, it } from "vitest";
import { cronRequestAllowed } from "@/lib/cron-auth";

describe("cron authorization", () => {
  it("allows the revalidate route when CRON_SECRET is unset", () => {
    expect(cronRequestAllowed(null, undefined)).toBe(true);
    expect(cronRequestAllowed(null, "")).toBe(true);
    expect(cronRequestAllowed(null, "   ")).toBe(true);
  });

  it("requires the bearer token when a secret is present", () => {
    expect(cronRequestAllowed("Bearer desk-secret", "desk-secret")).toBe(true);
    expect(cronRequestAllowed("Bearer desk-secret", "  desk-secret  ")).toBe(true);
    expect(cronRequestAllowed("Bearer other", "desk-secret")).toBe(false);
    expect(cronRequestAllowed(null, "desk-secret")).toBe(false);
  });
});
