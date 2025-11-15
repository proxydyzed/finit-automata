import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { FiniteAutomata, ErrorState, ExhaustiveRecognizer } from "../dst/export.js";
import { subsetConstruction, EmptySet, setsAreEqual, unionOfSets } from "./subset-construction.js";

try {
  const nfa = setup1();
  // console.log(JSON.stringify(nfa, null, 4));
  // console.log(nfa.stringifyMappings());

  const dfa = subsetConstruction(nfa);
  const recognizer = new ExhaustiveRecognizer(dfa);

  console.log(dfa);
  console.log(recognizer.accepts("01000"));

  const dfa2 = minimizeDfa(dfa);
} catch (error) {
  console.error(error);
}

function minimizeDfa(dfa) {
  const dfa2 = new FiniteAutomata();

  const accepting = dfa.accepting;
  const nonAccepting = new Set();

  for (const state of dfa.states) {
    if (state !== ErrorState && !accepting.has(state)) {
      nonAccepting.add(state);
    }
  }

  const partition = [accepting, nonAccepting];
  const worklist = [accepting, nonAccepting];
  let worklistIndex = 0;

  while (worklist.length > worklistIndex) {
    const workset = worklist.at(worklistIndex);
    worklistIndex++;

    for (const alpha of dfa.alphabets) {
      const X = new Set();
      for (const state of dfa.states) {
        const imageState = dfa.delta(state, alpha);
        if (imageState !== ErrorState && workset.has(imageState)) {
          X.add(state);
        }
      }

      console.log(X);
    }
  }
}
//   const partition = new Set([accepting, nonAccepting]);
//   const worklist  = [accepting, nonAccepting];
//   let worklistIndex = 0;

//   while (worklist.length > worklistIndex) {
//     const workset = worklist.at(worklistIndex);
//     worklistIndex++;

//     // partion has one or lesser states, thee is no chance of inconsistency
//     if (workset.size < 2) {
//       continue;
//     }

//     for (const alpha of dfa.alphabets) {
//       const image = new Set();
//       const reverseImage = new Map();
//       for (const state of workset) {
//         const deltaState = dfa.delta(state, alpha);
//         image.add(deltaState);
//         reverseImage.set(deltaState, state);
//       }

//       // const image = new Set(Array.from(workset, state => dfa.delta(state, alpha)));
//       q: for (const part of partition) {
//         const part1 = new Set(Array.from(part).filter(p =>  image.has(p)));
//         const part2 = new Set(Array.from(part).filter(p => !image.has(p)));

//         if (part1.size > 0 && part2.size > 0) {

//         }
//       }

//     }
//   }
//   console.log(partition);
// }

//   let   partition = new Set([dfa.accepting, nonAccepting]);
//   const nextP     = new Set([dfa.accepting, nonAccepting]);
//   const worklist  = [dfa.accepting, nonAccepting];
//   let worklistIndex = 0;

//   const dfaStates = Array.from(dfa.states);
//   while (worklist.length > worklistIndex) {
//     const s = worklist.at(worklistIndex);
//     worklistIndex++;
//     if (s === null) {
//       continue;
//     }

//     for (const c of dfa.alphabets) {
//       console.log(dfa.alphabets)
//       const image = new Set(dfaStates.filter(state => s.has(dfa.delta(state, c))));
//       part: for (const q of partition) {
//         const q1 = intersection(q, image);
//         const q2 = subtraction(q, q1);


//         if (q1.size !== 0 && q2.size !== 0) {
//           inner: for (const elem of partition) {
//             if (setsAreEqual(elem, q)) {
//               partition.delete(elem);
//               break inner;
//             }
//           }

//           inner: for (const elem of nextP) {
//             if (setsAreEqual(elem, q)) {
//               nextP.delete(elem);
//               break inner;
//             }
//           }

//           nextP.add(q1);
//           nextP.add(q2);

//           const index = worklist.findIndex(workset => setsAreEqual(workset, q));
//           if (index !== -1) {
//             // removes q; adds q1 and q2.
//             worklist[index] = null;
//             worklist.push(q1);
//             worklist.push(q2);
//           } else if (q1.size < q2.size) {
//             worklist.push(q1);
//           } else {
//             worklist.push(q2);
//           }

//           if (setsAreEqual(s, q)) {
//             break part;
//           }
//         }
//       }
//     }

//     partition = new Set(nextP);
//   }

//   console.log({
//     partition,
//     nextP,
//     worklist,
//   });
// }

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
