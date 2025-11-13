import { FiniteAutomata } from "./fa.js";
import { StateGraph } from "./graph.js";
import { ExhaustiveRecognizer } from "./recognizer.js";

// A six-character identifier consisting of an alphabetic character
// followed by zero to five alphanumeric characters
function question1() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);
  
  let alphabets = [];
  for (let i = 97; i <= 122; i++) {
    alphabets.push(String.fromCharCode(i));
  }

  let node1 = root.appendVertex(`state${fa.states.size - 1}`);

  // expect alphabetic charecter
  root.addEdges(alphabets, node1.start);

  // accept
  node1.accept();

  // add numbers to the alphabets
  for (let i = 0; i < 10; i++) {
    alphabets.push(String(i));
  }

  // maybe expect alphanumeric charecters (0...5)
  for (let i = 0; i < 5; i++) {
    const node2 = node1.appendVertex(`state${fa.states.size - 1}`);
    node1.addEdges(alphabets, node2.start);
    node2.accept();
    node1 = node2;
  }

  return fa;
}

// A string of one or more pairs, where each pair consists of an open
// parenthesis followed by a close parenthesis
function question2() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);

  const node1 = root.appendVertex("open");
  const node2 = root.appendVertex("closed");

  // expect '('
  root.addEdge("(", node1.start);

  // expect ')'
  node1.addEdge(")", node2.start);

  // maybe expect '('
  node2.addEdge("(", node1.start);
  node2.accept();

  return fa;
}


// A Pascal comment, which consists of an open brace, {, followed by
// zero or more characters drawn from an alphabet, 6, followed by a
// close brace, }
function question3() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);

  const node1 = root.appendVertex("{");
  const node2 = root.appendVertex("}");

  let alphabets = [" "];
  for (let i = 97; i <= 122; i++) {
    alphabets.push(String.fromCharCode(i));
  }

  // expect '{'
  root.addEdge("{", node1.start);

  // expect alphabets | '}'
  node1.addEdges(alphabets, node1.start);
  node1.addEdge("}", node2.start);

  // accept
  node2.accept();

  return fa;
}

{
  const fa = question1();
  const recognizer = new ExhaustiveRecognizer(fa);
  // console.log(fa);
  console.assert(recognizer.accepts("a"));       // true
  console.assert(!recognizer.accepts("1"));       // false
  console.assert(recognizer.accepts("a1"));      // true
  console.assert(!recognizer.accepts("abcdefg")); // false
}

{
  const fa = question2();
  const recognizer = new ExhaustiveRecognizer(fa);
  // console.log(fa);
  console.assert(!recognizer.accepts("("));    // false
  console.assert(!recognizer.accepts(")"));    // false
  console.assert(recognizer.accepts("()()")); // true
}

{
  const fa = question3();
  const recognizer = new ExhaustiveRecognizer(fa);
  // console.log(fa);
  console.assert(!recognizer.accepts("{ this comment does not work")); // false
  console.assert(!recognizer.accepts("neither does } this"));          // false
  console.assert(recognizer.accepts("{ this one does work }"));       // true
}
