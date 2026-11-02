import { nanoid } from "nanoid";

// op.kind -> key in the canvas document
const KIND_KEYS = { line: "lines", shape: "shapes", text: "texts" };
const KEYS = Object.values(KIND_KEYS);

export const MAX_OPS_PER_BATCH = 500;
const MAX_ITEMS_PER_KIND = 20000;
const MAX_ID_LENGTH = 100;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isValidId = (v) => typeof v === "string" && v.length > 0 && v.length <= MAX_ID_LENGTH;

function cleanObject(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!FORBIDDEN_KEYS.has(key)) out[key] = value;
  }
  return out;
}

/**
 * Canvas documents are kept as Map<id, item> per kind (insertion order = z-order)
 * so ops resolve in O(1).
 */
export function createCanvas(raw) {
  const canvas = { lines: new Map(), shapes: new Map(), texts: new Map(), background: null };
  if (!isPlainObject(raw)) return canvas;

  if (typeof raw.background === "string" && COLOR_RE.test(raw.background)) {
    canvas.background = raw.background;
  }

  for (const key of KEYS) {
    if (!Array.isArray(raw[key])) continue;
    for (const item of raw[key]) {
      if (!isPlainObject(item)) continue;
      // Older saved canvases stored lines without ids
      const id = isValidId(item.id) ? item.id : nanoid(12);
      canvas[key].set(id, { ...cleanObject(item), id });
    }
  }
  return canvas;
}

export function serializeCanvas(canvas) {
  return {
    lines: [...canvas.lines.values()],
    shapes: [...canvas.shapes.values()],
    texts: [...canvas.texts.values()],
    background: canvas.background,
  };
}

/**
 * Applies a batch of ops {op: add|update|remove|clear, kind, id, item, patch}.
 * Returns the ops that were valid and applied (safe to relay to other clients).
 */
export function applyOps(canvas, ops) {
  if (!Array.isArray(ops)) return [];

  const applied = [];
  for (const op of ops.slice(0, MAX_OPS_PER_BATCH)) {
    if (!isPlainObject(op)) continue;

    if (op.op === "clear") {
      for (const key of KEYS) canvas[key].clear();
      applied.push({ op: "clear" });
      continue;
    }

    if (op.op === "background") {
      if (op.value !== null && !(typeof op.value === "string" && COLOR_RE.test(op.value))) continue;
      canvas.background = op.value;
      applied.push({ op: "background", value: op.value });
      continue;
    }

    const key = KIND_KEYS[op.kind];
    if (!key) continue;
    const items = canvas[key];

    if (op.op === "add") {
      if (!isPlainObject(op.item) || !isValidId(op.item.id)) continue;
      if (items.has(op.item.id) || items.size >= MAX_ITEMS_PER_KIND) continue;
      const item = cleanObject(op.item);
      items.set(item.id, item);
      applied.push({ op: "add", kind: op.kind, item });
    } else if (op.op === "update") {
      const target = isValidId(op.id) ? items.get(op.id) : null;
      if (!target || !isPlainObject(op.patch)) continue;
      const { id: _ignored, ...patch } = cleanObject(op.patch);
      Object.assign(target, patch);
      applied.push({ op: "update", kind: op.kind, id: op.id, patch });
    } else if (op.op === "order") {
      // Full list of ids in the new z-order (back to front); unknown ids are ignored
      // and items not mentioned keep their relative order at the end
      if (!Array.isArray(op.ids) || op.ids.length > MAX_ITEMS_PER_KIND) continue;
      const ordered = new Map();
      for (const id of op.ids) {
        if (typeof id === "string" && items.has(id) && !ordered.has(id)) ordered.set(id, items.get(id));
      }
      for (const [id, item] of items) if (!ordered.has(id)) ordered.set(id, item);
      canvas[key] = ordered;
      applied.push({ op: "order", kind: op.kind, ids: [...ordered.keys()] });
    } else if (op.op === "remove") {
      if (isValidId(op.id) && items.delete(op.id)) {
        applied.push({ op: "remove", kind: op.kind, id: op.id });
      }
    }
  }
  return applied;
}
