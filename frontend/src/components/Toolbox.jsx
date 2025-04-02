import {
  EraserIcon,
  MousePointer2,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Square,
} from "lucide-react";
import { Button } from "./ui/button";

const Toolbox = ({ onSelectTool }) => {
  return (
    <div className="flex md:flex-col flex-wrap items-center justify-center gap-3 border border-white p-3 rounded-2xl bg-white dark:bg-gray-700 shadow-md">
      <Button variant="outline" onClick={() => onSelectTool("select")}>
        <MousePointer2 className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        onClick={() => {
          onSelectTool("pen");
          console.log("Pen");
        }}
      >
        <PenTool className="h-5 w-5" />
      </Button>

      <Button variant="outline" onClick={() => onSelectTool("eraser")}>
        <EraserIcon className="h-5 w-5" />
      </Button>

      <Button variant="outline" onClick={() => onSelectTool("pencil")}>
        <Pencil className="h-5 w-5" />
      </Button>

      <Button variant="outline" onClick={() => onSelectTool("square")}>
        <Square className="h-5 w-5" />
      </Button>

      <Button variant="outline" onClick={() => onSelectTool("rectangle")}>
        <RectangleHorizontal className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default Toolbox;
