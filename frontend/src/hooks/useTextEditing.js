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
 * inside the collaborative canvas environment using Konva and Redux
 */
const useTextEditing = (stageRef, socket) => {
    const dispatch = useDispatch();

    // Selects the text array and currently edited text from global Redux state
    const texts = useSelector((state) => state.drawing.texts);
    const currentText = useSelector((state) => state.drawing.currentText);

    // Local UI states for text editing
    const [isEditingText, setIsEditingText] = useState(false);      //  Flag to show if user is editing
    const [editTextProps, setEditTextProps] = useState(null);       //  Stores properties of text being edited

    /**
     * Called when the canvas is clicked using the "Text" tool.
     * Adds a new text element if the click isn't over existing text.
     * @param {Object} pointerPos - Current mouse pointer position.
     * @param {Object} selectedTool - Active drawing tool.
     */
    const handleAddText = (pointerPos, selectedTool) => {
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

        // If tool is "text", click is not over existing text, and no active text
        if (
            selectedTool === "text" &&
            !clickedOnText &&
            (!currentText || !currentText.text)
        ) {
            // Create a new text object
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
     * Creates and positions a native textarea over the canvas for live editing.
     */
    const handleEditText = (textObj) => {
        setIsEditingText(true);
        setEditTextProps(textObj);

        const stage = stageRef.current?.getStage();
        if (!stage) return;

        // Find the Konva Text node on stage using its ID
        const textNode = stage.findOne(`#${textObj.id}`);
        const textRect = textNode.getClientRect();                      //  Get bounding box
        const stageBox = stage.container().getBoundingClientRect();     //  Get canvas DOM box

        // Calculate position of textarea in DOM space
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
        textarea.focus();   //  Focus input for typing

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
            document.body.removeChild(textarea);    //  Clean up textarea
            setIsEditingText(false);                //  Exit editing mode
        });
    };

    // Return hook API for use in components
    return {
        handleAddText,
        handleEditText,
        handleCommitText,
        isEditingText,
        editTextProps,
    };
};

export default useTextEditing;