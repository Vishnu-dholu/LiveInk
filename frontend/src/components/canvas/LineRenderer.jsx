// Import Line component from react-konva to draw lines on the canvas
import { Line } from "react-konva";
import { useSelector } from "react-redux";

/**
 * LineRenderer is responsible for rendering all the user's drawn lines,
 * including completed lines and the line currently being drawn.
 */
const LineRenderer = ({ lines, currentLine, selectedTool }) => {
  // Helper function to determine line style based on tool
  const getLineProps = (tool) => {
    return {
      tension: tool === "pen" ? 0.5 : 0.2, //  Smoothing factor: pen is smoother
      dash: tool === "pencil" ? [5, 5] : [], //  Dashed effect for pencil
      strokeWidth: tool === "pen" ? 3 : 1.8, //  Thickness based on tool
      stroke: tool === "pen" ? "black" : "#353839", // Stroke color based on tool
    };
  };

  const liveLines = useSelector((state) => state.drawing.liveLines);

  return (
    <>
      {/* Render each completed line from the Redux store */}
      {lines.map((line, index) => (
        <Line
          key={index} //  Unique key for each line
          points={line.points} //  Array of x, y coordinates
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          tension={line.tool === "pen" ? 0.5 : 0.2} //  Smoothing factor: pen is smoother
          dash={line.tool === "pencil" ? [5, 5] : []} //  Dashed effect for pencil
          lineCap="round" //  Rounded line ends
          lineJoin="round" //  Smooth corner joints
        />
      ))}

      {/* Render the line currently being drawn */}
      {currentLine.length > 0 && (
        <Line
          key="current-line"
          points={currentLine} //  Points array of current line in progress
          {...getLineProps(selectedTool)} //  Dynamic styling based on tool
          lineCap="round"
          lineJoin="round"
        />
      )}

      {liveLines.map((line, index) => (
        <Line
          key={`live-line-${index}`}
          points={line.points}
          stroke={line.tool === "pen" ? "black" : "#353839"}
          strokeWidth={line.tool === "pen" ? 3 : 1.8}
          opacity={line.tool === "pen" ? 1 : 0.6}
          dash={line.tool === "pencil" ? [5, 5] : []}
          tension={0.5}
          lineCap="round"
          globalCompositeOperation={
            line.tool === "eraser" ? "destination-out" : "source-over"
          }
          listening={false}
        />
      ))}
    </>
  );
};

export default LineRenderer;
