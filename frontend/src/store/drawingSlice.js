import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  lines: [], //  Stores drawn lines
  shapes: [], //  Stores shapes (circle, rect, etc.)
  texts: [], //  Stores text elements
  undoHistory: [], //  Stack to track previous states (for undo)
  redoHistory: [], //  Stack to track undone states (for redo)
  currentLine: [], //  Temporarily holds the line being drawn
  currentShape: null, //  Temporarily holds shape being drawn
  selectedShapeId: null, //  ID of currently selected shape
  selectedTextId: null,
  zoom: 1, //  Current zoom level
  stageX: 0, //  X scroll position of canvas
  stageY: 0, //  Y scroll position of canvas
  showGrid: true, // Toggle to show/hide canvas gride
  liveShapes: [],
  liveLines: [],
  currentFillColor: "transparent",
  selectedTool: "select",
  currentStrokeWidth: 2,
  fontFamily: "Arial",
  fontStyle: "normal",
  fontSize: 17,
  roomId: null,
  createdBy: "",
  users: [],
  // chatHistory: [],
};

const drawingSlice = createSlice({
  name: "drawing",
  initialState,
  reducers: {
    // ----- LINE & SHAPE LOGIC -----
    // Adds a new line to the canvas
    addLine: (state, action) => {
      pushUndo(state); // Save current state for undo
      state.lines.push(action.payload); // Add new line
      state.redoHistory = []; // Clear redo stack after new action
    },

    // Updates the currently drawing line (real-time drawing)
    updateCurrentLine: (state, action) => {
      state.currentLine = action.payload;
    },

    setLiveLines: (state, action) => {
      state.liveLines = action.payload;
    },

    appendLiveLinePoints: (state, action) => {
      const { points, tool, socketId } = action.payload;
      const lineIndex = state.liveLines.findIndex(l => l.socketId === socketId);
      if (lineIndex === -1) {
         state.liveLines.push({ points: [...points], tool, socketId });
      } else {
         state.liveLines[lineIndex].points.push(...points);
      }
    },

    removeLiveLine: (state, action) => {
       const socketId = action.payload;
       state.liveLines = state.liveLines.filter(l => l.socketId !== socketId);
    },

    // Adds a shape with a unique ID
    drawShape: (state, action) => {
      const shape = action.payload;
      pushUndo(state);
      state.shapes.push(shape);
      state.redoHistory = [];
    },

    // Temporarily sets the current shape being drawn (used during interaction)
    updateCurrentShape: (state, action) => {
      state.currentShape = action.payload;
    },

    setLiveShapes: (state, action) => {
      state.liveShapes = action.payload;
    },

    updateLiveShape: (state, action) => {
      const liveShape = action.payload;
      const index = state.liveShapes.findIndex(s => s.socketId === liveShape.socketId);
      if (index === -1) {
        state.liveShapes.push(liveShape);
      } else {
        state.liveShapes[index] = liveShape;
      }
    },

    removeLiveShape: (state, action) => {
       const socketId = action.payload;
       state.liveShapes = state.liveShapes.filter(s => s.socketId !== socketId);
    },

    // Clears the currently drawn shape once finalized
    clearCurrentShape: (state) => {
      state.currentShape = null;
    },

    // ----- UNDO / REDO / CLEAR -----
    // Undo last action by restoring previous state
    undoAction: (state) => {
      if (state.undoHistory.length > 0) {
        const prevState = state.undoHistory.pop(); //  Get previous snapshot
        state.redoHistory.push(getSnapshot(state)); //  Save current for redo
        restoreSnapshot(state, prevState); //  Restore to previous
      }
    },

    // Redo the last undone action
    redoAction: (state) => {
      if (state.redoHistory.length > 0) {
        const redoState = state.redoHistory.pop(); //  Get next state
        pushUndo(state); //  Save current for undo
        restoreSnapshot(state, redoState); //  Restore redo state
      }
    },

    // Clears the canvas and saves the current snapshot to undoHistory
    clearCanvas: (state) => {
      pushUndo(state); // Save before clearing
      state.redoHistory = []; // Clear redo stack
      state.lines = [];
      state.shapes = [];
      state.texts = [];
    },

    // Syncs the entire canvas from the server (for undo/redo and late joiners)
    syncState: (state, action) => {
      state.lines = action.payload.lines || [];
      state.shapes = action.payload.shapes || [];
      state.texts = action.payload.texts || [];
      state.undoHistory = [];
      state.redoHistory = [];
    },

    // Applies deltas (add / update / remove / clear by id) received from other users.
    // Not recorded in this user's undo history.
    applyRemoteOps: (state, action) => {
      for (const op of action.payload || []) {
        if (op.op === "clear") {
          state.lines = [];
          state.shapes = [];
          state.texts = [];
          continue;
        }

        const key = REMOTE_KEYS[op.kind];
        if (!key) continue;

        if (op.op === "add") {
          if (state[key].some((i) => i.id === op.item.id)) continue;
          state[key].push(op.item);
          // The finished stroke/shape replaces that user's live preview
          if (op.item.socketId) {
            if (op.kind === "line") {
              state.liveLines = state.liveLines.filter((l) => l.socketId !== op.item.socketId);
            } else if (op.kind === "shape") {
              state.liveShapes = state.liveShapes.filter((s) => s.socketId !== op.item.socketId);
            }
          }
        } else if (op.op === "update") {
          const target = state[key].find((i) => i.id === op.id);
          if (target) Object.assign(target, op.patch);
        } else if (op.op === "remove") {
          state[key] = state[key].filter((i) => i.id !== op.id);
        }
      }

      if (state.selectedShapeId && !state.shapes.some((s) => s.id === state.selectedShapeId)) {
        state.selectedShapeId = null;
      }
      if (state.selectedTextId && !state.texts.some((t) => t.id === state.selectedTextId)) {
        state.selectedTextId = null;
      }
    },

    // ----- ERASER OVERHAUL -----
    beginErase: (state) => {
      // Push a single undo snapshot at the start of an erase stroke
      pushUndo(state);
      state.redoHistory = [];
    },

    eraseAt: (state, action) => {
      const { x, y, radius } = action.payload;
      const rSq = radius * radius;
      const inside = (px, py) => (px - x) * (px - x) + (py - y) * (py - y) < rSq;

      const newLines = [];
      let changed = false;

      for (const line of state.lines) {
        const pts = line.points;

        let touched = false;
        for (let i = 0; i < pts.length; i += 2) {
          if (inside(pts[i], pts[i + 1])) {
            touched = true;
            break;
          }
        }
        if (!touched) {
          newLines.push(line); // untouched lines keep their identity
          continue;
        }

        changed = true;
        // Split the line around the erased points. The first surviving segment keeps
        // the line's id; later segments get an id derived from the parent and their
        // start index, so every client derives the same ids.
        let segment = [];
        let segmentStart = 0;
        let keptOriginalId = false;
        const flush = () => {
          if (segment.length > 2) {
            const id = keptOriginalId ? `${line.id}~${segmentStart}` : line.id;
            keptOriginalId = true;
            newLines.push({ ...line, id, points: segment });
          }
          segment = [];
        };

        for (let i = 0; i < pts.length; i += 2) {
          if (inside(pts[i], pts[i + 1])) {
            flush();
          } else {
            if (segment.length === 0) segmentStart = i;
            segment.push(pts[i], pts[i + 1]);
          }
        }
        flush();
      }

      if (changed) state.lines = newLines;
    },

    eraseShape: (state, action) => {
      const { x, y, radius } = action.payload;
      const rSq = radius * radius;
      
      const keptShapes = state.shapes.filter(shape => {
        let centerX = shape.x;
        let centerY = shape.y;
        if (shape.type !== "circle") {
            centerX += (shape.width || 0) / 2;
            centerY += (shape.height || 0) / 2;
        }
        
        // Approximate collision using center point
        const dx = centerX - x;
        const dy = centerY - y;
        return (dx * dx + dy * dy) > rSq; // Keep if outside
      });
      if (keptShapes.length === state.shapes.length) return;
      state.shapes = keptShapes;
      // Clear selection if the selected shape was erased
      if (state.selectedShapeId && !state.shapes.find(s => s.id === state.selectedShapeId)) {
        state.selectedShapeId = null;
      }
    },

    eraseText: (state, action) => {
       const { x, y, radius } = action.payload;
       const rSq = radius * radius;
       
       const keptTexts = state.texts.filter(text => {
           // Approximate text collision using origin point
           const dx = text.x - x;
           const dy = text.y - y;
           return (dx * dx + dy * dy) > rSq;
       });
       if (keptTexts.length === state.texts.length) return;
       state.texts = keptTexts;
       // Clear selection if the selected text was erased
       if (state.selectedTextId && !state.texts.find(t => t.id === state.selectedTextId)) {
         state.selectedTextId = null;
       }
    },

    // ----- TEXT LOGIC -----
    // Adds a text element to the canvas
    addText: (state, action) => {
      const text = action.payload;

      pushUndo(state);
      state.texts.push(text);
      state.redoHistory = [];
    },

    setSelectedTextId: (state, action) => {
      state.selectedTextId = action.payload;
    },

    // Updates the content of a specific text element
    updateTextContent: (state, action) => {
      const { id, ...updates } = action.payload;
      const target = state.texts.find((t) => t.id === id);
      if (target) {
        pushUndo(state);
        Object.assign(target, updates);
        state.redoHistory = [];
      }
    },

    updateTextFontStyle: (state, action) => {
      const { id, fontStyle } = action.payload;
      const text = state.texts.find((t) => t.id === id);
      if (text) {
        pushUndo(state);
        text.fontStyle = fontStyle;
        state.redoHistory = [];
      }
    },

    updateTextFontFamily: (state, action) => {
      const { id, fontFamily } = action.payload;
      const text = state.texts.find((t) => t.id === id);
      if (text) {
        pushUndo(state);
        text.fontFamily = fontFamily;
        state.redoHistory = [];
      }
    },

    updateTextFontSize: (state, action) => {
      const { id, fontSize } = action.payload;
      const text = state.texts.find((t) => t.id === id);
      if (text) {
        pushUndo(state);
        text.fontSize = fontSize;
        state.redoHistory = [];
      }
    },

    deleteText: (state, action) => {
      const id = action.payload;
      pushUndo(state);
      state.texts = state.texts.filter((t) => t.id !== id);
      if (state.selectedTextId === id) state.selectedTextId = null;
      state.redoHistory = [];
    },

    deleteShape: (state, action) => {
      const id = action.payload;
      pushUndo(state);
      state.shapes = state.shapes.filter((s) => s.id !== id);
      if (state.selectedShapeId === id) state.selectedShapeId = null;
      state.redoHistory = [];
    },

    deselectText: (state) => {
      state.selectedTextId = null;
    },

    setSelectedTool: (state, action) => {
      state.selectedTool = action.payload;
    },

    setFontFamily: (state, action) => {
      state.fontFamily = action.payload;
    },

    setFontStyle: (state, action) => {
      state.fontStyle = action.payload;
    },

    // ------- POSITION UPDATES -------
    // Updates position of a line by translating each point
    updateLinePosition: (state, action) => {
      const { index, x, y } = action.payload;
      const line = state.lines[index];
      if (line) {
        const oldPoints = [...line.points];
        const newPoints = [];
        pushUndo(state);
        for (let i = 0; i < oldPoints.length; i += 2) {
          newPoints.push(oldPoints[i] + x, oldPoints[i + 1] + y);
        }
        state.redoHistory = [];
        line.points = newPoints;
      }
    },

    // Updates shape's X and Y position
    updateShapePosition: (state, action) => {
      const { index, x, y } = action.payload;
      if (state.shapes[index]) {
        pushUndo(state);
        state.shapes[index].x = x;
        state.shapes[index].y = y;
        state.redoHistory = [];
      }
    },

    // Updates the position of a specific text element
    updateTextPosition: (state, action) => {
      const { id, x, y } = action.payload;
      const text = state.texts.find((t) => t.id === id);
      if (text) {
        pushUndo(state);
        text.x = x;
        text.y = y;
        state.redoHistory = [];
      }
    },

    // ------- SHAPE TRANSFORM -------
    // Sets the currently selected shape (used for transforms)
    setSelectedShapeId: (state, action) => {
      state.selectedShapeId = action.payload;
    },

    // Updates transformation (position/scale/rotation) of a shape by ID
    updateShapeTransform: (state, action) => {
      const { id, updatedShape } = action.payload;
      const index = state.shapes.findIndex((shape) => shape.id === id);
      if (index === -1) return;
      pushUndo(state);
      state.shapes[index] = { ...state.shapes[index], ...updatedShape };
      state.redoHistory = [];
    },

    // ------- FILL COLOR -------
    setFillColor: (state, action) => {
      state.currentFillColor = action.payload;
    },

    resetFillColor: (state) => {
      state.currentFillColor = "transparent";
    },

    updateShapeFill: (state, action) => {
      const { id, fill } = action.payload;
      const shape = state.shapes.find((s) => s.id === id);
      if (shape) {
        pushUndo(state);
        shape.fill = fill;
        state.redoHistory = [];
      }
    },

    updateTextFill: (state, action) => {
      const { id, fill } = action.payload;
      const text = state.texts.find((t) => t.id === id);
      if (text) {
        pushUndo(state);
        text.fill = String(fill);
        state.redoHistory = [];
      }
    },

    // ------- VIEWPORT CONTROLS -------
    // Sets the zoom level of the canvas
    setZoom: (state, action) => {
      state.zoom = action.payload;
    },

    // Sets the X/Y position of the stage (canvas viewport)
    setStagePosition: (state, action) => {
      state.stageX = action.payload.x;
      state.stageY = action.payload.y;
    },

    // Toggles the background grid visibility
    toggleGrid: (state) => {
      state.showGrid = !state.showGrid;
    },

    setStrokeWidth: (state, action) => {
      state.currentStrokeWidth = action.payload;
    },

    setRoomInfo: (state, action) => {
      const { roomId, createdBy, users } = action.payload;
      state.roomId = roomId;
      state.createdBy = createdBy;
      state.users = users;
    },
    updateUsers: (state, action) => {
      state.users = action.payload;
    },
    clearRoom: (state) => {
      state.roomId = null;
      state.createdBy = "";
      state.users = [];
    },
    updateCreatedBy: (state, action) => {
      state.createdBy = action.payload || "";
    },
  },
});

// ------- SNAPSHOT HELPERS -------

const MAX_UNDO_STEPS = 50;
const REMOTE_KEYS = { line: "lines", shape: "shapes", text: "texts" };

// Saves the current drawable state for undo, keeping the history bounded
function pushUndo(state) {
  state.undoHistory.push(getSnapshot(state));
  if (state.undoHistory.length > MAX_UNDO_STEPS) state.undoHistory.shift();
}

// Creates a shallow copy of drawable elements for undo/redo
function getSnapshot(state) {
  return {
    lines: state.lines.map((line) => ({
      ...line,
      points: [...line.points],
      dash: [...(line.dash || [])],
    })),
    shapes: state.shapes.map((shape) => ({
      ...shape,
      dash: [...(shape.dash || [])],
    })),
    texts: state.texts.map((text) => ({ ...text })),
  };
}

// Restores a previous drawable state
function restoreSnapshot(state, snapshot) {
  state.lines = snapshot.lines || [];
  state.shapes = snapshot.shapes || [];
  state.texts = snapshot.texts || [];
}

export const {
  addLine,
  setLiveLines,
  drawShape,
  setLiveShapes,
  updateCurrentShape,
  clearCurrentShape,
  undoAction,
  redoAction,
  clearCanvas,
  syncState,
  applyRemoteOps,
  beginErase,
  eraseAt,
  eraseShape,
  eraseText,
  updateCurrentLine,
  addText,
  setSelectedTextId,
  updateTextContent,
  deleteText,
  deleteShape,
  deselectText,
  setSelectedTool,
  updateTextFontStyle,
  updateTextFontFamily,
  updateTextFontSize,
  setFontFamily,
  setFontStyle,
  setSelectedShapeId,
  updateShapeTransform,
  updateShapePosition,
  updateTextPosition,
  updateLinePosition,
  setZoom,
  setStagePosition,
  toggleGrid,
  setFillColor,
  resetFillColor,
  updateShapeFill,
  updateTextFill,
  setStrokeWidth,
  setRoomInfo,
  updateUsers,
  clearRoom,
  updateCreatedBy,
  appendLiveLinePoints,
  removeLiveLine,
  updateLiveShape,
  removeLiveShape,
} = drawingSlice.actions;

export default drawingSlice.reducer;
