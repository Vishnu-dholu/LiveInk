
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    lines: [],
    shapes: [],
    texts: [],
    undoHistory: [],
    redoHistory: [],
    currentLine: [],
    currentText: null
};

const drawingSlice = createSlice({
    name: "drawing",
    initialState,
    reducers: {
        addLine: (state, action) => {
            state.undoHistory.push({ lines: [...state.lines], shapes: [...state.shapes] }); // Save current state for undo
            state.lines.push(action.payload); // Add new line
            state.redoHistory = []; // Clear redo stack after new action
        },
        drawShape: (state, action) => {
            state.undoHistory.push({ lines: [...state.lines], shapes: [...state.shapes] })
            state.shapes.push(action.payload)
            state.redoHistory = []
        },
        undoAction: (state) => {
            if (state.undoHistory.length > 0) {
                const prevState = state.undoHistory.pop()
                state.redoHistory.push({
                    lines: [...state.lines],
                    shapes: [...state.shapes],
                    texts: [...state.texts]
                });
                state.lines = prevState.lines || [];
                state.shapes = prevState.shapes || [];
                state.texts = prevState.texts || [];
            }
        },
        redoAction: (state) => {
            if (state.redoHistory.length > 0) {
                const redoState = state.redoHistory.pop();
                state.undoHistory.push({
                    lines: [...state.lines],
                    shapes: [...state.shapes],
                    texts: [...state.texts]
                });
                state.lines = redoState.lines || [];
                state.shapes = redoState.shapes || [];
                state.texts = redoState.texts || [];
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
        removeLineAt: (state, action) => {
            const { x, y } = action.payload
            const threshold = 10    // Eraser sensitivity

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
        addText: (state, action) => {
            state.undoHistory.push({
                lines: [...state.lines],
                shapes: [...state.shapes],
                texts: [...state.texts]
            })
            state.texts.push(action.payload)
            state.redoHistory = []
        },
        updateCurrentText: (state, action) => {
            state.currentText = action.payload
        },
        commitCurrentText: (state) => {
            if (state.currentText) {
                state.undoHistory.push({
                    lines: [...state.lines],
                    shapes: [...state.shapes],
                    texts: [...state.texts]
                })
                state.texts.push(state.currentText)
                state.currentText = null
                state.redoHistory = []
            }
        },
        updateTextContent: (state, action) => {
            const { id, text } = action.payload
            const target = state.texts.find(t => t.id === id)
            if (target) target.text = text
        }
    },
});

export const { addLine, drawShape, undoAction, redoAction, clearCanvas, removeLineAt, updateCurrentLine, addText, updateCurrentText, commitCurrentText, updateTextContent } =
    drawingSlice.actions;

export default drawingSlice.reducer;
