import { FiniteAutomata } from "./fa.js";
import { StateGraph } from "./graph.js";
import { Recognizer } from "./recognizer.js";

function question1() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);
  
  let str = [];
  for (let i = 97; i <= 122; i++) {
    str.push(String.fromCharCode(i));
  }

  let node1 = root.appendVertex(fa.states.size - 1);
  root.addEdges(str, node1.start);

  for (let i = 0; i < 10; i++) {
    str.push(String(i));
  }

  for (let i = 0; i < 5; i++) {
    const node2 = node1.appendVertex(fa.states.size - 1);
    node1.addEdges(str, node2.start);
    node1 = node2;
  }

  node1.accept();
  return fa;
}

function question2() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);

  const node1 = root.appendVertex("open");
  const node2 = root.appendVertex("closed");

  root.addEdge("(", node1.start);
  node1.addEdge(")", node2.start);
  node2.addEdge("(", node1.start);

  node2.accept();

  return fa;
}

function question3() {
  const fa = new FiniteAutomata();
  const root = new StateGraph(fa, fa.start);

  const node1 = root.appendVertex("{");
  const node2 = root.appendVertex("}");

  let str = [];
  for (let i = 97; i <= 122; i++) {
    str.push(String.fromCharCode(i));
  }

  root.addEdge("{", node1.start);
  node1.addEdges(str, node1.start);
  node1.addEdge(" ", node1.start);
  node1.addEdge("}", node2.start);
  node2.accept();

  return fa;
}

{
  const fa = question1();
  const recognizer = new Recognizer(fa);
  // console.log(fa);
  console.log(recognizer.accepts("gktwla"));  // true
  console.log(recognizer.accepts("s1f5gd"));  // true
  console.log(recognizer.accepts("abcde"));   // false
  console.log(recognizer.accepts("abcdefg")); // false
  console.log("-- end --");
}

// {
//   const fa = question2();
//   const recognizer = new Recognizer(fa);
//   // console.log(fa);
//   console.log(recognizer.accepts("("));    // false
//   console.log(recognizer.accepts(")"));    // false
//   console.log(recognizer.accepts("()()")); // true
//   console.log("-- end --");
// }


// {
//   const fa = question3();
//   const recognizer = new Recognizer(fa);
//   // console.log(fa);
//   console.log(recognizer.accepts("{ this comment does not work")); // false
//   console.log(recognizer.accepts("neither does } this"));          // false
//   console.log(recognizer.accepts("{ this one does work }"));       // true
//   console.log("-- end --");
// }
