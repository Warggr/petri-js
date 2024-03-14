import {
  AnyAction, Reducer,
  combineReducers,
} from 'redux'
import undoable from 'redux-undo'
import { PetriNetState, Transition } from "./model"

export enum ActionType {
  INIT = '@@petri-js/INIT',
  FIRE = '@@petri-js/FIRE',
}

export class InitAction implements AnyAction {
  type: ActionType.INIT; // using literals to get a discriminated union
  payload: { state: PetriNetState };
}

export class FireAction implements AnyAction {
  type: ActionType.FIRE;
  payload: {
    nextState : PetriNetState,
    transition : Transition,
  }
}

export type Action = InitAction | FireAction;

export function init(state : PetriNetState) : InitAction {
  return {
    type   : ActionType.INIT,
    payload: { state },
  }
}

// marking is a synonym for (PetriNet)State
export function marking(state : PetriNetState = {}, action : Action): PetriNetState {
  switch (action.type) {
  case ActionType.INIT:
    return action.payload.state
  case ActionType.FIRE:
    return action.payload.nextState
  default:
    return state
  }
}

function sequence(state : string[] = [], action : Action): string[] {
  switch (action.type) {
  case ActionType.INIT:
    return []
  case ActionType.FIRE:
    return state.concat([
      action.payload.transition.name,
    ])
  default:
    return state
  }
}

export type StateAndStateHistory = {
  marking: PetriNetState;
  sequence: Transition[];
}

const reducers : Reducer<StateAndStateHistory, Action> = combineReducers({
  marking: undoable(marking),
  sequence: undoable(sequence),
})

export default reducers;
