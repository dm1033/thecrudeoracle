/**
 * Schematic offshore marks for the homepage earth.
 * These are rounded public field locations used as desk symbols.
 * They are not a rig census, not Baker Hughes, and not live positions.
 */

export type OffshoreRig = {
  id: string;
  name: string;
  basin: string;
  lat: number;
  lon: number;
};

export const OFFSHORE_RIGS: readonly OffshoreRig[] = [
  { id: "brent-field", name: "Brent", basin: "North Sea", lat: 61.15, lon: 1.7 },
  { id: "troll", name: "Troll", basin: "North Sea", lat: 60.64, lon: 3.72 },
  { id: "ekofisk", name: "Ekofisk", basin: "North Sea", lat: 56.54, lon: 3.21 },
  { id: "clair", name: "Clair", basin: "West of Shetland", lat: 60.75, lon: -2.5 },
  { id: "thunder-horse", name: "Thunder Horse", basin: "US Gulf", lat: 28.8, lon: -87.8 },
  { id: "perdido", name: "Perdido", basin: "US Gulf", lat: 26.13, lon: -94.9 },
  { id: "safaniya", name: "Safaniya", basin: "Arabian Gulf", lat: 28.3, lon: 48.75 },
  { id: "upper-zakum", name: "Upper Zakum", basin: "Arabian Gulf", lat: 24.98, lon: 53.65 },
  { id: "lula", name: "Lula", basin: "Santos", lat: -25.05, lon: -42.55 },
  { id: "bonga", name: "Bonga", basin: "Nigeria", lat: 4.55, lon: 4.55 },
  { id: "liza", name: "Liza", basin: "Guyana", lat: 8.0, lon: -56.85 },
  { id: "girassol", name: "Girassol", basin: "Angola", lat: -7.65, lon: 11.68 },
  { id: "gorgon", name: "Gorgon", basin: "North West Shelf", lat: -20.55, lon: 115.05 },
  { id: "hibernia", name: "Hibernia", basin: "Grand Banks", lat: 46.75, lon: -48.78 },
];
