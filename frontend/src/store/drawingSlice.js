
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    lines: [],
    undoHistory: [],
    redoHistory: [],
    currentLine: [],
};

const drawingSlice = createSlice({
    name: "drawing",
    initialState,
    reducers: {
        addLine: (state, action) => {
            state.undoHistory.push([...state.lines]); // Save current state for undo
            state.lines.push(action.payload); // Add new line
            state.redoHistory = []; // Clear redo stack after new action
        },
        undoAction: (state) => {
            if (state.lines.length > 0) {
                state.redoHistory.push([...state.lines]); // Save current state for redo
                state.lines = state.undoHistory.pop() || []; // Restore previous state
            }
        },
        redoAction: (state) => {
            if (state.redoHistory.length > 0) {
                const redoState = state.redoHistory.pop();
                if (redoState) {
                    state.undoHistory.push([...state.lines]); // Save current state for undo
                    state.lines = redoState; // Apply redo state
                }
            }
        },
        clearCanvas: (state) => {
            state.undoHistory.push([...state.lines]); // Save before clearing
            state.redoHistory = []; // Clear redo stack
            state.lines = [];
        },
        updateCurrentLine: (state, action) => {
            state.currentLine = action.payload;
        },
    },
});

export const { addLine, undoAction, redoAction, clearCanvas, updateCurrentLine } =
    drawingSlice.actions;

export default drawingSlice.reducer;
