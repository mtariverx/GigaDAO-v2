import {createStore, applyMiddleware, Store} from "redux";
import { Action, DaoReducer, DaoState } from "./DaoReducer";
import thunk from "redux-thunk";
export const store=createStore(DaoReducer, applyMiddleware(thunk));
