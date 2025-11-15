import {
  ErrorState,
  KnownMappings,
  KnownMappingsSize,
} from "../dst/export.js";

export class DeterministicFiniteAutomata {
  start;
  states;
  mappings;
  alphabets;
  accepting;

  constructor(name) {
    this.start = typeof name === "symbol" ? name : Symbol(String(name));
    this.states = new Set([ErrorState, this.start]);

    // JavaScript engine type-inference shenaniguns
    const map = new Map(Array.from({ length: 0 }, () => [0, Symbol("")]));
    this.mappings = new Map([[this.start, map]]);
    this.alphabets = new Map(Array.from({ length: 0 }, () => ["", 0]));
    this.accepting = new Set(Array.from({ length: 0 }, () => Symbol("")));
  }

  /**
   * ~    c
   * s(0) -> δ(s, c)
   * 
   * @param {symbol} state {s|s ∈ FinitAutomata.states}
   * @param {number} index {c|c ∈ FinitAutomata.alphabets}
   */
  delta(state, index) {
    if (typeof state !== "symbol") {
      throw new TypeError(`Expected argument "state" to be <symbol>, but got ${typeof state === "object" ? (state.constructor?.name ?? "null") : typeof state}`);
    }
    if (typeof index === "string") {
      index = this.addAlphabet(index);
    } else if (typeof index !== "number") {
      throw new TypeError(`Expected argument "index" to be <string|number>, but got ${typeof index === "object" ? (index.constructor?.name ?? "null") : typeof index}`);
    }

    if (state === ErrorState) {
      return ErrorState;
    }

    const mapping = this.mappings.get(state);
    if (mapping.has(index)) {
      // if (mapping.has(KnownMappings.sigma)) {
      //   return [...mapping.get(index), ...mapping.get(KnownMappings.sigma)];
      // }
      return mapping.get(index);
    }
    // if (mapping.has(KnownMappings.sigma)) {
    //   return mapping.get(KnownMappings.sigma);
    // }
    return ErrorState;
  }
  
  addAlphabet(alpha) {
    if (typeof alpha !== "string") {
      throw new TypeError(`Expected argument "alpha" to be <string>, but got ${typeof alpha === "object" ? (alpha.constructor?.name ?? "null") : typeof state}`);
    }
    if (this.alphabets.has(alpha)) {
      return this.alphabets.get(alpha);
    }
    
    const index = this.alphabets.size + KnownMappingsSize;
    this.alphabets.set(alpha, index);
    return index;
  }
  
  addVertex(name) {
    const state = Symbol(String(name));
    this.states.add(state);
    this.mappings.set(state, new Map());
    return state;
  }
  
  appendVertex(state) {
    if (typeof state !== "symbol") {
      throw new TypeError(`Expected argument "state" to be symbol, but got ${typeof state === "object" ? (state.constructor?.name ?? "null") : typeof state}`);
    }
    this.states.add(state);
    this.mappings.set(state, new Map());
  }
  
  addEdge(index, state1, state2) {
    if (typeof index !== "number") {
      throw new TypeError(`Expected argument "index" to be number, but got ${typeof index === "object" ? (index.constructor?.name ?? "null") : typeof index}`);
    }
    if (typeof state1 !== "symbol") {
      throw new TypeError(`Expected argument "state1" to be symbol, but got ${typeof state1 === "object" ? (state1.constructor?.name ?? "null") : typeof state1}`);
    }
    if (typeof state2 !== "symbol") {
      throw new TypeError(`Expected argument "state2" to be symbol, but got ${typeof state2 === "object" ? (state2.constructor?.name ?? "null") : typeof state2}`);
    }

    this.mappings.get(state1).set(index, state2);
  }

  toJSON() {
    const { start, states, mappings, alphabets, accepting } = this;
    const stateMap = new Map(Array.from(states, function(state, index) {
      return [state, index];
    }));

    return {
      start: stateMap.get(start),
      error: stateMap.get(ErrorState),
      states: Array.from(states, function(state) {
        return state.description;
      }),
      mappings: Array.from(mappings, function([state, map]) {
        return {
          key: stateMap.get(state),
          value: Array.from(map, function([k, v]) {
            return {
              key: k,
              value: stateMap.get(v),
            };
          }),
        };
      }),
      alphabets: Array.from(alphabets),
      accepting: Array.from(accepting, function(state) {
        return stateMap.get(state);
      }),
    };
  }
  
  stringifyMappings() {
    const reversed = new Map(Array.from(this.alphabets, ([v, k]) => [k, v]));
    let str = "";
    for (const [state1, map] of this.mappings) {
      for (const [index, state2] of map) {
        let alpha;
        rev: switch (index) {
          case KnownMappings.epsilon: {
            alpha = " ∈";
            break rev;
          }
          case KnownMappings.sigma: {
            alpha = " ∑";
            break rev;
          }
          default: {
            alpha = `"${reversed.get(index)}"`;
            break rev;
          }
        }
        
        str += `${state1.description.padEnd(4, " ")} + ${alpha.padEnd(4, " ")} => ${state2.description}\n`;
      }
    }
    
    return str;
  }
};
