import { setZoom } from "@/store/drawingSlice";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../ui/button";

const ZoomControls = () => {
  const dispatch = useDispatch();
  const zoom = useSelector((state) => state.drawing.zoom);

  const handleZoom = (factor) => {
    const newZoom = Math.max(0.2, Math.min(zoom + factor, 3));
    dispatch(setZoom(newZoom));
  };

  const handleReset = () => {
    dispatch(setZoom(1));
  };

  return (
    <div className="flex flex-col items-center gap-2 border-2 border-gray-400 bg-gray-200 dark:bg-blue-900 px-3 py-2 rounded-md shadow-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(-0.1)}
          className="px-3 text-lg dark:bg-blue-400 dark:text-gray-900"
        >
          −
        </Button>

        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {(zoom * 100).toFixed(0)}%
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handleZoom(0.1)}
          className="px-3 text-lg dark:bg-blue-400 dark:text-gray-900"
        >
          +
        </Button>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleReset}
        className="text-xs dark:bg-blue-400 dark:text-gray-900"
      >
        Reset
      </Button>
    </div>
  );
};

export default ZoomControls;
