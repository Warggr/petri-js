export type Node = string;

export type Transition = {
  name: string;
  preconditions: { [node: Node]: number };
  postconditions: { [node: Node]: number };
  inhibitors?: Node[];
}

type PetriNetModel = {
  nodes : Node[],
  transitions : Transition[],
}

export default PetriNetModel;

export type PetriNetState = {
  [node: Node]: number;
}
