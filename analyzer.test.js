// Run with Node.js: node analyzer.test.js
if(typeof require==='function')require('./analyzer.js');
(function(){
function assert(value,message){if(!value)throw new Error(message)}
const analyze=globalThis.CodeFlowAnalyzer.analyze;
const py=analyze([{path:'main.py',content:'from services.orders import create_order\n\ndef checkout(cart):\n    return create_order(cart)\n'},{path:'services/orders.py',content:'import sqlite3\n\ndef create_order(cart):\n    return save_order(cart)\n\ndef save_order(cart):\n    return cart\n'}]);
assert(py.files===2&&py.functions===3&&py.calls===2&&py.libraries===1,'Python counts and cross-file calls');
assert(!py.nodes.find(n=>n.label==='create_order').code.includes('def save_order'),'Python function boundaries');
const ts=analyze([{path:'src/main.ts',content:'import { save } from "./store.js";\nexport function run() { return save(); }\nconst twice = () => run();'},{path:'src/store.ts',content:'export function save() { return 1; }'}]);
assert(ts.functions===3&&ts.calls===2,'TypeScript functions and arrow calls');
assert(ts.edges.some(e=>e.source==='file:src/main.ts'&&e.target==='file:src/store.ts'),'JS extension resolves to TS');
const ignored=analyze([{path:'node_modules/a.js',content:'function ignored() {}'},{path:'a.js',content:'// function fake() {}\nfunction real() { const s="fake()"; real(); }'}]);
assert(ignored.files===1&&ignored.functions===1&&ignored.calls===1,'Ignored files, comments, strings and recursion');
const relative=analyze([{path:'pkg/a.py',content:'from .b import next_step\ndef start():\n    next_step()'},{path:'pkg/b.py',content:'def next_step():\n    pass'}]);
assert(relative.calls===1&&relative.libraries===0,'Python relative imports');
const empty=analyze([]);assert(empty.nodes.length===0&&empty.edges.length===0,'Empty projects');
console.log('Passed: Python boundaries and imports, TypeScript imports and calls, recursion, exclusions, comments, empty input.');
})();
