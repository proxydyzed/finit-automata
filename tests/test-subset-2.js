import { NondeterministicFiniteAutomata } from "./nfa.js";
import { DeterministicFiniteAutomata } from "./dfa.js";
import { ErrorState, ExhaustiveRecognizer, KnownMappings } from "../dst/export.js";
import { subsetConstruction } from "./subset-construction.js";

class MinimizationContext {
  #dfa;
  names;
  worklist;
  reachable;
  partitions;

  constructor(dfa) {
    this.dfa = dfa;
    this.names = new Map(Array.from({ length: 0 }, () => [
      // nfa state
      Symbol(""),
      // partition array index
      0,
    ]));
    this.worklist = new WorkList([]);
    this.reachable = new Map(Array.from({ length: 0 }, () => [
      // partition name
      Symbol(""),
      // partition array index
      new Set(Array.from({ length: 0 }, () => 0)),
    ]));
    this.partitions = Array.from({ length: 0 }, () => new Partition(Symbol(""), new Set()));
  }

  get dfa() {
    return this.#dfa;
  }

  set dfa(dfa) {
    this.#dfa = dfa;
  }

  static from(dfa, partitions) {
    const ctx = new this(dfa);

    for (const states of partitions) {
      ctx.addPartition(states);
    }

    return ctx;
  }

  addPartition(states) {
    const index = this.partitions.length;
    const entry = new Partition(Symbol(`p${index}`), states);
    this.reachable.set(entry.name, new Set());

    for (const state of states) {
      this.names.set(state, index);
    }

    this.partitions.push(entry);
    this.worklist.add(index);
  }

  addReachable(name, index) {
    if (typeof name !== "symbol") {
      throw new TypeError(`Expected argument "name" to be symbol, but got ${typeof name === "object" ? (name.constructor?.name ?? "null") : typeof name}`);
    }
    if (typeof index !== "number") {
      throw new TypeError(`Expected argument "index" to be number, but got ${typeof index === "object" ? (index.constructor?.name ?? "null") : typeof name}`);
    }
    
    this.reachable.get(name).add(index);
  }

  pushReachables(name) {
    const reachable = this.reachable.get(name);
    for (const reach of reachable) {
      if (!this.worklist.has(reach)) {
        this.worklist.add(reach);
      }
    }

    reachable.clear();
  }
}

class Partition {
  name;
  states;

  /**
   * @param {symbol} name
   * @param {Set<symbol>} states
   */
  constructor(name, states) {
    this.name = name;
    this.states = states;
  }
  
  toString() {
    return `Partition{ name: ${this.name.description}, states: Set{${Array.from(this.states, state => state.description).join()}} }`;
  }
}

class WorkList {
  buffer;
  index = 0;

  constructor(buffer) {
    this.buffer = buffer;
  }

  *[Symbol.iterator]() {
    while (this.buffer.length > this.index) {
      this.index++;
      yield this.buffer.at(this.index - 1);
    }
  }

  has(value) {
    return this.buffer.includes(value, this.index);
  }

  add(value) {
    this.buffer.push(value);
  }
}

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

  const context = minimizeDfa2(dfa);
  console.log(context);
  console.log(context.partitions.join("\n"));
} catch (error) {
  console.error(error.stack);
}

/**
 * @param {DeterministicFiniteAutomata} dfa
 */
function minimizeDfa2(dfa) {
  const accepting = dfa.accepting;
  const nonAccepting = new Set(Array.from({ length: 0 }, () => Symbol("")));

  for (const state of dfa.states) {
    if (state !== ErrorState && !accepting.has(state)) {
      nonAccepting.add(state);
    }
  }

  const context = MinimizationContext.from(dfa, [accepting, nonAccepting]);
  for (const index of context.worklist) {
    processWorkset(context, context.partitions.at(index), index);
  }

  return context;
}

/**
 * @param {MinimizationContext} ctx
 * @param {Partition} workset
 * @param {number} partitionIndex
 */
function processWorkset(ctx, workset, partitionIndex) {
  const { dfa } = ctx;
  // console.log(`Partition-index: ${partitionIndex}`);
  // console.log("Partition-entry:", String(workset));
  for (const [alpha, index] of dfa.alphabets) {
    processAlpha(ctx, workset, partitionIndex, alpha, index);
  }
  // console.log("\n");
}

/**
 * @param {MinimizationContext} ctx
 * @param {Partition} workset
 * @param {number} partitionIndex
 * @param {string} alpha
 * @param {number} index
 */
function processAlpha(ctx, workset, partitionIndex, alpha, index) {
  const { dfa, partitions, names } = ctx;
  const bucket = new Map();
  const errorBucket = [];
  // console.log(`Processing: "${alpha}"`);

  for (const state of workset.states) {
    const image = dfa.delta(state, index);
    // console.log(`  ${state.description} + "${alpha}" => ${image.description}`);

    if (image !== ErrorState) {
      const partition = partitions.at(names.get(image));
      // partition "A" is reaching some partition "B".
      // we add this so that later if we split the
      // partition "B" then we can add partition "A"
      // to the worklist as the entries in partition "A"
      // might reach any of the part of the split up
      // partition "B"
      ctx.addReachable(partition.name, partitionIndex);
      //               ^ partition "B"
      //                               ^ partition "A"

      // console.log("Partition:", partition.toString());

      if (bucket.has(partition.name)) {
        bucket.get(partition.name).push(state);
      } else {
        bucket.set(partition.name, [state]);
      }
    } else {
      errorBucket.push(state);
    }
  }

  if (errorBucket.length > 0) {
    bucket.set(ErrorState, errorBucket);
  }

  // console.log("Reachable:");
  // console.log(Array.from(reachable, ([k, v]) => `  ${k.description} => Set{${Array.from(v).join(", ")}}`).join("\n"));
  // console.log("Bucket:");
  // console.log(Array.from(bucket, ([k, v]) => `  ${k.description} => [${Array.from(v, s => s.description).join(", ")}]`).join("\n"));
  // console.log("");

  if (bucket.size > 1) {
    const partition = partitions.at(partitionIndex);

    const temp = [];
    for (const [, states] of bucket) {
      temp.push(new Set(states));
    }
    // console.log("Split states:");
    // console.log(temp);

    // console.log("Partition to split:");
    // console.log(String(partition));

    partition.states = temp.pop();
    for (const state of partition.states) {
      names.set(state, partitionIndex);
    }

    // console.log("Partition is split:");
    // console.log(String(partition));

    for (const states of temp) {
      ctx.addPartition(states);
    }

    // we push all partition "A" reachable from
    // partition "B" to the worklist and clear
    // the reachable set
    ctx.pushReachables(partition.name);
  }
}

/**
 * @param {DeterministicFiniteAutomata} dfa
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
