
import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "@reduxjs/toolkit";

const initialState = {
    lines: [],              //  Stores drawn lines
    shapes: [],             //  Stores shapes (circle, rect, etc.)
    texts: [],              //  Stores text elements
    undoHistory: [],        //  Stack to track previous states (for undo)
    redoHistory: [],        //  Stack to track undone states (for redo)
    currentLine: [],        //  Temporarily holds the line being drawn
    currentText: null,      //  Temporarily holds text being edited
    currentShape: null,     //  Temporarily holds shape being drawn
    selectedShapeId: null,  //  ID of currently selected shape
    selectedTextId: null,
    zoom: 1,                //  Current zoom level
    stageX: 0,              //  X scroll position of canvas
    stageY: 0,              //  Y scroll position of canvas
    showGrid: true,         // Toggle to show/hide canvas gride
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
};

const drawingSlice = createSlice({
    name: "drawing",
    initialState,
    reducers: {
        // ----- LINE & SHAPE LOGIC -----
        // Adds a new line to the canvas
        addLine: (state, action) => {
            state.undoHistory.push(getSnapshot(state));     // Save current state for undo
            state.lines.push(action.payload);               // Add new line
            state.redoHistory = [];                         // Clear redo stack after new action
        },

        // Updates the currently drawing line (real-time drawing)
        updateCurrentLine: (state, action) => {
            state.currentLine = action.payload;
        },

        setLiveLines: (state, action) => {
            state.liveLines = action.payload
        },

        // Adds a shape with a unique ID
        drawShape: (state, action) => {
            const shape = { id: nanoid(), fill: state.currentFillColor, ...action.payload }
            state.undoHistory.push(getSnapshot(state))
            state.shapes.push(shape)
            state.redoHistory = []
        },

        // Temporarily sets the current shape being drawn (used during interaction)
        updateCurrentShape: (state, action) => {
            state.currentShape = action.payload
        },

        setLiveShapes: (state, action) => {
            state.liveShapes = action.payload
        },

        // Clears the currently drawn shape once finalized
        clearCurrentShape: (state) => {
            state.currentShape = null
        },

        // ----- UNDO / REDO / CLEAR -----
        // Undo last action by restoring previous state
        undoAction: (state) => {
            if (state.undoHistory.length > 0) {
                const prevState = state.undoHistory.pop()       //  Get previous snapshot
                state.redoHistory.push(getSnapshot(state));     //  Save current for redo
                restoreSnapshot(state, prevState)               //  Restore to previous
            }
        },

        // Redo the last undone action
        redoAction: (state) => {
            if (state.redoHistory.length > 0) {
                const redoState = state.redoHistory.pop();      //  Get next state
                state.undoHistory.push(getSnapshot(state));     //  Save current for undo
                restoreSnapshot(state, redoState)               //  Restore redo state
            }
        },

        // Clears the canvas and saves the current snapshot to undoHistory
        clearCanvas: (state) => {
            state.undoHistory.push(getSnapshot(state)); // Save before clearing
            state.redoHistory = []; // Clear redo stack
            state.lines = [];
            state.shapes = [];
            state.texts = [];
        },

        // ----- LINE ERASER -----
        // Removes a segment of a line near a specific (x, y) point
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

                        // Only keep points that are not close to the erase point
                        if (Math.abs(lineX - x) >= threshold || Math.abs(lineY - y) >= threshold) {
                            newPoints.push(lineX, lineY);
                        }
                    }
                    // Return updated line only if it still has more than one point
                    return newPoints.length > 2 ? { ...line, points: newPoints } : null;
                })
                .filter(Boolean);   //  Remove null entries
        },

        // ----- TEXT LOGIC -----
        // Adds a text element to the canvas
        addText: (state, action) => {
            const text = {
                ...action.payload,
                fill: state.currentFillColor,
            }
            state.undoHistory.push(getSnapshot(state))
            state.texts.push(text)
            state.redoHistory = []
        },

        setSelectedTextId: (state, action) => {
            state.selectedTextId = action.payload;
        },

        // Sets the currently editing text element
        updateCurrentText: (state, action) => {
            state.currentText = action.payload
        },

        // Finalizes and commits the current text to the canvas
        commitCurrentText: (state) => {
            if (state.currentText) {
                state.undoHistory.push(getSnapshot(state))
                state.texts.push(state.currentText)
                state.currentText = null
                state.redoHistory = []
            }
        },

        // Updates the content of a specific text element
        updateTextContent: (state, action) => {
            state.undoHistory.push(getSnapshot(state));
            const { id, ...updates } = action.payload;
            const target = state.texts.find(t => t.id === id);
            if (target) {
                Object.assign(target, updates);
            }
        },

        updateTextFontStyle: (state, action) => {
            const { id, fontStyle } = action.payload
            const text = state.texts.find((t) => t.id === id)
            if (text) text.fontStyle = fontStyle
        },

        updateTextFontFamily: (state, action) => {
            const { id, fontFamily } = action.payload
            const text = state.texts.find((t) => t.id === id)
            if (text) text.fontFamily = fontFamily
        },

        updateTextFontSize: (state, action) => {
            const { id, fontSize } = action.payload
            const text = state.texts.find(t => t.id === id)
            if (text) text.fontSize = fontSize
        },

        deselectText: (state) => {
            state.selectedTextId = null
        },

        setSelectedTool: (state, action) => {
            state.selectedTool = action.payload;
        },

        setFontFamily: (state, action) => {
            state.fontFamily = action.payload
        },

        setFontStyle: (state, action) => {
            state.fontStyle = action.payload
        },

        // ------- POSITION UPDATES -------
        // Updates position of a line by translating each point
        updateLinePosition: (state, action) => {
            const { index, x, y } = action.payload
            const line = state.lines[index]
            if (line) {
                const oldPoints = [...line.points]
                const newPoints = []
                state.undoHistory.push(getSnapshot(state));
                for (let i = 0; i < oldPoints.length; i += 2) {
                    newPoints.push(oldPoints[i] + x, oldPoints[i + 1] + y)
                }
                state.redoHistory = [];
                line.points = newPoints
            }
        },

        // Updates shape's X and Y position
        updateShapePosition: (state, action) => {
            const { index, x, y } = action.payload;
            if (state.shapes[index]) {
                state.undoHistory.push(getSnapshot(state));
                state.shapes[index].x = x;
                state.shapes[index].y = y;
                state.redoHistory = [];
            }
        },

        // Updates the position of a specific text element
        updateTextPosition: (state, action) => {
            const { id, x, y } = action.payload
            const text = state.texts.find(t => t.id === id)
            if (text) {
                state.undoHistory.push(getSnapshot(state));
                text.x = x
                text.y = y
                state.redoHistory = [];
            }
        },

        // ------- SHAPE TRANSFORM -------
        // Sets the currently selected shape (used for transforms)
        setSelectedShapeId: (state, action) => {
            state.selectedShapeId = action.payload
        },

        // Updates transformation (position/scale/rotation) of a shape by ID
        updateShapeTransform: (state, action) => {
            const { id, updatedShape } = action.payload;
            const index = state.shapes.findIndex(shape => shape.id === id);
            if (index === -1) return;
            state.undoHistory.push(getSnapshot(state));
            state.shapes[index] = { ...state.shapes[index], ...updatedShape };
            state.redoHistory = [];
        },

        // ------- FILL COLOR -------
        setFillColor: (state, action) => {
            state.currentFillColor = action.payload
        },

        resetFillColor: (state) => {
            state.currentFillColor = "transparent"
        },

        updateShapeFill: (state, action) => {
            const { id, fill } = action.payload
            const shape = state.shapes.find(s => s.id === id)
            if (shape) {
                shape.fill = fill
                state.undoHistory.push(getSnapshot(state))
                state.redoHistory = []
            }
        },

        updateTextFill: (state, action) => {
            const { id, fill } = action.payload
            const text = state.texts.find(t => t.id === id)
            if (text) {
                text.fill = String(fill)
                state.undoHistory.push(getSnapshot(state))
                state.redoHistory = []
            }
        },

        // ------- VIEWPORT CONTROLS -------
        // Sets the zoom level of the canvas
        setZoom: (state, action) => {
            state.zoom = action.payload
        },

        // Sets the X/Y position of the stage (canvas viewport)
        setStagePosition: (state, action) => {
            state.stageX = action.payload.x
            state.stageY = action.payload.y
        },

        // Toggles the background grid visibility
        toggleGrid: (state) => {
            state.showGrid = !state.showGrid
        },

        setStrokeWidth: (state, action) => {
            state.currentStrokeWidth = action.payload
        },

        setRoomInfo: (state, action) => {
            const { roomId, createdBy, users } = action.payload
            state.roomId = roomId
            state.createdBy = createdBy
            state.users = users
        },
        updateUsers: (state, action) => {
            state.users = action.payload
        },
        clearRoom: (state) => {
            state.roomId = null
            state.createdBy = ""
            state.users = []
        },
        updateCreatedBy: (state, action) => {
            state.createdBy = action.payload || "";
        },
    },
});

export const updateTextFontStyleAndEmit = ({ id, fontStyle }) => (dispatch, _, { socket }) => {
    dispatch(updateTextFontStyle({ id, fontStyle }));
    socket.emit("text:updateFontStyle", { id, fontStyle });
};

export const updateTextFontFamilyAndEmit = ({ id, fontFamily }) => (dispatch, getState, { socket }) => {
    dispatch(updateTextFontFamily({ id, fontFamily }));
    socket.emit("text:updateFontFamily", { id, fontFamily });
};

export const updateTextFontSizeAndEmit = ({ id, fontSize }) => (dispatch, _, { socket }) => {
    dispatch(updateTextFontSize({ id, fontSize }));
    socket.emit("text:updateFontSize", { id, fontSize });
};

// ------- SNAPSHOT HELPERS -------

// Creates a shallow copy of drawable elements for undo/redo
function getSnapshot(state) {
    return {
        lines: state.lines.map(line => ({ ...line })),
        shapes: state.shapes.map(shape => ({ ...shape })),
        texts: state.texts.map(text => ({ ...text }))
    }
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
    removeLineAt,
    updateCurrentLine,
    addText,
    setSelectedTextId,
    updateCurrentText,
    commitCurrentText,
    updateTextContent,
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
} = drawingSlice.actions;

export default drawingSlice.reducer;
