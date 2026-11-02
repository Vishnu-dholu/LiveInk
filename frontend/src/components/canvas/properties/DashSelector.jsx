import { DASH_STYLES } from "@/lib/strokeStyle";

const DASH_ARRAYS = { solid: undefined, dashed: "8 5", dotted: "1 5" };

const DashSelector = ({ value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Line style</span>
    <div className="grid grid-cols-3 gap-1.5">
      {DASH_STYLES.map((style) => (
        <button
          key={style}
          type="button"
          onClick={() => onChange(style)}
          title={style}
          className={`flex h-8 items-center justify-center rounded border ${
            value === style
              ? "bg-blue-500 border-blue-600 text-white"
              : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          <svg width="40" height="6" aria-hidden="true">
            <line
              x1="2"
              y1="3"
              x2="38"
              y2="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={DASH_ARRAYS[style]}
            />
          </svg>
        </button>
      ))}
    </div>
  </div>
);

export default DashSelector;
