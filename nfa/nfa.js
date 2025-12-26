export const ErrorState = -1;
export const StartState = 0;

export const AlphabetReference = {
  __proto__: null,
  epsilon: 0,
  sigma: 1,
  fail: 2,
  eof: 3,
};

export const AlphabetOffset = 4;

export function alphaIndexIsRef(alphaIndex) {
  return AlphabetOffset > alphaIndex;
}

export class NFA {
  states;
  mappings;
  alphabets;
  accepting;

  constructor(name) {
    this.states = [String(name)];
    const mapping = new Map(Array.from({ length: 0 }, () => [
      // alphabet index @alphaIndex
      0,
      // nfa state index array @stateIndex [stateB]
      Array.from({ length: 0 }, () => 0),
    ]));
    this.mappings = new Map([
      [
        // the start state is always at 0 @stateIndex [stateA]
        StartState,
        // corresponding mapping @mapping
        mapping,
      ]
    ]);
    this.alphabets = new Map(Array.from({ length: 0 }, () => [
      // alphabet char @alpha
      '',
      // alphabet index @alphaIndex
      0,
    ]));
    this.accepting = new Set(Array.from({ length: 0 }, () =>
      // accepting state index @stateIndex [stateA/stateB]
      0,
    ));
  }

  delta(stateIndex, alphaIndex) {
    if (typeof stateIndex !== "number") {
      throw new TypeError(`Expected argument "stateIndex" to be number, but got ${whatType(stateIndex)}`);
    }

    if (typeof alphaIndex !== "number") {
      throw new TypeError(`Expected argument "alphaIndex" to be number, but got ${whatType(alphaIndex)}`);
    }

    if (stateIndex === ErrorState) {
      return null;
    }

    // every state must have a mapping, so this is safe to use without null checking
    const mapping = this.mappings.get(stateIndex);
    if (mapping.has(alphaIndex)) {
      return mapping.get(alphaIndex);
    }

    return null;
  }

  addAlpha(alpha) {
    if (typeof alpha !== "string") {
      throw new TypeError(`Expected argument "alpha" to be string, but got ${whatType(alpha)}`);
    }

    if (this.alphabets.has(alpha)) {
      return this.alphabets.get(alpha);
    }

    const alphaIndex = this.alphabets.size + AlphabetOffset;
    this.alphabets.set(alpha, alphaIndex);
    return alphaIndex;
  }

  addVertex(name) {
    const stateIndex = this.states.length;
    this.states.push(String(name));
    this.mappings.set(stateIndex, new Map());
    return stateIndex;
  }

  addEdge(alphaIndex, stateIndexA, stateIndexB) {
    const mapping = this.mappings.get(stateIndexA);
    if (mapping.has(alphaIndex)) {
      mapping.get(alphaIndex).push(stateIndexB);
    } else {
      mapping.set(alphaIndex, [stateIndexB]);
    }
  }
}

export function whatType(value) {
  if (typeof value === "object") {
    if (value === null) {
      return "null";
    }

    return value.constructor?.name ?? "@unknown";
  }

  return typeof value;
}
