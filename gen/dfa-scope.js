import {
  poisonPill,
} from "../utils/export.js";

export class DfaScope {
  static Tag = Object.freeze({
    __proto__: poisonPill,
    top   : 0,
    state : 1,
    edge  : 2,
  });

  static Top = class Top {
    tag = DfaScope.Tag.top;
  };

  static State = class State {
    tag = DfaScope.Tag.state;
    parent;
    nodeIndex;
    instIndex;
    reachable;
    accepting;

    constructor(parent, nodeIndex, instIndex, reachable, accepting) {
      this.parent = parent;
      this.nodeIndex = nodeIndex;
      this.instIndex = instIndex;
      this.reachable = reachable;
      this.accepting = accepting;
    }

    static from(__inst__) {
      if ("parent" in __inst__) {
        if (typeof __inst__.parent !== "object") {
          throw new Error(`Expected field "parent" to be "object", but got ${typeof __inst__.parent}`);
        }
      } else {
        throw new Error(`Expected "parent" field`);
      }
      if ("nodeIndex" in __inst__) {
        if (typeof __inst__.nodeIndex !== "number") {
          throw new Error(`Expected field "nodeIndex" to be "number", but got ${typeof __inst__.nodeIndex}`);
        }
      } else {
        throw new Error(`Expected "nodeIndex" field`);
      }
      if ("instIndex" in __inst__) {
        if (typeof __inst__.instIndex !== "number") {
          throw new Error(`Expected field "instIndex" to be "number", but got ${typeof __inst__.instIndex}`);
        }
      } else {
        throw new Error(`Expected "instIndex" field`);
      }
      if ("reachable" in __inst__) {
        if (typeof __inst__.reachable !== "boolean") {
          throw new Error(`Expected field "reachable" to be "boolean", but got ${typeof __inst__.reachable}`);
        }
      } else {
        throw new Error(`Expected "reachable" field`);
      }
      if ("accepting" in __inst__) {
        if (typeof __inst__.accepting !== "boolean") {
          throw new Error(`Expected field "accepting" to be "boolean", but got ${typeof __inst__.accepting}`);
        }
      } else {
        throw new Error(`Expected "accepting" field`);
      }
      return new this(__inst__.parent, __inst__.nodeIndex, __inst__.instIndex, __inst__.reachable, __inst__.accepting);
    }
  };

  static Edge = class Edge {
    tag = DfaScope.Tag.edge;
    parent;
    hasFail;
    hasEof;
    alphabets;

    constructor(parent, hasFail, hasEof, alphabets) {
      this.parent = parent;
      this.hasFail = hasFail;
      this.hasEof = hasEof;
      this.alphabets = alphabets;
    }

    static from(__inst__) {
      if ("parent" in __inst__) {
        if (typeof __inst__.parent !== "object") {
          throw new Error(`Expected field "parent" to be "object", but got ${typeof __inst__.parent}`);
        }
      } else {
        throw new Error(`Expected "parent" field`);
      }
      if ("hasFail" in __inst__) {
        if (typeof __inst__.hasFail !== "boolean") {
          throw new Error(`Expected field "hasFail" to be "boolean", but got ${typeof __inst__.hasFail}`);
        }
      } else {
        throw new Error(`Expected "hasFail" field`);
      }
      if ("hasEof" in __inst__) {
        if (typeof __inst__.hasEof !== "boolean") {
          throw new Error(`Expected field "hasEof" to be "boolean", but got ${typeof __inst__.hasEof}`);
        }
      } else {
        throw new Error(`Expected "hasEof" field`);
      }
      if ("alphabets" in __inst__) {
        if (typeof __inst__.alphabets !== "object") {
          throw new Error(`Expected field "alphabets" to be "object", but got ${typeof __inst__.alphabets}`);
        }
      } else {
        throw new Error(`Expected "alphabets" field`);
      }
      return new this(__inst__.parent, __inst__.hasFail, __inst__.hasEof, __inst__.alphabets);
    }
  };
};
