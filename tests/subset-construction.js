import { FixedColumnTable } from "./tables.js";
import { KnownMappings } from "./nfa.js";

export const EmptySet = Symbol("empty");

/**
 * @param {NondeterministicFiniteAutomata} nfa
 */
export function subsetConstruction(nfa) {
  const table = new FixedColumnTable(nfa.alphabets.size);
  const alphabets = Array.from(nfa.alphabets);

  const qq = epsilonClosure(nfa, [nfa.start]);
  const Q = [[Symbol("d0"), new Set(qq)]];
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
        const alreadyProcessed = Q.find(([, states]) => setsAreEqual(states, t));
        if (typeof alreadyProcessed === "undefined") {
          const dfaState = Symbol(`d${Q.length}`);
          Q.push([dfaState, t]);
          worklist.push(t);
          elem.deref = dfaState;
        } else {
          elem.deref = alreadyProcessed[0];
        }
      }

      col++;
    }
  }

  return {
    Q: Q,
    T: table,
    "∑": alphabets.map(([k]) => k),
  };
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
function setsAreEqual(set1, set2) {
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
