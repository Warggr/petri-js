import * as d3 from 'd3'

// MARK: Some constants.

const TRANSITION_SIDE = 30
const PLACE_RADIUS    = Math.sqrt(TRANSITION_SIDE * TRANSITION_SIDE / 2)

/**
 * Helper class to render any bipartite graph.
 */
export default class BipartiteGraphRenderer {
  onClickTransition = (_transition) => {};

  /**
   * Creates a BipartiteGraphRenderer.
   *
   * @param {HTMLElement} element - An SVG node the simulator will be rendered to.
   * @param {Array}       vertices
   * @param {Array}       edges
   * @param {boolean}     dragNodes - Whether nodes are drag-and-drop-able.
  */
  constructor(element, vertices, edges, dragNodes) {
    const svg     = d3.select(element)
    const width  = svg.node().getBoundingClientRect().width
    const height = svg.node().getBoundingClientRect().height

    // Build the arrow end marker. Note that arrows are drawn like that: ``-->-``. Hence we should draw
    // their source and target nodes over them, so as to hide the exceeding parts.
    svg.append('svg:defs').selectAll('marker')
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

    // Create arcs (before the nodes, so that the nodes are on top)
    const arcsGroup  = svg.append('g').attr('class', 'arcs')

    let arcs = arcsGroup.selectAll('g')
      .data(edges, (d) => d.id)

    arcs.exit().remove()
    const arcsEnter = arcs.enter().append('g')
      .attr('id', (edge) => edge.id)
    arcsEnter.append('line')
      .attr('stroke'      , (edge) => edge.color || 'black') // TODO: why are the arrow heads still always black?
      .attr('stroke-width', 1)
      .attr('marker-end'  , 'url(#end)')
    arcsEnter.filter((edge) => edge.label !== undefined && edge.label != '1').append('text')
      .text((edge) => edge.label)

    // Create nodes
    const nodesGroup = svg.append('g').attr('class', 'nodes')

    const nodesEnter = nodesGroup.selectAll('g')
      .data(vertices, (d) => d.id)
      .enter().append('g')
        .attr('id'   , (vertex) => vertex.id)
        .attr('class', (vertex) => vertex.type)

    const places = nodesEnter.filter('.place')
    places.append('circle')
      .attr('r'                 , PLACE_RADIUS)
      .attr('fill'              , 'rgb(255, 248, 220)')
      .attr('stroke'            , 'rgb(224, 220, 191)')
      .attr('stroke-width'      , '3px')
    places.append('text')
      .attr('text-anchor'       , 'left')
      .attr('alignment-baseline', 'central')
      .attr('dx', PLACE_RADIUS * 1.25)
      .text((place) => place.id)
    this.nodeMarkings = places.append('text')
      .attr('class'             , 'marking')
      .attr('text-anchor'       , 'middle')
      .attr('alignment-baseline', 'central')

    const transitions = nodesEnter.filter('.transition')
    if(dragNodes){ transitions.attr('cursor', 'pointer') }
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
    transitions.on('click', (t) => { this.onClickTransition(t) }) // TODO: why does just this.onClickTransition not work?

    // Create the force simulation.
    this.simulation = d3.forceSimulation()
      .force('link'   , d3.forceLink().id((d) => d.id).distance(50))
      .force('charge' , d3.forceManyBody())
      .force('center' , d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(TRANSITION_SIDE * 2))
      .on   ('tick'   , () => {
        nodesGroup.selectAll('g')
          .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
        arcsGroup.selectAll('g line')
          .attr('x1', (d) => d.source.x)
          .attr('y1', (d) => d.source.y)
          .attr('x2', (d) => d.target.x)
          .attr('y2', (d) => d.target.y)
        arcsGroup.selectAll('g text')
          .attr('x', (d) => (d.source.x + d.target.x) / 2)
          .attr('y', (d) => (d.source.y + d.target.y) / 2)
      })

    // Run the force simulation to space out places and transitions.
    this.simulation.nodes(vertices)
      .force('link').links(edges)

    if(dragNodes){
      nodesEnter
      .call(d3.drag()
        .on('start', ::this._handleDragStart)
        .on('drag' , ::this._handleDrag)
        .on('end'  , ::this._handleDragEnd))
    }
  }

  static fromPetriNetModel(model, element, dragNodes){
    // Adapt places and transitions data to d3. The goal is to create an array that contains all
    // vertices and another that contains all egdes, so that it'll be easier to handle them in the
    // force simulation later on.

    // vertices: [(id: String, type: String)]
    const places = model.places.map((place) => ({ id: place, type: 'place' }))
    const transitions = model.transitions
        .map((transition) => ({
          ...transition,
          id  : transition.name,
          type: 'transition',
        }))
    const vertices = transitions.concat(places)

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
        let result = preconditions.concat(postconditions)
        if(transition.inhibitors) {
          const inhibitors = (transition.inhibitors || [])
            .map((place) => ({
              id    : '!' + place + transition.name,
              source: place,
              target: transition.name,
              color : 'red',
            }))
          result = result.concat(inhibitors)
        }
        return result
      })
      .reduce((partialResult, e) => partialResult.concat(e))

    return new BipartiteGraphRenderer(element, vertices, edges, dragNodes);
  }

  /**
   * Set the current marking state.
   *
   * @param {PetriNetState} state - The new state
   * @param {string} _transition - The transition that caused the new state.
   *    This parameter is not used and is only for compatibility with the PetriNetView interface.
   */
  setState(state, _transition){
    this.nodeMarkings.text((p) => state[p.id])
  }

  _handleDragStart(d) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0.3).restart()
    }
    d.fx = d.x
    d.fy = d.y
  }

  _handleDrag(d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }

  _handleDragEnd(d) {
    if (!d3.event.active) {
      this.simulation.alphaTarget(0)
    }
    d.fx = null
    d.fy = null
  }
}
