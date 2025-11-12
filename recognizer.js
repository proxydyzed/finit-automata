import { ErrorState } from "./fa.js";

export class Recognizer {
  fa;
  
  /**
   * @param {FiniteAutomata} fa
   */
  constructor(fa) {
    this.fa = fa;
  }

  /**
   * @param {string} str
   */
  accepts(str) {
    const state = this.recognize(str);
    return this.fa.accepting.has(state);
  }

  /**
   * @param {string} str
   */
  recognize(str) {
    let state = this.fa.start;
    for (const alpha of str) {
      state = this.fa.delta(state, alpha);
      if (state === ErrorState) {
        return ErrorState;
      }
    }

    return state;
  }
}
