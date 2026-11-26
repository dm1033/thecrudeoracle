import { NextResponse } from "next/server";
import { deliverSponsorEnquiry, parseSponsorEnquiry } from "@/lib/sponsor-enquiry";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "unreadable" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as { company?: unknown }) : {};
  if (typeof record.company === "string" && record.company.trim() !== "") {
    return NextResponse.json({ ok: true, delivery: "sent" });
  }

  const parsed = parseSponsorEnquiry(body);
  if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

  const result = await deliverSponsorEnquiry(parsed.value, process.env, SITE.contactEmail);
  return NextResponse.json({ ok: true, ...result });
}
