import { FiniteAutomata } from "./fa.js";

export class StateGraph {
  fa;
  start;
  map;
  
  /**
   * @param {FiniteAutomata} fa
   * @param {symbol} start
   */
  constructor(fa, start) {
    this.fa = fa;
    this.start = start;

    // thanks to how the data is organized, this can never fail
    // #<FinitAutomata>.mappings will always have every state (except ErrorState)
    this.map = this.fa.mappings.get(start);
  }

  /**
   * @param {string} str
   */
  appendString(str) {
    const fa = this.fa;
    let state = this.start;
    
    for (const alpha of str) {
      if (!fa.alphabets.has(alpha)) {
        fa.alphabets.add(alpha);
      }
      
      const map = fa.mappings.get(state);
      if (map.has(alpha)) {
        state = map.get(alpha);
        continue;
      }
      
      state = Symbol(String(fa.states.size - 1));
      fa.states.add(state);

      // make sure the new state has a corresponding mapping
      fa.mappings.set(state, new Map());
      map.set(alpha, state);
    }
    
    this.fa.accepting.add(state);
    return state;
  }

  /**
   * @param {string} name
   */
  appendVertex(name) {
    const state = Symbol(String(name));
    this.fa.states.add(state);

    // make sure the new state has a corresponding mapping
    this.fa.mappings.set(state, new Map());
    return new StateGraph(this.fa, state);
  }

  /**
   * @param {string} alpha
   * @param {symbol} state
   */
  addEdge(alpha, state) {
    this.fa.alphabets.add(alpha);
    this.map.set(alpha, state);
  }

  /**
   * @param {string} alpha
   */
  hasEdge(alpha) {
    return this.map.has(alpha);
  }

  /**
   * Caller must ensure there exists an edge
   * 
   * @param {string} alpha
   */
  getVertex(alpha) {
    return new StateGraph(this.fa, this.map.get(alpha));
  }

  /**
   * @param {Array<string>} edges
   * @param {symbol} state
   */
  addEdges(edges, state) {
    for (const alpha of edges) {
      this.addEdge(alpha, state);
    }
  }

  accept() {
    this.fa.accepting.add(this.start);
  }
};
