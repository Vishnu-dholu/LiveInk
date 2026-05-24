import {
  resetFillColor,
  setFillColor,
  updateTextFill,
} from "@/store/drawingSlice";
import { useDispatch, useSelector } from "react-redux";
import { ChromePicker } from "react-color";
import { socket } from "@/lib/socket";

/**
 * ColorPickerWrapper renders a ChromePicker for the paint bucket tool.
 * 
 * Behavior:
 * - Always sets `currentFillColor` so the next click on a shape/text fills it.
 * - If a text is already selected (via prior click), it also fills that text immediately.
 */
const ColorPickerWrapper = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor,
  );

  const handleChange = (color) => {
    const hex = color.hex;
    // Always update the current fill color for future paint clicks
    dispatch(setFillColor(hex));
  };

  return (
    <div className="absolute bottom-6 md:left-24 border border-gray-700 bg-gray-300 dark:bg-gray-800 p-3 rounded-lg shadow-lg z-50">
      {/* Close button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose}
          className="text-sm px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          ✕
        </button>
      </div>
      <ChromePicker color={currentFillColor} onChange={handleChange} />
    </div>
  );
};

export default ColorPickerWrapper;
