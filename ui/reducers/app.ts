import { createInitialState, type AppAction, type AppState } from "../state";

export function reduceAppState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "redisUrlChanged":
      return { ...state, redisUrl: action.value, message: "" };
    case "pollingIntervalChanged":
      return { ...state, pollingIntervalMs: action.value };
    case "messageSet":
      return { ...state, message: action.message };
    case "connected":
      return { ...state, redisUrl: action.redisUrl, isConnected: true };
    case "disconnected":
      return createInitialState(false);
    default:
      return state;
  }
}
