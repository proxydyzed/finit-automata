import {
  FiniteAutomata,
  ErrorState,
  StateGraph,
  ExhaustiveRecognizer,
  TokenRecognizer,
} from "../dst/export.js";

const fa = new FiniteAutomata();
const root = new StateGraph(fa, fa.start);

root.addEdges([" ", "\n", "\r", "\t"], root.start);

const nums = root.appendVertex("numbers");
root.addEdges([  1,2,3,4,5,6,7,8,9].map(String), nums.start);
nums.addEdges([0,1,2,3,4,5,6,7,8,9].map(String), nums.start);
nums.accept();

const zero = root.appendVertex("zero");
root.addEdge("0", zero.start);
zero.accept();

const stateToTagMap = new Map([
  [root.appendString("+"), Symbol("plus")],
  [root.appendString("-"), Symbol("minus")],
  [root.appendString("*"), Symbol("star")],
  [root.appendString("/"), Symbol("slash")],
  [zero.start,             Symbol("zero")],
  [nums.start,             Symbol("numbers")],
]);

const source = "1 + 2 / 3";
const tokenizer = new TokenRecognizer(fa, source);
console.log(tok(tokenizer.next()));
console.log(tok(tokenizer.next()));
console.log(tok(tokenizer.next()));
console.log(tok(tokenizer.next()));
console.log(tok(tokenizer.next()));

function tok(token) {
  return {
    tag: String(stateToTagMap.get(token.state).description),
    str: source.slice(token.start, token.end),
  };
}
