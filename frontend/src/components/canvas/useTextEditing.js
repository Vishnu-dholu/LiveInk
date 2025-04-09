import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    updateTextContent,
    updateCurrentText,
    commitCurrentText,
} from "@/store/drawingSlice";
import { v4 as uuidv4 } from "uuid";

/**
 * Custom hook to handle text creation, editing and committing logic
 * inside the collaborative canvas using Konva and Redux
 */
const useTextEditing = (stageRef, socket) => {
    const dispatch = useDispatch();

    // Redux state selectors
    const texts = useSelector((state) => state.drawing.texts);
    const currentText = useSelector((state) => state.drawing.currentText);

    // Local UI states for text editing
    const [isEditingText, setIsEditingText] = useState(false);
    const [editTextProps, setEditTextProps] = useState(null);

    /**
     * Called when the canvas is clicked using the "Text" tool.
     * Adds a new text element if the click isn't over existing text.
     */
    const handleAddText = (pointerPos, selectedTool) => {
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

        if (
            selectedTool === "text" &&
            !clickedOnText &&
            (!currentText || !currentText.text)
        ) {
            const newText = {
                id: uuidv4(),
                x: pointerPos.x,
                y: pointerPos.y,
                text: "Type here...",
                fontSize: 17,
                draggable: true,
            };

            dispatch(updateCurrentText(newText));
            socket.emit("text:start", newText);
        }
    };

    /**
     * Called to commit the currently active text object to the text array.
     */
    const handleCommitText = () => {
        if (currentText) {
            dispatch(commitCurrentText());
            socket.emit("text:commit", currentText);
        }
    };

    /**
     * Called when user double-clicks on a text node.
     * Creates a native textarea overlay for editing.
     */
    const handleEditText = (textObj) => {
        setIsEditingText(true);
        setEditTextProps(textObj);

        const stage = stageRef.current?.getStage();
        if (!stage) return;

        const textNode = stage.findOne(`#${textObj.id}`);
        const textRect = textNode.getClientRect();
        const stageBox = stage.container().getBoundingClientRect();

        const areaPosition = {
            x: stageBox.left + textRect.x,
            y: stageBox.top + textRect.y,
        };

        // Create native HTML textarea element for editing
        const textarea = document.createElement("textarea");
        textarea.value = textObj.text;

        // Styling the textarea to match canvas text
        Object.assign(textarea.style, {
            position: "absolute",
            top: `${areaPosition.y}px`,
            left: `${areaPosition.x}px`,
            width: `${textRect.width}px`,
            height: `${textRect.height}px`,
            fontSize: `${textObj.fontSize}px`,
            fontFamily: textObj.fontFamily || "Arial",
            fontWeight: textObj.fontStyle || "normal",
            textAlign: textObj.align || "left",
            border: "none",
            background: "transparent",
            outline: "none",
            color: "#000",
            padding: "0",
            margin: "0",
            overflow: "hidden",
            resize: "none",
            zIndex: 1000,
            minWidth: "100px",
            minHeight: `${textObj.fontSize + 6}px`,
        });

        document.body.appendChild(textarea);
        textarea.focus();

        // Resize textarea dynamically based on content
        const resizeTextarea = () => {
            textarea.style.width = "auto";
            textarea.style.height = "auto";
            textarea.style.width = `${textarea.scrollWidth + 2}px`;
            textarea.style.height = `${textarea.scrollHeight + 2}px`;
        };

        textarea.addEventListener("input", resizeTextarea);
        resizeTextarea();

        // On Enter key press, blur to trigger save
        textarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                textarea.blur();
            }
        });

        // When editing ends (on blur), update Redux and emit changes
        textarea.addEventListener("blur", () => {
            if (textarea.value !== textObj.text) {
                dispatch(updateTextContent({ id: textObj.id, text: textarea.value }));
                socket.emit("text:update", { id: textObj.id, text: textarea.value });
            }
            document.body.removeChild(textarea);
            setIsEditingText(false);
        });
    };
    return {
        handleAddText,
        handleEditText,
        handleCommitText,
        isEditingText,
        editTextProps,
    };
};

export default useTextEditing;