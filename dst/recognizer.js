import { ErrorState } from "./fa.js";

const DEBUG = false;

// simple recognizer.
// exhausts the input string completely.
// does not match part of the string,
// pattern must consume the whole string.
export class ExhaustiveRecognizer {
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
      const state2 = this.fa.delta(state, alpha);
      if (DEBUG) {
        console.log(`"${state.description}" + "${alpha}" => "${state2.description}"`);
      }

      if (state2 === ErrorState) {
        return ErrorState;
      }
      
      state = state2;
    }

    return state;
  }
};

// token recognizer
// splits the input string into tokens.
// matches a specific part of the source
// and returns a matching token every call
// to <TokenRecognizer>.next().
export class TokenRecognizer {
  fa;
  index;
  source;

  /**
   * @param {FiniteAutomata} fa
   * @param {string} source
   */
  constructor(fa, source) {
    this.fa = fa;
    this.index = 0;
    this.source = source;
  }

  next() {
    let state = this.fa.start;
    let capturingState = null;
    let capturingIndex = this.index;
    let startIndex = this.index;

    while (this.index < this.source.length) {
      const alpha = this.source.at(this.index);
      this.index++;

      state = this.fa.delta(state, alpha);

      s: switch (state) {
        case ErrorState: {
          if (capturingState === null) {
            // we didn't capture any accepting state but
            // hit an error state, report the error
            throw new InvalidCharError("Unknown charecter", this.index - 1);
          }

          // otherwise, we have something to return
          this.index = capturingIndex;
          return new Token(capturingState, startIndex, capturingIndex);
        }

        case this.fa.start: {
          // reset the index
          startIndex = this.index;
          break s;
        }

        default: {
          // capture the state if it's in <FiniteAutomata>.accepting
          if (this.fa.accepting.has(state)) {
            capturingState = state;
            capturingIndex = this.index;
          }

          break s;
        }
      }
    }

    if (capturingState === null) {
      // we didn't capture any accepting state but
      // reached the end of input
      throw new InvalidCharError("Unexpected end of input", this.index);
    }

    // otherwise, we have something to return
    this.index = capturingIndex;
    return new Token(capturingState, startIndex, capturingIndex);
  }
};

export class Token {
  state;
  start;
  end;

  /**
   * @param {symbol} state
   * @param {number} start
   * @param {number} end
   */
  constructor(state, start, end) {
    this.state = state;
    this.start = start;
    this.end = end;
  }
};

export class InvalidCharError extends Error {
  index;

  constructor(message, index) {
    super(message);
    this.index = index;
  }
};