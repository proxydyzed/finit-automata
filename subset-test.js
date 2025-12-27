import {
  NFA,
  NFABuilder,
  AlphabetOffset,
  AlphabetReference,
  StartState,
  ErrorState,
  SubsetNode,
  toSubset,
  printSubset,
} from "./nfa/export.js";

// non-revealing import
// should probably do something about this
import {
  buildString,
} from "./nfa/nfa-builder.js";

import {
  generate,
  runIr,
} from "./gen/export.js";

import { join } from "node:path";
import { writeFile } from "node:fs/promises";

const alphabetStart = "abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const alphabetContinue = "abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

try {
  const { nfa, tokens } = constructNFA();
  const subset = toSubset(nfa, tokens);
  const ir = generate(subset);
  const source = runIr(subset, ir);
  await writeFile(join(import.meta.dirname, "lexer-generated.txt"), String(source));
  console.log("DONE");
} catch (error) {
  console.error(error);
}

function constructNFA() {
  const builder = new NFABuilder(new NFA("start"));
  // builder.addString("new", "keywordNew");
  // builder.nfa.accepting.delete(buildString(builder.nfa, "%%();"));

  builder.addEdges(" \n\r\t", StartState, StartState);

  {
    const stateIndex = builder.nfa.addVertex("eof");
    builder.nfa.addEdge(AlphabetReference.eof, StartState, stateIndex);
    builder.accept(stateIndex, "eof");
  }

  {
    const stateIndex = builder.nfa.addVertex("invalid");
    builder.accept(stateIndex, "invalid");
    builder.nfa.addEdge(AlphabetReference.fail, StartState, stateIndex);
  }

  builder.addString("+" , "plus");
  builder.addString("-" , "minus");
  builder.addString("*" , "asterisk");
  builder.addString("/" , "slash");

  builder.addString("(" , "lParen");
  builder.addString(")" , "rParen");
  builder.addString("{" , "lBrace");
  builder.addString("}" , "rBrace");
  builder.addString("[" , "lBracket");
  builder.addString("]" , "rBracket");

  builder.addString(":" , "colon");
  builder.addString(";" , "semicolon");

  builder.addString("?" , "question");
  builder.addString("!" , "bang");

  builder.addString("," , "comma");
  builder.addString("." , "period");
  builder.addString("..." , "period3");

  builder.addString("=" , "equal");
  builder.addString("==", "equalEqual");
  builder.addString("!=", "bangEqual");
  builder.addString("+=", "plusEqual");
  builder.addString("-=", "minusEqual");
  builder.addString("*=", "asteriskEqual");
  builder.addString("/=", "slashEqual");

  builder.addString("<" , "lAngle");
  builder.addString(">" , "rAngle");
  builder.addString("<=", "lAngleEqual");
  builder.addString(">=", "rAngleEqual");
  builder.addString("=>", "equalRAngle");

  {
    const stateIndex = builder.nfa.addVertex("number");
    builder.addEdges("0123456789", StartState, stateIndex);
    builder.addEdges("0123456789", stateIndex, stateIndex);
    builder.accept(stateIndex, "number");
  }

  {
    const stateIndex = builder.nfa.addVertex("identifier");
    builder.addEdges("abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ", StartState, stateIndex);
    builder.addEdges("abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", stateIndex, stateIndex);
    builder.accept(stateIndex, "identifier");
  }

  {
    const alphaIndex1 = builder.nfa.addAlpha("\"");
    const alphaIndex2 = builder.nfa.addAlpha("\\");
    const stateIndexA = StartState;
    const stateIndexB = builder.nfa.addVertex("string-incomplete");
    const stateIndexC = builder.nfa.addVertex("string");
    const stateIndexD = builder.nfa.addVertex("string-invalid");
    const stateIndexE = builder.nfa.addVertex("string-escape");
    const stateIndexF = builder.nfa.addVertex("string-escape-invalid");
    // starting '"'
    builder.nfa.addEdge(alphaIndex1, stateIndexA, stateIndexB);
    // ending '"'
    builder.nfa.addEdge(alphaIndex1, stateIndexB, stateIndexC);
    // escape'\\.'
    //        ^^
    builder.nfa.addEdge(alphaIndex2, stateIndexB, stateIndexE);
    // escape char '\\.'
    //                ^
    builder.addEdges("\\nrtbf", stateIndexE, stateIndexB);
    // any other character
    builder.nfa.addEdge(AlphabetReference.fail, stateIndexB, stateIndexB);
    builder.nfa.addEdge(AlphabetReference.fail, stateIndexE, stateIndexF);

    builder.accept(stateIndexB, "incomplete_string");
    builder.accept(stateIndexC, "string");
    builder.accept(stateIndexD, "invalid_string");
    builder.accept(stateIndexF, "invalid_string_escape");
  }

  {
    const alphaIndex = builder.nfa.addAlpha("/");
    const stateIndexA = StartState;
    const stateIndexB = builder.nfa.addVertex("maybe-comment");
    const stateIndexC = builder.nfa.addVertex("comment");
    const stateIndexD = builder.nfa.addVertex("last-comment");
    builder.nfa.addEdge(alphaIndex, stateIndexA, stateIndexB);
    builder.nfa.addEdge(alphaIndex, stateIndexB, stateIndexC);
    builder.nfa.addEdge(builder.nfa.addAlpha("\n"), stateIndexC, stateIndexA);
    builder.nfa.addEdge(AlphabetReference.eof, stateIndexC, stateIndexA);
    builder.nfa.addEdge(AlphabetReference.fail, stateIndexC, stateIndexC);
    builder.accept(stateIndexD, "eof");
  }

  // builder.accept(StartState, "invalid");

  return builder;
}

function constructNFA2() {
  const builder = new NFABuilder(new NFA("start"));
  // builder.addString("red", "RED1");
  // builder.addVertex("v1", stateIndex => {
  //   builder.addEdges("abcdef", stateIndex, builder.addVertex("v2", stateIndex => {
  //     builder.addEdges("d", stateIndex, builder.addVertex("v3", stateIndex => {
  //       builder.accept(stateIndex, "RED!");
  //       return stateIndex;
  //     }));
  //     return stateIndex;
  //   }))
  // });

  builder.addEdges("r", StartState, builder.addVertex("v1", stateIndexA => {
    builder.addEdges("abcdef", stateIndexA, builder.addVertex("v2", stateIndexB => {
      builder.addEdges("d", stateIndexB, builder.addVertex("v3", stateIndexC => {
        builder.accept(stateIndexC, "RED!")
        return stateIndexC;
      }));
      return stateIndexB;
    }));
    return stateIndexA;
  }));

  builder.addString("red", "RED2");
  return builder;
//   const alphabetStart = "abcdef";
//   const alphabetContinue = "abcdef01";
//   for (const alpha of alphabetContinue) {
//     builder.nfa.addAlpha(alpha);
//   }
//   // const embeddedText = builder.nfa.addVertex("embededText");
//   // const embeddedTextTrailing = builder.nfa.addVertex("embededTextTrailing");
//   // builder.accept(embeddedTextTrailing, "embeddedTextTrailing");
//   // const embeddedText1 = builder.addSentinelString("</script", StartState, embeddedTextTrailing);
//   // builder.accept(embeddedText1, "script");

//   // const embeddedText2 = builder.addSentinelString("</style", StartState, embeddedTextTrailing);
//   // builder.accept(embeddedText2, "style");

//   const ident = builder.nfa.addVertex("identifier");

//   for (const [str, token] of [
//     // ["a",     "_a"],
//     // ["ac",     "_ac"],
//     // ["ade",    "_ade"],
//   ]) {
//     const stateIndexA = builder.addSentinelString(str, ident, ident);
//     const stateIndexB = builder.nfa.addVertex(`keyword(${token})`);

//     builder.addEdges(alphabetContinue, stateIndexA, ident);
//     // builder.nfa.addEdge(AlphabetReference.fail, stateIndexA, stateIndexB);
//     // builder.nfa.addEdge(AlphabetReference.eof,  stateIndexA, stateIndexB);

//     console.log(builder.nfa.states.at(stateIndexA));
//     builder.accept(stateIndexB, token);
//   }

//   // const stateIndexA = builder.addSentinelString("for",     ident, ident), "keywordFor";
//   // const stateIndexA = builder.addSentinelString("false",   ident, ident), "keywordFalse";
//   // const stateIndexA = builder.addSentinelString("finally", ident, ident), "keywordFinally";

//   builder.addEdges(alphabetStart,    StartState, ident);
//   builder.addEdges(alphabetContinue, ident,      ident);

//   builder.accept(ident, "identifier");

//   builder.addVertex("a", stateIndexA => {
//     builder.addEdges("a", StartState, stateIndexA);

//     const stateIndexB = builder.addVertex("a_", null);
//     for (const alphaIndex of [AlphabetReference.fail, AlphabetReference.eof]) {
//       builder.nfa.addEdge(alphaIndex, stateIndexA, stateIndexB);
//     }

//     builder.accept(stateIndexB, "_a");
//   });

//   // console.log(builder.nfa.mappings);
//   // throw 1;

//   // let stateIndexA = StartState;
//   // for (const c of "</script") {
//   //   const stateIndexB = builder.nfa.addVertex(`'${c}'`);
//   //   const alphaIndex = builder.nfa.addAlpha(c);
//   //   builder.nfa.addEdge(alphaIndex, stateIndexA, stateIndexB);
//   //   builder.nfa.addEdge(AlphabetReference.fail, stateIndexA, StartState);
//   //   builder.nfa.addEdge(AlphabetReference.eof, stateIndexA, embeddedTextTrailing);

//   //   stateIndexA = stateIndexB;
//   // }

//   // builder.accept(stateIndexA, "embeddedText");

//   // builder.addString(".", "Tag.period");
//   // builder.addString("...", "Tag.period3");
//   // builder.addString("==", "Tag.equalEqual");

//   // const stateIndexA = StartState;
//   // const stateIndexB = builder.nfa.addVertex("b");
//   // const stateIndexC = builder.nfa.addVertex("c");

//   // builder.nfa.addEdge(builder.nfa.addAlpha("a"), stateIndexA, stateIndexB);
//   // builder.nfa.addEdge(builder.nfa.addAlpha("b"), stateIndexB, stateIndexC);
//   // builder.nfa.addEdge(builder.nfa.addAlpha("c"), stateIndexC, stateIndexA);

//   return builder;
}

// function _() {
//   switch (source[lexer.index]) {
//     case '.': {
//       lexer.index++;
//       tag = Tag.period;
//       switch (source[lexer.index]) {
//         case '.': {
//           switch (source[lexer.index + 1]) {
//             case '.': {
//               lexer.index += 2;
//               tag = Tag.period3;
//               break;
//             }
//           }
//           break;
//         }
//       }
//       break;
//     }
//   }
// }