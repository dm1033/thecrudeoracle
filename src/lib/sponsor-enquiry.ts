import { isValidEmail } from "@/lib/newsletter";
import { SPONSOR_SLOTS, type SponsorSlot } from "@/lib/sponsor-slots";

export const GENERAL_ENQUIRY_ID = "general";

export interface SponsorEnquiry {
  name: string;
  email: string;
  organisation: string;
  slotId: string;
  months: string;
  message: string;
}

const MONTHS = new Set(["", "1", "3", "6", "12"]);

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function parseSponsorEnquiry(
  input: unknown,
  slots: readonly SponsorSlot[] = SPONSOR_SLOTS,
): { ok: true; value: SponsorEnquiry } | { ok: false; error: string } {
  const record = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const name = text(record.name, 120);
  const email = text(record.email, 320);
  const organisation = text(record.organisation, 160);
  const slotId = text(record.slotId, 80);
  const months = text(record.months, 2);
  const message = text(record.message, 4000);
  if (name.length < 2) return { ok: false, error: "Name is required." };
  if (!isValidEmail(email)) return { ok: false, error: "A valid email is required." };
  if (message.length < 2) return { ok: false, error: "Message is required." };
  const known = slotId === GENERAL_ENQUIRY_ID || slots.some((slot) => slot.id === slotId);
  if (!known) return { ok: false, error: "Choose a slot." };
  if (!MONTHS.has(months)) return { ok: false, error: "Choose a period of 1, 3, 6 or 12 months." };
  return { ok: true, value: { name, email, organisation, slotId, months, message } };
}

export function sponsorEnquirySlot(slotId: string, slots: readonly SponsorSlot[] = SPONSOR_SLOTS): SponsorSlot | undefined {
  return slots.find((slot) => slot.id === slotId);
}

/** Mailto fallback. The slot name is already in the subject and the body. */
export function sponsorEnquiryMailto(value: SponsorEnquiry, contactEmail: string, slots: readonly SponsorSlot[] = SPONSOR_SLOTS): string {
  const slot = sponsorEnquirySlot(value.slotId, slots);
  const slotName = slot?.name ?? "General enquiry";
  const subject = `Sponsorship enquiry: ${slotName}`;
  const body = [
    `Name: ${value.name}`,
    `Email: ${value.email}`,
    `Organisation: ${value.organisation || "—"}`,
    `Slot: ${slotName}${slot ? ` (${slot.id})` : ""}`,
    `Placement: ${slot?.placement ?? "—"}`,
    `Price: ${slot?.price ?? "—"}`,
    `Months: ${value.months || "—"}`,
    "",
    value.message,
  ].join("\n");
  return `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Blank, missing, or the placeholder key means the form stays on the mailto fallback. */
export function sponsorEnquiryAccessKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = env.SPONSOR_ENQUIRY_ACCESS_KEY?.trim();
  if (!key || key === "replace_me") return null;
  return key;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

/**
 * Web3Forms when David has set SPONSOR_ENQUIRY_ACCESS_KEY.
 * Any miss, including a failed post, returns the mailto fallback.
 */
export async function deliverSponsorEnquiry(
  value: SponsorEnquiry,
  env: Record<string, string | undefined> = process.env,
  contactEmail = "intelligence@thecrudeoracle.com",
  fetchImpl: FetchLike = fetch,
  slots: readonly SponsorSlot[] = SPONSOR_SLOTS,
): Promise<{ delivery: "sent" } | { delivery: "mailto"; href: string }> {
  const href = sponsorEnquiryMailto(value, contactEmail, slots);
  const accessKey = sponsorEnquiryAccessKey(env);
  if (!accessKey) return { delivery: "mailto", href };
  const slot = sponsorEnquirySlot(value.slotId, slots);
  const slotName = slot?.name ?? "General enquiry";
  try {
    const response = await fetchImpl("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: AbortSignal.timeout(4_000),
      body: JSON.stringify({
        access_key: accessKey,
        subject: `Sponsorship enquiry: ${slotName}`,
        from_name: value.name,
        email: value.email,
        organisation: value.organisation,
        slot: slot ? `${slot.name} (${slot.id})` : slotName,
        placement: slot?.placement ?? "",
        price: slot?.price ?? "",
        months: value.months,
        message: value.message,
      }),
    });
    if (!response.ok) return { delivery: "mailto", href };
    const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;
    if (payload?.success === false) return { delivery: "mailto", href };
    return { delivery: "sent" };
  } catch {
    return { delivery: "mailto", href };
  }
}
