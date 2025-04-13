import { Layer, Line } from "react-konva";
import { useSelector } from "react-redux";

const GridLayer = ({ width, height, gridSize = 50 }) => {
  const zoom = useSelector((state) => state.drawing.zoom);
  const scaledGridSize = gridSize * zoom;

  const verticalLines = [];
  for (let i = 0; i < width / scaledGridSize; i++) {
    verticalLines.push(
      <Line
        key={`v-${i}`}
        points={[i * scaledGridSize, 0, i * scaledGridSize, height]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }

  const HorizontalLines = [];
  for (let i = 0; i < height / scaledGridSize; i++) {
    HorizontalLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * scaledGridSize, width, i * scaledGridSize]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }
  return <Layer>{[...verticalLines, ...HorizontalLines]}</Layer>;
};

export default GridLayer;
