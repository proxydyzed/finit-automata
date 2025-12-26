import {
  ErrorState,
  StartState,
  AlphabetReference,
  AlphabetOffset,
} from "./nfa.js";

import {
  SubsetGen,
  Subset,
  SubsetNode,
  SubsetEntry,
} from "./strict-subset.js";

import {
  IndentingWriter,
  setsAreEqual,
} from "../utils/export.js";

export function toSubset(nfa, tokens) {
  const subset = new SubsetGen(nfa, tokens);
  const rootNode = subset.addNode({
    tag: SubsetNode.Tag.root,
    data: {
      data1: -1,
      data2: -1,
    },
  });
  subset.pushEntry({
    states: new Set([StartState]),
    found: nfa.accepting.has(StartState) ? StartState : ErrorState,
    node: rootNode,
  });

  const scratchTop = subset.scratch.getSize();
  try {
    for (const entryIndex of subset.worklist) {
      const node = handleEntry(subset, entryIndex);
      subset.scratch.append(node);
    }

    const scratchSlice = subset.scratch.slice(scratchTop, subset.scratch.getSize());
    subset.extra.appendSlice(scratchSlice);
    subset.nodes.at(rootNode).data.data1 = subset.extra.getSize() - scratchSlice.getSize();
    subset.nodes.at(rootNode).data.data2 = subset.extra.getSize();
  } finally {
    subset.scratch.setSize(scratchTop);
  }

  return Subset.from({
    nfa       : subset.nfa,
    tokens    : subset.tokens,
    alphabets : subset.alphabets,
    entries   : subset.entries,
    nodes     : subset.nodes,
    extra     : subset.extra,
  });
}

function handleEntry(subset, entryIndex) {
  const entry = subset.entries.at(entryIndex);
  const states = entry.states;
  const scratchTop = subset.scratch.getSize();
  try {
    for (const [, alphaIndex] of subset.nfa.alphabets) {
      handleEdge(subset, states, alphaIndex);
    }
    
    handleEdge(subset, states, AlphabetReference.fail);
    handleEdge(subset, states, AlphabetReference.eof);

    const scratchSlice = subset.scratch.slice(scratchTop, subset.scratch.getSize());
    const extraDataIndex = subset.extra.getSize();
    subset.extra.append(scratchSlice.getSize());
    subset.extra.appendSlice(scratchSlice);

    entry.node = subset.addNode({
      tag: SubsetNode.Tag.state,
      data: {
        data1: entryIndex,
        data2: extraDataIndex,
      },
    });

    return entry.node;
  } finally {
    subset.scratch.setSize(scratchTop);
  }
}

function handleEdge(subset, states, alphaIndex) {
  const { states: images, found } = deltas(subset, states, alphaIndex);

  if (images.size === 0) {
    return;
  }

  let entryIndex = subset.entries.findIndex(entry => setsAreEqual(entry.states, images));
  if (entryIndex === -1) {
    entryIndex = subset.pushEntry({
      states: images,
      found: found,
      node: -1,
    });
  }

  const node = subset.addNode({
    tag: SubsetNode.Tag.edge,
    data: {
      data1: entryIndex,
      data2: alphaIndex,
    },
  });

  subset.scratch.append(node);
}

function deltas(subset, states, alphaIndex) {
  if (alphaIndex === AlphabetReference.epsilon) {
    throw new Error(`Error, detected epsilon mapping`);
  }

  if (alphaIndex === AlphabetReference.sigma) {
    throw new Error(`Error, detected sigma mapping`);
  }

  const seen = new Set(Array.from({ length: 0 }, () =>
    // nfa state (@stateIndexB) that has edge (@alphaIndex) from state <- arguments.states (@stateIndexA)
    0,
  ));

  let foundIndex = ErrorState;
  outer: for (const stateIndexA of states) {
    const mapping = subset.nfa.mappings.get(stateIndexA);
    if (!mapping.has(alphaIndex)) {
      continue outer;
    }

    const nextStates = mapping.get(alphaIndex);
    inner: for (const stateIndexB of nextStates) {
      seen.add(stateIndexB);

      if (subset.nfa.accepting.has(stateIndexB)) {
        if (foundIndex === ErrorState) {
          foundIndex = stateIndexB;
          continue inner;
        } else if (foundIndex === stateIndexB) {
          continue inner;
        }

        const stateB = subset.nfa.states.at(stateIndexB);
        const found = subset.nfa.states.at(foundIndex);

        console.log({
          stateB,
          found,
        })

        const len = Math.max(stateB.length, found.length) + 1;

        let alpha;
        alpha: switch (alphaIndex) {
          case AlphabetReference.fail: alpha = "fail"; break alpha;
          case AlphabetReference.eof:  alpha = "elf"; break alpha;

          default: alpha = `'${subset.alphabets.at(alphaIndex - AlphabetOffset)}'`; break alpha;
        }

        const prefix = `${stateB} + ${alpha} -> `;
        throw new Error(`\
Duplicate accepting states found,
${prefix}${found.padEnd(len, " ")}@${subset.tokens.get(foundIndex)}
~${" ".repeat(prefix.length - 1)}^ first encountered here
${prefix}${stateB.padEnd(len, " ")}@${subset.tokens.get(stateIndexB)}
~${" ".repeat(prefix.length - 1)}^ duplicate here
`);
      }
    }
  }

  return SubsetEntry.from({ states: seen, found: foundIndex, node: -1 });
}

export function printSubset(subset) {
  const rootNode = subset.nodes.at(StartState);
  const decls = subset.extra.slice(rootNode.data.data1, rootNode.data.data2);
  const writer = new IndentingWriter();

  for (const decl of decls) {
    const node = subset.nodes.at(decl);
    printSubsetNode(subset, writer, node);
  }

  console.log(writer.buffer);
}

function printSubsetNode(subset, writer, node) {
  switch (node.tag) {
    case SubsetNode.Tag.state: {
      const entry = subset.entries.at(node.data.data1);

      writer.writeLine(`Node(%${node.data.data1}, ${entry.found !== ErrorState ? `"${subset.tokens.get(entry.found)}"` : "null"}, entries = {`);
      writer.indent++;
      for (const stateIndex of entry.states) {
        writer.writeLine(`State(${subset.nfa.states.at(stateIndex)}),`);
      }
      writer.indent--;

      if (subset.extra.at(node.data.data2) === 0) {
        writer.writeLine("}, edges = { });");
      } else {
        writer.writeLine("}, edges = {");
        writer.indent++;

        const extraDataIndex = node.data.data2;
        const extraDataLength = subset.extra.at(extraDataIndex);
        const extraSlice = subset.extra.slice(extraDataIndex + 1, extraDataIndex + 1 + extraDataLength);
        for (const index of extraSlice) {
          printSubsetNode(subset, writer, subset.nodes.at(index));
        }

        writer.indent--;
        writer.writeLine("});");
      }

      break;
    }

    case SubsetNode.Tag.edge: {
      writer.writeLine(`Edge(${JSON.stringify(subset.alphabets.at(node.data.data2 - AlphabetOffset))}, %${node.data.data1}),`);
      break;
    }

    default: {
      throw new Error(`Unexpected tag %${node.tag}`);
    }
  }
}
