import {
  nfa2dfa,
  minimizeDfa,
} from "../algs/export.js";
import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  ErrorState,
  KnownMappings,
  ExhaustiveRecognizer,
} from "../dst/export.js";
import {
  buildString,
} from "../tests/setups.js";

function convertToScanner({ nfa, tokens }) {
  const subset = nfa2dfa(nfa);
  const dfa1 = subset.toDfa();

  const entryNameMap = new Map();
  for (const entry of subset.entries) {
    // multiple states are ignored
    inner: for (const state of entry.states) {
      if (nfa.accepting.has(state)) {
        entryNameMap.set(entry.name, tokens.get(state));
        break inner;
      }
    }
  }

  const ctx = new ScannerCrafter(dfa1, entryNameMap);
  recurse(ctx, dfa1.start);
  console.log(ctx.buffer);
}

class ScannerCrafter {
  dfa;
  tokens;
  seen;
  reversedAlphabets;

  buffer = "";
  indent = 0;

  constructor(dfa, tokens) {
    this.dfa = dfa;
    this.tokens = tokens;
    this.seen = new Set();
    this.reversedAlphabets = new Map(Array.from(dfa.alphabets, ([k, v]) => [v, k]));
  }

  writeAll(str) {
    this.buffer += str;
  }

  writeLine(str) {
    this.buffer += "  ".repeat(this.indent) + str + "\n";
  }
}

function recurse(ctx, subsetStateA) {
  if (ctx.seen.has(subsetStateA)) {
    return;
  }

  ctx.seen.add(subsetStateA);

  const { dfa, tokens, reversedAlphabets } = ctx;
  const mapping = dfa.mappings.get(subsetStateA);

  if (mapping.size === 0) {
    return;
  } else if (mapping.size === 1) {
    const [[alphaIndex, subsetStateB]] = mapping;
    const alpha = reversedAlphabets.get(alphaIndex);

    ctx.writeLine(`if (source[index] == '${alpha}') {`);
    ctx.indent++;
    ctx.writeLine("index++;");

    if (dfa.accepting.has(subsetStateB)) {
      ctx.writeLine(`tag = Token.Tag.${tokens.get(subsetStateB)};`);
    }

    ctx.indent--;
    ctx.writeLine("}");
    return;
  }

  ctx.writeLine(`switch (source[index]) {`);
  ctx.indent++;
  for (const [alphaIndex, subsetStateB] of mapping) {
    const alpha = reversedAlphabets.get(alphaIndex);

    ctx.writeLine(`case '${alpha}': {`);
    ctx.indent++;
    ctx.writeLine(`index++;`);

    if (dfa.accepting.has(subsetStateB)) {
      ctx.writeLine(`tag = Token.Tag.${tokens.get(subsetStateB)};`);
      // ctx.writeLine(`tag = Token.get(${JSON.stringify(tokens.get(subsetStateB))});`);
    }

    recurse(ctx, subsetStateB);

    ctx.writeLine("break;");
    ctx.indent--;
    ctx.writeLine("}");
  }

  ctx.indent--;
  ctx.writeLine("}");
}

try {
  convertToScanner(rl());
} catch (error) {
  console.error(error);
}

function stringifyFA(fa) {
  return `\
Intermediate: DeterministicFiniteAutomata${String(fa.start)}
states: Set(${fa.states.size}){ ${Array.from(fa.states, state => state.description).join(", ")} }
accepting: Set(${fa.accepting.size}){ ${Array.from(fa.accepting, state => state.description)} }
mappings
${fa.stringifyMappings().trimEnd()}`;
}

function rl() {
  const nfa = new NondeterministicFiniteAutomata("n0");
  const tokens = new Map();

  tokens.set(buildString(nfa, "("),   "lParen");
  tokens.set(buildString(nfa, ")"),   "rParen");
  tokens.set(buildString(nfa, "{"),   "lBrace");
  tokens.set(buildString(nfa, "}"),   "rBrace");
  tokens.set(buildString(nfa, "["),   "lBracket");
  tokens.set(buildString(nfa, "]"),   "rBracket");

  tokens.set(buildString(nfa, ":"),   "colon");
  tokens.set(buildString(nfa, ";"),   "semicolon");

  tokens.set(buildString(nfa, "new"), "keywordNew");
  tokens.set(buildString(nfa, "now"), "keywordNow");

  tokens.set(buildString(nfa, "?"),   "question");

  tokens.set(buildString(nfa, "!"),   "bang");
  tokens.set(buildString(nfa, "+"),   "plus");
  tokens.set(buildString(nfa, "-"),   "minus");
  tokens.set(buildString(nfa, "*"),   "asterisk");
  tokens.set(buildString(nfa, "/"),   "slash");
  tokens.set(buildString(nfa, ","),   "comma");
  tokens.set(buildString(nfa, "."),   "period");

  tokens.set(buildString(nfa, "="),   "equal");

  tokens.set(buildString(nfa, "=="),  "equalEqual");
  tokens.set(buildString(nfa, "!="),  "bangEqual");
  tokens.set(buildString(nfa, "+="),  "plusEqual");
  tokens.set(buildString(nfa, "-="),  "minusEqual");
  tokens.set(buildString(nfa, "*="),  "asteriskEqual");
  tokens.set(buildString(nfa, "/="),  "slashEqual");

  tokens.set(buildString(nfa, "<"),   "lAngle");
  tokens.set(buildString(nfa, ">"),   "rAngle");
  tokens.set(buildString(nfa, "<="),  "lAngleEqual");
  tokens.set(buildString(nfa, ">="),  "rAngleEqual");

  tokens.set(buildString(nfa, "=>"),  "equalRAngle");

  return { nfa, tokens };

  {
    const alphabetVertex = nfa.addVertex("alphabets");

    for (const alpha of "abcdefghijklmnopqrstuvwxyz") {
      const index1 = nfa.addAlphabet(alpha);
      nfa.addEdge(index1, nfa.start, alphabetVertex);
      nfa.addEdge(index1, alphabetVertex, alphabetVertex);

      const index2 = nfa.addAlphabet(alpha.toUpperCase());
      nfa.addEdge(index2, nfa.start, alphabetVertex);
      nfa.addEdge(index2, alphabetVertex, alphabetVertex);
    }

    const numberVertex = nfa.addVertex("numbers");

    for (const alpha of "0123456789") {
      const index = nfa.addAlphabet(alpha);
      nfa.addEdge(index, nfa.start, numberVertex);
      nfa.addEdge(index, numberVertex, numberVertex);
      nfa.addEdge(index, alphabetVertex, alphabetVertex);
    }

    {
      const index = nfa.addAlphabet("_");
      nfa.addEdge(index, nfa.start, alphabetVertex);
      nfa.addEdge(index, alphabetVertex, alphabetVertex);
    }

    nfa.accepting.add(alphabetVertex);
    nfa.accepting.add(numberVertex);
  }

  return { nfa, tokens };
}

/**
 * @param {string[]} iter 
 */
function clusterChars(iter, fixOrder = false) {
  const mapping = new Map(Array.from({ length: 0 }, () => [
    // character code point
    0,
    // clusters array index
    0,
  ]));

  const entries = Array.from({ length: 0 }, () => 0);
  let uniqueIndex = 0;

  for (const alpha of iter) {
    const codePoint = alpha.codePointAt(0);
    const c1 = codePoint - 1;
    const c2 = codePoint + 1;

    if (mapping.has(c1)) {
      const merge1 = mapping.get(c1);
      if (mapping.has(c2)) {
        const merge2 = mapping.get(c2);
        entries[merge1] = entries[merge2];
      }

      mapping.set(codePoint, merge1);
    } else if (mapping.has(c2)) {
      const merge2 = mapping.get(c2);
      mapping.set(codePoint, merge2);
    } else {
      // const cluster = { deref: Symbol(`s${entries.length}`), alpha, codePoint };
      const entry = uniqueIndex;
      uniqueIndex++;

      mapping.set(codePoint, entries.length);
      entries.push(entry);
    }
  }

  if (fixOrder) {
    const seen = new Set();
    return new Map(Array.from(mapping, ([k, v]) => [k, seen.add(entries[v]).size - 1]));
  }

  return new Map(Array.from(mapping, ([k, v]) => [k, entries[v]]));
}

function bucketCluster(mapping) {
  const bucket = new Map();
  for (const [k, v] of mapping) {
    const entry = v;
    if (bucket.has(entry)) {
      bucket.get(entry).push(k);
    } else {
      bucket.set(entry, [k]);
    }
  }

  return Array.from(bucket.values());
}
