import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stage, Layer, Line, Rect } from "react-konva";
import {
  addLine,
  drawShape,
  updateCurrentLine,
  clearCanvas,
  redoAction,
  undoAction,
  removeLineAt,
} from "../store/drawingSlice";
import io from "socket.io-client";
import Toolbar from "./Toolbar";
import Toolbox from "./Toolbox";
import { Menu } from "lucide-react";

const socket = io("http://localhost:5000");

const Canvas = () => {
  const dispatch = useDispatch();
  const lines = useSelector((state) => state.drawing.lines);
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const redoHistory = useSelector((state) => state.drawing.redoHistory);
  const shapes = useSelector((state) => state.drawing.shapes); // Get shapes from Redux

  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 100);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 100);
  const [isToolboxVisible, setIsToolboxVisible] = useState(false);
  const [selectedTool, setSelectedTool] = useState("pencil");

  const [currentShape, setCurrentShape] = useState(null);

  useEffect(() => {
    const updateSize = () => {
      setCanvasWidth(window.innerWidth - 200);
      setCanvasHeight(window.innerHeight - 100);
    };
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();

    if (selectedTool === "pen" || selectedTool === "pencil") {
      dispatch(updateCurrentLine([pos.x, pos.y])); // Start drawing
    } else if (selectedTool === "square" || selectedTool === "rectangle") {
      // Start drawing a shape
      setCurrentShape({ x: pos.x, y: pos.y, width: 0, height: 0 });
    } else if (selectedTool === "eraser") {
      dispatch(removeLineAt({ x: pos.x, y: pos.y }));
      socket.emit("erase", { x: pos.x, y: pos.y });
    }
  };

  const handleMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition();

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
    } else if (currentLine.length > 0) {
      dispatch(updateCurrentLine([...currentLine, pos.x, pos.y]));
    }
  };

  const handleMouseUp = () => {
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
    }
  };

  const handleUndo = () => {
    dispatch(undoAction());
    socket.emit("undo", { userId: socket.id });
  };

  const handleRedo = () => {
    dispatch(redoAction());
    socket.emit("redo", { userId: socket.id });
  };

  const handleClear = () => {
    dispatch(clearCanvas());
    socket.emit("clear");
  };

  const handleSelectTool = (tool) => {
    setSelectedTool(tool);
  };

  // Sync Redux with WebSocket events
  useEffect(() => {
    socket.on("draw", (newLine) => {
      dispatch(addLine(newLine));
    });

    socket.on("drawShape", (shape) => {
      dispatch(drawShape(shape));
    });

    socket.on("undo", (data) => {
      if (data.userId !== socket.id) {
        dispatch(undoAction());
      }
    });

    socket.on("redo", (data) => {
      if (data.userId !== socket.id) {
        dispatch(redoAction());
      }
    });

    socket.on("clear", () => {
      dispatch(clearCanvas());
    });

    socket.on("erase", (pos) => {
      console.log("Received Erase at:", pos);
      dispatch(removeLineAt(pos));
    });

    return () => {
      socket.off("draw");
      socket.off("drawShape");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear");
      socket.off("erase");
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full w-full bg-gray-300 dark:bg-gray-900 p-4">
      <div className="md:hidden absolute top-58 left-4 z-50">
        <button
          onClick={() => setIsToolboxVisible(!isToolboxVisible)}
          className="p-2 bg-gray-800 text-white rounded-md"
        >
          <Menu size={28} />
        </button>
      </div>

      <div
        className={`fixed md:relative md:w-20 w-full md:h-auto mt-6 top-50 left-1 flex md:flex-col justify-center md:justify-start transition-transform duration-300 ease-in-out ${
          isToolboxVisible ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:flex md:flex-col md:items-center`}
      >
        <Toolbox onSelectTool={handleSelectTool} activeTool={selectedTool} />
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-screen-xl px-4">
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
        <div className="w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-400 border-gray-300 dark:border-gray-700 overflow-hidden">
          <Stage
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {lines.map((line, index) => (
                <Line
                  key={index}
                  points={line.points}
                  stroke={line.stroke}
                  strokeWidth={line.strokeWidth}
                  tension={line.tool === "pen" ? 0.5 : 0.2}
                  dash={line.tool === "pencil" ? [5, 5] : []}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
              {currentLine.length > 0 && (
                <Line
                  points={currentLine}
                  stroke="black"
                  strokeWidth={2}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {shapes.map((shape, index) => (
                <Rect
                  key={index}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  stroke="black"
                  strokeWidth={2}
                />
              ))}
              {currentShape && (
                <Rect
                  x={currentShape.x}
                  y={currentShape.y}
                  width={currentShape.width}
                  height={currentShape.height}
                  stroke="black"
                  strokeWidth={2}
                  dash={[10, 5]} //  Dotted line for preview
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
