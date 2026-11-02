import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { setDrawingDefaults, setFillColor, updateItemProps } from "@/store/drawingSlice";
import Section from "./properties/Section";
import StrokeSection from "./properties/StrokeSection";
import TextSection from "./properties/TextSection";
import ColorField from "./properties/ColorField";
import SliderField from "./properties/SliderField";
import ArrangeSection from "./properties/ArrangeSection";
import CanvasSection from "./properties/CanvasSection";

const KIND_LABELS = { line: "Line", shape: "Shape", text: "Text" };
const SHAPE_TOOLS = ["square", "rectangle", "circle"];

// Property name in the panel -> default stored in the drawing slice
const DEFAULT_KEYS = {
  stroke: "currentStrokeColor",
  strokeWidth: "currentStrokeWidth",
  opacity: "currentOpacity",
  dashStyle: "currentDashStyle",
  fill: "currentTextColor",
  fontSize: "fontSize",
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
};

// Values shown for a selected item (older saved items may lack newer fields)
function itemStrokeValues(kind, item) {
  return {
    stroke: item.stroke || "#000000",
    strokeWidth: item.strokeWidth ?? 2,
    opacity: item.opacity ?? 1,
    dashStyle: item.dashStyle ?? (kind === "line" && item.tool === "pencil" ? "dashed" : "solid"),
  };
}

const SettingsPanel = ({ selectedTool }) => {
  const dispatch = useDispatch();

  // The selected item (only one kind is selected at a time)
  const target = useSelector((state) => {
    const d = state.drawing;
    const line = d.selectedLineId && d.lines.find((i) => i.id === d.selectedLineId);
    if (line) return { kind: "line", item: line };
    const shape = d.selectedShapeId && d.shapes.find((i) => i.id === d.selectedShapeId);
    if (shape) return { kind: "shape", item: shape };
    const text = d.selectedTextId && d.texts.find((i) => i.id === d.selectedTextId);
    if (text) return { kind: "text", item: text };
    return null;
  }, (a, b) => a?.item === b?.item && a?.kind === b?.kind);

  const defaults = useSelector((state) => {
    const d = state.drawing;
    return {
      stroke: d.currentStrokeColor,
      strokeWidth: d.currentStrokeWidth,
      opacity: d.currentOpacity,
      dashStyle: d.currentDashStyle,
      textColor: d.currentTextColor,
      fontSize: d.fontSize,
      fontFamily: d.fontFamily,
      fontStyle: d.fontStyle,
      fill: d.currentFillColor,
    };
  }, shallowEqual);

  // Edit the selected item, or the defaults for new items when nothing is selected.
  // `prop` groups a continuous drag into a single undo step.
  const apply = (patch, prop) => {
    if (target) {
      dispatch(
        updateItemProps({
          kind: target.kind,
          id: target.item.id,
          patch,
          coalesceKey: `${target.kind}:${target.item.id}:${prop}`,
        }),
      );
      return;
    }
    const mapped = {};
    for (const [key, value] of Object.entries(patch)) mapped[DEFAULT_KEYS[key]] = value;
    dispatch(setDrawingDefaults(mapped));
  };

  const applyFill = (fill) => {
    if (target?.kind === "shape") {
      dispatch(
        updateItemProps({
          kind: "shape",
          id: target.item.id,
          patch: { fill },
          coalesceKey: `shape:${target.item.id}:fill`,
        }),
      );
    } else {
      dispatch(setFillColor(fill));
    }
  };

  const kind = target?.kind;
  const showStroke = kind === "line" || kind === "shape" ||
    (!target && (selectedTool === "pen" || selectedTool === "pencil" || SHAPE_TOOLS.includes(selectedTool)));
  const showFill = kind === "shape" || (!target && (SHAPE_TOOLS.includes(selectedTool) || selectedTool === "paint"));
  const showText = kind === "text" || (!target && selectedTool === "text");

  const strokeValues = target && kind !== "text" ? itemStrokeValues(kind, target.item) : defaults;
  const textValues = target && kind === "text"
    ? {
        fill: target.item.fill || "#000000",
        fontSize: target.item.fontSize ?? 17,
        fontFamily: target.item.fontFamily || "Arial",
        fontStyle: target.item.fontStyle || "normal",
        opacity: target.item.opacity ?? 1,
      }
    : {
        fill: defaults.textColor,
        fontSize: defaults.fontSize,
        fontFamily: defaults.fontFamily,
        fontStyle: defaults.fontStyle,
      };
  const fillValue = kind === "shape" ? target.item.fill || "transparent" : defaults.fill;

  const hasContext = showStroke || showFill || showText;

  return (
    <div className="w-full flex flex-col gap-6 overflow-x-hidden">
      <div className="rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
        {target ? (
          <>
            <span className="font-semibold">{KIND_LABELS[kind]} selected</span>
            <span className="block">Changes apply to this item.</span>
          </>
        ) : (
          <>
            <span className="font-semibold capitalize">{selectedTool} defaults</span>
            <span className="block">Applied to new items you draw. Select an item to edit it.</span>
          </>
        )}
      </div>

      {target && <Section title="Arrange"><ArrangeSection kind={kind} id={target.item.id} /></Section>}

      {showStroke && (
        <Section title="Stroke">
          <StrokeSection values={strokeValues} onChange={apply} />
        </Section>
      )}

      {showFill && (
        <Section title={selectedTool === "paint" && !target ? "Bucket color" : "Fill"}>
          <div className="space-y-4">
            <ColorField
              label="Fill color"
              value={fillValue}
              allowNone
              onChange={applyFill}
            />
            {kind === "shape" && (
              <SliderField
                label="Rotation"
                value={Math.round(target.item.rotation || 0)}
                min={0}
                max={360}
                format={(v) => `${v}°`}
                onChange={(rotation) => apply({ rotation }, "rotation")}
              />
            )}
          </div>
        </Section>
      )}

      {showText && (
        <Section title="Text">
          <TextSection values={textValues} onChange={apply} showOpacity={kind === "text"} />
        </Section>
      )}

      {!hasContext && (
        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 text-center space-y-2 py-4">
          <span className="text-3xl">🛠️</span>
          <p className="text-sm font-medium">Select an item, or pick a drawing tool, to adjust its settings</p>
        </div>
      )}

      <Section title="Canvas">
        <CanvasSection />
      </Section>
    </div>
  );
};

export default SettingsPanel;
