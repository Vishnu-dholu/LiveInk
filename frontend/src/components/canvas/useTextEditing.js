import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    updateTextContent,
    updateCurrentText,
    commitCurrentText,
} from "@/store/drawingSlice";
import { v4 as uuidv4 } from "uuid";

const useTextEditing = (stageRef, socket) => {
    const dispatch = useDispatch();
    const texts = useSelector((state) => state.drawing.texts);
    const currentText = useSelector((state) => state.drawing.currentText);
    const [isEditingText, setIsEditingText] = useState(false);
    const [editTextProps, setEditTextProps] = useState(null);

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

    const handleCommitText = () => {
        if (currentText) {
            dispatch(commitCurrentText());
            socket.emit("text:commit", currentText);
        }
    };

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

        const textarea = document.createElement("textarea");
        textarea.value = textObj.text;

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

        const resizeTextarea = () => {
            textarea.style.width = "auto";
            textarea.style.height = "auto";
            textarea.style.width = `${textarea.scrollWidth + 2}px`;
            textarea.style.height = `${textarea.scrollHeight + 2}px`;
        };

        textarea.addEventListener("input", resizeTextarea);
        resizeTextarea();

        textarea.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                textarea.blur();
            }
        });

        textarea.addEventListener("blur", () => {
            if (textarea.value !== textObj.text) {
                dispatch(updateTextContent({ id: textObj.id, text: textarea.value }));
                socket.emit("text:update", { id: textObj.id, text: textarea.value });
            }
            document.body.removeChild(textarea);
            setIsEditingText(false);
        });
    };

    // const handleTextDragEnd = (e, textObj) => {
    //     const { x, y } = e.target.position();
    //     const updatedText = { ...textObj, x, y };
    //     dispatch(updateTextContent(updatedText));
    //     socket.emit("text:update", updatedText);
    // };

    return {
        handleAddText,
        handleEditText,
        handleCommitText,
        // handleTextDragEnd,
        isEditingText,
        editTextProps,
    };
};

export default useTextEditing;
