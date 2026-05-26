import { setZoom } from "@/store/drawingSlice";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Minus, RotateCcw } from "lucide-react";

/**
 *  ZoomControls component provides UI to zoom in/out and reset zoom level.
 *  It uses a modern glassmorphic horizontal pill design.
 */
const ZoomControls = () => {
  const dispatch = useDispatch();
  const zoom = useSelector((state) => state.drawing.zoom);

  // Handles zoom increment/decrement within a defined range
  const handleZoom = (factor) => {
    const newZoom = Math.max(0.2, Math.min(zoom + factor, 3));
    dispatch(setZoom(newZoom));
  };

  // Resets zoom level to default (100%)
  const handleReset = () => {
    dispatch(setZoom(1));
  };

  return (
    <div className="flex items-center gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/50 shadow-xl rounded-full px-2 py-1.5 transition-all hover:shadow-2xl">
      <button
        onClick={() => handleZoom(-0.1)}
        className="w-8 h-8 rounded-full flex items-center justify-center p-0 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all outline-none"
        title="Zoom Out (Ctrl -)"
      >
        <Minus size={18} />
      </button>

      <div
        className="text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[3.5rem] text-center cursor-pointer select-none hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        onClick={handleReset}
        title="Reset Zoom (Ctrl 0)"
      >
        {(zoom * 100).toFixed(0)}%
      </div>

      <button
        onClick={() => handleZoom(0.1)}
        className="w-8 h-8 rounded-full flex items-center justify-center p-0 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all outline-none"
        title="Zoom In (Ctrl +)"
      >
        <Plus size={18} />
      </button>

      <div className="w-[1px] h-5 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        onClick={handleReset}
        className="w-8 h-8 rounded-full flex items-center justify-center p-0 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all outline-none"
        title="Reset Zoom (Ctrl 0)"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
};

export default ZoomControls;
