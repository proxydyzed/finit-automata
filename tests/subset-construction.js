import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { DeterministicFiniteAutomata } from "./dfa.js";
import { FiniteAutomata, ErrorState } from "../dst/export.js";

export const EmptySet = Symbol("empty");

/**
 * @param {NondeterministicFiniteAutomata} nfa
 */
export function subsetConstruction(nfa) {
  const table = new FixedColumnTable(nfa.alphabets.size);
  const alphabets = Array.from(nfa.alphabets);

  const qq = epsilonClosure(nfa, [nfa.start]);
  const entries = [new Entry(Symbol("d0"), new Set(qq))];
  const worklist = [qq];
  let worklistIndex = 0;

  while (worklist.length > worklistIndex) {
    const q = worklist.at(worklistIndex);
    worklistIndex++;

    let   col = 0;
    const row = table.allocRow();
    for (const [, index] of alphabets) {
      const d = deltas(nfa, q, index);
      const t = epsilonClosure(nfa, d);
      const elem = table.get({ row: row, col: col });

      if (t.size === 0) {
        elem.deref = EmptySet;
      } else {
        const alreadyProcessed = entries.find(({ states }) => setsAreEqual(states, t));
        if (typeof alreadyProcessed === "undefined") {
          const dfaState = Symbol(`d${entries.length}`);
          entries.push(new Entry(dfaState, t));
          worklist.push(t);
          elem.deref = dfaState;
        } else {
          elem.deref = alreadyProcessed.name;
        }
      }

      col++;
    }
  }

  return makeDfa(nfa, entries, table, alphabets);
}

/**
 * @param {NondeterministicFiniteAutomata} nfa
 * @param {Entry[]} entries
 * @param {FixedColumnTable} table
 * @param {[string, number][]} alphabets
 * 
 */
function makeDfa(nfa, entries, table, alphabets) {
  const reversed = new Map(Array.from(nfa.alphabets, ([v, k]) => [k, v]));
  reversed.set(KnownMappings.epsilon, "∈");
  reversed.set(KnownMappings.sigma, "∑");

  const dfa = new DeterministicFiniteAutomata(entries[0].name);
  for (const [alpha, index] of alphabets) {
    dfa.alphabets.set(alpha, index);
  }

  for (const { name: state } of entries) {
    dfa.appendVertex(state);
  }

  // console.log(entries.map(String).join("\n"));

  for (const { name: q, states } of entries) {
    inner: for (const state of states) {
      if (nfa.accepting.has(state)) {
        dfa.accepting.add(q);
        break inner;
      }
    }
  }

  let rowCount = 0;
  for (const row of table) {
    let colCount = 0;
    for (const { deref: state2 } of row) {
      if (state2 !== EmptySet) {
        const { name: state1 } = entries.at(rowCount);
        const [alpha, index] = alphabets.at(colCount);
        
        // console.log(`${state1.description} + ${alpha} -> ${state2.description}`);
        dfa.addEdge(index, state1, state2);
      }
      colCount++;
    }
    rowCount++;
  }

  return dfa;
}

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

/**
 * @param {Set<any>} set1
 * @param {Set<any>} set2
 */
export function unionOfSets(set1, set2) {
  return new Set([...set1, ...set2]);
}
