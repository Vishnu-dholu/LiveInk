// Import Konva's Text component for rendering text on canvas
import {
  setSelectedTextId,
  updateTextFill,
  resetFillColor,
} from "@/store/drawingSlice";
import { Text } from "react-konva";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "@/lib/socket";

/**
 * TextRenderer handles rendering of all text elements on the canvas.
 * It supports:
 * - Displaying all saved text
 * - Handling double-click to enable editing
 * - Dragging and repositioning text elements
 * - Direct click-to-fill with the paint bucket tool
 */

const TextRenderer = ({ isEditingText, editTextProps, onEdit }) => {
  const texts = useSelector((state) => state.drawing.texts);
  const selectedTool = useSelector((state) => state.drawing.selectedTool);
  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor,
  );
  const dispatch = useDispatch();

  /**
   * Handles when a text object is dragged and dropped to a new position.
   */
  const handleTextDragEnd = (e, textObj) => {
    const { x, y } = e.target.position();
    onEdit({
      ...textObj,
      x,
      y,
      isDrag: true,
    });
  };

  /**
   * Handles click on a text element.
   * - Paint bucket tool: fills the text with the current color
   * - Select tool: selects the text for settings panel
   * - Other tools: selects the text
   */
  const handleTextClick = (t) => {
    if (selectedTool === "paint") {
      // Direct click-to-fill (same pattern as ShapeRenderer)
      dispatch(updateTextFill({ id: t.id, fill: currentFillColor }));
      socket.emit("text:fill", { id: t.id, fill: currentFillColor });
      dispatch(resetFillColor());
    } else {
      dispatch(setSelectedTextId(t.id));
    }
  };

  return (
    <>
      {texts.map((t) => {
        // Skip rendering the text currently being edited via textarea
        if (isEditingText && editTextProps?.id === t.id) return null;

        return (
          <Text
            key={`${t.id}-${t.fill}`}
            id={t.id}
            text={t.text}
            x={t.x}
            y={t.y}
            fontSize={t.fontSize}
            fontStyle={t.fontStyle || "normal"}
            fontFamily={t.fontFamily || "Arial"}
            fill={t.fill || "black"}
            width={t.width || undefined}
            draggable={selectedTool === "select"}
            onClick={() => handleTextClick(t)}
            onDblClick={() => onEdit(t)}
            onDragEnd={(e) => handleTextDragEnd(e, t)}
          />
        );
      })}
    </>
  );
};

export default TextRenderer;
