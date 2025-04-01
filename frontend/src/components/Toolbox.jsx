import {
  EraserIcon,
  Pencil,
  PenTool,
  RectangleHorizontal,
  Square,
} from "lucide-react";
import { Button } from "./ui/button";

const Toolbox = () => {
  return (
    <div className="flex md:flex-col flex-wrap items-center justify-center gap-3 border border-white p-3 rounded-2xl bg-white dark:bg-gray-700 shadow-md">
      <Button variant="outline">
        <PenTool className="h-5 w-5" />
      </Button>

      <Button variant="outline">
        <EraserIcon className="h-5 w-5" />
      </Button>

      <Button variant="outline">
        <Pencil className="h-5 w-5" />
      </Button>

      <Button variant="outline">
        <Square className="h-5 w-5" />
      </Button>

      <Button variant="outline">
        <RectangleHorizontal className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default Toolbox;
