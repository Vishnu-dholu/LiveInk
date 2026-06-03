import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import {
  addLine,
  drawShape,
  updateCurrentLine,
  beginErase,
  eraseAt,
  eraseShape,
  eraseText,
  updateCurrentShape,
  clearCurrentShape,
  setSelectedTool,
  resetFillColor,
} from "@/store/drawingSlice";
import { socket } from "@/lib/socket";
import { encode } from "@/proto/codec";

/**
 *  Custom hook that handles all mouse events on the canvas
 * and dispatches appropriate Redux actions or emit socket events.
 */
const useCanvasEvent = ({
  selectedTool,
  stageRef,
  isEditingText,
  handleAddText,
}) => {
  const dispatch = useDispatch();
  // Redux state
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const currentShape = useSelector((state) => state.drawing.currentShape);
  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor,
  );
  const currentStrokeWidth = useSelector(
    (state) => state.drawing.currentStrokeWidth,
  );
  const zoom = useSelector((state) => state.drawing.zoom);

  const [isMouseDown, setIsMouseDown] = useState(false); //  Track if mouse is being held down
  const lastSentIndexRef = useRef(0);
  const eraseBatchRef = useRef([]);

  /**
   *  Calculates the current pointer position relative to canvas,
   * accounting for zoom and canvas position.
   */
  const getPointerPosition = () => {
    const stage = stageRef.current?.getStage(); //  Get Konva stage instance
    const pos = stage?.getPointerPosition(); //  Mouse position in screen coords

    if (!stage || !pos) return { x: 0, y: 0 };

    const stagePos = {
      x: stage.x(), //  X position of the stage
      y: stage.y(), //  Y position of the stage
    };

    // Return pointer position relative to canvas scale and translation
    return {
      x: (pos.x - stagePos.x) / stage.scaleX(),
      y: (pos.y - stagePos.y) / stage.scaleY(),
    };
  };

  /**
   *  Mouse down event - determines what to start drawing or editing
   * depending on the selected tool and pointer position.
   */
  const handleMouseDown = () => {
    // dispatch(startInteraction())
    const pos = getPointerPosition();
    setIsMouseDown(true);

    // Prevent interaction while editing text
    if (isEditingText) return;

    // Handle tool-specific actions
    if (selectedTool === "pen" || selectedTool === "pencil") {
      lastSentIndexRef.current = 0;
      dispatch(updateCurrentLine([pos.x, pos.y])); // Start drawing
    } else if (["square", "rectangle"].includes(selectedTool)) {
      // Start drawing a shape
      dispatch(updateCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 }));
    } else if (selectedTool === "eraser") {
      dispatch(beginErase());
      const radius = 20 / zoom;
      dispatch(eraseAt({ x: pos.x, y: pos.y, radius }));
      dispatch(eraseShape({ x: pos.x, y: pos.y, radius }));
      dispatch(eraseText({ x: pos.x, y: pos.y, radius }));
      eraseBatchRef.current.push({ x: pos.x, y: pos.y });
    } else if (selectedTool === "text") {
      handleAddText(pos, selectedTool);
    } else if (selectedTool === "circle") {
      dispatch(
        updateCurrentShape({ type: "circle", x: pos.x, y: pos.y, radius: 0 }),
      );
    }
  };

  /**
   *  Mouse move event - updates the currently drawn shape/line as user drags
   */
  const handleMouseMove = () => {
    if (!isMouseDown) return;

    const pos = getPointerPosition();

    if (selectedTool === "pen" || selectedTool === "pencil") {
      // Draw live line by appending new point
      if (currentLine.length > 0) {
        const updatedLine = [...currentLine, pos.x, pos.y];
        dispatch(updateCurrentLine(updatedLine));
        
        const newPoints = updatedLine.slice(lastSentIndexRef.current);
        if (newPoints.length > 0) {
            const payload = encode("DrawLive", { points: newPoints, tool: selectedTool, socketId: socket.id });
            if (payload) socket.emit("draw:live", payload);
            lastSentIndexRef.current = updatedLine.length;
        }
      }
    } else if (selectedTool === "square" && currentShape) {
      // Keep shape a square by taking max distance
      const size = Math.max(
        Math.abs(pos.x - currentShape.x),
        Math.abs(pos.y - currentShape.y),
      );
      const updatedShape = {
        ...currentShape,
        width: size,
        height: size,
      };
      dispatch(updateCurrentShape(updatedShape));
      const payload = encode("ShapeLive", { ...updatedShape, type: "square", socketId: socket.id });
      if (payload) socket.emit("shape:live", payload);
    } else if (selectedTool === "rectangle" && currentShape) {
      // Update rectangle width/height
      const updatedShape = {
        ...currentShape,
        width: pos.x - currentShape.x,
        height: pos.y - currentShape.y,
      };
      dispatch(updateCurrentShape(updatedShape));
      const payload = encode("ShapeLive", { ...updatedShape, type: "rect", socketId: socket.id });
      if (payload) socket.emit("shape:live", payload);
    } else if (selectedTool === "eraser") {
      const radius = 20 / zoom;
      dispatch(eraseAt({ x: pos.x, y: pos.y, radius }));
      dispatch(eraseShape({ x: pos.x, y: pos.y, radius }));
      dispatch(eraseText({ x: pos.x, y: pos.y, radius }));
      eraseBatchRef.current.push({ x: pos.x, y: pos.y });
    } else if (selectedTool === "circle" && currentShape) {
      // Calculate radius using distance formula
      const dx = pos.x - currentShape.x;
      const dy = pos.y - currentShape.y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const updatedShape = {
        ...currentShape,
        radius,
      };
      dispatch(updateCurrentShape(updatedShape));
      const payload = encode("ShapeLive", { ...updatedShape, type: "circle", socketId: socket.id });
      if (payload) socket.emit("shape:live", payload);
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
          strokeWidth: currentStrokeWidth,
          opacity: selectedTool === "pen" ? 1 : 0.6,
          dash: selectedTool === "pencil" ? [5, 5] : [],
          socketId: socket.id,
        };
        dispatch(addLine(newLine));
        const payload = encode("DrawFinal", newLine);
        if (payload) socket.emit("draw", payload);
        dispatch(updateCurrentLine([])); // Reset for next stroke
      }
    } else if (["square", "rectangle", "circle"].includes(selectedTool)) {
      // Finalize and commit shape to Redux + socket
      if (currentShape) {
        const shapeWithTool = {
          ...currentShape,
          id: uuidv4(),
          tool: selectedTool,
          fill: currentFillColor,
          type: selectedTool === "circle" ? "circle" : (selectedTool === "square" ? "square" : "rect"),
          socketId: socket.id,
        };
        dispatch(drawShape(shapeWithTool));
        const payload = encode("ShapeFinal", shapeWithTool);
        if (payload) socket.emit("drawShape", payload);
        dispatch(clearCurrentShape());
        dispatch(resetFillColor());
      }
    } else if (selectedTool === "eraser") {
      if (eraseBatchRef.current.length > 0) {
        const radius = 20 / zoom;
        const payload = encode("EraseBatch", { points: eraseBatchRef.current, radius });
        if (payload) socket.emit("erase", payload);
        eraseBatchRef.current = [];
      }
    }
  };

  return { handleMouseDown, handleMouseMove, handleMouseUp, currentShape };
};

export default useCanvasEvent;
