/**
 * Deterministic, self-contained media library.
 * The demo ships zero external image assets: every "photo" is a generated
 * gradient tile paired with a category glyph, so the UI is fully offline.
 */

export interface MediaAsset {
  id: string;
  label: string;
  from: string;
  to: string;
  accent: string;
}

const palettes: [string, string, string][] = [
  ["#e7ecff", "#c3cdfb", "#5a5de3"],
  ["#e6fbf3", "#b8efdb", "#059669"],
  ["#fff1e6", "#ffd6b8", "#ea580c"],
  ["#fdeaf3", "#fbc7e0", "#db2777"],
  ["#e6f6ff", "#bde5fb", "#0284c7"],
  ["#f1ecff", "#d9ccfd", "#7c3aed"],
  ["#fff7d6", "#fbe49c", "#ca8a04"],
  ["#e8f5e9", "#c3e6c8", "#2f7d32"],
  ["#fdecec", "#f8caca", "#dc2626"],
  ["#eef2f7", "#d3dce8", "#475569"],
  ["#f0f4ff", "#ccd9f7", "#3b5bdb"],
  ["#fff0f5", "#ffcfe1", "#c2255c"],
];

export const MEDIA_ASSETS: MediaAsset[] = palettes.map(([from, to, accent], index) => ({
  id: `asset-${String(index + 1).padStart(2, "0")}`,
  label: `Studio tile ${String(index + 1).padStart(2, "0")}`,
  from,
  to,
  accent,
}));

export const MEDIA_MAP = new Map(MEDIA_ASSETS.map((asset) => [asset.id, asset]));

export function getMedia(id: string): MediaAsset {
  return MEDIA_MAP.get(id) ?? MEDIA_ASSETS[0];
}

/** Deterministic image identifiers for a product, derived from its index. */
export function productImageIds(index: number, count = 3): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    ids.push(MEDIA_ASSETS[(index * 3 + i * 5) % MEDIA_ASSETS.length].id);
  }
  return ids;
}
