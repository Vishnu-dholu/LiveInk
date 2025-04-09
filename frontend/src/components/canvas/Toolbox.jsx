// Importing icons for various tools from lucide-react
import {
  EraserIcon,
  MousePointer2,
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
      <div className="flex md:flex-col flex-wrap items-center justify-center gap-3 border border-white p-3 rounded-2xl bg-white dark:bg-gray-700 shadow-md">
        {/* Loop through each tool to render a button with icon and tooltip */}
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
                onClick={() => onSelectTool(tool)} // Set the tool as active
              >
                {/* Render the tool's icon */}
                <Icon className="h-5 w-5" />

                {/* Highlight border for active tool */}
                {activeTool === tool && (
                  <div className="absolute inset-0 border-2 border-blue-700 rounded-md"></div>
                )}
              </Button>
            </TooltipTrigger>

            {/* Tooltip content shows tool name on hover */}
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

export default Toolbox;
