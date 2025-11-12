import { FiniteAutomata, ErrorState } from "./fa.js";
import { StateGraph } from "./graph.js";
import { Recognizer } from "./recognizer.js";

const fa = new FiniteAutomata();
const root = new StateGraph(fa, fa.start);

root.appendString("new");
root.appendString("not");
root.appendString("while");

{
  // add an edge to zero (number)
  // ```pseudo-code
  // delta(s(0), '0') == s(zero)
  // ```
  // 
  const node = root.appendVertex("zero");
  root.addEdge("0", node.start);
  //          ^

  // make the node an accepting state
  // tecnically '0' is a number, any
  // digits following it are errors
  node.accept();
}

{
  const nums = Array.from({ length: 9 }, (_, i) => String(i + 1));

  // add edges for 1 to 9
  // ```pseudo-code
  // delta(s(0), '1'...'9') == s(numbers)
  // ```
  // 
  const node = root.appendVertex("numbers");
  root.addEdges(nums, node.start);
  //          ^

  // add the cyclic loop for 0 to 9
  // ```pseudo-code
  // delta(s(numbers), '0'...'9') == s(numbers)
  // ```
  //
  node.addEdge("0", node.start);
  node.addEdges(nums, node.start);

  // make the node an accepting state
  node.accept();
}

// debug
// console.log(fa);
// console.log(JSON.stringify(fa, null, 2));

const recognizer = new Recognizer(fa);
console.log(recognizer.accepts("2101")); // true
console.log(recognizer.accepts("new"));  // true
console.log(recognizer.accepts("new.")); // false
