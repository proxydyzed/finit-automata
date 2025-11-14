import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { FiniteAutomata, ErrorState, ExhaustiveRecognizer } from "../dst/export.js";
import { subsetConstruction, EmptySet } from "./subset-construction.js";

try {
  const nfa = new NondeterministicFiniteAutomata("n0");

  // NFA for the RE "a(b|c)"
  const n0 = nfa.start;
  const n1 = nfa.addVertex("n1");
  const n2 = nfa.addVertex("n2");
  const n3 = nfa.addVertex("n3");
  const n4 = nfa.addVertex("n4");
  const n5 = nfa.addVertex("n5");
  const n6 = nfa.addVertex("n6");
  const n7 = nfa.addVertex("n7");
  const n8 = nfa.addVertex("n8");
  const n9 = nfa.addVertex("n9");

  const a = nfa.addAlphabet("a");
  const b = nfa.addAlphabet("b");
  const c = nfa.addAlphabet("c");

  nfa.addEdge(a, n0, n1);
  nfa.addEdge(KnownMappings.epsilon, n1, n2);
  nfa.addEdge(KnownMappings.epsilon, n2, n3);
  nfa.addEdge(KnownMappings.epsilon, n2, n9);
  nfa.addEdge(KnownMappings.epsilon, n3, n4);
  nfa.addEdge(KnownMappings.epsilon, n3, n6);
  nfa.addEdge(b, n4, n5);
  nfa.addEdge(KnownMappings.epsilon, n5, n8);
  nfa.addEdge(c, n6, n7);
  nfa.addEdge(KnownMappings.epsilon, n7, n8);
  nfa.addEdge(KnownMappings.epsilon, n8, n3);
  nfa.addEdge(KnownMappings.epsilon, n8, n9);

  nfa.accepting.add(n9);
  // console.log(JSON.stringify(nfa, null, 4));
  // console.log(nfa.stringifyMappings());

  const data = subsetConstruction(nfa);
  const table = data.T;
  const entries = data.Q;

  // console.log(data);
  // console.log("Entries:", data.Q);
  // console.log(`Table{ rows: ${data.T.rows}, cols: ${data.T.cols} }:`, data.T.buffer);

  const dfa = makeDfa(nfa, entries, table, data["∑"]);
  const recognizer = new ExhaustiveRecognizer(dfa);
  console.log(dfa);
  console.log(recognizer.accepts("abcbbcbbcccbcb"));
} catch (error) {
  console.error(error);
}

function makeDfa(nfa, entries, table, alphabets) {
  const reversed = new Map(Array.from(nfa.alphabets, ([v, k]) => [k, v]));
  reversed.set(KnownMappings.epsilon, "∈");
  reversed.set(KnownMappings.sigma, "∑");

  const dfa = new FiniteAutomata()
  for (const [alpha, index] of alphabets) {
    dfa.alphabets.add(alpha);
  }

  dfa.start = entries.at(0)[0];
  dfa.states = new Set([ErrorState, dfa.start]);
  dfa.mappings.clear();

  for (const [state] of entries) {
    dfa.states.add(state);
    dfa.mappings.set(state, new Map());
  }

  for (const [q, states] of entries) {
    for (const state of states) {
      if (nfa.accepting.has(state)) {
        dfa.accepting.add(q);
      }
    }
  }

  let rowCount = 0;
  for (const row of table) {
    let colCount = 0;
    for (const { deref: state2 } of row) {
      if (state2 !== EmptySet) {
        const [state1] = entries.at(rowCount);
        const alpha = alphabets.at(colCount);

        // console.log(`${state1.description} + ${alpha} -> ${state2.description}`);
        dfa.mappings.get(state1).set(alpha, state2);
      }
      colCount++;
    }
    rowCount++;
  }

  return dfa;
}
