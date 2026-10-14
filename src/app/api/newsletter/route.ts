import { NextResponse } from "next/server";
import { isValidEmail, subscribeEmail } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, status: "rejected" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as { email?: unknown; company?: unknown }) : {};
  if (typeof record.company === "string" && record.company.trim() !== "") {
    return NextResponse.json({ ok: true, status: "subscribed" });
  }

  const email = typeof record.email === "string" ? record.email.trim() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, status: "rejected" }, { status: 400 });
  }

  const result = await subscribeEmail(email);
  const status = result.ok ? 200 : 502;
  return NextResponse.json(result, { status });
}
