
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    lines: [],
    shapes: [],
    texts: [],
    undoHistory: [],
    redoHistory: [],
    currentLine: [],
    currentText: null,
    currentShape: null,
};

const drawingSlice = createSlice({
    name: "drawing",
    initialState,
    reducers: {
        // ----- LINE & SHAPE LOGIC -----
        addLine: (state, action) => {
            state.undoHistory.push(getSnapshot(state)); // Save current state for undo
            state.lines.push(action.payload); // Add new line
            state.redoHistory = []; // Clear redo stack after new action
        },
        drawShape: (state, action) => {
            state.undoHistory.push(getSnapshot(state))
            state.shapes.push(action.payload)
            state.redoHistory = []
        },
        updateCurrentShape: (state, action) => {
            state.currentShape = action.payload
        },
        clearCurrentShape: (state) => {
            state.currentShape = null
        },

        // ----- UNDO / REDO / CLEAR -----
        undoAction: (state) => {
            if (state.undoHistory.length > 0) {
                const prevState = state.undoHistory.pop()
                state.redoHistory.push(getSnapshot(state));
                restoreSnapshot(state, prevState)
            }
        },
        redoAction: (state) => {
            if (state.redoHistory.length > 0) {
                const redoState = state.redoHistory.pop();
                state.undoHistory.push(getSnapshot(state));
                restoreSnapshot(state, redoState)
            }
        },
        clearCanvas: (state) => {
            state.undoHistory.push({
                lines: [...state.lines],
                shapes: [...state.shapes],
                texts: [...state.texts]
            }); // Save before clearing
            state.redoHistory = []; // Clear redo stack
            state.lines = [];
            state.shapes = [];
            state.texts = [];
        },

        // ----- LINE ERASER -----
        removeLineAt: (state, action) => {
            const { x, y } = action.payload
            const threshold = 10    // Eraser sensitivity
            state.undoHistory.push(getSnapshot(state));

            state.lines = state.lines
                .map((line) => {
                    const newPoints = [];
                    for (let i = 0; i < line.points.length; i += 2) {
                        const lineX = line.points[i];
                        const lineY = line.points[i + 1];

                        if (Math.abs(lineX - x) >= threshold || Math.abs(lineY - y) >= threshold) {
                            newPoints.push(lineX, lineY);
                        }
                    }
                    return newPoints.length > 2 ? { ...line, points: newPoints } : null;
                })
                .filter(Boolean);
        },
        updateCurrentLine: (state, action) => {
            state.currentLine = action.payload;
        },

        // ----- TEXT LOGIC -----
        addText: (state, action) => {
            state.undoHistory.push(getSnapshot(state))
            state.texts.push(action.payload)
            state.redoHistory = []
        },
        updateCurrentText: (state, action) => {
            state.currentText = action.payload
        },
        commitCurrentText: (state) => {
            if (state.currentText) {
                state.undoHistory.push(getSnapshot(state))
                state.texts.push(state.currentText)
                state.currentText = null
                state.redoHistory = []
            }
        },
        updateTextContent: (state, action) => {
            const { id, text } = action.payload
            const target = state.texts.find(t => t.id === id)
            if (target) target.text = text
        },

        updateLinePosition: (state, action) => {
            const { index, x, y } = action.payload
            const line = state.lines[index]
            if (line) {
                const oldPoints = [...line.points]
                const newPoints = []

                for (let i = 0; i < oldPoints.length; i += 2) {
                    newPoints.push(oldPoints[i] + x, oldPoints[i + 1] + y)
                }

                line.points = newPoints
            }
        },
        updateShapePosition: (state, action) => {
            const { index, x, y } = action.payload;
            if (state.shapes[index]) {
                state.shapes[index].x = x;
                state.shapes[index].y = y;
            }
        },
    },
});

// Helper to take a snapshot of current drawable state
function getSnapshot(state) {
    return {
        lines: [...state.lines],
        shapes: [...state.shapes],
        texts: [...state.texts]
    }
}

// Helper to restore a snapshot into current state
function restoreSnapshot(state, snapshot) {
    state.lines = snapshot.lines || [];
    state.shapes = snapshot.shapes || [];
    state.texts = snapshot.texts || [];
}

export const {
    addLine,
    drawShape,
    updateCurrentShape,
    clearCurrentShape,
    undoAction,
    redoAction,
    clearCanvas,
    removeLineAt,
    updateCurrentLine,
    addText,
    updateCurrentText,
    commitCurrentText,
    updateTextContent,
} = drawingSlice.actions;

export default drawingSlice.reducer;
