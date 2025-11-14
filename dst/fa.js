export const ErrorState = Symbol("error");

export class FiniteAutomata {
  start;
  states;
  mappings;
  alphabets;
  accepting;

  constructor() {
    this.start = Symbol("start");
    this.states = new Set([this.start, ErrorState]);

    // JavaScript engine type-inference shenaniguns
    const map = new Map(Array.from({ length: 0 }, () => ["", Symbol("")]));
    this.mappings = new Map([[this.start, map]]);
    this.alphabets = new Set(Array.from({ length: 0 }, () => ""));
    this.accepting = new Set(Array.from({ length: 0 }, () => Symbol("")));
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
