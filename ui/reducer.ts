import { reduceAppState } from "./reducers/app";
import { reduceJobState } from "./reducers/jobs";
import { reduceQueueState } from "./reducers/queues";
import type { AppAction, AppState } from "./state";

export { createInitialState } from "./state";
export type { AppAction, AppState } from "./state";

export function reducer(state: AppState, action: AppAction): AppState {
  return reduceJobState(
    reduceQueueState(reduceAppState(state, action), action),
    action,
  );
}
