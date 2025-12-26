import {
  WorkList,
  Uint32ArrayListLike,
  poisonPill,
} from "../utils/export.js";

export class SubsetGen {
  nfa;
  tokens;
  worklist = new WorkList([]);
  alphabets;

  entries = [];
  nodes = [];

  extra = new Uint32ArrayListLike();
  scratch = new Uint32ArrayListLike();

  constructor(nfa, tokens) {
    this.nfa = nfa;
    this.tokens = tokens;
    this.alphabets = Array.from(nfa.alphabets.keys());
    // this.reversedAlphabets = new Map(Array.from(nfa.alphabets, ([k, v]) => [v, k]));
  }

  pushEntry(entry) {
    const entryIndex = this.entries.length;
    this.entries.push(SubsetEntry.from(entry));
    this.worklist.add(entryIndex);
    return entryIndex;
  }

  addNode(node) {
    this.nodes.push(SubsetNode.from(node));
    return this.nodes.length - 1;
  }
};

export class Subset {
  // nfa;
  tokens;
  alphabets;
  entries;
  nodes;
  extra;

  #nfa;
  get nfa() { return this.#nfa; }
  set nfa(nfa) { this.#nfa = nfa; }

  constructor(nfa, tokens, alphabets, entries, nodes, extra) {
    this.nfa = nfa;
    this.tokens = tokens;
    this.alphabets = alphabets;
    this.entries = entries;
    this.nodes = nodes;
    this.extra = extra;
  }

  getArray(extraIndex) {
    const lens = this.extra.at(extraIndex);
    return this.extra.slice(extraIndex + 1, extraIndex + 1 + lens);
  }

  static from(__inst__) {
    if ("nfa" in __inst__) {
      if (typeof __inst__.nfa !== "object") {
        throw new Error(`Expected field "nfa" to be "object", but got ${typeof __inst__.nfa}`);
      }
    } else {
      throw new Error(`Expected "nfa" field`);
    }
    if ("tokens" in __inst__) {
      if (typeof __inst__.tokens !== "object") {
        throw new Error(`Expected field "tokens" to be "object", but got ${typeof __inst__.tokens}`);
      }
    } else {
      throw new Error(`Expected "tokens" field`);
    }
    if ("alphabets" in __inst__) {
      if (typeof __inst__.alphabets !== "object") {
        throw new Error(`Expected field "alphabets" to be "object", but got ${typeof __inst__.alphabets}`);
      }
    } else {
      throw new Error(`Expected "alphabets" field`);
    }
    if ("entries" in __inst__) {
      if (typeof __inst__.entries !== "object") {
        throw new Error(`Expected field "entries" to be "object", but got ${typeof __inst__.entries}`);
      }
    } else {
      throw new Error(`Expected "entries" field`);
    }
    if ("nodes" in __inst__) {
      if (typeof __inst__.nodes !== "object") {
        throw new Error(`Expected field "nodes" to be "object", but got ${typeof __inst__.nodes}`);
      }
    } else {
      throw new Error(`Expected "nodes" field`);
    }
    if ("extra" in __inst__) {
      if (typeof __inst__.extra !== "object") {
        throw new Error(`Expected field "extra" to be "object", but got ${typeof __inst__.extra}`);
      }
    } else {
      throw new Error(`Expected "extra" field`);
    }
    return new this(__inst__.nfa, __inst__.tokens, __inst__.alphabets, __inst__.entries, __inst__.nodes, __inst__.extra);
  }
};

export class SubsetEntry {
  states;
  found;
  node;
  constructor(states, found, node) {
    this.states = states;
    this.found = found;
    this.node = node;
  }
  static from(__inst__) {
    if ("states" in __inst__) {
      if (typeof __inst__.states !== "object") {
        throw new Error(`Expected field "states" to be "object", but got ${typeof __inst__.states}`);
      }
    } else {
      throw new Error(`Expected "states" field`);
    }
    if ("found" in __inst__) {
      if (typeof __inst__.found !== "number") {
        throw new Error(`Expected field "found" to be "number", but got ${typeof __inst__.found}`);
      }
    } else {
      throw new Error(`Expected "found" field`);
    }
    if ("node" in __inst__) {
      if (typeof __inst__.node !== "number") {
        throw new Error(`Expected field "node" to be "number", but got ${typeof __inst__.node}`);
      }
    } else {
      throw new Error(`Expected "node" field`);
    }
    return new this(__inst__.states, __inst__.found, __inst__.node);
  }
}

export class SubsetNode {
  tag;
  data;
  static Tag = Object.freeze({
    __proto__: poisonPill,
    root              : 0,
    edge              : 1,
    state             : 2,
  });
  static Data = class Data {
    data1;
    data2;
    constructor(data1, data2) {
      this.data1 = data1;
      this.data2 = data2;
    }
    static from(__inst__) {
      if ("data1" in __inst__) {
        if (typeof __inst__.data1 !== "number") {
          throw new Error(`Expected field "data1" to be "number", but got ${typeof __inst__.data1}`);
        }
      } else {
        throw new Error(`Expected "data1" field`);
      }
      if ("data2" in __inst__) {
        if (typeof __inst__.data2 !== "number") {
          throw new Error(`Expected field "data2" to be "number", but got ${typeof __inst__.data2}`);
        }
      } else {
        throw new Error(`Expected "data2" field`);
      }
      return new this(__inst__.data1, __inst__.data2);
    }
  };
  constructor(tag, data) {
    this.tag = tag;
    this.data = data;
  }
  static from(__inst__) {
    if ("tag" in __inst__) {
      if (typeof __inst__.tag !== "number") {
        throw new Error(`Expected field "tag" to be "number", but got ${typeof __inst__.tag}`);
      }
    } else {
      throw new Error(`Expected "tag" field`);
    }
    if ("data" in __inst__) {
      if (typeof __inst__.data !== "object") {
        throw new Error(`Expected field "data" to be "object", but got ${typeof __inst__.data}`);
      }
    } else {
      throw new Error(`Expected "data" field`);
    }
    return new this(__inst__.tag, SubsetNode.Data.from(__inst__.data));
  }
}
