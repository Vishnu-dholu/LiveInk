// Per-browser drawing preferences (stroke width, colours, font defaults...).
// Storage can be unavailable (private mode), so every access is guarded.
const STORAGE_KEY = "liveink:drawingPrefs";

const VALIDATORS = {
  currentStrokeColor: (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v),
  currentTextColor: (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v),
  currentStrokeWidth: (v) => Number.isFinite(v) && v >= 1 && v <= 40,
  currentOpacity: (v) => Number.isFinite(v) && v >= 0.05 && v <= 1,
  currentDashStyle: (v) => ["solid", "dashed", "dotted"].includes(v),
  fontFamily: (v) => typeof v === "string" && v.length < 60,
  fontStyle: (v) => ["normal", "bold", "italic", "bold italic"].includes(v),
  fontSize: (v) => Number.isFinite(v) && v >= 2 && v <= 400,
  recentColors: (v) =>
    Array.isArray(v) && v.length <= 8 && v.every((c) => /^#[0-9a-fA-F]{6}$/.test(c)),
};

export const PREF_KEYS = Object.keys(VALIDATORS);

export function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const prefs = {};
    for (const key of PREF_KEYS) {
      if (key in raw && VALIDATORS[key](raw[key])) prefs[key] = raw[key];
    }
    return prefs;
  } catch {
    return {};
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage unavailable: preferences just won't persist
  }
}
