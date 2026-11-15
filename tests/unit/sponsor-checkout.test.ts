import { describe, expect, it } from "vitest";
import { adsText } from "@/lib/advertising";
import { SPONSOR_SLOTS, slotArtworkMailto, slotCheckout } from "@/lib/sponsor-slots";

const EMAIL = "intelligence@thecrudeoracle.com";

describe("sponsor slot checkout", () => {
  it("falls back to the enquiry mailto when the payment link is empty", () => {
    const slot = SPONSOR_SLOTS.find((item) => item.id === "price-board");
    expect(slot).toBeDefined();
    expect(slot?.stripePaymentLink).toBe("");
    expect(slot?.price).toBe("$200/week");
    const checkout = slotCheckout(slot!, EMAIL);
    expect(checkout.external).toBe(false);
    expect(checkout.href.startsWith(`mailto:${EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(checkout.href)).toContain("Sponsorship enquiry: Price board, presented by");
  });

  it("uses a Stripe Payment Link only when one is set", () => {
    const slot = { ...SPONSOR_SLOTS[0], stripePaymentLink: "https://buy.stripe.com/test_example" };
    expect(slotCheckout(slot, EMAIL)).toEqual({
      href: "https://buy.stripe.com/test_example",
      external: true,
    });
    expect(slotCheckout({ ...slot, stripePaymentLink: "  " }, EMAIL).external).toBe(false);
    expect(slotCheckout({ ...slot, available: false }, EMAIL).external).toBe(false);
  });

  it("keeps the published indicative figures and leaves every payment link empty", () => {
    expect(SPONSOR_SLOTS.find((slot) => slot.id === "calculator")?.price).toBe("$40/week");
    expect(SPONSOR_SLOTS.find((slot) => slot.id === "eia-inventory-day")?.price).toBe("$100/week");
    expect(SPONSOR_SLOTS.find((slot) => slot.id === "daily-note-primary")?.price).toBe("$150/week");
    expect(SPONSOR_SLOTS.find((slot) => slot.id === "jobs-events")?.price).toBe("$50 per listing");
    expect(SPONSOR_SLOTS.every((slot) => slot.stripePaymentLink === "")).toBe(true);
  });

  it("prefills the artwork email with the slot name", () => {
    const slot = SPONSOR_SLOTS.find((item) => item.id === "daily-note-primary")!;
    const href = decodeURIComponent(slotArtworkMailto(slot, EMAIL));
    expect(href).toContain("Sponsor artwork and details: Daily note, primary");
    expect(href).toContain("daily-note-primary");
  });
});

describe("advertising gate", () => {
  it("emits nothing until a publisher id is set and consent is on", () => {
    expect(adsText()).toBeNull();
    expect(adsText({ adsensePublisherId: "pub-1", advertisingConsent: false })).toBeNull();
    expect(adsText({ adsensePublisherId: "", advertisingConsent: true })).toBeNull();
    expect(adsText({ adsensePublisherId: "pub-1", advertisingConsent: true })).toBe(
      "google.com, pub-1, DIRECT, f08c47fec0942fa0\n"
    );
  });
});
