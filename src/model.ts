export type Node = string;

export class Transition {
  name: string;
  preconditions: { [node: Node]: number };
  postconditions: { [node: Node]: number };
}

export class PetriNetState {
  [node: Node]: number;
}

export default class PetriNetModel {
  places: Node[];
  transitions: Transition[];
  state: PetriNetState;
};
