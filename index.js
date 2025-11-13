import {
  FiniteAutomata,
  ErrorState,
  StateGraph,
  ExhaustiveRecognizer,
  TokenRecognizer,
} from "./dst/export.js";

const fa = new FiniteAutomata();
const root = new StateGraph(fa, fa.start);
const stateToTagMap = new Map();

stateToTagMap.set(root.appendString("new"),   Symbol("new"));
stateToTagMap.set(root.appendString("not"),   Symbol("not"));
stateToTagMap.set(root.appendString("while"), Symbol("while"));
stateToTagMap.set(root.appendString("."),     Symbol("period"));

// TODO:
// invent complementary character and add comments
// {
//   const node1 = root.appendVertex("maybe-comment");
//   const node2 = root.appendVertex("definitely-comment");
//   root.addEdge("/", node1.start);
//   node1.accept();
//   node1.addEdge("/", node2.start);
//   node2.addEdge(???) // consume till '\n'
//   node2.addEdge("\n", root.start);
// }

{
  root.addEdge(" ", root.start);
  root.addEdge("\n", root.start);
  root.addEdge("\r", root.start);
  root.addEdge("\t", root.start);
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
  // technically '0' is a number, any
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

// identifiers are tricky.
// recklessly adding edges might break some
// keywords. so we have to walk the graph and
// add "identifier" edge to the end of all
// keywords. and also make every keyword node
// an accepting node.
{
  const alphabets = ["_"];
  for (let i = 97; i <= 122; i++) {
    alphabets.push(String.fromCharCode(i));
  }

  const alphanumeric = [...alphabets];
  for (let i = 0; i < 10; i++) {
    alphanumeric.push(String(i));
  }

  const ident = root.appendVertex("identifier");
  const identTag = Symbol("identifier");
  ident.addEdges(alphanumeric, ident.start);
  ident.accept();
  stateToTagMap.set(ident.start, identTag);

  const workList = [root];
  while (workList.length > 0) {
    const node1 = workList.pop();
    for (const alpha of alphabets) {
      if (node1.hasEdge(alpha)) {
        // if an edge exists, add it to the work list
        const node2 = node1.getVertex(alpha);
        workList.push(node2);

        // if it is not already an accepting state
        // that means it is safe to overwrite it to
        // the "identifier" state
        if (!fa.accepting.has(node2.start)) {
          node2.accept();
          stateToTagMap.set(node2.start, identTag);
        }
      } else {
        // otherwise, add an edge to "identifier"

        // TODO: add an empty matchmaker so that 
        // the graph does not look as horrible as
        // right now after adding every single 
        // alphanumeric character to every vertex 
        // in the keyword recognition path.
        node1.addEdge(alpha, ident.start);
      }
    }
  }
}

// debug
// console.log(fa);
// console.log(JSON.stringify(fa, null, 2));

const input = `2101    new
while .not n news nothing awhile`;

const recognizer = new ExhaustiveRecognizer(fa);
console.assert(!recognizer.accepts(input));
console.assert(recognizer.accepts("2101"));
console.assert(recognizer.accepts("new"));
console.assert(!recognizer.accepts("new."));

// TODO:
// somehow convey to the tokenizer to emit
// an eof token instead of throwing an error
// at the end of input
const tokenizer = new TokenRecognizer(fa, input);
try {
  console.log(tok(tokenizer.next())); // number
  console.log(tok(tokenizer.next())); // "new"
  console.log(tok(tokenizer.next())); // "while"
  console.log(tok(tokenizer.next())); // period
  console.log(tok(tokenizer.next())); // "not"
  console.log(tok(tokenizer.next())); // "n"
  console.log(tok(tokenizer.next())); // "news"
  console.log(tok(tokenizer.next())); // "nothing"
  console.log(tok(tokenizer.next())); // "awhila"
} catch (error) {
  console.error(error);
}

function tok(token) {
  return {
    tag: stateToTagMap.get(token.state),
    str: input.slice(token.start, token.end),
  };
}
