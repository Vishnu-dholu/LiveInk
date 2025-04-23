import { useSelector, useDispatch } from "react-redux";
import { updateTextContent } from "@/store/drawingSlice";
import { Label } from "../ui/label";

const FontSizeControl = () => {
  const dispatch = useDispatch();
  const selectedTextId = useSelector((state) => state.drawing.selectedTextId);
  const texts = useSelector((state) => state.drawing.texts);
  const selectedText = texts.find((t) => t.id === selectedTextId);

  if (!selectedText) return null;

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
        onChange={(e) =>
          dispatch(
            updateTextContent({
              id: selectedTextId,
              fontSize: parseInt(e.target.value, 10),
            })
          )
        }
        className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-black dark:text-white"
      />
    </div>
  );
};

export default FontSizeControl;
