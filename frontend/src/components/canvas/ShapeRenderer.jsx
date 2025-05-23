// Import Rect (rectangle shape) component from react-konva
import { socket } from "@/lib/socket";
import {
  resetFillColor,
  setSelectedShapeId,
  updateShapeFill,
  updateShapeTransform,
} from "@/store/drawingSlice";
import { useEffect, useRef } from "react";
import { Rect, Circle, Transformer, Line } from "react-konva";
import { useDispatch, useSelector } from "react-redux";

/**
 * ShapeRenderer is responsible for rendering all static shapes
 * (like reactangles) as well as a live preview of the currently being drawn.
 */
const ShapeRenderer = ({ shapes, currentShape, selectedTool, zoom }) => {
  const dispatch = useDispatch();

  //  Get all finalized shapes from Redux store
  const selectedShapeId = useSelector((state) => state.drawing.selectedShapeId);
  const liveShapes = useSelector((state) => state.drawing.liveShapes);

  const currentFillColor = useSelector(
    (state) => state.drawing.currentFillColor
  );

  // Refs for Transformer and shape instances
  const transformerRef = useRef(null);
  const shapeRefs = useRef([]);

  useEffect(() => {
    if (transformerRef.current && selectedShapeId !== null) {
      const selectedNode = shapeRefs.current[selectedShapeId];

      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        // Optional: helpful for debugging
        console.warn(
          "Transformer node not found for shape id",
          selectedShapeId
        );
      }
    }
  }, [selectedShapeId, shapes]);

  // Deselect shape on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        dispatch(setSelectedShapeId(null));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <>
      {/* Transparent rect for catching deselection clicks */}
      <Rect
        x={0}
        y={0}
        width={window.innerWidth}
        height={window.innerHeight}
        fill="transparent"
        listening={true}
        onMouseDown={() => {
          if (selectedTool === "select") {
            dispatch(setSelectedShapeId(null));
          }
        }}
      />
      {/* Render all previously drawn shapes */}
      {shapes.map((shape, index) => {
        const commonProps = {
          x: shape.x,
          y: shape.y,
          stroke: "black",
          strokeWidth: 2,
          fill: shape.fill || "transparent",
          draggable: selectedTool === "select",

          onClick: () => {
            if (selectedTool === "select") {
              dispatch(setSelectedShapeId(shape.id));
            } else if (selectedTool === "paint") {
              dispatch(
                updateShapeFill({ id: shape.id, fill: currentFillColor })
              );
              socket.emit("shape:fill", {
                id: shape.id,
                fill: currentFillColor,
              });
              dispatch(resetFillColor());
            }
          },

          onTransformEnd: (e) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            const rotation = node.rotation();

            let updatedShape;

            if (shape.tool === "circle") {
              const avgScale = (scaleX + scaleY) / 2;
              updatedShape = {
                ...shape,
                x: node.x() / zoom,
                y: node.y() / zoom,
                radius: ((shape.radius || 1) * avgScale) / zoom,
                rotation,
              };
            } else {
              updatedShape = {
                ...shape,
                x: node.x() / zoom,
                y: node.y() / zoom,
                width: (shape.width * scaleX) / zoom,
                height: (shape.height * scaleY) / zoom,
                rotation,
              };
            }

            node.scaleX(1);
            node.scaleY(1);

            dispatch(updateShapeTransform({ id: shape.id, updatedShape }));
            socket.emit("shape:update", {
              id: shape.id,
              updatedShape,
            });
            dispatch(resetFillColor());
          },

          onDragEnd: (e) => {
            const updatedShape = {
              ...shape,
              x: e.target.x() / zoom,
              y: e.target.y() / zoom,
            };

            dispatch(updateShapeTransform({ id: shape.id, updatedShape }));
            socket.emit("shape:update", { id: shape.id, updatedShape });
            dispatch(resetFillColor());
          },

          ref: (el) => {
            if (el) shapeRefs.current[shape.id] = el;
          },
        };

        if (shape.type === "circle") {
          return (
            <Circle
              key={`${shape.id}-${shape.fill}`}
              radius={shape.radius}
              {...commonProps}
            />
          );
        } else {
          return (
            <Rect
              key={`${shape.id}-${shape.fill}`}
              width={shape.width}
              height={shape.height}
              {...commonProps}
            />
          );
        }
      })}

      {/* Add Transformer for the selected shape */}
      {selectedShapeId !== null && <Transformer ref={transformerRef} />}

      {/* Render the shape currently being drawn */}
      {currentShape &&
        (selectedTool === "circle" ? (
          <Circle
            x={currentShape.x}
            y={currentShape.y}
            radius={currentShape.radius}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]}
            // fill={currentFillColor}
          />
        ) : (
          <Rect
            x={currentShape.x}
            y={currentShape.y}
            width={currentShape.width}
            height={currentShape.height}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]} //  Dotted line for preview
            // fill={currentFillColor}
          />
        ))}

      {liveShapes.map((shape, index) =>
        shape.type === "circle" ? (
          <Circle
            key={`live-circle-${index}`}
            x={shape.x}
            y={shape.y}
            radius={shape.radius}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]}
            listening={false}
            fill="rgba(0,0,0,0.2)"
          />
        ) : (
          <Rect
            key={`live-rect-${index}`}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            stroke="black"
            strokeWidth={2}
            dash={[10, 5]}
            listening={false}
            fill="rgba(0,0,0,0.2)"
          />
        )
      )}
    </>
  );
};

export default ShapeRenderer;
