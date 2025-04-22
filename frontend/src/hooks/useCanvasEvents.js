import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addLine, drawShape, updateCurrentLine, removeLineAt, updateCurrentText, commitCurrentText, updateCurrentShape, clearCurrentShape } from "@/store/drawingSlice";
import { socket } from "@/lib/socket";

/**
 *  Custom hook that handles all mouse events on the canvas
 * and dispatches appropriate Redux actions or emit socket events.
 */
const useCanvasEvent = ({ selectedTool, stageRef, isEditingText }) => {
    const dispatch = useDispatch()
    // Redux state
    const texts = useSelector((state) => state.drawing.texts);
    const currentLine = useSelector((state) => state.drawing.currentLine);
    const currentText = useSelector((state) => state.drawing.currentText);
    const currentShape = useSelector((state) => state.drawing.currentShape);
    const currentFillColor = useSelector((state) => state.drawing.currentFillColor)

    const [isMouseDown, setIsMouseDown] = useState(false);  //  Track if mouse is being held down

    /**
     *  Calculates the current pointer position relative to canvas,
     * accounting for zoom and canvas position.
     */
    const getPointerPosition = () => {
        const stage = stageRef.current?.getStage()  //  Get Konva stage instance
        const pos = stage?.getPointerPosition()     //  Mouse position in screen coords

        if (!stage || !pos) return { x: 0, y: 0 }

        const stagePos = {
            x: stage.x(),   //  X position of the stage
            y: stage.y(),   //  Y position of the stage
        };

        // Return pointer position relative to canvas scale and translation
        return {
            x: (pos.x - stagePos.x) / stage.scaleX(),
            y: (pos.y - stagePos.y) / stage.scaleY(),
        }
    }

    /**
     *  Mouse down event - determines what to start drawing or editing
     * depending on the selected tool and pointer position.
     */
    const handleMouseDown = () => {
        // dispatch(startInteraction())
        const pos = getPointerPosition()
        setIsMouseDown(true);

        // Prevent interaction while editing text
        if (isEditingText) return;

        // Check if user clicked on existing text element
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

        // Handle tool-specific actions
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
            // If clicked on blank space, start a new text box
            const newText = {
                id: uuidv4(),
                x: pos.x,
                y: pos.y,
                text: "Type here...",
                fontSize: 17,
                // fill: currentFillColor,
                draggable: true,
            };

            dispatch(updateCurrentText(newText));
            socket.emit("text:start", newText);
        }
        else if (selectedTool === "circle") {
            dispatch(updateCurrentShape({ type: "circle", x: pos.x, y: pos.y, radius: 0 }))
        }
    };

    /**
     *  Mouse move event - updates the currently drawn shape/line as user drags
     */
    const handleMouseMove = () => {
        if (!isMouseDown) return;

        const pos = getPointerPosition()

        if (selectedTool === "pen" || selectedTool === "pencil") {
            // Draw live line by appending new point
            if (currentLine.length > 0) {
                const updatedLine = [...currentLine, pos.x, pos.y]
                dispatch(updateCurrentLine(updatedLine));
                socket.emit("draw:live", { points: updatedLine, tool: selectedTool })
            }
        } else if (selectedTool === "square" && currentShape) {
            // Keep shape a square by taking max distance
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
            // Update rectangle width/height
            const updatedShape = {
                ...currentShape,
                width: pos.x - currentShape.x,
                height: pos.y - currentShape.y,
            }
            dispatch(updateCurrentShape(updatedShape));
            socket.emit("shape:live", updatedShape)
        } else if (selectedTool === "eraser") {
            // Erase  as user moves
            dispatch(removeLineAt({ x: pos.x, y: pos.y }));
            socket.emit("erase", { x: pos.x, y: pos.y });
        }
        else if (selectedTool === "circle" && currentShape) {
            // Calculate radius using distance formula
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

    /**
     * Mouse up event - finalize the shape, line or text
     */
    const handleMouseUp = () => {
        setIsMouseDown(false);

        // Finalize freehand drawing
        if (selectedTool === "pen" || selectedTool === "pencil") {
            if (currentLine.length > 0) {
                const newLine = {
                    points: [...currentLine],
                    tool: selectedTool,
                    stroke: selectedTool === "pen" ? "black" : "#353839",
                    strokeWidth: selectedTool === "pen" ? 3 : 1.8,
                    opacity: selectedTool === "pen" ? 1 : 0.6,
                    dash: selectedTool === "pencil" ? [5, 5] : [],
                };
                dispatch(addLine(newLine));
                socket.emit("draw", newLine);
                dispatch(updateCurrentLine([])); // Reset for next stroke
            }
        } else if (["square", "rectangle", "circle"].includes(selectedTool)) {
            // Finalize and commit shape to Redux + socket
            if (currentShape) {
                const shapeWithTool = { ...currentShape, id: uuidv4(), tool: selectedTool, fill: currentFillColor }
                dispatch(drawShape(shapeWithTool));
                socket.emit("drawShape", shapeWithTool);
                dispatch(clearCurrentShape())
            }
        } else if (selectedTool === "text" && currentText) {
            // Commit current text to Redux and socket
            const committedText = { ...currentText };
            dispatch(commitCurrentText());
            socket.emit("text:commit", committedText);
        }

        // dispatch(endInteraction())
    };

    return { handleMouseDown, handleMouseMove, handleMouseUp, currentShape }
}

export default useCanvasEvent