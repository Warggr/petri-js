import PetriNetModel, { PetriNetState, Transition } from "./model";

export abstract class AbstractPetriNetController {
  onChangeState : (arg0: PetriNetState, arg1: Transition) => void = (_arg0, _arg1) => {};

  constructor(
    public readonly model : PetriNetModel,
    protected state : PetriNetState,
  ){
  }

  abstract isFireable(t : Transition): boolean;
  abstract fire(t : Transition) : void;
}

export default class PetriNetController extends AbstractPetriNetController {
  constructor(model : PetriNetModel, state : PetriNetState){
    super(model, state);
  }

  isFireable(t : Transition): boolean {
    if(Object.keys(t.preconditions).find((node) => this.state[node] < t.preconditions[node])) return false
    if(t.inhibitors && t.inhibitors.find((node) => this.state[node] > 0)) return false
    return true
  }

  fire(t : Transition) {
    for (const node in t.preconditions) {
      this.state[node] -= t.preconditions[node];
    }
    for (const node in t.postconditions) {
      this.state[node] += t.postconditions[node];
    }
    this.onChangeState(this.state, t)
  }
}
