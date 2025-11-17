import {
  nfa2dfa,
  minimizeDfa,
} from "../algs/export.js";
import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  ErrorState,
  KnownMappings,
  ExhaustiveRecognizer,
} from "../dst/export.js";
import {
  buildString,
} from "../tests/setups.js";

function convertToScanner(nfa) {
  const subset = nfa2dfa(nfa);
  const dfa1 = subset.toDfa();
  const context = minimizeDfa(dfa1);
  const dfa2 = context.toDfa();

  const nameMapping = new Map(Array.from({ length: 0 }, () => [
    // nfa accepting state
    Symbol(""),
    // dfa state (minimized and accepting)
    Symbol(""),
  ]));

  for (const entry of subset.entries) {
    for (const state of entry.states) {
      if (nfa.accepting.has(state)) {
        nameMapping.set(state, context.partitions.at(context.names.get(entry.name)).name);
      }
    }
  }

  const nameBucket = new Map();
  for (const [state, partitionName] of nameMapping) {
    if (nameBucket.has(partitionName)) {
      nameBucket.get(partitionName).push(state);
    } else {
      nameBucket.set(partitionName, [state]);
    }
  }

  // console.log(nameMapping);
  // console.log(nameBucket);

  let str = "";
  const reversedAlphabets = new Map(Array.from(dfa2.alphabets, ([k, v]) => [v, k]));
  for (const state of dfa2.states) {
    if (state === ErrorState) {
      continue;
    }

    str += `state ${state.description}:\n`;
    const mapping = dfa2.mappings.get(state);
    const clusters = clusterChars(Array.from(mapping, ([k]) => reversedAlphabets.get(k)));
    const codePointBuckets = bucketCluster(clusters);
    console.log({ clusters: Array.from(clusters.keys(), c => String.fromCodePoint(c)) });
    console.log({ bucket: codePointBuckets.map(codePointBucket => codePointBucket.map(c => String.fromCodePoint(c))) })

  }

  console.log(str);
}

try {
  convertToScanner(rl());
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

function rl() {
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

  buildString(nfa, "=>");

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

  return nfa;
}

/**
 * @param {string[]} iter 
 */
function clusterChars(iter, fixOrder = false) {
  const mapping = new Map(Array.from({ length: 0 }, () => [
    // character code point
    0,
    // clusters array index
    0,
  ]));

  const entries = Array.from({ length: 0 }, () => 0);
  let uniqueIndex = 0;

  for (const alpha of iter) {
    const codePoint = alpha.codePointAt(0);
    const c1 = codePoint - 1;
    const c2 = codePoint + 1;

    if (mapping.has(c1)) {
      const merge1 = mapping.get(c1);
      if (mapping.has(c2)) {
        const merge2 = mapping.get(c2);
        entries[merge1] = entries[merge2];
      }

      mapping.set(codePoint, merge1);
    } else if (mapping.has(c2)) {
      const merge2 = mapping.get(c2);
      mapping.set(codePoint, merge2);
    } else {
      // const cluster = { deref: Symbol(`s${entries.length}`), alpha, codePoint };
      const entry = uniqueIndex;
      uniqueIndex++;

      mapping.set(codePoint, entries.length);
      entries.push(entry);
    }
  }

  if (fixOrder) {
    const seen = new Set();
    return new Map(Array.from(mapping, ([k, v]) => [k, seen.add(entries[v]).size - 1]));
  }

  return new Map(Array.from(mapping, ([k, v]) => [k, entries[v]]));
}

function bucketCluster(mapping) {
  const bucket = new Map();
  for (const [k, v] of mapping) {
    const entry = v;
    if (bucket.has(entry)) {
      bucket.get(entry).push(k);
    } else {
      bucket.set(entry, [k]);
    }
  }

  return Array.from(bucket.values());
}
