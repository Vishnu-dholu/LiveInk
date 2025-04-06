import {
  EraserIcon,
  MousePointer2,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Square,
  Type,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tools = [
  { tool: "select", Icon: MousePointer2, name: "Select" },
  { tool: "text", Icon: Type, name: "Text" },
  { tool: "pen", Icon: PenTool, name: "Pen" },
  { tool: "eraser", Icon: EraserIcon, name: "Eraser" },
  { tool: "pencil", Icon: Pencil, name: "Pencil" },
  { tool: "square", Icon: Square, name: "Square" },
  { tool: "rectangle", Icon: RectangleHorizontal, name: "Rectangle" },
];

const Toolbox = ({ onSelectTool, activeTool }) => {
  return (
    <TooltipProvider>
      <div className="flex md:flex-col flex-wrap items-center justify-center gap-3 border border-white p-3 rounded-2xl bg-white dark:bg-gray-700 shadow-md">
        {tools.map(({ tool, Icon, name }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                key={tool}
                variant="outline"
                className={`relative transition-all ${
                  activeTool === tool
                    ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg border-blue-700 dark:border-white"
                    : "bg-white text-black dark:bg-gray-500 dark:text-white"
                }`}
                onClick={() => onSelectTool(tool)}
              >
                <Icon className="h-5 w-5" />
                {activeTool === tool && (
                  <div className="absolute inset-0 border-2 border-blue-700 rounded-md"></div>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default Toolbox;
