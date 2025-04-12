import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addLine, drawShape, updateCurrentLine, removeLineAt, updateCurrentText, commitCurrentText, updateCurrentShape, clearCurrentShape } from "@/store/drawingSlice";
import { socket } from "@/lib/socket";

const useCanvasEvent = ({ selectedTool, stageRef, isEditingText }) => {
    const dispatch = useDispatch()
    const texts = useSelector((state) => state.drawing.texts);
    const currentLine = useSelector((state) => state.drawing.currentLine);
    const currentText = useSelector((state) => state.drawing.currentText);
    const currentShape = useSelector((state) => state.drawing.currentShape);

    const [isMouseDown, setIsMouseDown] = useState(false);

    // Utility: Get current mouse pointer position relative to canvas
    const getPointerPosition = () => {
        const stage = stageRef.current?.getStage()
        return stage?.getPointerPosition()
    }

    // Check of user clicked inside an existing text area
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
        } else if (["square", "rectangle"].includes(selectedTool)) {
            // Start drawing a shape
            dispatch(updateCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 }));
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
        } else if (selectedTool === "circle") {
            dispatch(updateCurrentShape({ type: "circle", x: pos.x, y: pos.y, radius: 0 }))
        }
    };

    const handleMouseMove = () => {
        if (!isMouseDown) return;

        const pos = getPointerPosition()

        if (selectedTool === "pen" || selectedTool === "pencil") {
            if (currentLine.length > 0) {
                const updatedLine = [...currentLine, pos.x, pos.y]
                dispatch(updateCurrentLine(updatedLine));
                socket.emit("draw:live", updatedLine)
            }
        } else if (selectedTool === "square" && currentShape) {
            const size = Math.max(
                Math.abs(pos.x - currentShape.x),
                Math.abs(pos.y - currentShape.y)
            );
            const updatedShape = {
                ...currentShape,
                width: size,
                height: size,
            }
            dispatch(updateCurrentShape(updatedShape));
            socket.emit("shape:live", updatedShape)
        } else if (selectedTool === "rectangle" && currentShape) {
            const updatedShape = {
                ...currentShape,
                width: pos.x - currentShape.x,
                height: pos.y - currentShape.y,
            }
            dispatch(updateCurrentShape(updatedShape));
            socket.emit("shape:live", updatedShape)
        } else if (selectedTool === "eraser") {
            dispatch(removeLineAt({ x: pos.x, y: pos.y }));
            socket.emit("erase", { x: pos.x, y: pos.y });
        }
        else if (selectedTool === "circle" && currentShape) {
            const dx = pos.x - currentShape.x;
            const dy = pos.y - currentShape.y;
            const radius = Math.sqrt(dx * dx + dy * dy);
            const updatedShape = {
                ...currentShape,
                radius,
            };
            dispatch(updateCurrentShape(updatedShape));
            socket.emit("shape:live", updatedShape);
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
        } else if (["square", "rectangle", "circle"].includes(selectedTool)) {
            if (currentShape) {
                const shapeWithTool = { ...currentShape, id: uuidv4(), tool: selectedTool }
                dispatch(drawShape(shapeWithTool));
                socket.emit("drawShape", shapeWithTool);
                dispatch(clearCurrentShape())
            }
        } else if (selectedTool === "text" && currentText) {
            const committedText = { ...currentText };
            dispatch(commitCurrentText());
            socket.emit("text:commit", committedText);
        }
    };

    return { handleMouseDown, handleMouseMove, handleMouseUp, currentShape }
}

export default useCanvasEvent