import { NextResponse } from "next/server";
import { checkEiaHealth } from "@/lib/published-prices";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Reports whether the EIA spot feed is configured and answering. Does not return the API key. */
export async function GET() {
  const health = await checkEiaHealth();
  return NextResponse.json(health);
}
