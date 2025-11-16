import {
  DeterministicFiniteAutomata,
  NondeterministicFiniteAutomata,
  ErrorState,
  ExhaustiveRecognizer,
  KnownMappings,
} from "../dst/export.js";
import {
  minimizeDfa,
} from "../algs/export.js";
import * as setups from "./setups.js";

try {
  const dfa = setups.setup1();
  const recognizer = new ExhaustiveRecognizer(dfa);
  const entries = [
    { input: "01010", output: true },
  ];
  
  for (const { input, output } of entries) {
    console.assert(output === recognizer.accepts(input), `Failed to recognize "${input}"`);
  }
} catch (error) {
  console.log(error.message)
  console.log(error.stack);
}
