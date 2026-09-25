/** Illustrative crude and LNG sea lanes. Not live AIS. */

export type Vessel = "tanker" | "lng";

export interface SeaLane {
  id: string;
  vessel: Vessel;
  /** [lat, lon] waypoints. */
  waypoints: [number, number][];
  ships: number;
}

export const SEA_LANES: SeaLane[] = [
  {
    id: "gulf-cape-rotterdam",
    vessel: "tanker",
    waypoints: [
      [26.6, 50.1],
      [22.5, 60.2],
      [12.2, 51.0],
      [-1.5, 45.5],
      [-30.0, 34.0],
      [-34.8, 18.4],
      [-20.0, -5.0],
      [8.0, -18.0],
      [36.0, -10.0],
      [48.5, -5.5],
      [51.9, 3.6],
    ],
    ships: 3,
  },
  {
    id: "gulf-malacca-china",
    vessel: "tanker",
    waypoints: [
      [26.2, 51.5],
      [24.5, 57.5],
      [15.0, 70.0],
      [6.2, 90.0],
      [1.4, 103.5],
      [8.0, 110.0],
      [18.0, 116.0],
      [29.8, 122.5],
    ],
    ships: 3,
  },
  {
    id: "waf-europe",
    vessel: "tanker",
    waypoints: [
      [4.2, 5.5],
      [6.0, -2.0],
      [18.0, -18.5],
      [36.5, -10.0],
      [49.0, -4.0],
      [51.5, 1.5],
    ],
    ships: 2,
  },
  {
    id: "usgc-europe",
    vessel: "tanker",
    waypoints: [
      [28.5, -90.5],
      [28.0, -80.0],
      [32.0, -65.0],
      [40.0, -40.0],
      [48.0, -12.0],
      [51.2, 2.5],
    ],
    ships: 2,
  },
  {
    id: "qatar-lng-japan",
    vessel: "lng",
    waypoints: [
      [25.9, 51.6],
      [15.5, 68.0],
      [6.0, 88.0],
      [1.6, 103.8],
      [14.0, 118.0],
      [28.0, 130.0],
      [34.6, 139.5],
    ],
    ships: 2,
  },
  {
    id: "usgc-lng-europe",
    vessel: "lng",
    waypoints: [
      [29.5, -93.8],
      [27.0, -82.0],
      [30.0, -60.0],
      [38.0, -35.0],
      [48.5, -8.0],
      [51.7, -5.1],
    ],
    ships: 2,
  },
  {
    id: "australia-lng-korea",
    vessel: "lng",
    waypoints: [
      [-20.5, 116.5],
      [-12.0, 122.0],
      [2.0, 128.0],
      [18.0, 130.0],
      [32.0, 128.5],
      [35.0, 129.5],
    ],
    ships: 1,
  },
];

export const RIGS: { name: string; lat: number; lon: number }[] = [
  { name: "North Sea", lat: 58.4, lon: 1.6 },
  { name: "Gulf of Mexico", lat: 28.2, lon: -88.8 },
  { name: "Santos", lat: -25.2, lon: -42.8 },
  { name: "Stabroek", lat: 8.1, lon: -56.9 },
  { name: "Bonga", lat: 4.6, lon: 4.5 },
  { name: "Arabian Gulf", lat: 26.4, lon: 52.4 },
];

export const HUBS: { name: string; lat: number; lon: number }[] = [
  { name: "Rotterdam", lat: 51.9, lon: 4.1 },
  { name: "Houston", lat: 29.3, lon: -94.8 },
  { name: "Ras Tanura", lat: 26.7, lon: 50.2 },
  { name: "Singapore", lat: 1.3, lon: 103.8 },
  { name: "Ningbo", lat: 29.9, lon: 121.9 },
];
