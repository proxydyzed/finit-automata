import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";
import { FiniteAutomata, ErrorState, ExhaustiveRecognizer } from "../dst/export.js";
import { subsetConstruction, EmptySet, setsAreEqual, unionOfSets } from "./subset-construction.js";

try {
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
  // console.log(JSON.stringify(nfa, null, 4));
  // console.log(nfa.stringifyMappings());

  const dfa = subsetConstruction(nfa);
  const recognizer = new ExhaustiveRecognizer(dfa);

  console.log(dfa);
  console.log(recognizer.accepts("abcbbcbbcccbcb"));

  // const dfa2 = minimizeDfa(dfa);
} catch (error) {
  console.error(error);
}

function minimizeDfa(dfa) {
  const labels = new Map(Array.from(dfa.states, state => [state, dfa.accepting.has(state) ? 1 : 0]));

  while (true) {
    for (const alpha of dfa.alphabets) {

    }
  }
//   const dfa2 = new FiniteAutomata();
//   const accepting    = dfa.accepting;
//   const nonAccepting = new Set();

//   for (const state of dfa.states) {
//     if (state !== ErrorState && !accepting.has(state)) {
//       nonAccepting.add(state);
//     }
//   }

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

/*py
import collections

DFA = collections.namedtuple("DFA", ("Q", "Sigma", "delta", "q_0", "F"))


# Minimizes the given DFA. To avoid making this function more complicated, I've
# assumed that the input contains no dead states.
def minimize(dfa):
    # Input state labeling. Two states are distinguishable iff they have
    # different labels.
    labels = {q: (1 if q in dfa.F else 0) for q in dfa.Q}

    # Refine the labels until we reach a fixed point.
    while True:
        label_count = len(set(labels.values()))
        for sigma in dfa.Sigma:
            # Extend each label by the label of the successor state after sigma.
            labels = {
                q: (label, labels.get(dfa.delta.get((q, sigma))))
                for (q, label) in labels.items()
            }
            # Renumber for a compact representation. In another language, we'd
            # do these steps at the same time.
            labels = renumber_labels(labels)
        if len(set(labels.values())) <= label_count:
            # Arrived at a fixed point.
            break

    # Compute the new transition function.
    delta = {}
    for q in dfa.Q:
        for sigma in dfa.Sigma:
            q_prime = dfa.delta.get((q, sigma))
            if q_prime is not None:
                delta[(labels[q], sigma)] = labels[q_prime]

    return DFA(
        Q=set(labels.values()),
        Sigma=dfa.Sigma,
        delta=delta,
        q_0=labels[dfa.q_0],
        F={labels[q] for q in dfa.F},
    )


def renumber_labels(labels):
    label_numbers = {}
    for label in labels.values():
        label_numbers.setdefault(label, len(label_numbers))
    return {q: label_numbers[label] for (q, label) in labels.items()}


a = "a"
b = "b"
c = "c"
print(
    minimize(
        DFA(
            Q={0, 1, 2, 3},
            Sigma={a, b, c},
            delta={
                (0, a): 1,
                (1, b): 2,
                (1, c): 3,
                (2, b): 2,
                (2, c): 3,
                (3, b): 2,
                (3, c): 3,
            },
            q_0=0,
            F={1, 2, 3},
        )
    )
)
print(
    minimize(
        DFA(
            Q={0, 1, 2, 3},
            Sigma={a, b, c},
            delta={(0, a): 1, (1, b): 2, (1, c): 3, (3, c): 3},
            q_0=0,
            F={1, 2, 3},
        )
    )
)
*/

/*
OUTPUT:
DFA(Q={0, 1}, Sigma={'a', 'c', 'b'}, delta={(0, 'a'): 1, (1, 'c'): 1, (1, 'b'): 1}, q_0=0, F={1})
DFA(Q={0, 1, 2, 3}, Sigma={'a', 'c', 'b'}, delta={(0, 'a'): 1, (1, 'c'): 3, (1, 'b'): 2, (3, 'c'): 3}, q_0=0, F={1, 2, 3})
*/