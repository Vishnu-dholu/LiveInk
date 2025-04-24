import { useSelector, useDispatch } from "react-redux";
import { updateTextContent } from "@/store/drawingSlice";
import { Label } from "@/components/ui/label";
import { socket } from "@/lib/socket";

const FontSizeControl = () => {
  const dispatch = useDispatch();
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);
  const texts = useSelector((state) => state.drawing.texts);

  // Find the selected text object based on the selectedTextId
  const selectedText = texts.find((t) => t.id === selectedTextId);

  // If no text is selected, return null
  if (!selectedText) return null;

  // Handle font size change
  const handleFontSizeChange = (e) => {
    const fontSize = parseInt(e.target.value, 10);
    if (fontSize >= 2 && fontSize <= 400) {
      const payload = {
        id: selectedTextId,
        fontSize,
      };

      dispatch(updateTextContent(payload));

      socket.emit("text:updateFontSize", payload);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label
        htmlFor="font-size-input"
        className="text-sm font-medium text-gray-700 dark:text-gray-200"
      >
        Font Size
      </Label>
      <input
        id="font-size-input"
        type="number"
        min={6}
        max={200}
        value={selectedText.fontSize}
        onChange={handleFontSizeChange}
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
      />
    </div>
  );
};

export default FontSizeControl;
