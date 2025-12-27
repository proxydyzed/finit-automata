import {
  whatType,
} from "../utils/export.js";

import {
  NFA,
  ErrorState,
  StartState,
  AlphabetReference
} from "./nfa.js";

export class NFABuilder {
  nfa;
  tokens = new Map();

  constructor(nfa) {
    if (!(nfa instanceof NFA)) {
      throw new TypeError(`Expected NFA, but got ${whatType(nfa)}`);
    }

    this.nfa = nfa;
  }

  addString(str, tokenName) {
    const stateIndex = buildString(this.nfa, str);
    this.tokens.set(stateIndex, tokenName);
  }

  addSentinelString(sentinel, failState, eofState) {
    // console.log("fail-state:", this.nfa.states.at(failState));
    // console.log("eof-state:", this.nfa.states.at(eofState));

    let stateIndex1 = StartState;
    for (const c of sentinel) {
      const stateIndex2 = this.nfa.addVertex(`sentinel(${c})`);
      const alphaIndex = this.nfa.addAlpha(c);

      this.nfa.addEdge(alphaIndex,             stateIndex1, stateIndex2);
      this.nfa.addEdge(AlphabetReference.fail, stateIndex2, failState);
      this.nfa.addEdge(AlphabetReference.eof,  stateIndex2, eofState);

      stateIndex1 = stateIndex2;
    }

    return stateIndex1;
  }

  addEdges(edges, state1, state2) {
    if (typeof state1 !== "number") {
      throw new TypeError(`Expected argument "state1" to be number, but got ${whatType(state1)}`);
    }
    if (typeof state2 !== "number") {
      throw new TypeError(`Expected argument "state2" to be number, but got ${whatType(state2)}`);
    }

    for (const edge of edges) {
      const alphaIndex = this.nfa.addAlpha(edge);
      this.nfa.addEdge(alphaIndex, state1, state2);
    }
  }

  addVertex(name, callback) {
    const vertex = this.nfa.addVertex(name);
    if (typeof callback !== "function") {
      return vertex;
    }

    return callback(vertex);
  }

  accept(stateIndex, tokenName) {
    this.nfa.accepting.add(stateIndex);
    this.tokens.set(stateIndex, tokenName);
  }
}

export function buildString(nfa, str) {
  if (!(nfa instanceof NFA)) {
    throw new TypeError(`Expected NFA, but got ${whatType(nfa)}`);
  }

  if (typeof str !== "string") {
    throw new TypeError(`Expected string, but got ${whatType(str)}`);
  }

  let stateIndexA = StartState;
  for (const alpha of str) {
    const alphaIndex = nfa.addAlpha(alpha);
    const stateIndexB = nfa.addVertex(`str{${str}, ${alpha}, ${nfa.states.length}}`);
    nfa.addEdge(alphaIndex, stateIndexA, stateIndexB);
    stateIndexA = stateIndexB;
  }

  nfa.accepting.add(stateIndexA);
  return stateIndexA;
}
