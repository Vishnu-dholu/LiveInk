// Import Konva's Text component for rendering text on canvas
import { Text } from "react-konva";
// Import Redux hook to access state from the store
import { useSelector } from "react-redux";

/**
 * TextRenderer handles rendering of all text elements on the canvas.
 * It supports:
 * - Displaying all saved text
 * - Handling double-click to enable editing
 * - Dragging and repositioning text elements
 * - Displaying temporary "currentText" during creation
 */

const TextRenderer = ({ isEditingText, editTextProps, onEdit }) => {
  // All saved text elements from Redux store
  const texts = useSelector((state) => state.drawing.texts);
  // A temporary text object that is currently being created
  const currentText = useSelector((state) => state.drawing.currentText);

  /**
   * Handles when a text object is dragged and dropped to a new position.
   * Updates the coordinates by calling the onEdit function.
   */
  const handleTextDragEnd = (e, textObj) => {
    const { x, y } = e.target.position(); //  Get new position after drag
    onEdit({
      ...textObj, //  Spread original properties of the text object
      x,
      y,
      isDrag: true, //  Mark this edit as a result of dragging
    });
  };

  return (
    <>
      {/* Render all finalized text elements */}
      {texts.map((t) => {
        // Skip rendering the currently edited text
        if (isEditingText && editTextProps?.id === t.id) return null;

        return (
          <Text
            key={t.id} //  Unique key for each text object
            id={t.id} //  ID used to identify which text is edited
            text={
              // If text is "Type here..." and this text is being edited, show empty string to allow user input
              t.text === "Type here..." &&
              isEditingText &&
              editTextProps?.id === t.id
                ? ""
                : t.text
            }
            x={t.x} //  X position on canvas
            y={t.y} //  Y position on canvas
            fontSize={t.fontSize}
            fill={t.fill || "black"}
            draggable
            onDblClick={() => onEdit(t)} //  Double-click triggers edit mode
            onDragEnd={(e) => handleTextDragEnd(e, t)} //  Handle repositioning after drag
          />
        );
      })}

      {/* Render current text being created but not commited yet */}
      {currentText && (
        <Text
          text={currentText.text} //  Temporary display of text
          x={currentText.x}
          y={currentText.y}
          fontSize={currentText.fontSize}
          fill="gray"
        />
      )}
    </>
  );
};

export default TextRenderer;
