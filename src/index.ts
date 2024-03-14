// .js because we're compiling everything to JS.
// See https://github.com/Microsoft/TypeScript/issues/16577
import PetriNetModel, { PetriNetState, Transition } from './model.js';
import BipartiteGraphRenderer from './renderer.js';
import PetriNetController, { AbstractPetriNetController } from './controller.js';
import PetriNetReduxWrapper from './reducers.js';
import PetriNetViewer from './view.js';

export { PetriNetModel, BipartiteGraphRenderer, PetriNetController, PetriNetReduxWrapper };

export default class PetriNet {
    renderer   : BipartiteGraphRenderer;
    view       : PetriNetViewer;
    controller : AbstractPetriNetController;

    constructor(model : PetriNetModel, startingState : PetriNetState){
        this.renderer   = BipartiteGraphRenderer.fromPetriNetModel(model, document.getElementById('petrinet'), /*dragNodes=*/ true)
        this.view       = new PetriNetReduxWrapper(this.renderer, startingState)
        this.controller = new PetriNetController(model, startingState)

        this.controller.onChangeState = (newState : PetriNetState, cause : Transition) => this.view.setState(newState, cause);
        this.view.setState(startingState, { name: 'INIT', preconditions: {}, postconditions: {} }); // TODO fix this
        this.renderer.onClickTransition = (transition : Transition) => {
            if(this.controller.isFireable(transition)) this.controller.fire(transition);
        }
    }
}
