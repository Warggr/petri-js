import * as d3 from 'd3'

// MARK: Some constants.

const TRANSITION_SIDE = 30
const PLACE_RADIUS    = Math.sqrt(TRANSITION_SIDE * TRANSITION_SIDE / 2)

// MARK: The PetriNet class.

/**
 * Helper class to render a Petri Net.
 *
 * This class holds the state of a Petri Net simulator, and renders its view.
 */
export default class PetriNetView {

  /**
   * Creates a Petri Net View.
   *
   * @param {HTMLElement} element - An SVG node the simulator will be rendered to.
   * @param {PetriNetModel} model   - The Petri Net model to simulate.
   * @param {Boolean}      dragNodes - Whether nodes are drag-and-drop-able.
  */
  constructor(element, model, dragNodes = false) {
    this.svg     = d3.select(element)
    const width  = this.svg.node().getBoundingClientRect().width
    const height = this.svg.node().getBoundingClientRect().height

    this.model = model
    this.dragNodes = dragNodes;
    // Build the arrow en marker. Note that arrows are drawn like that: ``-->-``. Hence we should draw
    // their source and target nodes over them, so as to hide the exceeding parts.
    this.svg.append('svg:defs').selectAll('marker')
      .data(['end']).enter()
      .append('svg:marker')
      .attr('id'          , String)
      .attr('refX'        , TRANSITION_SIDE)
      .attr('refY'        , 4)
      .attr('markerWidth' , 12)
      .attr('markerHeight', 12)
      .attr('orient'      , 'auto')
      .append('svg:path')
      .attr('d', 'M0,0 L0,8 L8,4 z')

    this.arcsGroup  = this.svg.append('g').attr('class', 'arcs')
    this.nodesGroup = this.svg.append('g').attr('class', 'nodes')

    // Create the force simulation.
    this.simulation = d3.forceSimulation()
      .force('link'   , d3.forceLink().id((d) => d.id).distance(50))
      .force('charge' , d3.forceManyBody())
      .force('center' , d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(TRANSITION_SIDE * 2))
      .on   ('tick'   , () => {
        this.nodesGroup.selectAll('g')
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        this.arcsGroup.selectAll('g line')
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y)
        this.arcsGroup.selectAll('g text')
          .attr('x', (d) => (d.source.x + d.target.x) / 2)
          .attr('y', (d) => (d.source.y + d.target.y) / 2)
      })
    this.render();
  }

  handleDragStart(d) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart()
    }
    d.fx = d.x
    d.fy = d.y
  }

  handleDrag(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }

  handleDragEnd(d) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0)
    }
    d.fx = null
    d.fy = null
  }

  render() {
    const model = this.model

    // Adapt places and transitions data to d3. The goal is to create an array that contains all
    // vertices and another that contains all egdes, so that it'll be easier to handle them in the
    // force simulation later on.

    // vertices: [(id: String, type: String)]
    const vertices = model.places
      .map((place) => ({ id: place, type: 'place' }))
      .concat(model.transitions
        .map((transition) => ({
          ...transition,
          id  : transition.name,
          type: 'transition',
        })))

    // edges: [(source: String, target: String, label: Model.Transition.Label)]
    const edges = model.transitions
      .map((transition) => {
        const preconditions = Object.keys(transition.preconditions)
          .map((place) => ({
            id    : place + transition.name,
            source: place,
            target: transition.name,
            label : transition.preconditions[place],
          }))
        const postconditions = Object.keys(transition.postconditions)
          .map((place) => ({
            id    : transition.name + place,
            source: transition.name,
            target: place,
            label : transition.postconditions[place],
          }))
        return preconditions.concat(postconditions)
      })
      .reduce((partialResult, e) => partialResult.concat(e))

    // Note that because d3 will mutate the data objects we'll bind to the vertices, we can't bind
    // the updated data as is. Instead, we should mutate the already bound objects, so that we can
    // preserve the positions and relations that were computed by the previous simulation run.
    const updatedVertices = this.nodesGroup.selectAll('g').data()
    for (const vertex of vertices) {
      const prev = updatedVertices.find((v) => v.id == vertex.id)
      if (typeof prev !== 'undefined') {
        for (const prop in vertex) {
          prev[prop] = vertex[prop]
        }
      } else {
        updatedVertices.push(vertex)
      }
    }

    // Draw new places and new transitions.
    let arcs = this.arcsGroup.selectAll('g')
      .data(edges, (d) => d.id)
    arcs.exit().remove()

    const arcsEnter = arcs.enter().append('g')
      .attr('id', (edge) => edge.id)
    arcsEnter.append('line')
      .attr('stroke'      , 'black')
      .attr('stroke-width', 1)
      .attr('marker-end'  , 'url(#end)')
    arcsEnter.filter((edge) => edge.label != '1').append('text')
      .text((edge) => edge.label)

    arcs = arcsEnter.merge(arcs)

    let nodes = this.nodesGroup.selectAll('g')
      .data(updatedVertices, (d) => d.id)

    const nodesEnter = nodes.enter().append('g')
      .attr('id'   , (vertex) => vertex.id)
      .attr('class', (vertex) => vertex.type)

    if(this.dragNodes){
      nodesEnter
      .call(d3.drag()
        .on('start', ::this.handleDragStart)
        .on('drag' , ::this.handleDrag)
        .on('end'  , ::this.handleDragEnd))
    }

    const places = nodesEnter.filter('.place')
    places.append('circle')
      .attr('r'                 , () => PLACE_RADIUS)
      .attr('fill'              , 'rgb(255, 248, 220)')
      .attr('stroke'            , 'rgb(224, 220, 191)')
      .attr('stroke-width'      , '3px')
    places.append('text')
      .attr('class'             , 'marking')
      .attr('text-anchor'       , 'middle')
      .attr('alignment-baseline', 'central')
    places.append('text')
      .attr('text-anchor'       , 'left')
      .attr('alignment-baseline', 'central')
      .attr('dx', PLACE_RADIUS * 1.25)
      .text((place) => place.id)

    const transitions = nodesEnter.filter('.transition')
      .attr('cursor'            , 'pointer')
    transitions.append('circle')
      .attr('r'                 , PLACE_RADIUS)
      .attr('fill'              , 'white')
    transitions.append('rect')
      .attr('width'             , TRANSITION_SIDE)
      .attr('height'            , TRANSITION_SIDE)
      .attr('x'                 , -TRANSITION_SIDE / 2)
      .attr('y'                 , -TRANSITION_SIDE / 2)
      .attr('fill'              , 'rgb(220, 227, 255)')
      .attr('stroke'            , 'rgb(169, 186, 255)')
      .attr('stroke-width'      , 3)
    transitions.append('text')
      .attr('text-anchor'       , 'middle')
      .attr('alignment-baseline', 'central')
      .text((transition) => transition.id)

    nodes = nodesEnter.merge(nodes)

    const marking = this.model.state;
    // Update place markings and transition states.
    nodes.filter('.place').select('.marking')
      .text((p) => marking[p.id])

    // Run the force simulation to space out places and transitions.
    this.simulation.nodes(updatedVertices)
      .force('link').links(edges)
  }

}
