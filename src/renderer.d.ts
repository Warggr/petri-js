import PetriNetModel, { Node, Transition, PetriNetState } from './model';
import PetriNetViewer from './view';

type Vertex = {
    id : string,
    type : string,
}

type Edge = {
    id : string,
}

declare class BipartiteGraphRenderer implements PetriNetViewer {
    onClickTransition: (transition: Transition) => void;

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

    setState(newState: PetriNetState, transition: Transition): void;
}

export default BipartiteGraphRenderer;
