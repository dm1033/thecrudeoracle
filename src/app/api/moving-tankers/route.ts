import { NextResponse } from "next/server";
import { loadMovingTankerFeed } from "@/lib/tankermap-feed";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

/** Delayed TankerMap positions for hulls underway at 1 knot or more. */
export async function GET() {
  const feed = await loadMovingTankerFeed();
  return NextResponse.json(feed);
}
