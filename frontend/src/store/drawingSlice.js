
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    lines: [],
    shapes: [],
    undoHistory: [],
    redoHistory: [],
    currentLine: [],
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
                state.redoHistory.push({ lines: [...state.lines], shapes: [...state.shapes] }); // Save current state for redo
                state.lines = prevState.lines;
                state.shapes = prevState.shapes;
            }
        },
        redoAction: (state) => {
            if (state.redoHistory.length > 0) {
                const redoState = state.redoHistory.pop();
                state.undoHistory.push({ lines: [...state.lines], shapes: [...state.shapes] });
                state.lines = redoState.lines
                state.shapes = redoState.shapes
            }
        },
        clearCanvas: (state) => {
            state.undoHistory.push({ lines: [...state.lines], shapes: [...state.shapes] }); // Save before clearing
            state.redoHistory = []; // Clear redo stack
            state.lines = [];
            state.shapes = [];
        },
        removeLineAt: (state, action) => {
            const { x, y } = action.payload
            state.lines = state.lines.filter((line) => {
                for (let i = 0; i < line.points.length; i += 2) {
                    const lineX = line.points[i]
                    const lineY = line.points[i + 1]
                    if (Math.abs(lineX - x) < 10 && Math.abs(lineY - y) < 10) {
                        return false
                    }
                }
                return true
            })
        },
        updateCurrentLine: (state, action) => {
            state.currentLine = action.payload;
        },
    },
});

export const { addLine, drawShape, undoAction, redoAction, clearCanvas, removeLineAt, updateCurrentLine } =
    drawingSlice.actions;

export default drawingSlice.reducer;
