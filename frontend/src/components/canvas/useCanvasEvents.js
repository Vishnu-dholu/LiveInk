import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addLine, drawShape, updateCurrentLine, removeLineAt, updateCurrentText, commitCurrentText } from "@/store/drawingSlice";
import { socket } from "@/lib/socket";

const useCanvasEvent = ({ selectedTool, stageRef, isEditingText }) => {
    const dispatch = useDispatch()
    const texts = useSelector((state) => state.drawing.texts);
    const currentLine = useSelector((state) => state.drawing.currentLine);
    const currentText = useSelector((state) => state.drawing.currentText);

    const [currentShape, setCurrentShape] = useState(null);
    const [isMouseDown, setIsMouseDown] = useState(false);

    const getPointerPosition = () => {
        const stage = stageRef.current?.getStage()
        return stage?.getPointerPosition()
    }

    const handleMouseDown = () => {
        const pos = getPointerPosition()
        setIsMouseDown(true);
        if (isEditingText) return;

        const clickedOnText = texts.some((t) => {
            const textWidth = t.text.length * (t.fontSize * 0.6);
            const textHeight = t.fontSize;
            return (
                pos.x >= t.x &&
                pos.x <= t.x + textWidth &&
                pos.y >= t.y &&
                pos.y <= t.y + textHeight
            );
        });

        if (selectedTool === "pen" || selectedTool === "pencil") {
            dispatch(updateCurrentLine([pos.x, pos.y])); // Start drawing
        } else if (selectedTool === "square" || selectedTool === "rectangle") {
            // Start drawing a shape
            setCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
        } else if (selectedTool === "eraser") {
            dispatch(removeLineAt({ x: pos.x, y: pos.y }));
            socket.emit("erase", { x: pos.x, y: pos.y });
        } else if (
            selectedTool === "text" &&
            !clickedOnText &&
            !currentText?.text && !isEditingText
        ) {
            const newText = {
                id: uuidv4(),
                x: pos.x,
                y: pos.y,
                text: "Type here...",
                fontSize: 17,
                draggable: true,
            };

            dispatch(updateCurrentText(newText));
            socket.emit("text:start", newText);
        }
    };

    const handleMouseMove = () => {
        if (!isMouseDown) return;

        const pos = getPointerPosition()

        if (selectedTool === "pen" || selectedTool === "pencil") {
            if (currentLine.length > 0) {
                dispatch(updateCurrentLine([...currentLine, pos.x, pos.y]));
            }
        } else if (selectedTool === "square" && currentShape) {
            const size = Math.max(
                Math.abs(pos.x - currentShape.x),
                Math.abs(pos.y - currentShape.y)
            );
            setCurrentShape({
                ...currentShape,
                width: size,
                height: size,
            });
        } else if (selectedTool === "rectangle" && currentShape) {
            setCurrentShape({
                ...currentShape,
                width: pos.x - currentShape.x,
                height: pos.y - currentShape.y,
            });
        } else if (selectedTool === "eraser") {
            dispatch(removeLineAt({ x: pos.x, y: pos.y }));
            socket.emit("erase", { x: pos.x, y: pos.y });
        }
    };

    const handleMouseUp = () => {
        setIsMouseDown(false);

        if (selectedTool === "pen" || selectedTool === "pencil") {
            if (currentLine.length > 0) {
                const newLine = {
                    points: [...currentLine],
                    tool: selectedTool,
                    stroke: selectedTool === "pen" ? "black" : "#353839",
                    strokeWidth: selectedTool === "pen" ? 3 : 1.8,
                    opacity: selectedTool === "pen" ? 1 : 0.6,
                };
                dispatch(addLine(newLine));
                socket.emit("draw", newLine);
                dispatch(updateCurrentLine([])); // Reset for next stroke
            }
        } else if (selectedTool === "square" || selectedTool === "rectangle") {
            if (currentShape) {
                dispatch(drawShape(currentShape));
                socket.emit("drawShape", currentShape);
                setCurrentShape(null);
            }
        } else if (selectedTool === "text" && currentText) {
            dispatch(commitCurrentText());
            socket.emit("text:commit", currentText);
        }
    };

    return { handleMouseDown, handleMouseMove, handleMouseUp, currentShape }
}

export default useCanvasEvent