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

function clusterChars(iter) {
  const bucket = new Map(Array.from({ length: 0 }, () => [
    // character code point
    0,
    // clusters array index
    0,
  ]));

  const clusters = Array.from({ length: 0 }, () => ({ deref: Symbol("") }));

  for (const alpha of iter) {
    const codePoint = alpha.codePointAt(0);
    const c1 = codePoint - 1;
    const c2 = codePoint + 1;

    if (bucket.has(c1)) {
      const merge1 = bucket.get(c1);
      if (bucket.has(c2)) {
        const merge2 = bucket.get(c2);
        clusters.at(merge1).deref = clusters.at(merge2).deref;
      }

      bucket.set(codePoint, merge1);
    } else if (bucket.has(c2)) {
      const merge2 = bucket.get(c2);
      bucket.set(codePoint, merge2);
    } else {
      const cluster = { deref: Symbol(`s${clusters.length}`), alpha, codePoint };
      bucket.set(codePoint, clusters.length);
      clusters.push(cluster)
    }
  }

  return { clusters, bucket };
}

function convertToScanner(dfa, names) {
  // console.log("DFA:", { start: dfa.start, states: dfa.states, accepting: dfa.accepting });
  // console.log("Alphabets:", dfa.alphabets);
  console.log(names);
  const { clusters, bucket } = clusterChars(dfa.alphabets.keys());
  console.log(clusters);
  const reverseBucket = new Map();
  for (const [codePoint, clusterIndex] of bucket) {
    const cluster = clusters.at(clusterIndex)
    if (reverseBucket.has(cluster.deref)) {
      reverseBucket.get(cluster.deref).push(codePoint);
    } else {
      reverseBucket.set(cluster.deref, [codePoint]);
    }
  }

  // console.log(bucket);
  console.log(Array.from(reverseBucket, ([sym, codes]) => `${sym.description.padEnd(3, " ")} => [ ${codes.sort((a, b) => a > b ? 1 : -1).map(code => `'${String.fromCharCode(code)}'`).join(", ")} ]`).join("\n"));
}

try {
  const nfa = new NondeterministicFiniteAutomata("n0");

  buildString(nfa, "(");
  buildString(nfa, ")");
  buildString(nfa, "{");
  buildString(nfa, "}");
  buildString(nfa, "[");
  buildString(nfa, "]");

  buildString(nfa, ":");
  buildString(nfa, ";");

  buildString(nfa, "?");

  buildString(nfa, "!");
  buildString(nfa, "+");
  buildString(nfa, "-");
  buildString(nfa, "*");
  buildString(nfa, "/");
  buildString(nfa, ",");
  buildString(nfa, ".");

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

  {
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
  }

  const subset = nfa2dfa(nfa);
  const subsetNameMapping = new Map(Array.from({ length: 0 }, () => [
    // dfa state (in subset)
    Symbol(""),
    // nfa state
    Symbol(""),
  ]));

  for (const entry of subset.entries) {
    for (const state of entry.states) {
      subsetNameMapping.set(entry.name, state);
    }
  }

  const context = minimizeDfa(subset.toDfa());
  const minimizedNameMapping = new Map(Array.from({ length: 0 }, () => [
    // nfa state
    Symbol(""),
    // dfa state (minimized)
    Symbol(""),
  ]));

  for (const [state, partitionIndex] of context.names) {
    const partition = context.partitions.at(partitionIndex);
    minimizedNameMapping.set(subsetNameMapping.get(state), partition.name);
  }

  // console.log(subsetNameMapping);
  // console.log(minimizedNameMapping);

  convertToScanner(context.toDfa(), minimizedNameMapping);

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
