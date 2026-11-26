import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  deliverSponsorEnquiry,
  parseSponsorEnquiry,
  sponsorEnquiryAccessKey,
  sponsorEnquiryMailto,
} from "@/lib/sponsor-enquiry";

const sample = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  organisation: "Analytical Engines",
  slotId: "price-board",
  months: "3",
  message: "We would like the homepage price board.",
};

describe("sponsor enquiry", () => {
  it("rejects a missing slot and accepts a chosen one", () => {
    expect(parseSponsorEnquiry({ ...sample, slotId: "not-a-slot" }).ok).toBe(false);
    expect(parseSponsorEnquiry(sample)).toEqual({ ok: true, value: sample });
    expect(parseSponsorEnquiry({ ...sample, slotId: "general", months: "" }).ok).toBe(true);
  });

  it("puts the slot name in the mailto so the buyer does not retype it", () => {
    const parsed = parseSponsorEnquiry(sample);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const href = decodeURIComponent(sponsorEnquiryMailto(parsed.value, "intelligence@thecrudeoracle.com"));
    expect(href).toContain("Sponsorship enquiry: Price board, presented by");
    expect(href).toContain("price-board");
    expect(href).toContain("Homepage price board");
  });

  it("ignores a placeholder access key and posts when a real one is set", async () => {
    expect(sponsorEnquiryAccessKey({})).toBeNull();
    expect(sponsorEnquiryAccessKey({ SPONSOR_ENQUIRY_ACCESS_KEY: "replace_me" })).toBeNull();
    const parsed = parseSponsorEnquiry(sample);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const fallback = await deliverSponsorEnquiry(parsed.value, {});
    expect(fallback.delivery).toBe("mailto");

    const posted: { body: { access_key?: string; slot?: string } | null } = { body: null };
    const sent = await deliverSponsorEnquiry(parsed.value, { SPONSOR_ENQUIRY_ACCESS_KEY: "test-key" }, "intelligence@thecrudeoracle.com", async (_url, init) => {
      posted.body = JSON.parse(String(init?.body)) as { access_key?: string; slot?: string };
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    });
    expect(sent).toEqual({ delivery: "sent" });
    expect(posted.body?.access_key).toBe("test-key");
    expect(posted.body?.slot).toContain("price-board");

    const failed = await deliverSponsorEnquiry(parsed.value, { SPONSOR_ENQUIRY_ACCESS_KEY: "test-key" }, "intelligence@thecrudeoracle.com", async () => {
      return new Response(JSON.stringify({ success: false }), { status: 200 });
    });
    expect(failed.delivery).toBe("mailto");
  });
});

describe("editor line and homepage heading", () => {
  it("names the editor exactly and does not add other credentials", () => {
    const about = readFileSync(resolve(process.cwd(), "src/app/about/page.tsx"), "utf8");
    expect(about).toContain("David John Miller CEng");
    expect(about).not.toMatch(/MSc|PMI-CP|PRINCE2|MICE/);
    const home = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(home).toContain("<h1");
    expect(readFileSync(resolve(process.cwd(), "src/components/PresentedBy.tsx"), "utf8")).toContain("Sponsor this");
    expect(readFileSync(resolve(process.cwd(), "src/components/PresentedBy.tsx"), "utf8")).not.toContain("Your brand here");
  });
});
