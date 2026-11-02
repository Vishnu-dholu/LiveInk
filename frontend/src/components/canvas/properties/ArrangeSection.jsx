import { useDispatch } from "react-redux";
import {
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
} from "lucide-react";
import {
  deleteLine,
  deleteShape,
  deleteText,
  duplicateItem,
  reorderItem,
} from "@/store/drawingSlice";

const DELETE_ACTIONS = { line: deleteLine, shape: deleteShape, text: deleteText };

const ActionButton = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`flex h-9 items-center justify-center rounded border ${
      danger
        ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`}
  >
    <Icon size={16} />
  </button>
);

// Layer order (within lines, shapes or texts), duplicate and delete for the selected item
const ArrangeSection = ({ kind, id }) => {
  const dispatch = useDispatch();
  const move = (to) => dispatch(reorderItem({ kind, id, to }));

  return (
    <div className="grid grid-cols-6 gap-1.5">
      <ActionButton icon={ArrowUpToLine} label="Bring to front" onClick={() => move("front")} />
      <ActionButton icon={ChevronUp} label="Bring forward" onClick={() => move("forward")} />
      <ActionButton icon={ChevronDown} label="Send backward" onClick={() => move("backward")} />
      <ActionButton icon={ArrowDownToLine} label="Send to back" onClick={() => move("back")} />
      <ActionButton icon={Copy} label="Duplicate" onClick={() => dispatch(duplicateItem({ kind, id }))} />
      <ActionButton icon={Trash2} label="Delete" danger onClick={() => dispatch(DELETE_ACTIONS[kind](id))} />
    </div>
  );
};

export default ArrangeSection;
