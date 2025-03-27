import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import io from "socket.io-client";
import Toolbar from "./Toolbar";

// Connect to WebSocket server
const socket = io("http://localhost:5000");

const Canvas = () => {
  // Stores drawn lines
  const [lines, setLines] = useState(() => []);
  // Stack for undo
  const [history, setHistory] = useState(() => []);
  // Stack for redo
  const [redoHistory, setRedoHistory] = useState(() => []);
  // Track whether user is currently drawing
  const [isDrawing, setIsDrawing] = useState(false);
  // Reference to the Konva stage
  const stageRef = useRef(null);

  /* ----------functions------------ */

  // Handle mouse/touch down event (start drawing)
  const handleMouseDown = (event) => {
    setIsDrawing(true);
    const pos = event.target.getStage().getPointerPosition();

    // Save current state before modifying it
    setHistory((prevHistory) => [...prevHistory, [...lines]]);
    setRedoHistory([]); // Clear redo when drawing a new line

    const newLine = { points: [pos.x, pos.y], stroke: "black", strokeWidth: 3 };
    setLines((prevLines) => [...prevLines, newLine]);

    // Emit drawing to server immediately
    socket.emit("draw", newLine);
  };

  // Handle mouse/touch move event (draw line)
  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const stage = event.target.getStage();
    const point = stage.getPointerPosition();

    setLines((prevLines) => {
      if (prevLines.length === 0) return prevLines;

      const updatedLines = [...prevLines];
      const lastLine = updatedLines[updatedLines.length - 1];

      // Update the last line with new points
      lastLine.points = [...lastLine.points, point.x, point.y];

      socket.emit("draw", lastLine);

      return updatedLines;
    });
  };

  // Handle mouse/touch up event (stop drawing)
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Undo action
  const handleUndo = () => {
    if (history.length === 0) return; // Prevent errors

    // Get the last saved state
    const previousState = history[history.length - 1];

    setRedoHistory((prevRedo) => [...prevRedo, lines]); // Save current state in redo
    setLines(previousState); // Restore previous state
    setHistory((prevHistory) => prevHistory.slice(0, -1)); // Remove last history entry

    socket.emit("undo", previousState);
  };

  // Redo action
  const handleRedo = () => {
    if (redoHistory.length === 0) return; // No redo possible

    // Get the last redo state
    const nextState = redoHistory[redoHistory.length - 1];

    setHistory((prevHistory) => [...prevHistory, lines]); // Save current state in history
    setLines(nextState); // Restore redo state
    setRedoHistory((prevRedo) => prevRedo.slice(0, -1)); // Remove last redo entry

    socket.emit("redo");
  };

  // Clear action
  const handleClear = () => {
    setLines([]);
    setHistory([]);
    setRedoHistory([]);

    socket.emit("clear");
  };

  // Listen for real-time drawing updates
  useEffect(() => {
    socket.on("draw", (newLine) => {
      setLines((prevLines) => [...prevLines, newLine]);
    });

    socket.on("undo", (previousState) => {
      if (previousState && Array.isArray(previousState)) {
        setLines(previousState);
      }
    });

    socket.on("redo", (nextState) => {
      if (nextState && Array.isArray(nextState)) {
        setLines(nextState);
        setHistory((prevHistory) => [...prevHistory, nextState]);
      }
    });

    socket.on("clear", () => {
      setLines([]);
      setHistory([]);
      setRedoHistory([]);
    });

    return () => {
      socket.off("draw");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear");
    };
  }, []);

  return (
    <div className="flex flex-col items-center">
      <Toolbar onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear} />
      <Stage
        width={window.innerWidth - 200}
        height={window.innerHeight - 200}
        ref={stageRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border-2 border-black"
      >
        <Layer>
          {lines.map((line, index) => (
            <Line
              key={index}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              lineCap="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
