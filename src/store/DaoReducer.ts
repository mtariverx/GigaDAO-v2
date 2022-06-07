import * as pic from "./../pic/pic";

export interface DaoState {
  dao: pic.Dao;
}
const initialState = {
  dao: {},
};
export type Action = { type: "SET_DAO"; payload: pic.Dao };
export const DaoReducer = (state: DaoState = initialState, action: Action) => {
  switch (action.type) {
    case "SET_DAO": {
      return { ...state, dao: { ...action.payload } };
    }
    default:
      return state;
  }
};
