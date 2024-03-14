import { Store, createStore, createLogger, applyMiddleware } from 'redux'
import { ActionCreators } from 'redux-undo'
import reducers, { StateAndStateHistory } from './actions'
import * as actions from './actions'
import { PetriNetState, Transition } from './model'
import PetriNetViewer from './view';

/**
 * Uses Redux to remember the state of the model over time.
 * This is a decorator: it implements the PetriNetViewer interface,
 * but also contains a viewer
 */
export default class PetriNetReduxWrapper implements PetriNetViewer {
  store : Store<StateAndStateHistory>;

  constructor(
    private wrapped : PetriNetViewer,
    state : PetriNetState, // TODO: do we absolutely need to provide a state?
    options = { enableLogging: false }
  ) {
    // Create the redux store.
    this.store = options.enableLogging
      ? createStore(reducers, applyMiddleware(createLogger({ collapsed: true })))
      : createStore(reducers)
    this.store.subscribe(::this._setState)
    this.store.dispatch(actions.init(state))
    this.store.dispatch(ActionCreators.clearHistory())
  }

  get state() : PetriNetState { return this.store.getState().marking.present }

  protected _setState(){
    // not setting transition because
    // 1. there's no guarantee that the new state has been set by this transition, rather than by an undo()
    // 2. only Redux should need the parameter anyway, and you're not supposed to chain two Redux decorators
    this.wrapped.setState(this.state)
  }

  setState(state : PetriNetState, transition? : Transition) {
    const action : actions.Action = {
      type   : actions.ActionType.FIRE,
      payload: { transition, nextState : state }
    }
    this.store.dispatch(action);
  }

  /** Returns the sequence of transition fired so far. */
  sequence() : Transition[] {
    return this.store.getState().sequence.present
  }

  /** Undo the last transition firing. */
  undo() {
    this.store.dispatch(ActionCreators.undo())
  }

  /** Redo the last transition firing. */
  redo() {
    this.store.dispatch(ActionCreators.redo())
  }
}
