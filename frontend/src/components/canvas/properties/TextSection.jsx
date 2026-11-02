import ColorField from "./ColorField";
import SliderField from "./SliderField";

const FONTS = [
  "Arial", "Helvetica", "Verdana", "Tahoma", "Trebuchet MS", "Georgia",
  "Palatino Linotype", "Times New Roman", "Courier New", "Lucida Console", "Roboto",
];
const STYLES = [
  ["normal", "Normal"],
  ["bold", "Bold"],
  ["italic", "Italic"],
  ["bold italic", "Bold Italic"],
];

const selectClass =
  "p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-black dark:text-white";

// values: { fill, fontSize, fontFamily, fontStyle, opacity? }; onChange(patch, propName)
const TextSection = ({ values, onChange, showOpacity }) => (
  <div className="space-y-4">
    <ColorField
      label="Text color"
      value={values.fill}
      onChange={(fill) => onChange({ fill }, "fill")}
    />
    <SliderField
      label="Font size"
      value={values.fontSize}
      min={8}
      max={120}
      format={(v) => `${v}px`}
      onChange={(fontSize) => onChange({ fontSize }, "fontSize")}
    />
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Font family</span>
      <select
        value={values.fontFamily}
        onChange={(e) => onChange({ fontFamily: e.target.value }, "fontFamily")}
        className={selectClass}
      >
        {FONTS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    </div>
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Font style</span>
      <select
        value={values.fontStyle}
        onChange={(e) => onChange({ fontStyle: e.target.value }, "fontStyle")}
        className={selectClass}
      >
        {STYLES.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </div>
    {showOpacity && (
      <SliderField
        label="Opacity"
        value={values.opacity}
        min={0.05}
        max={1}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(opacity) => onChange({ opacity }, "opacity")}
      />
    )}
  </div>
);

export default TextSection;
