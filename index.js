import { FiniteAutomata, ErrorState } from "./fa.js";
import { StateGraph } from "./graph.js";
import { Recognizer } from "./recognizer.js";

const fa = new FiniteAutomata();

const graph = new StateGraph(fa, fa.start);

graph.appendString("new");
graph.appendString("not");
graph.appendString("while");

const graph1 = graph.appendVertex("zero");

// add an edge to zero (number)
// ```pseudo
// delta(s(0), '0') == s(zero)
// ```
// 
graph.addEdge("0", graph1.start);
graph1.accept();

const nums = Array.from({ length: 9 }, (_, i) => String(i + 1));
const graph2 = graph.appendVertex("numbers");
for (const alpha of nums) {
  graph.addEdge(alpha, graph2.start);
}

graph2.addEdge("0", graph2.start);
for (const alpha of nums) {
  graph2.addEdge(alpha, graph2.start);
}

graph2.accept();

const recognizer = new Recognizer(fa);

// console.log(fa);

console.log(recognizer.accepts("2101"));
console.log(recognizer.accepts("new"));

// console.log(JSON.stringify(fa, null, 2));
// console.log(fa.append("new"));
