import {
  ErrorState,
  WorkList,
} from "../dst/export.js";

const DEBUG = false;

/**
 * @param {DeterministicFiniteAutomata} dfa
 */
export function minimizeDfa(dfa) {
  const accepting = dfa.accepting;
  const nonAccepting = new Set(Array.from({ length: 0 }, () => Symbol("")));

  for (const state of dfa.states) {
    if (state !== ErrorState && !accepting.has(state)) {
      nonAccepting.add(state);
    }
  }

  const context = new MinimizationContext(dfa);
  if (accepting.size > 0) {
    context.addPartition(accepting);
  }
  if (nonAccepting.size > 0) {
    context.addPartition(nonAccepting);
  }
  
  if (DEBUG) {
    console.log(context);
    console.log("-- begin --\n\n");
  }
  
  for (const index of context.worklist) {
    processWorkset(context, context.partitions.at(index), index);
    if (DEBUG) {
      console.log("\n");
    }
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
  
  if (DEBUG) {
    console.log(`${partitionIndex} => ${String(workset)}`);
  }

  for (const [alpha, index] of dfa.alphabets) {
    const partitionIsSplit = processAlpha(ctx, workset, partitionIndex, alpha, index);

    if (partitionIsSplit) {
      break;
    }
    
    if (DEBUG) {
      console.log("");
    }
  }
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
  const bucket = new Map(Array.from({ length: 0 }, () => [
    // partition name
    Symbol(""),
    // array of dfa states
    Array.from({ length: 0 }, () => Symbol("")),
  ]));
  // array of dead dfa states
  const errorBucket = Array.from({ length: 0 }, () => Symbol(""));
  
  if (DEBUG) {
    console.log(`Processing: "${alpha}"`);
  }

  for (const state of workset.states) {
    const image = dfa.delta(state, index);

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

      if (bucket.has(partition.name)) {
        bucket.get(partition.name).push(state);
      } else {
        bucket.set(partition.name, [state]);
      }

      if (DEBUG) {
        console.log(`  ${state.description} + "${alpha}" => ${image.description.padEnd(5, " ")} | ${String(partition)}`);
      }
    } else {
      errorBucket.push(state);
      if (DEBUG) {
        console.log(`  ${state.description} + "${alpha}" => ${image.description.padEnd(5, " ")} | Dead state`);
      }
    }
  }

  if (errorBucket.length > 0) {
    bucket.set(ErrorState, errorBucket);
  }

  if (DEBUG) {
    console.log("Reachable:");
    console.log(Array.from(ctx.reachable, ([k, v]) => `  ${k.description} => Set{${Array.from(v).join(", ")}}`).join("\n"));
    console.log("Bucket:");
    console.log(Array.from(bucket, ([k, v]) => `  ${k.description.padEnd(5, " ")} => [${Array.from(v, s => s.description).join(", ")}]`).join("\n"));
  }
  
  if (bucket.size > 1) {
    const partition = partitions.at(partitionIndex);

    const temp = [];
    for (const [, states] of bucket) {
      temp.push(new Set(states));
    }
  
    if (DEBUG) {
      console.log("\nFound multiple partitions being reached, partition must be split");
      console.log("Partition to split:");
      console.log(" ", String(partition));
    }
    
    partition.states = temp.pop();
    for (const state of partition.states) {
      names.set(state, partitionIndex);
    }

    if (DEBUG) {
      console.log("Partition is split:");
      console.log(" ", String(partition));
    }
    
    for (const states of temp) {
      ctx.addPartition(states);
    }

    if (DEBUG) {
      console.log(`NEW partitions\n  ${ctx.partitions.join("\n  ")}`);
    }

    // we push all partition "A" reachable from
    // partition "B" to the worklist and clear
    // the reachable set
    ctx.pushReachables(partition.name);

    if (DEBUG) {
      console.log("Pushed reachable indices, returning true");
    }

    return true;
  }

  if (DEBUG) {
    console.log("Nothing was split, returning false");
  }

  return false;
}

export class MinimizationContext {
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
    this.worklist = new WorkList(Array.from({ length: 0 }, () => 0));
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
