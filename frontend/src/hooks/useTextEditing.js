import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateTextContent,
  addText,
  updateTextPosition,
} from "@/store/drawingSlice";
import { v4 as uuidv4 } from "uuid";

/**
 * Custom hook to handle text creation, editing and committing logic
 * inside the collaborative canvas environment using Konva and Redux
 */
const useTextEditing = (stageRef, socket) => {
  const dispatch = useDispatch();

  // Selects the text array from global Redux state
  const texts = useSelector((state) => state.drawing.texts);
  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor,
  );

  // Local UI states for text editing
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTextProps, setEditTextProps] = useState(null);

  /**
   * Opens a native textarea overlay positioned over a text element
   * for inline editing. Works for both new and existing text.
   */
  const openTextEditor = useCallback(
    (textObj, isNewText = false) => {
      setIsEditingText(true);
      setEditTextProps(textObj);

      const stage = stageRef.current?.getStage();
      if (!stage) {
        setIsEditingText(false);
        setEditTextProps(null);
        return;
      }

      const stageBox = stage.container().getBoundingClientRect();

      // Try to find the rendered Konva node for precise positioning
      const textNode = stage.findOne(`#${textObj.id}`);

      let textRect;
      if (textNode) {
        textRect = textNode.getClientRect();
      } else {
        // Fallback: approximate position using stage transform
        const scaleX = stage.scaleX();
        const scaleY = stage.scaleY();
        textRect = {
          x: textObj.x * scaleX + stage.x(),
          y: textObj.y * scaleY + stage.y(),
          width: 120,
          height: (textObj.fontSize || 17) + 6,
        };
      }

      // Calculate position of textarea in DOM space
      const areaPosition = {
        x: stageBox.left + textRect.x,
        y: stageBox.top + textRect.y,
      };

      // Create native HTML textarea element for editing
      const textarea = document.createElement("textarea");
      textarea.value = isNewText ? "" : textObj.text;

      const textColor = textObj.fill === "transparent" ? "#000" : (textObj.fill || "#000");

      // Styling the textarea to match canvas text exactly (inline editing style)
      Object.assign(textarea.style, {
        position: "fixed",
        top: `${areaPosition.y}px`,
        left: `${areaPosition.x}px`,
        width: `${Math.max(textRect.width, 100)}px`,
        height: `${textRect.height}px`,
        fontSize: `${textObj.fontSize || 17}px`,
        fontFamily: textObj.fontFamily || "Arial",
        fontStyle: textObj.fontStyle?.includes("italic") ? "italic" : "normal",
        fontWeight: textObj.fontStyle?.includes("bold") ? "bold" : "normal",
        textAlign: textObj.align || "left",
        border: "none",
        background: "transparent",
        outline: "none",
        color: textColor,
        padding: "0",
        margin: "0",
        overflow: "hidden",
        resize: "none",
        zIndex: 10000,
        minWidth: "100px",
        minHeight: `${(textObj.fontSize || 17) + 6}px`,
        lineHeight: "1.2",
      });

      // Prevent canvas mousedown from stealing focus
      textarea.addEventListener("mousedown", (e) => {
        e.stopPropagation();
      });

      document.body.appendChild(textarea);

      // Focus and select all text after a microtask to ensure DOM is ready
      requestAnimationFrame(() => {
        textarea.focus();
        if (!isNewText) {
          textarea.select();
        }
      });

      // Resize textarea dynamically based on content
      const resizeTextarea = () => {
        textarea.style.width = "auto";
        textarea.style.height = "auto";
        textarea.style.width = `${Math.max(textarea.scrollWidth + 10, 120)}px`;
        textarea.style.height = `${Math.max(textarea.scrollHeight + 4, (textObj.fontSize || 17) + 10)}px`;
      };

      textarea.addEventListener("input", resizeTextarea);
      resizeTextarea();

      // On Enter key press, blur to trigger save
      textarea.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          textarea.blur();
        }
        // Allow Escape to cancel
        if (e.key === "Escape") {
          // Restore original text on cancel
          textarea.value = textObj.text;
          textarea.blur();
        }
      });

      // Ensure blur only fires once
      let hasBlurred = false;

      // When editing ends (on blur), update Redux and emit changes
      textarea.addEventListener("blur", () => {
        if (hasBlurred) return;
        hasBlurred = true;

        const newValue = textarea.value.trim();

        if (newValue && newValue !== textObj.text) {
          // Text was changed — update it
          dispatch(updateTextContent({ id: textObj.id, text: newValue }));
          socket.emit("text:update", { id: textObj.id, text: newValue });
        } else if (!newValue && isNewText) {
          // Empty text on a brand new node — update with placeholder
          dispatch(
            updateTextContent({ id: textObj.id, text: "Type here..." }),
          );
          socket.emit("text:update", {
            id: textObj.id,
            text: "Type here...",
          });
        }
        // If text is unchanged (editing existing text without changes), do nothing

        textarea.removeEventListener("input", resizeTextarea);
        textarea.remove();
        setIsEditingText(false);
        setEditTextProps(null);
      });
    },
    [dispatch, stageRef, socket],
  );

  /**
   * Called when the canvas is clicked using the "Text" tool.
   * Adds a new text element and immediately opens the editor.
   */
  const handleAddText = useCallback(
    (pointerPos, selectedTool) => {
      if (isEditingText) return;

      // Check if the click overlaps with any existing text
      const clickedOnText = texts.some((t) => {
        const textWidth = t.text.length * (t.fontSize * 0.6);
        const textHeight = t.fontSize;
        return (
          pointerPos.x >= t.x &&
          pointerPos.x <= t.x + textWidth &&
          pointerPos.y >= t.y &&
          pointerPos.y <= t.y + textHeight
        );
      });

      if (selectedTool === "text" && !clickedOnText) {
        const fill = currentFillColor === "transparent" ? "black" : (currentFillColor || "black");

        const newText = {
          id: uuidv4(),
          x: pointerPos.x,
          y: pointerPos.y,
          text: "Type here...",
          fontSize: 17,
          draggable: true,
          fill: fill,
          fontStyle: "normal",
          fontFamily: "Arial",
        };

        // Add to Redux immediately — text is now in texts[]
        dispatch(addText(newText));
        socket.emit("text:start", newText);

        // Open editor after Konva has a chance to render the node
        setTimeout(() => {
          openTextEditor(newText, true);
        }, 80);
      }
    },
    [isEditingText, texts, currentFillColor, dispatch, socket, openTextEditor],
  );

  /**
   * Called when user double-clicks on a text node to edit it.
   */
  const handleEditText = useCallback(
    (textObj) => {
      if (isEditingText) return;
      openTextEditor(textObj, false);
    },
    [isEditingText, openTextEditor],
  );

  /**
   * Called when a text object is dragged to a new position.
   */
  const handleUpdateTextPosition = useCallback(
    (updatedText) => {
      dispatch(
        updateTextPosition({
          id: updatedText.id,
          x: updatedText.x,
          y: updatedText.y,
        }),
      );
      socket.emit("text:update", {
        id: updatedText.id,
        x: updatedText.x,
        y: updatedText.y,
      });
    },
    [dispatch, socket],
  );

  return {
    handleAddText,
    handleEditText,
    isEditingText,
    editTextProps,
    handleUpdateTextPosition,
  };
};

export default useTextEditing;
