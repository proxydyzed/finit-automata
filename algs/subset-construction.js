import {
  KnownMappings,
  FixedColumnTable,
  NondeterministicFiniteAutomata,
  DeterministicFiniteAutomata,
  WorkList,
} from "../dst/export.js";

export const EmptySet = Symbol("empty");

export function nfa2dfa(nfa) {
  if (!(nfa instanceof NondeterministicFiniteAutomata)) {
    throw new TypeError(`Expected NondeterministicFiniteAutomata, but got ${typeof nfa === "object" ? (nfa.constructor?.name ?? "null") : typeof nfa}`);
  }

  const subset = new Subset(nfa);
  const qq = epsilonClosure(nfa, [nfa.start]);
  subset.pushEntry(qq);

  for (const index of subset.worklist.iter()) {
    const entry = subset.entries[index];
    processEntry(subset, entry);
  }

  return subset;
}

function processEntry(subset, entry) {
  subset.table.rows++;
  for (const [, index] of subset.alphabets) {
    processAlpha(subset, entry, index);
  }
}

function processAlpha(subset, entry, index) {
  const images = deltas(subset.nfa, entry.states, index);
  const reachableImages = epsilonClosure(subset.nfa, images);

  if (reachableImages.size === 0) {
    subset.table.push(-1);
    return;
  }

  const alreadyProcessed = subset.entries.findIndex(entry => setsAreEqual(entry.states, reachableImages));
  if (alreadyProcessed !== -1) {
    subset.table.push(alreadyProcessed);
    return;
  }

  subset.table.push(subset.pushEntry(reachableImages));
}

class Subset {
  nfa;
  table;
  entries;
  worklist;
  alphabets;

  /**
   * @param {NondeterministicFiniteAutomata} nfa
   */
  constructor(nfa) {
    this.nfa = nfa;
    this.table = new FixedColumnTable(nfa.alphabets.size, () => 0);
    this.entries = Array.from({ length: 0 }, () => new Entry(
      // corresponding dfa state
      Symbol(""),
      // set of nfa states returned by epsilon-closure computation
      new Set(Array.from({ length: 0 }, () => Symbol("")))
    ));

    this.alphabets = Array.from(nfa.alphabets);
    this.worklist = new WorkList(Array.from({ length: 0 }, () => 0));
  }
  
  /**
   * @param {Set<symbol>} states
   */
  pushEntry(states) {
    const entryIndex = this.entries.length;
    const name = Symbol(`s{${entryIndex}}`);
    this.entries.push(new Entry(name, states));
    this.worklist.add(entryIndex);
    return entryIndex;
  }

  toDfa() {
    const start = this.entries[0].name;
    const dfa = new DeterministicFiniteAutomata(start);
    for (const [alpha, index] of this.alphabets) {
      dfa.alphabets.set(alpha, index);
    }

    for (const { name, states } of this.entries) {
      if (name !== start) {
        dfa.appendVertex(name);
      }

      inner: for (const state of states) {
        if (this.nfa.accepting.has(state)) {
          dfa.accepting.add(name);
          break inner;
        }
      }
    }

    for (let row = 0; row < this.table.rows; row++) {
      for (let col = 0; col < this.table.cols; col++) {
        const entryIndex = this.table.get({ row, col }).deref;
        if (entryIndex !== -1) {
          const index  = this.alphabets.at(col)[1];
          const state1 = this.entries.at(row).name;
          const state2 = this.entries.at(entryIndex).name;
          dfa.addEdge(index, state1, state2);
        }
      }
    }

    return dfa;
  }
};

class Entry {
  name;
  states;

  /**
   * Subset table entry
   * @param {symbol} name DFA state
   * @param {Set<symbol>} states corresponding NFA states
   */
  constructor(name, states) {
    this.name = name;
    this.states = states;
  }
  
  toString() {
    return `${this.name.description} => {${Array.from(this.states, state => state.description).join()}}`;
  }
}

/**
 * @param {NondeterministicFiniteAutomata} nfa
 * @param {ArrayLike<symbol>} states
 * @param {number} index
 */
function deltas(nfa, states, index) {
  const seen = new Set(Array.from({ length: 0 }, () => Symbol("")));
  for (const state1 of states) {
    let next = nfa.delta(state1, index) ?? [];
    if (index !== KnownMappings.epsilon) {
      const sigmaMapping = nfa.delta(state1, KnownMappings.sigma) ?? [];
      next = [...next, ...sigmaMapping];
    }
    for (const state2 of next) {
      seen.add(state2);
    }
  }
  return seen;
}

/**
 * @param {NondeterministicFiniteAutomata} nfa
 * @param {ArrayLike<symbol>} states
 */
function epsilonClosure(nfa, states) {
  const seen = new Set(Array.from({ length: 0 }, () => Symbol("")));
  const worklist = Array.from(states);
  let worklistIndex = 0;

  while (worklist.length > worklistIndex) {
    const state1 = worklist.at(worklistIndex);
    worklistIndex++;

    const next = nfa.delta(state1, KnownMappings.epsilon);
    seen.add(state1);
    
    if (next !== null) {
      for (const state2 of next) {
        if (!seen.has(state2)) {
          seen.add(state2);
          worklist.push(state2);
        }
      }
    }
  }
  
  return seen;
}

/**
 * @param {Set<any>} set1
 * @param {Set<any>} set2
 */
function subsetOf(set1, set2) {
  for (const elem of set1) {
    if (!set2.has(elem)) {
      return false;
    }
  }

  return true;
}

/**
 * @param {Set<any>} set1
 * @param {Set<any>} set2
 */
function addTo(set1, set2) {
  for (const elem of set1) {
    set2.add(elem);
  }
}

/**
 * @param {Set<any>} set1
 * @param {Set<any>} set2
 */
export function setsAreEqual(set1, set2) {
  if (set1.size !== set2.size) {
    return false;
  }

  for (const elem of set1) {
    if (!set2.has(elem)) {
      return false;
    }
  }

  return true;
}
