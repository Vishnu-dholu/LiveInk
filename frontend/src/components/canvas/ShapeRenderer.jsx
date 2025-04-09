import { Rect } from "react-konva";
import { useSelector } from "react-redux";

const ShapeRenderer = ({ currentShape }) => {
  const shapes = useSelector((state) => state.drawing.shapes);

  return (
    <>
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
    </>
  );
};

export default ShapeRenderer;
