import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { subsetConstruction } from "./subset-construction.js";

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

  const dfa = subsetConstruction(nfa);
  console.log(dfa);
  // console.log("Entries:", data.Q);
  // console.log(`Table{ rows: ${data.T.rows}, cols: ${data.T.cols} }:`, data.T.buffer);
} catch (error) {
  console.error(error);
}
