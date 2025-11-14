import { FixedColumnTable } from "./tables.js";
import { NondeterministicFiniteAutomata, KnownMappings } from "./nfa.js";

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
console.log(nfa.stringifyMappings());

const table = new FixedColumnTable(nfa.alphabets.size);
// console.log(Array.from(epsilonClosure(nfa, [nfa.start]), state => state.description));
const reversed = new Map(Array.from(nfa.alphabets, ([v, k]) => [k, v]));
reversed.set(KnownMappings.epsilon, "∈");
reversed.set(KnownMappings.sigma, "∑");

const qq = epsilonClosure(nfa, [nfa.start]);
const Q = new Set(qq);
const worklist = [qq];

while (worklist.length > 0) {
  const q = worklist.pop();
  console.log("worklist", Array.from(q, s => s.description));
  
  for (const index of nfa.alphabets.values()) {
    const d = deltas(nfa, q, index);
    const t = epsilonClosure(nfa, d);
    console.log(`For "${reversed.get(index)}"\n`,
      "Delta", Array.from(d, s => s.description), "\n",
      "epsilon-closure", Array.from(t, s => s.description),
    );
  }
  
}










/**
 * @param {NondeterministicFiniteAutomata} nfa
 * @param {ArrayLike<symbol>} states
 * @param {number} index
 */
 function deltas(nfa, states, index) {
   // const worklist = Array.from(states);
   const seen = new Set(Array.from({ length: 0 }, () => Symbol("")));
   for (const state1 of states) {
     // seen.add(state1);
     
     let next = nfa.delta(state1, index) ?? [];
     if (index !== KnownMappings.epsilon) {
       const all = nfa.mappings.get(state1).get(KnownMappings.sigma);
       if (typeof all !== "undefined") {
         next = [...next, ...all];
       }
     }
      
     for (const state2 of next) {
       seen.add(state2);
     }
   }
   
   return seen;
 }

/**
 * @param {NondeterministicFiniteAutomata} nfa
 * @param {ArrayLike<symbol>} states
 */
function epsilonClosure(nfa, states) {
  const worklist = Array.from(states);
  const seen = new Set(Array.from({ length: 0 }, () => Symbol("")));
  
  while (worklist.length > 0) {
    const state1 = worklist.pop();
    const next = nfa.delta(state1, KnownMappings.epsilon);
    seen.add(state1);
    
    if (next !== null) {
      for (const state2 of next) {
        if (!seen.has(state2)) {
          seen.add(state2);
          worklist.push(state2);
        }
      }
    }
  }
  
  return seen;
}

