/**
 * Keyless NASA GIBS mosaics. Public imagery, not a live picture of the hulls.
 * Blue Marble is a shaded-relief composite. VIIRS is the day/night band.
 */

export type SatelliteBasemapId = "day" | "night";

export type SatelliteBasemap = {
  id: "sat-day" | "sat-night";
  label: string;
  tiles: string;
  maxZoom: number;
  attribution: string;
  note: string;
  href: string;
};

const GIBS = "https://www.earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs";

export const SATELLITE_BASEMAPS: Record<SatelliteBasemapId, SatelliteBasemap> = {
  day: {
    id: "sat-day",
    label: "Day satellite",
    tiles:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg",
    maxZoom: 8,
    attribution: "NASA GIBS Blue Marble Shaded Relief and Bathymetry",
    note: "NASA mosaic. Not a live picture of these hulls.",
    href: GIBS,
  },
  night: {
    id: "sat-night",
    label: "Night satellite",
    tiles:
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png",
    maxZoom: 8,
    attribution: "NASA GIBS VIIRS Black Marble",
    note: "NASA night-lights mosaic. Not a live picture of these hulls.",
    href: GIBS,
  },
};
