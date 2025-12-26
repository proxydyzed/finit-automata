import {
  AlphabetOffset,
  AlphabetReference,
  StartState,
  ErrorState,
  SubsetNode,
  printSubset,
  alphaIndexIsRef,
} from "../nfa/export.js";

import {
  assert,
  IndentingWriter,
  ArrayListLike,
  Uint32ArrayListLike,
  poisonPill,
} from "../utils/export.js";

import {
  Instruction,
  InstructionList,
  InstructionRefOffset,
  CompilationContext,
  SCDIR,
} from "./instruction.js";

import {
  DfaScope,
} from "./dfa-scope.js";

/*

TASKS:
create alphabet bucket
embed states within other states
join circular references
separate "eof" and "fail" references
assert no "sigma" or "epsilon" edges remain

TODO:
make sure every end is met with at least one token, `token !== undefined`
make seeking edges, `source[index + x]`
make sentinel states, `.endsWith()`

*/

export function generate(subset) {
  const ctx = new CompilationContext(subset);
  const rootNode = ctx.getRootNode();
  assert(rootNode.tag === SubsetNode.Tag.root, "Expected root node");


  const nodeIndex = ctx.getExtra(rootNode.data.data1);
  const scope = new DfaScope.Top();
  ctx.addInst({
    tag: Instruction.Tag.start,
    data: {
      data1: -1,
      data2: -1,
    },
  });

  ctx.getInst(0).data.data1 = enterNode(ctx, scope, nodeIndex);
  return new SCDIR(ctx.instructions, ctx.extra);
}

function enterNode(ctx, parentScope, nodeIndex) {
  const node = ctx.getNode(nodeIndex);
  assert(node.tag === SubsetNode.Tag.state, `Expected state node, got ${node.tag}`);

  const entryIndex = node.data.data1;
  const extraIndex = node.data.data2;
  const tokenIndex = ctx.subset.entries.at(entryIndex).found;

  const hasToken = tokenIndex !== -1;
  const edgeNodes = ctx.unpackArray(extraIndex);

  if (hasToken && !ctx.subset.tokens.has(tokenIndex)) {
    throw new Error(`Token index (${tokenIndex}) does not have a matching token name\n${traceScope(ctx, parentScope, nodeIndex)}`);
  }

  if (edgeNodes.getSize() === 0) {
    // this is a dead-end.
    // states with no outgoing edges
    // land here, and we test if there
    // is a corresponding token along
    // the state.
    // should probably report an error
    // for finding no token along the 
    // way

    if (!hasToken) {
      // console.log("empty");
      // throw new Error(`Terminal states requires tokens`);
      // return Instruction.Ref.stateEmpty;

      let currentScope = parentScope;
      loop: while (true) {
        switch (currentScope.tag) {
          case DfaScope.Tag.top: {
            throw new Error(`Terminating state without any tracing token found\n${traceScope(ctx, parentScope, nodeIndex)}`);
          }

          case DfaScope.Tag.state: {
            if (currentScope.accepting) {
              break loop;
            }

            currentScope = currentScope.parent;
            continue loop;
          }

          case DfaScope.Tag.edge: {
            currentScope = currentScope.parent;
            continue loop;
          }

          default: {
            assert(false, "Unreachable");
          }
        }
      }
    }

    // console.log("zero-edges");
    return ctx.addStateInst({
      reachable: false,
      token: tokenIndex,
      edges: 0,
      edgesLength: 0,
    });
  }

  // console.log("many-edges");
  const instIndex = ctx.makeStateInst();
  // assert(false, "WIP");
  const scope = DfaScope.State.from({
    parent: parentScope,
    nodeIndex: nodeIndex,
    instIndex: instIndex,
    reachable: false,
    accepting: hasToken,
  });
  const edges = enterEdges(ctx, scope, nodeIndex, edgeNodes);
  ctx.setStateInst(instIndex, {
    reachable: scope.reachable,
    token: tokenIndex,
    edges: edges,
    edgesLength: ctx.extra.at(edges),
  });
  return instIndex;
}

function enterEdges(ctx, parentScope, parentNodeIndex, edges) {
  // assert(false, "Broken");

  let hasFail = false;
  let hasEof = false;
  for (const edgeIndex of edges) {
    const node = ctx.getNode(edgeIndex);
    assert(node.tag === SubsetNode.Tag.edge, "Expected edge node");

    // const entryIndex = node.data.data1;
    const alphaIndex = node.data.data2;
    // const nextNodeIndex = ctx.subset.entries.at(entryIndex).node;

    if (alphaIndexIsRef(alphaIndex)) {
      block: switch (alphaIndex) {
        case AlphabetReference.sigma:
        case AlphabetReference.epsilon: {
          throw new Error(`Unexpected alphabet: %${alphaIndex}\n${traceScope(ctx, parentScope, -1)}`);
        }

        case AlphabetReference.fail: {
          hasFail = true;
          break block;
        }

        case AlphabetReference.eof: {
          hasEof = true;
          break block;
        }
      }
    }
  }

  const buckets = makeBuckets(ctx, edges);
  const entries = Array.from(buckets, function enterBucket([nextNodeIndex, alphaIndexArray]) {
    const reachableScope = findReachableStateScope(ctx, parentScope, nextNodeIndex);
    const entry = {
      nextNodeIndex,
      alphaIndexArray,
      instIndex: -1,
      recursive: reachableScope !== null,
    };

    const scope = DfaScope.Edge.from({
      parent: parentScope,
      hasFail,
      hasEof,
      alphabets: alphaIndexArray,
    });

    if (reachableScope) {
      reachableScope.reachable = true;
      entry.instIndex = reachableScope.instIndex;
    } else {
      entry.instIndex = enterNode(ctx, scope, nextNodeIndex);
    }

    inner: for (const alphaIndex of alphaIndexArray) {
      if (!alphaIndexIsRef(alphaIndex)) {
        // only allow references
        continue inner;
      }

      block: switch (alphaIndex) {
        case AlphabetReference.fail: {
          if (alphaIndexArray.length > 1) {
            throw new Error(`Can not have "fail" edge with multiple alphabets\n${traceScope(ctx, scope, nextNodeIndex)}`);
          }

          break block;
        }

        case AlphabetReference.eof: {
          if (entry.recursive) {
            throw new Error(`Can not have recursive "eof" edge\n${traceScope(ctx, scope, nextNodeIndex)}`);
          }

          break block;
        }

        default: {
          assert(false, "Unreachable");
        }
      }
    }

    return entry;
  });

  const scratchTop = ctx.scratch.getSize();
  try {
    for (const { nextNodeIndex, alphaIndexArray, instIndex, recursive } of entries) {
      inner: for (const alphaIndex of alphaIndexArray) {
        if (!alphaIndexIsRef(alphaIndex)) {
          // only allow references
          continue inner;
        }

        block: switch (alphaIndex) {
          case AlphabetReference.fail: {
            ctx.scratch.append(ctx.addInst({
              tag: recursive ? Instruction.Tag.edgeFailCircular : Instruction.Tag.edgeFail,
              data: {
                data1: instIndex,
                data2: -1,
              },
            }));
            break block;
          }

          case AlphabetReference.eof: {
            ctx.scratch.append(ctx.addInst({
              tag: Instruction.Tag.edgeEof,
              data: {
                data1: instIndex,
                data2: -1,
              },
            }));
            break block;
          }
        }
      }
    }

    if (!hasFail) {
      ctx.scratch.append(Instruction.Ref.edgeFailImplicit);
    }

    if (!hasEof) {
      ctx.scratch.append(ctx.addInst({
        tag: Instruction.Tag.edgeEof,
        data: {
          data1: -1,
          data2: -1,
        },
      }));
    }

    for (const { nextNodeIndex, alphaIndexArray, instIndex, recursive } of entries) {
      let validCount = 0;
      inner: for (const alphaIndex of alphaIndexArray) {
        if (alphaIndexIsRef(alphaIndex)) {
          // don't allow references
          continue inner;
        }

        validCount++;
      }

      if (validCount === 0) {
        continue;
      }

      const alphabetsStart = ctx.extra.getSize();
      ctx.extra.append(validCount);
      inner: for (const alphaIndex of alphaIndexArray) {
        if (alphaIndexIsRef(alphaIndex)) {
          continue inner;
        }

        ctx.extra.append(alphaIndex);
      }

      ctx.scratch.append(ctx.addEdgeInst({
        recursive: recursive,
        instIndex: instIndex,
        alphabets: alphabetsStart,
        alphabetsLength: validCount,
      }));
    }

    const slice = ctx.scratch.slice(scratchTop, ctx.scratch.getSize());
    const extraIndex = ctx.extra.getSize();
    ctx.extra.append(slice.getSize());
    ctx.extra.appendSlice(slice);
    return extraIndex;    
  } finally {
    ctx.scratch.setSize(scratchTop);
  }
}

function makeBuckets(ctx, nodeMembers) {
  const bucket = new Map();
  for (const nodeIndex of nodeMembers) {
    const node = ctx.getNode(nodeIndex);
    assert(node.tag === SubsetNode.Tag.edge, "Expected edge node");

    const entryIndex = node.data.data1;
    const alphaIndex = node.data.data2;

    // if (AlphabetOffset >= alphaIndex) {
    //   continue;
    // }

    const nextNodeIndex = ctx.subset.entries.at(entryIndex).node;
    if (bucket.has(nextNodeIndex)) {
      bucket.get(nextNodeIndex).push(alphaIndex);
    } else {
      bucket.set(nextNodeIndex, [alphaIndex]);
    }
  }

  return bucket;
}

function findReachableStateScope(ctx, scope, nodeIndex) {
  let currentScope = scope;
  while (true) {
    switch (currentScope.tag) {
      case DfaScope.Tag.top: {
        return null;
      }

      case DfaScope.Tag.state: {
        if (currentScope.nodeIndex === nodeIndex) {
          return currentScope;
        }

        currentScope = currentScope.parent;
        continue;
      }

      case DfaScope.Tag.edge: {
        currentScope = currentScope.parent;
        continue;
      }

      default: {
        assert(false, "Unreachable");
      }
    }
  }

  // let currentScope = scope;
  // while (scope !== null) {
  //   if (scope.nodeIndex === nodeIndex) {
  //     return scope;
  //   }

  //   scope = scope.parent;
  // }

  return null;
}


/*
state {
  nodeIndex: number;
  edges: array;
  labeled: boolean;
  accepting: boolean;
  if (accepting)
    token: number;
  else
    offset: number;
}


state {
  nodeIndex: number;
  edges: array;
};

stateLabeled {
  nodeIndex: number;
  edges: array;
};

stateAccepting {
  nodeIndex: number;
  token: number;
  edges: array;
};

stateAcceptingLabeled {
  nodeIndex: number;
  token: number;
  edges: array;
};

edge {
  instIndex: number;
  alphabets: array;
};

edgeOffset {
  instIndex: number;
  offset: number;
  alphabets: array;
}

edgeContinue {
  nodeIndex: number;
  alphabets: array;
};

*/

function stringify(str) {
  return JSON.stringify(str);
}

function traceScope(ctx, parentScope, nodeIndex) {
  let currentScope = parentScope;
  let str = nodeIndex === -1 ? "" : `\t@state(${Array.from(ctx.subset.entries.at(ctx.getNode(nodeIndex).data.data1).states, state => {
    return ctx.subset.nfa.states.at(state);
  }).join(", ")})\n`;

  loop: while (true) {
    switch (currentScope.tag) {
      case DfaScope.Tag.top: {
        str = str + "\t@top\n";
        break loop;
      }

      case DfaScope.Tag.state: {
        const node = ctx.getNode(currentScope.nodeIndex);
        const states = ctx.subset.entries.at(node.data.data1).states;

        str = str + `\t@state(${Array.from(states, state => {
          return ctx.subset.nfa.states.at(state);
        }).join(", ")})\n`;
        currentScope = currentScope.parent;
        continue loop;
      }

      case DfaScope.Tag.edge: {
        str = str + `\t@edge(${Array.from(currentScope.alphabets, alphaIndex => {
          if (alphaIndex >= AlphabetOffset) {
            return "'" + JSON.stringify(ctx.subset.alphabets.at(alphaIndex - AlphabetOffset)).slice(1, -1) + "'";
          } else if (alphaIndex === AlphabetReference.fail) {
            return "fail";
          } else if (alphaIndex === AlphabetReference.eof) {
            return "eof";
          }
        })})\n`;

        currentScope = currentScope.parent;
        continue loop;
      }

      default: {
        assert(false, "Unreachable");
      }
    }
  }

  return str;
}

