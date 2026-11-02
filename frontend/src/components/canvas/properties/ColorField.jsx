import { useDispatch, useSelector } from "react-redux";
import { addRecentColor } from "@/store/drawingSlice";

const PRESETS = ["#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
const NAMED = { black: "#000000", white: "#ffffff" };

// <input type="color"> only accepts #rrggbb
const toHex = (value) => {
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  return NAMED[value] || "#000000";
};

/**
 * Colour control: native picker, preset swatches and the colours used recently.
 * onChange fires continuously while dragging in the native picker.
 */
const ColorField = ({ label, value, onChange, allowNone = false }) => {
  const dispatch = useDispatch();
  const recentColors = useSelector((state) => state.drawing.recentColors);
  const isNone = value === "transparent";

  const pick = (color) => {
    onChange(color);
    dispatch(addRecentColor(color));
  };

  const renderSwatch = (color) => (
    <button
      key={color}
      type="button"
      title={color}
      onClick={() => pick(color)}
      className={`h-5 w-5 rounded border ${
        !isNone && toHex(value) === color
          ? "ring-2 ring-blue-500 border-white"
          : "border-gray-400 dark:border-gray-500"
      }`}
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-200">
        <span>{label}</span>
        <span className="font-mono">{isNone ? "none" : toHex(value)}</span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={toHex(value)}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => dispatch(addRecentColor(e.target.value))}
          className="h-8 w-12 cursor-pointer rounded border border-gray-300 dark:border-gray-600 bg-transparent p-0.5"
        />
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange("transparent")}
            className={`px-2 py-1 text-xs rounded border ${
              isNone
                ? "bg-blue-500 text-white border-blue-600"
                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            No fill
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">{PRESETS.map(renderSwatch)}</div>

      {recentColors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Recent
          </span>
          {recentColors.map(renderSwatch)}
        </div>
      )}
    </div>
  );
};

export default ColorField;
