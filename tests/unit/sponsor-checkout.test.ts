import { describe, expect, it } from "vitest";
import { adsText } from "@/lib/advertising";
import { SPONSOR_SLOTS, sharedSponsorPrice, slotArtworkMailto, slotCheckout, slotCheckoutNote, slotClientReferenceId } from "@/lib/sponsor-slots";

const EMAIL = "intelligence@thecrudeoracle.com";
const PAYMENT_LINK = "https://buy.stripe.com/cNi3cw8127TYdgq0lRaIM00";

describe("sponsor slot checkout", () => {
  it("falls back to the enquiry mailto when the payment link is empty", () => {
    const published = SPONSOR_SLOTS.find((item) => item.id === "price-board");
    expect(published).toBeDefined();
    expect(published?.price).toBe("$100/month");
    expect(published?.period).toBe("month");
    const slot = { ...published!, stripePaymentLink: "" };
    const checkout = slotCheckout(slot, EMAIL);
    expect(checkout.external).toBe(false);
    expect(checkout.href.startsWith(`mailto:${EMAIL}?subject=`)).toBe(true);
    expect(decodeURIComponent(checkout.href)).toContain("Sponsorship enquiry: Price board, presented by");
  });

  it("uses a Stripe Payment Link only when one is set, and records the slot id", () => {
    const slot = { ...SPONSOR_SLOTS[0], stripePaymentLink: "https://buy.stripe.com/test_example" };
    expect(slotCheckout(slot, EMAIL)).toEqual({
      href: "https://buy.stripe.com/test_example?client_reference_id=price-board",
      external: true,
    });
    expect(slotCheckout({ ...slot, stripePaymentLink: "  " }, EMAIL).external).toBe(false);
    expect(slotCheckout({ ...slot, available: false }, EMAIL).external).toBe(false);
  });

  it("prices every slot at $100 per month and points every slot at the shared payment link", () => {
    expect(sharedSponsorPrice()).toBe("$100/month");
    for (const id of ["calculator", "eia-inventory-day", "daily-note-primary", "jobs-events", "price-board"]) {
      const slot = SPONSOR_SLOTS.find((item) => item.id === id);
      expect(slot?.price).toBe("$100/month");
      expect(slot?.period).toBe("month");
    }
    expect(SPONSOR_SLOTS.length).toBeGreaterThan(0);
    expect(SPONSOR_SLOTS.every((slot) => slot.stripePaymentLink === PAYMENT_LINK)).toBe(true);
    for (const slot of SPONSOR_SLOTS) {
      const checkout = slotCheckout(slot, EMAIL);
      const url = new URL(checkout.href);
      expect(checkout.external).toBe(true);
      expect(`${url.origin}${url.pathname}`).toBe(PAYMENT_LINK);
      expect(url.searchParams.get("client_reference_id")).toBe(slot.id);
      expect(slotCheckoutNote(slot)).toBe(`At checkout, enter the slot name (${slot.name}) and amount shown.`);
    }
  });

  it("keeps only characters Stripe will store on client_reference_id", () => {
    expect(slotClientReferenceId("price-board")).toBe("price-board");
    expect(slotClientReferenceId("North Sea / UK energy!!")).toBe("North-Sea-UK-energy");
    expect(slotClientReferenceId("///")).toBeNull();
    expect(slotClientReferenceId(`ok_${"a".repeat(250)}`)).toHaveLength(200);

    const messy = {
      ...SPONSOR_SLOTS[0],
      id: "North Sea / UK energy!!",
      stripePaymentLink: "https://buy.stripe.com/test_example?prefilled_email=a%40b.co",
    };
    const url = new URL(slotCheckout(messy, EMAIL).href);
    expect(url.searchParams.get("client_reference_id")).toBe("North-Sea-UK-energy");
    expect(url.searchParams.get("prefilled_email")).toBe("a@b.co");
    expect(slotCheckout({ ...messy, id: "???" }, EMAIL).href).toBe("https://buy.stripe.com/test_example?prefilled_email=a%40b.co");
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
