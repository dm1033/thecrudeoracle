/** Decode the packed Natural Earth land mask (int16 degrees × 100, little-endian). */

function bytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function decodePoints(b64: string): Float32Array {
  const raw = bytes(b64);
  const view = new DataView(raw.buffer);
  const n = raw.length / 4;
  const xyz = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const lat = (view.getInt16(i * 4, true) / 100) * (Math.PI / 180);
    const lon = (view.getInt16(i * 4 + 2, true) / 100) * (Math.PI / 180);
    const cosLat = Math.cos(lat);
    xyz[i * 3] = cosLat * Math.cos(lon);
    xyz[i * 3 + 1] = Math.sin(lat);
    xyz[i * 3 + 2] = cosLat * Math.sin(lon);
  }
  return xyz;
}

export function decodeEdges(b64: string): Uint16Array {
  const raw = bytes(b64);
  const view = new DataView(raw.buffer);
  const n = raw.length / 4;
  const edges = new Uint16Array(n * 2);
  for (let i = 0; i < n; i++) {
    edges[i * 2] = view.getUint16(i * 4, true);
    edges[i * 2 + 1] = view.getUint16(i * 4 + 2, true);
  }
  return edges;
}
