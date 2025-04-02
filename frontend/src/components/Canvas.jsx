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
import { Menu } from "lucide-react";

const socket = io("http://localhost:5000");

const Canvas = () => {
  const dispatch = useDispatch();
  const lines = useSelector((state) => state.drawing.lines);
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const redoHistory = useSelector((state) => state.drawing.redoHistory);
  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth - 200);
  const [canvasHeight, setCanvasHeight] = useState(window.innerHeight - 100);
  const [isToolboxVisible, setIsToolboxVisible] = useState(false);

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
        <Toolbox />
      </div>

      <div className="flex flex-col items-center flex-1 w-full max-w-screen-xl px-4">
        <Toolbar
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
        />
        <div className="w-full max-w-6xl max-h-[80vh] shadow-lg rounded-xl border bg-gray-100 dark:bg-gray-500 border-gray-300 dark:border-gray-700 overflow-hidden">
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
