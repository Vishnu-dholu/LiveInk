import { Layer, Line } from "react-konva";
import { useSelector } from "react-redux";

const GridLayer = ({ width, height, gridSize = 50 }) => {
  const zoom = useSelector((state) => state.drawing.zoom);
  const stageX = useSelector((state) => state.drawing.stageX);
  const stageY = useSelector((state) => state.drawing.stageY);

  const scaledGridSize = gridSize * zoom;

  const verticalLines = [];
  const horizontalLines = [];

  // Calculate where the first vertical line should start based on pan
  const startX = -stageX % scaledGridSize;
  const startY = -stageY % scaledGridSize;

  for (let x = startX; x < width; x += scaledGridSize) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  for (let y = startY; y < height; y += scaledGridSize) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  return (
    <Layer listening={false}>{[...verticalLines, ...horizontalLines]}</Layer>
  );
};

export default GridLayer;
