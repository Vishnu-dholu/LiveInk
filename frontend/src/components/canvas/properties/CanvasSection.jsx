import { useDispatch, useSelector } from "react-redux";
import { setBackground, setZoom, toggleGrid } from "@/store/drawingSlice";
import { Switch } from "@/components/ui/switch";
import ColorField from "./ColorField";
import SliderField from "./SliderField";

const CanvasSection = () => {
  const dispatch = useDispatch();
  const showGrid = useSelector((state) => state.drawing.showGrid);
  const zoom = useSelector((state) => state.drawing.zoom);
  const background = useSelector((state) => state.drawing.background);

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-200">
        Show grid
        <Switch checked={showGrid} onCheckedChange={() => dispatch(toggleGrid())} />
      </label>

      <div className="space-y-1">
        <SliderField
          label="Zoom"
          value={zoom}
          min={0.2}
          max={3}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(value) => dispatch(setZoom(value))}
        />
        <button
          type="button"
          onClick={() => dispatch(setZoom(1))}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Reset to 100%
        </button>
      </div>

      <div className="space-y-1">
        <ColorField
          label="Canvas background (shared)"
          value={background || "#ffffff"}
          onChange={(color) => dispatch(setBackground(color))}
        />
        {background && (
          <button
            type="button"
            onClick={() => dispatch(setBackground(null))}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset to default
          </button>
        )}
      </div>
    </div>
  );
};

export default CanvasSection;
