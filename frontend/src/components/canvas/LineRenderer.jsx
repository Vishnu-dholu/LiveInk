import { Line } from "react-konva";
import { useSelector } from "react-redux";

const LineRenderer = () => {
  const lines = useSelector((state) => state.drawing.lines);
  const currentLine = useSelector((state) => state.drawing.currentLine);
  const selectedTool = useSelector((state) => state.drawing.selectedTool);

  return (
    <>
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
          key="current-line"
          points={currentLine}
          stroke={selectedTool === "pen" ? "black" : "#353839"}
          strokeWidth={selectedTool === "pen" ? 3 : 1.8}
          tension={selectedTool === "pen" ? 0.5 : 0.2}
          lineCap="round"
          lineJoin="round"
          dash={selectedTool === "pencil" ? [5, 5] : []}
        />
      )}
    </>
  );
};

export default LineRenderer;
