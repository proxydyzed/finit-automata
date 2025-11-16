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
  console.log(setups.setup1().constructor?.name);
  console.log(setups.setup2().constructor?.name);
  console.log(setups.setup3().constructor?.name);
  console.log(setups.setup4().constructor?.name);
  console.log(setups.setup5().constructor?.name);
  console.log(setups.setup6().constructor?.name);
  console.log(setups.setup7().constructor?.name);
} catch (error) {
  console.log(error.message)
  console.log(error.stack);
}
