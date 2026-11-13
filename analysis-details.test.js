if(typeof require==='function'){require('./analyzer.js');require('./analysis-details.js')}
(function(){
const assert=(value,message)=>{if(!value)throw new Error(message)};
const analyze=files=>CodeFlowDetails.enrich(CodeFlowAnalyzer.analyze(files));
const py=analyze([{path:'test.py',content:'import requests\n\ndef send(value):\n    """Send an event."""\n    if value:\n        requests.post("https://example.com", json=value)\n    return value\n\ndef run():\n    send(1)\n    send(2)\n'}]);
const send=py.nodes.find(n=>n.label==='send');const edge=py.edges.find(e=>e.kind==='call');
assert(send.documentation==='Send an event.','Python docstring');
assert(send.parameters==='value'&&send.returns[0].line===7,'Parameters and return lines');
assert(send.callSites[0].name==='requests.post'&&send.callSites[0].line===6,'External call location');
assert(send.summary.includes('HTTP'),'Evidence-based operation summary');
assert(edge.sites.length===2&&edge.sites[0].line===10&&edge.sites[1].arguments==='2','Repeated call sites');
const js=analyze([{path:'a.js',content:'/** Save a value. */\nfunction save(value) { return value; }\nconst run = x => save(save(x));\nfunction other() { obj.save(1); }'}]);
const save=js.nodes.find(n=>n.label==='save'),run=js.nodes.find(n=>n.label==='run'),other=js.nodes.find(n=>n.label==='other');
assert(save.documentation==='Save a value.','JSDoc');
assert(run.parameters==='x'&&run.returns[0].implicit,'Arrow signature and implicit return');
assert(run.callSites.length===2&&run.callSites[0].arguments==='save(x)','Nested calls and arguments');
assert(!other.callSites[0].target,'Do not confuse object methods with same-name functions');
const recursive=analyze([{path:'r.py',content:'def again():\n    again()'}]);
assert(recursive.calls===1,'Recursion');
assert(analyze([]).nodes.length===0,'Empty input');
console.log('Passed detailed analysis: documentation, signatures, returns, call sites, nested calls, external calls, recursion.');
})();
