export const DASH_STYLES = ["solid", "dashed", "dotted"];

// Konva dash array for a dash style at a given stroke width
export function dashFor(style, width = 2) {
  const w = Math.max(width, 1);
  if (style === "dashed") return [w * 3, w * 2];
  if (style === "dotted") return [w, w * 2];
  return [];
}
