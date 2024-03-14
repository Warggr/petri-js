import { PetriNetState, Transition } from "./model";

export default interface PetriNetViewer {
    // The parameter transition is used (as of now) only by the Redux implementation,
    // which logs the history of used transitions
    setState(newState : PetriNetState, transition? : Transition) : void;
}
