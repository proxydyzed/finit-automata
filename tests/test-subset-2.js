import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  ErrorState,
  ExhaustiveRecognizer,
  KnownMappings,
} from "../dst/export.js";
import {
  minimizeDfa,
  subsetConstruction,
} from "../algs/export.js";

try {
  const dfa = setup2();
  const recognizer = new ExhaustiveRecognizer(dfa);
  
  // console.assert(recognizer.accepts("a"),   `Failed to recognize "a"`);
  // console.log(dfa);
  // console.assert(recognizer.accepts("fie"),   `Failed to recognize "fie"`);
  // console.assert(recognizer.accepts("fee"),   `Failed to recognize "fee"`);
  // console.assert(!recognizer.accepts("fe"),   `Failed to recognize "fe"`);
  // console.assert(!recognizer.accepts("feee"), `Failed to recognize "feee"`);
  // console.assert(!recognizer.accepts("fii"),  `Failed to recognize "fii"`);

  // console.log(dfa);

  const context = minimizeDfa(dfa);
  console.log(context);
  console.log(context.partitions.join("\n"));
} catch (error) {
  console.error(error.stack);
}

/**
 * @param {DeterministicFiniteAutomata} dfa
 */
function _minimizeDfa(dfa) {
  const dfa2 = new DeterministicFiniteAutomata(Symbol("start"));

  const accepting = dfa.accepting;
  const nonAccepting = new Set();

  for (const state of dfa.states) {
    if (state !== ErrorState && !accepting.has(state)) {
      nonAccepting.add(state);
    }
  }

  let partition = [accepting, nonAccepting];
  for (const [alpha] of dfa.alphabets) {
    const newPartition = [];
    console.log(`alpha: ${alpha}`);

    for (const states of partition) {
      console.log(`states: {${Array.from(states, state => state.description)}}`);
      const partitionEntries = partition.map(states => ({ members: [], states: states }));
      const noPartitionMembers = [];

      for (const state of states) {
        const image = dfa.delta(state, alpha);
        console.log(`${state.description} + ${alpha} = ${image.description}`);
        if (image === ErrorState) {
          noPartitionMembers.push(state);
        } else {
          for (const entry2 of partitionEntries) {
            if (entry2.states.has(image)) {
              entry2.members.push(state);
            }
          }
        }
      }

      const newPartitionEntries = partitionEntries.filter(entry => entry.members.length > 0);
      // if one of them is zero, the partition is not divided
      const partitionIsDivided = newPartitionEntries.length * noPartitionMembers.length !== 0;
      for (const { members } of newPartitionEntries) {
        newPartition.push(new Set(members));
      }
      if (noPartitionMembers.length > 0) {
        newPartition.push(new Set(noPartitionMembers));
      }

      console.log("New Partition:", newPartition);
    }

    partition = newPartition;
  }

  console.log("Final:", partition);
}

function setup1() {
  const nfa = new NondeterministicFiniteAutomata("n0");

  // NFA for the RE "a(b|c)*"
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

  return subsetConstruction(nfa);
}

function setup2() {
  const dfa = new DeterministicFiniteAutomata("a");

  const na = dfa.start;
  const nb = dfa.addVertex("b");
  const nc = dfa.addVertex("c");
  const nd = dfa.addVertex("d");
  const ne = dfa.addVertex("e");
  const nf = dfa.addVertex("f");

  const a0 = dfa.addAlphabet("0");
  const a1 = dfa.addAlphabet("1");

  dfa.addEdge(a1, na, nc);
  dfa.addEdge(a0, na, nb);
  dfa.addEdge(a0, nb, na);
  dfa.addEdge(a1, nb, nd);
  dfa.addEdge(a0, nc, ne);
  dfa.addEdge(a1, nc, nf);
  dfa.addEdge(a0, nd, ne);
  dfa.addEdge(a1, nd, nf);
  dfa.addEdge(a0, ne, ne);
  dfa.addEdge(a1, ne, nf);
  dfa.addEdge(a0, nf, nf);
  dfa.addEdge(a1, nf, nf);

  dfa.accepting.add(nc);
  dfa.accepting.add(nd);
  dfa.accepting.add(ne);

  return dfa;
}

function setup3() {
  // NFA for RE "fee|fie"
  const dfa = new DeterministicFiniteAutomata(Symbol("s0"));

  const s0 = dfa.start;
  const s1 = dfa.addVertex("s1");
  const s2 = dfa.addVertex("s2");
  const s3 = dfa.addVertex("s3");
  const s4 = dfa.addVertex("s4");
  const s5 = dfa.addVertex("s5");

  const f = dfa.addAlphabet("f");
  const e = dfa.addAlphabet("e");
  const i = dfa.addAlphabet("i");

  dfa.addEdge(f, s0, s1);
  dfa.addEdge(e, s1, s2);
  dfa.addEdge(i, s1, s4);
  dfa.addEdge(e, s2, s3);
  dfa.addEdge(e, s4, s5);

  dfa.accepting.add(s3);
  dfa.accepting.add(s5);

  return dfa;
}
