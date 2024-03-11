import PetriNetView from 'petri-js'

// Create a new PetriNet view.
const model = {
  places     : [ 'p0', 'p1' ],
  transitions: [
    {
      name          : 't1',
      preconditions : { 'p0': 1 },
      postconditions: { 'p1': 2 },
    },
    {
      name          : 't0',
      preconditions : { 'p1': 1 },
      postconditions: { 'p0': 1 },
    },
  ],
  state: { 'p0': 1, 'p1': 0 },
}

const petrinet = new PetriNetView(document.getElementById('petrinet'), model, /*dragNodes=*/ true)
