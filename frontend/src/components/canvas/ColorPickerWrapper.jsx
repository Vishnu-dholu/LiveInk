import { setFillColor, updateTextFill } from "@/store/drawingSlice";
import { useDispatch, useSelector } from "react-redux";
import { ChromePicker } from "react-color";
import { socket } from "@/lib/socket";

const ColorPickerWrapper = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor
  );
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);

  const handleChange = (color) => {
    const hex = color.hex;
    dispatch(setFillColor(hex));

    if (selectedTextId) {
      dispatch(updateTextFill({ id: selectedTextId, fill: hex }));
      socket.emit("text:fill", { id: selectedTextId, fill: hex });
    }
  };

  return (
    <div className="absolute bottom-6 md:left-24 border border-gray-700 bg-gray-300 dark:bg-gray-800 p-3 rounded-lg shadow-lg z-50">
      {/* Close button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={onClose} // Use onClose passed from parent to close the color picker
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
