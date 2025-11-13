export const ErrorState = Symbol("error");

export class FiniteAutomata {
  start;
  states;
  mappings;
  alphabets;
  accepting;

  // JavaScript engine type-inference shenaniguns
  constructor() {
    this.start = Symbol("start");
    this.states = new Set([this.start, ErrorState]);
    
    const map = new Map([["_", this.start]]);
    this.mappings = new Map([[this.start, map]]);

    this.alphabets = new Set(["_"]);
    this.accepting = new Set([ErrorState]);

    map.clear();
    this.alphabets.clear();
    this.accepting.clear();
  }

  /**
   *      c
   * s(0) -> δ(s, c)
   * 
   * @param {symbol} state {s|s ∈ FinitAutomata.states}
   * @param {string} alpha {c|c ∈ FinitAutomata.alphabets}
   */
  delta(state, alpha) {
    if (state === ErrorState) {
      return ErrorState;
    }

    return this.mappings.get(state).get(alpha) ?? ErrorState;
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
};
