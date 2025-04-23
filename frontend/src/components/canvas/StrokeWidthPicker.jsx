import { useDispatch, useSelector } from "react-redux";
import { setStrokeWidth } from "@/store/drawingSlice";
import { Slider } from "@/components/ui/slider"; // Make sure this is installed
import { Pencil } from "lucide-react"; // Optional icon

const StrokeWidthPicker = () => {
  const dispatch = useDispatch();
  const currentStrokeWidth = useSelector(
    (state) => state.drawing.currentStrokeWidth
  );

  const handleChange = (value) => {
    dispatch(setStrokeWidth(value[0]));
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-3 rounded-lg bg-gray-300 dark:bg-gray-600 shadow-md border border-gray-200 dark:border-gray-700 max-w-sm">
      {/* Header with icon */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
        <Pencil className="w-4 h-4" />
        Line Size:{" "}
        <span className="ml-auto font-semibold">{currentStrokeWidth}px</span>
      </div>

      {/* Styled slider */}
      <Slider
        defaultValue={[currentStrokeWidth]}
        min={1}
        max={10}
        step={1}
        onValueChange={handleChange}
        className="w-full"
      />
    </div>
  );
};

export default StrokeWidthPicker;
