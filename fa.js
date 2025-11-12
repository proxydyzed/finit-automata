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
    
    const map = new Map([["", this.start]]);
    this.mappings = new Map([[this.start, map]]);

    this.alphabets = new Set([["", -1]]);
    this.accepting = new Set([ErrorState]);

    map.clear();
    this.alphabets.clear();
    this.accepting.clear();
  }

  /**
   * @param {symbol} state
   * @param {string} alpha
   */
  delta(state, alpha) {
    if (state === ErrorState) {
      return ErrorState;
    }

    return this.mappings.get(state).get(alpha) ?? ErrorState;
  }

  // /**
  //  * @param {symbol} state
  //  * @param {string} alpha
  //  */
  // δ(state, alpha) {
  //   return this.delta(state, alpha);
  // }

  toJSON() {
    return {
      start: String(this.start),
      states: [...this.states].map(state => state.description),
      mappings: Object.fromEntries(
        [...this.mappings.entries()]
          .map(([state, map]) => [state.description, Object.fromEntries(
            [...map.entries()].map(([k, v]) => [k, v.description])
          )])
      ),
      alphabets: [...this.alphabets],
      accepting: [...this.accepting.values()].map(state => state.description),
    };
  }
};
