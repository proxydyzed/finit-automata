import {
  nfa2dfa,
  minimizeDfa,
} from "../algs/export.js";
import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  KnownMappings,
  ExhaustiveRecognizer,
} from "../dst/export.js";
import {
  buildString,
} from "../tests/setups.js";

try {
  const nfa = new NondeterministicFiniteAutomata("n0");

  buildString(nfa, "!");
  buildString(nfa, "+");
  buildString(nfa, "-");
  buildString(nfa, "*");
  buildString(nfa, "/");

  buildString(nfa, "=");

  buildString(nfa, "==");
  buildString(nfa, "!=");
  buildString(nfa, "+=");
  buildString(nfa, "-=");
  buildString(nfa, "*=");
  buildString(nfa, "/=");

  buildString(nfa, "<");
  buildString(nfa, ">");
  buildString(nfa, "<=");
  buildString(nfa, ">=");

  const alphabetVertex = nfa.addVertex("alphabets");

  for (const alpha of "abcdefghijklmnopqrstuvwxyz") {
    const index1 = nfa.addAlphabet(alpha);
    nfa.addEdge(index1, nfa.start, alphabetVertex);
    nfa.addEdge(index1, alphabetVertex, alphabetVertex);

    const index2 = nfa.addAlphabet(alpha.toUpperCase());
    nfa.addEdge(index2, nfa.start, alphabetVertex);
    nfa.addEdge(index2, alphabetVertex, alphabetVertex);
  }

  const numberVertex = nfa.addVertex("numbers");

  for (const alpha of "0123456789") {
    const index = nfa.addAlphabet(alpha);
    nfa.addEdge(index, nfa.start, numberVertex);
    nfa.addEdge(index, numberVertex, numberVertex);
    nfa.addEdge(index, alphabetVertex, alphabetVertex);
  }

  {
    const index = nfa.addAlphabet("_");
    nfa.addEdge(index, nfa.start, alphabetVertex);
    nfa.addEdge(index, alphabetVertex, alphabetVertex);
  }

  nfa.accepting.add(alphabetVertex);
  nfa.accepting.add(numberVertex);

  const subset = nfa2dfa(nfa);
  const { table, entries } = subset;

  const subsetNameMapping = new Map(Array.from({ length: 0 }, () => [
    // dfa state (in subset)
    Symbol(""),
    // nfa state
    Symbol(""),
  ]));
  for (const entry of entries) {
    for (const state of entry.states) {
      subsetNameMapping.set(entry.name, state);
    }
  }


  const minimizedNameMapping = new Map(Array.from({ length: 0 }, () => [
    // nfa state
    Symbol(""),
    // dfa state (minimized)
    Symbol(""),
  ]));
  const context = minimizeDfa(subset.toDfa());

  // console.log(context);

  for (const [state, partitionIndex] of context.names) {
    const partition = context.partitions.at(partitionIndex);
    minimizedNameMapping.set(subsetNameMapping.get(state), partition.name);
  }

  console.log(subsetNameMapping);
  console.log(minimizedNameMapping);

  // console.log(context.toDfa());

  // const dfa2 = minimizeDfa(dfa);

  // // console.log("Begin:", stringifyFA(nfa));
  // // console.log("End;\n");
  // // console.log("Begin:", stringifyFA(dfa));
  // // console.log("End;");
  // console.log("Begin:", stringifyFA(dfa2));
  // console.log("End;");

  // // console.log(dfa2);

  // const tests = [
  //   { input: "=", output: true },
  //   { input: "==", output: true },
  //   { input: "===", output: false },
  //   { input: "=+", output: false },
  //   { input: "+=", output: true },
  //   { input: "newhile", output: true },
  //   { input: "new", output: true },
  //   { input: "wen", output: true },
  // ];

  // const recognizer = new ExhaustiveRecognizer(dfa2);

  // for (const { input, output } of tests) {
  //   console.assert(output === recognizer.accepts(input), `Failed on "${input}"`);
  // }
  // console.log("Done");
} catch (error) {
  console.error(error);
}

function stringifyFA(fa) {
  return `\
Intermediate: DeterministicFiniteAutomata${String(fa.start)}
states: Set(${fa.states.size}){ ${Array.from(fa.states, state => state.description).join(", ")} }
accepting: Set(${fa.accepting.size}){ ${Array.from(fa.accepting, state => state.description)} }
mappings
${fa.stringifyMappings().trimEnd()}`;
}
