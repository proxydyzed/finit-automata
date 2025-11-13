import { FiniteAutomata, ErrorState } from "./fa.js";
import { StateGraph } from "./graph.js";
import { ExhaustiveRecognizer, TokenRecognizer } from "./recognizer.js";

const fa = new FiniteAutomata();
const root = new StateGraph(fa, fa.start);
const stateToTagMap = new Map();

stateToTagMap.set(root.appendString("new"),   Symbol("new"));
stateToTagMap.set(root.appendString("not"),   Symbol("not"));
stateToTagMap.set(root.appendString("while"), Symbol("while"));
stateToTagMap.set(root.appendString("."),     Symbol("period"));

{
  root.addEdge(" ", root.start);
}

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

  stateToTagMap.set(node.start, Symbol("zero"));
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
  stateToTagMap.set(node.start, Symbol("number"));
}

// debug
// console.log(fa);
// console.log(JSON.stringify(fa, null, 2));

const input = "2101    new while.not";

const recognizer = new ExhaustiveRecognizer(fa);
console.assert(!recognizer.accepts(input));
console.assert(recognizer.accepts("2101"));
console.assert(recognizer.accepts("new"));
console.assert(!recognizer.accepts("new."));

const tokenizer = new TokenRecognizer(fa, input);
console.log(tok(tokenizer.next())); // number
console.log(tok(tokenizer.next())); // "new"
console.log(tok(tokenizer.next())); // "while"
console.log(tok(tokenizer.next())); // period
console.log(tok(tokenizer.next())); // "not"

function tok(token) {
  return {
    tag: stateToTagMap.get(token.state),
    str: input.slice(token.start, token.end),
  };
}
