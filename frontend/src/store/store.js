import { configureStore } from "@reduxjs/toolkit";
import drawingReducer from "./drawingSlice"
import { socket } from "../lib/socket"

export const store = configureStore({
    reducer: {
        drawing: drawingReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: {
                extraArgument: { socket }
            }
        })
})