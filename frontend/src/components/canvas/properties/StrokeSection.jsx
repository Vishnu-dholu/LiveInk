import ColorField from "./ColorField";
import SliderField from "./SliderField";
import DashSelector from "./DashSelector";

// values: { stroke, strokeWidth, opacity, dashStyle }; onChange(patch, propName)
const StrokeSection = ({ values, onChange }) => (
  <div className="space-y-4">
    <ColorField
      label="Stroke color"
      value={values.stroke}
      onChange={(stroke) => onChange({ stroke }, "stroke")}
    />
    <SliderField
      label="Stroke width"
      value={values.strokeWidth}
      min={1}
      max={40}
      format={(v) => `${v}px`}
      onChange={(strokeWidth) => onChange({ strokeWidth }, "strokeWidth")}
    />
    <SliderField
      label="Opacity"
      value={values.opacity}
      min={0.05}
      max={1}
      step={0.05}
      format={(v) => `${Math.round(v * 100)}%`}
      onChange={(opacity) => onChange({ opacity }, "opacity")}
    />
    <DashSelector
      value={values.dashStyle}
      onChange={(dashStyle) => onChange({ dashStyle }, "dashStyle")}
    />
  </div>
);

export default StrokeSection;
