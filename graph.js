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
      fa.mappings.set(state, new Map());
      map.set(alpha, state);
    }
    
    this.fa.accepting.add(state);
    return state;
  }

  appendVertex(name) {
    const state = Symbol(String(name));
    this.fa.states.add(state);
    this.fa.mappings.set(state, new Map());
    return new StateGraph(this.fa, state);
  }

  addEdge(alpha, state) {
    this.fa.alphabets.add(alpha);
    this.map.set(alpha, state);
  }

  addEdges(edges, state) {
    for (const alpha of edges) {
      this.addEdge(alpha, state);
    }
  }

  accept() {
    this.fa.accepting.add(this.start);
  }
};
