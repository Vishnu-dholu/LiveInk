// Importing icons for various tools from lucide-react
import {
  Circle,
  EraserIcon,
  MousePointer2,
  PaintBucket,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Square,
  Type,
} from "lucide-react";
import { Button } from "../ui/button";
// Tooltip components for user guidance
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// List of tools available in the toolbox with corresponding icons and labels
const tools = [
  { tool: "select", Icon: MousePointer2, name: "Select" },
  { tool: "text", Icon: Type, name: "Text" },
  { tool: "pen", Icon: PenTool, name: "Pen" },
  { tool: "eraser", Icon: EraserIcon, name: "Eraser" },
  { tool: "pencil", Icon: Pencil, name: "Pencil" },
  { tool: "square", Icon: Square, name: "Square" },
  { tool: "rectangle", Icon: RectangleHorizontal, name: "Rectangle" },
  { tool: "circle", Icon: Circle, name: "Circle" },
  { tool: "paint", Icon: PaintBucket, name: "Paint-Bucket" },
];

/**
 * Toolbox Component
 * Displays a vertical list of buttons for tool selection
 *
 * Props:
 * - onSelectTool: function to call when a tool is selected
 * - activeTool: the currently selected tool
 */
const Toolbox = ({ onSelectTool, activeTool }) => {
  return (
    // TooltipProvider wraps all tooltips for consistency
    <TooltipProvider>
      <div
        // className="grid grid-cols-4 md:grid-cols-1 md:flex md:flex-col items-center justify-items-center md:items-center md:justify-center gap-2 p-2 bg-gray-600 md:bg-white dark:md:bg-gray-700 rounded-2xl md:rounded-2xl md:border md:border-gray-300 dark:md:border-gray-600 shadow-none md:shadow-lg w-full md:w-auto mx-auto"
        className="grid grid-cols-4 md:grid-cols-1 md:flex md:flex-col items-center justify-items-center md:items-center md:justify-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl md:border md:border-gray-300 dark:md:border-gray-700 shadow-inner w-full md:w-auto mx-auto"
      >
        {/* Loop through each tool to render a button with icon and tooltip */}
        {tools.map(({ tool, Icon, name }) => (
          <Tooltip key={tool}>
            <TooltipTrigger asChild>
              <Button
                key={tool}
                variant="outline"
                className={`relative h-10 w-10 p-0 flex items-center justify-center transition-all duration-200 rounded-md ${
                  activeTool === tool
                    ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg border-blue-700 dark:border-white"
                    : "bg-white text-black dark:bg-gray-500 dark:text-white"
                }`}
                onClick={() => onSelectTool(tool)} // Set the tool as active
              >
                {/* Render the tool's icon */}
                <Icon className="h-5 w-5" />

                {/* Highlight border for active tool */}
                {activeTool === tool && (
                  <div className="absolute inset-0 border-2 border-blue-700 dark:border-white rounded-md pointer-events-none"></div>
                )}
              </Button>
            </TooltipTrigger>

            {/* Tooltip content shows tool name on hover */}
            <TooltipContent side="right" sideOffset={5}>
              {name}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default Toolbox;
