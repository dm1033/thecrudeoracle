import { COAST } from "@/components/globe-land";
import attachmentsJson from "../../data/vessel-attachments.json";
import {
  TANKERMAP_ORIGIN,
  type VesselWatchView,
  buildVesselMapModel,
  findAttachment,
  parseSearchHit,
  parseTrack,
  parseVessel,
  readAttachments,
  resolveVesselQuery,
  tankermapProfileUrl,
  tankermapShareUrl,
} from "@/lib/tankermap";

const ATTACHMENTS = readAttachments(attachmentsJson);

async function tankermapJson(path: string): Promise<unknown> {
  const response = await fetch(`${TANKERMAP_ORIGIN}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "TheCrudeOracle/1.0 (+https://www.thecrudeoracle.com; vessel watch)",
    },
    next: { revalidate: 1800 },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    throw new Error(`TankerMap ${response.status} for ${path}`);
  }
  return response.json();
}

function baseView(imo: string, notice: string | null, retrievedAt: string): VesselWatchView {
  return {
    imo,
    status: "missing",
    notice,
    shareUrl: tankermapShareUrl(imo),
    profileUrl: tankermapProfileUrl(imo),
    vessel: null,
    track: [],
    attachment: findAttachment(ATTACHMENTS, imo),
    map: null,
    retrievedAt,
  };
}

export async function loadWatchedVessel(rawQuery: string | undefined): Promise<VesselWatchView> {
  const retrievedAt = new Date().toISOString();
  const { imo, notice } = resolveVesselQuery(rawQuery);

  const view = baseView(imo, notice, retrievedAt);

  try {
    const search = await tankermapJson(`/api/search?q=${encodeURIComponent(imo)}`);
    const hit = parseSearchHit(search, Number(imo));
    if (!hit) {
      return { ...view, status: "missing" };
    }

    const [vesselPayload, trackPayload] = await Promise.all([
      tankermapJson(`/api/vessels/${hit.id}`),
      tankermapJson(`/api/vessels/${hit.id}/track`),
    ]);
    const vessel = parseVessel(vesselPayload);
    if (!vessel || vessel.imo !== Number(imo)) {
      return { ...view, status: "missing" };
    }
    const track = parseTrack(trackPayload);
    return {
      ...view,
      status: "ok",
      vessel,
      track,
      map: buildVesselMapModel({
        vessel,
        track,
        places: view.attachment?.places ?? [],
        coast: COAST,
      }),
    };
  } catch {
    return { ...view, status: "unavailable" };
  }
}
