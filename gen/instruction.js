import {
  SubsetNode,
} from "../nfa/export.js";

import {
  ArrayListLike,
  Uint32ArrayListLike,
  poisonPill,
} from "../utils/export.js";

export const InstructionRefOffset = 2;

export class Instruction {
  tag;
  data;
  static verify(data) {
    return this.from(data);
  }
  static Tag = Object.freeze({
    __proto__: poisonPill,
    start            : 0,
    state            : 1,
    stateAccepting   : 2,
    stateReachable   : 3,
    edge             : 4,
    edgeCircular     : 5,
    edgeEof          : 6,
    edgeFail         : 7,
    edgeFailCircular : 8,
  });
  static Ref = Object.freeze({
    __proto__: poisonPill,
    stateEmpty       : 0,
    edgeFailImplicit : 1,
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
  static State = class State {
    reachable;
    token;
    edges;
    edgesLength;
    constructor(reachable, token, edges, edgesLength) {
      this.reachable = reachable;
      this.token = token;
      this.edges = edges;
      this.edgesLength = edgesLength;
    }
    static from(__inst__) {
      if ("reachable" in __inst__) {
        if (typeof __inst__.reachable !== "boolean") {
          throw new Error(`Expected field "reachable" to be "boolean", but got ${typeof __inst__.reachable}`);
        }
      } else {
        throw new Error(`Expected "reachable" field`);
      }
      if ("token" in __inst__) {
        if (typeof __inst__.token !== "number") {
          throw new Error(`Expected field "token" to be "number", but got ${typeof __inst__.token}`);
        }
      } else {
        throw new Error(`Expected "token" field`);
      }
      if ("edges" in __inst__) {
        if (typeof __inst__.edges !== "number") {
          throw new Error(`Expected field "edges" to be "number", but got ${typeof __inst__.edges}`);
        }
      } else {
        throw new Error(`Expected "edges" field`);
      }
      if ("edgesLength" in __inst__) {
        if (typeof __inst__.edgesLength !== "number") {
          throw new Error(`Expected field "edgesLength" to be "number", but got ${typeof __inst__.edgesLength}`);
        }
      } else {
        throw new Error(`Expected "edgesLength" field`);
      }
      return new this(__inst__.reachable, __inst__.token, __inst__.edges, __inst__.edgesLength);
    }
  };
  static Edge = class Edge {
    recursive;
    instIndex;
    alphabets;
    alphabetsLength;
    constructor(recursive, instIndex, alphabets, alphabetsLength) {
      this.recursive = recursive;
      this.instIndex = instIndex;
      this.alphabets = alphabets;
      this.alphabetsLength = alphabetsLength;
    }
    static from(__inst__) {
      if ("recursive" in __inst__) {
        if (typeof __inst__.recursive !== "boolean") {
          throw new Error(`Expected field "recursive" to be "boolean", but got ${typeof __inst__.recursive}`);
        }
      } else {
        throw new Error(`Expected "recursive" field`);
      }
      if ("instIndex" in __inst__) {
        if (typeof __inst__.instIndex !== "number") {
          throw new Error(`Expected field "instIndex" to be "number", but got ${typeof __inst__.instIndex}`);
        }
      } else {
        throw new Error(`Expected "instIndex" field`);
      }
      if ("alphabets" in __inst__) {
        if (typeof __inst__.alphabets !== "number") {
          throw new Error(`Expected field "alphabets" to be "number", but got ${typeof __inst__.alphabets}`);
        }
      } else {
        throw new Error(`Expected "alphabets" field`);
      }
      if ("alphabetsLength" in __inst__) {
        if (typeof __inst__.alphabetsLength !== "number") {
          throw new Error(`Expected field "alphabetsLength" to be "number", but got ${typeof __inst__.alphabetsLength}`);
        }
      } else {
        throw new Error(`Expected "alphabetsLength" field`);
      }
      return new this(__inst__.recursive, __inst__.instIndex, __inst__.alphabets, __inst__.alphabetsLength);
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
    return new this(__inst__.tag, this.Data.from(__inst__.data));
  }
};

// return new this(__inst__.tag, this.Data.from(__inst__.data));
export const InstructionList = ArrayListLike(Instruction);

export class CompilationContext {
  subset;
  instructions = new InstructionList();
  extra = new Uint32ArrayListLike();
  scratch = new Uint32ArrayListLike();

  constructor(subset) {
    this.subset = subset;
  }

  getNode(nodeIndex) {
    return this.subset.nodes.at(nodeIndex);
  }

  getRootNode() {
    return this.subset.nodes.at(0);
  }

  getExtra(extraIndex) {
    return this.subset.extra.at(extraIndex);
  }

  extraSlice(from, to) {
    return this.subset.extra.slice(from, to);
  }

  getToken(tokenIndex) {
    return this.subset.tokens.get(tokenIndex);
  }

  getAlphaStringified(alphaOffset) {
    return JSON.stringify(this.subset.alphabets.at(alphaOffset));
  }

  unpackArray(extraIndex) {
    const length = this.subset.extra.at(extraIndex);
    return this.subset.extra.slice(extraIndex + 1, extraIndex + 1 + length);
  }

  addInst(inst) {
    this.instructions.append(inst);
    return this.instructions.getSize() - 1 + InstructionRefOffset;
  }

  getInst(instIndex) {
    return this.instructions.at(instIndex);
  }

  addStateInst(stateInst) {
    const data = Instruction.State.from(stateInst);

    if (data.edgesLength === 0) {
      return this.addInst({
        tag: Instruction.Tag.stateAccepting,
        data: {
          data1: data.token,
          data2: -1,
        },
      });
    }

    return this.addInst({
      tag: data.reachable ? Instruction.Tag.stateReachable : Instruction.Tag.state,
      data: {
        data1: data.token,
        data2: data.edges,
      },
    });
  }

  makeStateInst() {
    return this.addInst({
      tag: -1,
      data: {
        data1: -1,
        data2: -1,
      },
    });
  }

  setStateInst(instOffset, stateInst) {
    const data = Instruction.State.from(stateInst);
    const inst = this.getInst(instOffset - InstructionRefOffset);

    inst.data.data1 = data.token;
    if (data.edgesLength === 0) {
      inst.tag = Instruction.Tag.stateAccepting;
      return;
    } else {
      inst.tag = data.reachable ? Instruction.Tag.stateReachable : Instruction.Tag.state;
      inst.data.data2 = data.edges;
    }
  }

  addEdgeInst(edgeInst) {
    const data = Instruction.Edge.from(edgeInst);
    return this.addInst({
      tag: data.recursive ? Instruction.Tag.edgeCircular : Instruction.Tag.edge,
      data: {
        data1: data.instIndex,
        data2: data.alphabets,
      },
    });
  }
};

export class DfaScope {
  #parent;
  get parent() {return this.#parent;}
  set parent(parent) {this.#parent = parent;}

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

// Semi Compiled Dfa Intermediate Representation
export class SCDIR {
  instructions;
  extra;

  constructor(instructions, extra) {
    this.instructions = instructions;
    this.extra = extra;
  }
}
