import { NextResponse } from "next/server";
import { loadWatchedVessel } from "@/lib/tankermap-feed";

export const revalidate = 1800;

/** Slim delayed position for the homepage earth. Same one hull as the flow map. */
export async function GET() {
  const view = await loadWatchedVessel(undefined);
  const vessel = view.vessel;
  if (view.status !== "ok" || !vessel) {
    return NextResponse.json({ ship: null });
  }
  return NextResponse.json({
    ship: {
      name: vessel.name,
      imo: String(vessel.imo),
      lat: vessel.lat,
      lon: vessel.lon,
      cogDeg: vessel.cogDeg,
      speedKn: vessel.speedKn,
      observedAt: vessel.observedAt,
      shareUrl: view.shareUrl,
    },
  });
}
