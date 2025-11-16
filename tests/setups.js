import {
  NondeterministicFiniteAutomata,
  DeterministicFiniteAutomata,
  KnownMappings,
} from "../dst/export.js";
import {
  subsetConstruction,
} from "../algs/export.js";

export function setup1() {
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

export function setup2() {
  // some random dfa from wikipedia
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

export function setup3() {
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

export function setup4() {
  const dfa = new DeterministicFiniteAutomata(Symbol("Rem 0"));
  const q0 = dfa.start;
  const q1 = dfa.addVertex("Rem 1");
  const q2 = dfa.addVertex("Rem 2");
  const q3 = dfa.addVertex("Rem 3");

  const a0 = dfa.addAlphabet("0");
  const a1 = dfa.addAlphabet("1");

  dfa.addEdge(a0, q0, q0);
  dfa.addEdge(a1, q0, q1);

  dfa.addEdge(a0, q1, q2);
  dfa.addEdge(a1, q1, q3);

  dfa.addEdge(a0, q2, q0);
  dfa.addEdge(a1, q2, q1);

  dfa.addEdge(a0, q3, q2);
  dfa.addEdge(a1, q3, q3);

  dfa.accepting.add(q0);

  // console.log(dfa);
  return dfa;
}

export function setup5() {
  const nfa = new NondeterministicFiniteAutomata("start");
  const qA = nfa.addVertex("A");
  const qB = nfa.addVertex("B");
  const qEnd = nfa.addVertex("end");
  
  nfa.addEdge(KnownMappings.epsilon, nfa.start, qA);
  nfa.addEdge(nfa.addAlphabet("0"), qA, qB);
  nfa.addEdge(nfa.addAlphabet("1"), qB, qA);
  nfa.addEdge(KnownMappings.epsilon, qB, qEnd);
  
  nfa.accepting.add(qEnd);
  return subsetConstruction(nfa);
}