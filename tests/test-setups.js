import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  ErrorState,
  ExhaustiveRecognizer,
  KnownMappings,
} from "../dst/export.js";
import {
  minimizeDfa,
  subsetConstruction,
} from "../algs/export.js";
import * as setups from "./setups.js";

try {
  const dfa = setups.setup3();
  const recognizer = new ExhaustiveRecognizer(dfa);
  const entries = [
    { input: "fie", output: true },
  ];
  
  for (const { input, output } of entries) {
    console.assert(output === recognizer.accepts(input), `Failed to recognize "${input}"`);
  }

  // console.log(dfa);
  // console.log(dfa.stringifyMappings())

  const context = minimizeDfa(dfa);
  // console.log(context);
  // console.log(context.partitions.join("\n"));
} catch (error) {
  console.error(error.stack);
}
