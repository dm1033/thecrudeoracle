/**
 * Reference boxes for the seaborne map.
 * They are navigation labels, not a transit census and not an outage feed.
 */

export interface Chokepoint {
  id: "hormuz" | "bab-el-mandeb" | "suez" | "malacca" | "usgc" | "north-sea";
  name: string;
  note: string;
  /** [lon, lat] ring, closed. */
  ring: [number, number][];
}

function box(lon: number, lat: number, dLon = 1.4, dLat = 0.9): [number, number][] {
  return [
    [lon - dLon, lat - dLat],
    [lon + dLon, lat - dLat],
    [lon + dLon, lat + dLat],
    [lon - dLon, lat + dLat],
    [lon - dLon, lat - dLat],
  ];
}

export const CHOKEPOINTS: readonly Chokepoint[] = [
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    note: "Reference area between Oman and Iran. This map has no proprietary outage or flow figure for the strait.",
    ring: box(56.5, 26.6, 1.6, 0.8),
  },
  {
    id: "bab-el-mandeb",
    name: "Bab el-Mandeb",
    note: "Reference area at the southern Red Sea. Coverage counts are GDELT news volume, not a risk score.",
    ring: box(43.3, 12.6, 1.1, 0.7),
  },
  {
    id: "suez",
    name: "Suez Canal",
    note: "Reference area for the canal and northern Gulf of Suez. No transit tally is published here.",
    ring: box(32.5, 30.4, 0.8, 1.1),
  },
  {
    id: "malacca",
    name: "Strait of Malacca",
    note: "Reference area between the Malay Peninsula and Sumatra. Lanes drawn here are schematic.",
    ring: box(100.8, 2.8, 2.2, 1.1),
  },
  {
    id: "usgc",
    name: "US Gulf Coast",
    note: "Reference area for the US Gulf loading region. It is not a port-call feed.",
    ring: box(-90.2, 27.6, 3.2, 1.6),
  },
  {
    id: "north-sea",
    name: "North Sea",
    note: "Reference area for the northern North Sea loading region, including the Brent marker's home basin.",
    ring: box(2.2, 58.6, 3.4, 2.2),
  },
];

export function chokepointById(id: string): Chokepoint | null {
  return CHOKEPOINTS.find((item) => item.id === id) ?? null;
}
