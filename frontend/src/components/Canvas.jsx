import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import io from "socket.io-client";
import Toolbar from "./Toolbar";

// Connect to WebSocket server
const socket = io("http://localhost:5000");

const Canvas = () => {
  // Stores drawn lines
  const [lines, setLines] = useState([]);
  // Stack for undo
  const [history, setHistory] = useState([]);
  // Stack for redo
  const [redoHistory, setRedoHistory] = useState([]);
  // Track whether user is currently drawing
  const [isDrawing, setIsDrawing] = useState(false);
  // Reference to the Konva stage
  const stageRef = useRef(null);

  /* ----------functions------------ */

  // Handle mouse/touch down event (start drawing)
  const handleMouseDown = (event) => {
    setIsDrawing(true);
    const pos = event.target.getStage().getPointerPosition();
    setLines([
      ...lines,
      { points: [pos.x, pos.y], stroke: "black", strokeWidth: 3 },
    ]);

    // Save current state in history for undo
    setHistory([...history, lines]);
  };

  // Handle mouse/touch move event (draw line)
  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    const stage = event.target.getStage();
    const point = stage.getPointerPosition();

    // Update the last line with new points
    let lastline = lines[lines.length - 1];
    lastline.points = [...lastline.points, point.x, point.y];

    setLines([...lines.slice(0, -1), lastline]);
    socket.emit("draw", lines);
  };

  // Handle mouse/touch up event (stop drawing)
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Undo action
  const handleUndo = () => {
    if (history.length === 0) return;

    // Get the last state from history
    const previousState = history[history.length - 1];

    // Store the current state in redoHistory for redo
    setRedoHistory([...redoHistory, lines]);
    // Restore the previous state
    setLines(previousState);
    // Remove the last state from history
    setHistory(history.slice(0, -1));
  };

  // Redo action
  const handleRedo = () => {
    // if (history.length === 0) return;

    // Get the last state from redoHistory
    const nextState = redoHistory[redoHistory.length - 1];

    // Store the current state in history for undo
    setHistory([...history, lines]);
    // Restore the next state
    setLines(nextState);
    // Remove the last state from redoHistory
    setRedoHistory(redoHistory.slice(0, 1));
  };

  // Clear action
  const handleClear = () => {
    setLines([]);
    setHistory([]);
    setRedoHistory([]);
  };

  // Listen for real-time drawing updates
  useEffect(() => {
    socket.on("draw", (data) => {
      setLines(data);
    });

    return () => socket.off("draw");
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* <div className="flex gap-4 p-4">
        <button
          onClick={handleUndo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Undo
        </button>
        <button
          onClick={handleRedo}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Redo
        </button>
      </div> */}
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
