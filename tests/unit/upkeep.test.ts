import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("weekly upkeep", () => {
  it("301-redirects every Netlify path to the canonical host and leaves Vercel alone", () => {
    const toml = readFileSync("netlify.toml", "utf8");
    expect(toml).toContain('from = "/"');
    expect(toml).toContain('to = "https://www.thecrudeoracle.com/"');
    expect(toml).toContain('from = "/*"');
    expect(toml).toContain('to = "https://www.thecrudeoracle.com/:splat"');
    expect(toml).toContain("status = 301");
    expect(toml).toContain("force = true");
    const vercel = readFileSync("vercel.json", "utf8");
    expect(vercel).not.toContain("www.thecrudeoracle.com/:splat");
    const nextConfig = readFileSync("next.config.mjs", "utf8");
    expect(nextConfig).not.toContain("www.thecrudeoracle.com/:splat");
  });

  it("publishes security.txt with the intelligence contact and an expiry about a year out", () => {
    const text = readFileSync("public/.well-known/security.txt", "utf8");
    expect(text).toContain("Contact: mailto:intelligence@thecrudeoracle.com");
    const expires = text.match(/^Expires: (.+)$/m)?.[1];
    expect(expires).toBeTruthy();
    const expiry = Date.parse(expires ?? "");
    const yearOut = Date.parse("2027-11-02T00:00:00Z");
    expect(expiry).toBeGreaterThanOrEqual(yearOut);
    expect(expiry).toBeLessThan(Date.parse("2027-12-02T00:00:00Z"));
  });

  it("links the X profile from the footer and the Organization schema", () => {
    const site = readFileSync("src/lib/site.ts", "utf8");
    const footer = readFileSync("src/components/Footer.tsx", "utf8");
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(site).toContain('xProfile: "https://x.com/thecrudeoracle"');
    expect(footer).toContain("SITE.xProfile");
    expect(layout).toContain("sameAs: [SITE.xProfile]");
  });
});
