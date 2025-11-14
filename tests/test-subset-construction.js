import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";

try {
  const nfa = new NondeterministicFiniteAutomata("q0");

  const q0 = nfa.start;
  const q1 = nfa.addVertex("q1");
  const q2 = nfa.addVertex("q2");
  const q3 = nfa.addVertex("q3");
  const q4 = nfa.addVertex("q4");

  const a = nfa.addAlphabet("a");
  const b = nfa.addAlphabet("b");

  nfa.addEdge(a, q0, q1);
  nfa.addEdge(KnownMappings.epsilon, q0, q3);
  nfa.addEdge(b, q1, q2);
  nfa.addEdge(KnownMappings.sigma, q2, q0);
  nfa.addEdge(KnownMappings.sigma, q3, q4);
  nfa.addEdge(b, q4, q3);

  // console.log(JSON.stringify(nfa, null, 4));
  // console.log(nfa.stringifyMappings());

  const data = subsetConstruction(nfa);
  console.log("Entries:", data.entries);
  console.log(`Table{ rows: ${data.table.rows}, cols: ${data.table.cols} }:`, data.table.buffer);
} catch (error) {
  console.error(error);
}

/**
 * @param {NondeterministicFiniteAutomata} nfa
 */
function subsetConstruction(nfa) {
  const reversed = new Map(Array.from(nfa.alphabets, ([v, k]) => [k, v]));
  reversed.set(KnownMappings.epsilon, "∈");
  reversed.set(KnownMappings.sigma, "∑");

  const table = new FixedColumnTable(nfa.alphabets.size);
  const qq = epsilonClosure(nfa, [nfa.start]);
  const Q = new Set(qq);
  const worklist = [qq];
  let worklistIndex = 0;

  while (worklist.length > worklistIndex) {
    const q = worklist.at(worklistIndex);
    worklistIndex++;

    // console.log("worklist", Array.from(q, s => s.description));
    
    let col = 0;
    const row = table.rows;
    table.allocRow();
    for (const index of nfa.alphabets.values()) {
      const d = deltas(nfa, q, index);
      const t = epsilonClosure(nfa, d);

      // console.log(`For "${reversed.get(index)}"\n`,
      //   "Delta", Array.from(d, s => s.description), "\n",
      //   "epsilon-closure", Array.from(t, s => s.description),
      // );

      const elem = table.get({ row: row, col: col });
      elem.deref = t;

      // if (!subsetOf(t, Q)) {
      //   addTo(t, Q);
      //   worklist.push(t);
      // }

      if (t.size > 0) {
        const alreadyProcessed = worklist.some(workset => {
          if (workset.size !== t.size) {
            return false;
          }

          for (const elem of workset) {
            if (!t.has(elem)) {
              return false;
            }
          }

          return true;
        });

        if (!alreadyProcessed) {
          worklist.push(t);
        }
      }
      col++;
    }

    // console.log("-- end --\n\n");
  }
  return {
    entries: worklist,
    table: table,
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
