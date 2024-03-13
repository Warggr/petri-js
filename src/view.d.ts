import PetriNetModel, { Node, Transition } from './model';

type Vertex = {
    id : string,
    type : string,
}

type Edge = {
    id : string,
}

export declare class BipartiteGraphRenderer {
    onClickTransition: (transition: Transition) => void;
    onClickNode: (node: Node) => void;

    constructor(
        element : HTMLElement,
        nodes : Vertex[],
        arcs : Edge[],
        dragNodes? : boolean, // TODO: default value is false, maybe I can somehow express it here
    );

    static fromPetriNetModel(
        model : PetriNetModel,
        element : HTMLElement,
        dragNodes? : boolean,
    ) : BipartiteGraphRenderer;
}
