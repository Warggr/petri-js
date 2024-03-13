export type Node = string;

export type Transition = {
  name: string;
  preconditions: { [node: Node]: number };
  postconditions: { [node: Node]: number };
  inhibitors: Node[];
}

type PetriNetState = {
  [node: Node]: number;
}

export default class PetriNetModel {
  places: Node[];
  transitions: Transition[];
  state: PetriNetState;
}
