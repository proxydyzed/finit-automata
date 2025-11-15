import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { DeterministicFiniteAutomata } from "./dfa.js";
import { FiniteAutomata, ErrorState, ExhaustiveRecognizer } from "../dst/export.js";
import { subsetConstruction, EmptySet, setsAreEqual, unionOfSets } from "./subset-construction.js";

try {
  const nfa = setup1();
  // console.log(JSON.stringify(nfa, null, 4));
  // console.log(nfa.stringifyMappings());

  const dfa = subsetConstruction(nfa);
  // const dfa = setup3();
  const recognizer = new ExhaustiveRecognizer(dfa);

  // console.log(dfa);
  // console.assert(recognizer.accepts("fie"),   `Failed to recognize "fie"`);
  // console.assert(recognizer.accepts("fee"),   `Failed to recognize "fee"`);
  // console.assert(!recognizer.accepts("fe"),   `Failed to recognize "fe"`);
  // console.assert(!recognizer.accepts("feee"), `Failed to recognize "feee"`);
  // console.assert(!recognizer.accepts("fii"),  `Failed to recognize "fii"`);

  const dfa2 = minimizeDfa(dfa);
} catch (error) {
  console.error(error);
}


/*

for (alpha of alphabets):
  iteration(f):
    for (part of partition):
      iteration({ s3, s5 }):
        for (state of { s3, s5 }):
          s3 + f = 0;
          s5 + f = 0;
        end;
      end;
      iteration({ s0, s1, s2, s4 }):
        for (state of { s0, s1, s2, s4 }):
          s0 + f = s1;
          s1 + f = 0;
          s2 + f = 0;
          s4 + f = 0;
        end;
      end;
    end;
  end;

  iteration(e):
    for (part of partition):
      iteration({ s3, s5 }):
        for (state of { s3, s5 }):
          s3 + e = 0;
          s5 + e = 0;
        end;
      end;
      iteration({ s0, s1, s2, s4 }):
        for (state of { s0, s1, s2, s4 }):
          s0 + e = 0;
          s1 + e = s2; // partition 1
          s2 + e = s3; // partition 0
          s4 + e = s5; // partition 0
        end;
      end;
    end;
  end;
end;

alpha(f):
  for (part of partion):
    iteration(1):
      s3 + f = 0
      s5 + f = 0
    end;

    iteration(2):
      s0 + f = s1
      s1 + f = 0
      s2 + f = 0
      s4 + f = 0
    end;
  end;
end;

alpha(e):
  for (part of partition):
    iteration(1):
      s3 + e = 0
      s5 + e = 0
    end;

    iteration(2):
      s0 + e = 0
      s1 + e = s2
      s2 + e = s3 // offending
      s4 + e = s5 // offending
    end;

    iteration(n):
      image := part[n] + alpha(@)
      for (part2 of partition):
        if (part2.has(image)):
          partitionNames.get(part2).push(image);
        end;
      end;
    end;
  end;
end;


*/

function minimizeDfa(dfa) {
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

  return nfa;
}

function setup2() {
  const nfa = new NondeterministicFiniteAutomata("a");

  const na = nfa.start;
  const nb = nfa.addVertex("b");
  const nc = nfa.addVertex("c");
  const nd = nfa.addVertex("d");
  const ne = nfa.addVertex("e");
  const nf = nfa.addVertex("f");

  const a0 = nfa.addAlphabet("0");
  const a1 = nfa.addAlphabet("1");

  nfa.addEdge(a1, na, nc);
  nfa.addEdge(a0, na, nb);
  nfa.addEdge(a0, nb, na);
  nfa.addEdge(a1, nb, nd);
  nfa.addEdge(a0, nc, ne);
  nfa.addEdge(a1, nc, nf);
  nfa.addEdge(a0, nd, ne);
  nfa.addEdge(a1, nd, nf);
  nfa.addEdge(a0, ne, ne);
  nfa.addEdge(a1, ne, nf);
  nfa.addEdge(a0, nf, nf);
  nfa.addEdge(a1, nf, nf);

  nfa.accepting.add(nc);
  nfa.accepting.add(nd);
  nfa.accepting.add(ne);

  return nfa;
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

function intersection(set1, set2) {
  const set = new Set();
  for (const elem of set1) {
    if (set2.has(elem)) {
      set.add(elem);
    }
  }

  return set;
}

function subtraction(set1, set2) {
  const set = new Set(set1);
  for (const elem of set2) {
    set.delete(elem);
  }

  return set;
}
