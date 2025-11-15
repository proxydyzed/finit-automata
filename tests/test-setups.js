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
import {
  setup1,
  setup2,
  setup3,
} from "./setups.js";

try {
  const dfa = setup2();
  const recognizer = new ExhaustiveRecognizer(dfa);
  
  // console.assert(recognizer.accepts("a"),   `Failed to recognize "a"`);
  // console.log(dfa);
  // console.assert(recognizer.accepts("fie"),   `Failed to recognize "fie"`);
  // console.assert(recognizer.accepts("fee"),   `Failed to recognize "fee"`);
  // console.assert(!recognizer.accepts("fe"),   `Failed to recognize "fe"`);
  // console.assert(!recognizer.accepts("feee"), `Failed to recognize "feee"`);
  // console.assert(!recognizer.accepts("fii"),  `Failed to recognize "fii"`);

  console.log(dfa);

  const context = minimizeDfa(dfa);
  console.log(context);
  console.log(context.partitions.join("\n"));
} catch (error) {
  console.error(error.stack);
}
