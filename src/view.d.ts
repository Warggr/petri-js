import PetriNetModel from './model';

export declare class PetriNetView {
    constructor(
        element : HTMLElement,
        model : PetriNetModel,
        dragNodes : boolean | undefined, // TODO: default value is false, maybe I can somehow express it here
    );
    render() : undefined;
}
