import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Stage, Layer, Line } from "react-konva"; // Import Konva components
import {
  addLine,
  updateCurrentLine,
  clearCanvas,
  redoAction,
  undoAction,
} from "../store/drawingSlice";
import io from "socket.io-client";
import Toolbar from "./Toolbar"; // Import Toolbar component
import Toolbox from "./Toolbox";

const socket = io("http://localhost:5000");

const Canvas = () => {
  const dispatch = useDispatch();
  const lines = useSelector((state) => state.drawing.lines);
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const redoHistory = useSelector((state) => state.drawing.redoHistory);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 200);

  useEffect(() => {
    const updateSize = () => setCanvasWidth(window.innerWidth - 200);
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    dispatch(updateCurrentLine([pos.x, pos.y])); // Start drawing
  };

  const handleMouseMove = (e) => {
    if (currentLine.length === 0) return;

    const pos = e.target.getStage().getPointerPosition();
    dispatch(updateCurrentLine([...currentLine, pos.x, pos.y]));
  };

  const handleMouseUp = () => {
    if (currentLine.length === 0) return;

    const newLine = { points: currentLine };
    dispatch(addLine(newLine));
    socket.emit("draw", newLine); // Sync with server
    dispatch(updateCurrentLine([])); // Reset current line
  };

  const handleUndo = () => {
    if (lines.length > 0) {
      dispatch(undoAction());
      socket.emit("undo", { userId: socket.id });
    }
  };

  const handleRedo = () => {
    if (redoHistory.length > 0) {
      dispatch(redoAction());
      socket.emit("redo", { userId: socket.id });
    }
  };

  const handleClear = () => {
    dispatch(clearCanvas());
    socket.emit("clear");
  };

  // Sync Redux with WebSocket events
  useEffect(() => {
    socket.on("draw", (newLine) => {
      dispatch(addLine(newLine));
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

    return () => {
      socket.off("draw");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear");
    };
  }, [dispatch]);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center h-full w-full bg-gray-200 dark:bg-gray-900 rounded-2xl p-4">
      <div className="md:w-20 w-full md:h-auto flex md:flex-col justify-center md:justify-start">
        <Toolbox />
      </div>
      <div className="flex flex-col items-center flex-1">
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
        <div className="w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-500 border-gray-300 dark:border-gray-700 overflow-hidden">
          <Stage
            width={window.innerWidth - 100}
            height={600}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <Layer>
              {lines.map((line, index) => (
                <Line
                  key={index}
                  points={line.points}
                  stroke="black"
                  strokeWidth={2}
                />
              ))}
              {currentLine.length > 0 && (
                <Line points={currentLine} stroke="black" strokeWidth={2} />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
