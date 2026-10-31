// Computes the minimal set of ops (add / update / remove / clear, keyed by item id)
// between two canvas states. The server applies the same ops to its copy of the canvas.

const KINDS = [
  ["line", "lines"],
  ["shape", "shapes"],
  ["text", "texts"],
];

function valueEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!valueEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  if (keysA.length !== Object.keys(b).length) return false;
  return keysA.every((k) => valueEqual(a[k], b[k]));
}

// Only the fields that changed (null if nothing did)
function itemPatch(prev, next) {
  let patch = null;
  for (const key of Object.keys(next)) {
    if (key === "id") continue;
    if (!valueEqual(prev[key], next[key])) {
      patch = patch || {};
      patch[key] = next[key];
    }
  }
  return patch;
}

export function diffCanvas(prev, next) {
  const hadItems = KINDS.some(([, key]) => prev[key].length > 0);
  const hasItems = KINDS.some(([, key]) => next[key].length > 0);
  if (hadItems && !hasItems) return [{ op: "clear" }];

  const ops = [];
  for (const [kind, key] of KINDS) {
    const before = prev[key];
    const after = next[key];
    if (before === after) continue;

    const beforeById = new Map(before.map((item) => [item.id, item]));
    const afterIds = new Set();

    for (const item of after) {
      afterIds.add(item.id);
      const old = beforeById.get(item.id);
      if (!old) {
        ops.push({ op: "add", kind, item });
      } else if (old !== item) {
        const patch = itemPatch(old, item);
        if (patch) ops.push({ op: "update", kind, id: item.id, patch });
      }
    }

    for (const item of before) {
      if (!afterIds.has(item.id)) ops.push({ op: "remove", kind, id: item.id });
    }
  }
  return ops;
}
