import { Slider } from "@/components/ui/slider";

const SliderField = ({ label, value, min, max, step = 1, format = (v) => v, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-200">
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{format(value)}</span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={(v) => onChange(v[0])}
      className="w-full"
    />
  </div>
);

export default SliderField;
