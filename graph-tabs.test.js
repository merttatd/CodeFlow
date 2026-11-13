const fs = require("node:fs"),
  vm = require("node:vm"),
  path = require("node:path");
class Element {
  constructor() {
    this.children = [];
    this.value = "";
    this.dataset = {};
    this.attrs = {};
    this.clientWidth = 1200;
    this.clientHeight = 700;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this.namespaceURI = "http://www.w3.org/2000/svg";
    this.classes = new Set();
    this.classList = {
      add: (x) => this.classes.add(x),
      remove: (x) => this.classes.delete(x),
      toggle: (x, v) => {
        const yes = v === undefined ? !this.classes.has(x) : v;
        if (yes) this.classes.add(x);
        else this.classes.delete(x);
        return yes;
      },
    };
  }
  append(...children) {
    this.children.push(...children);
  }
  replaceChildren(...children) {
    this.children = children;
  }
  setAttribute(k, v) {
    this.attrs[k] = v;
    if (k === "class") this.classes = new Set(v.split(" "));
    if (k.startsWith("data-")) this.dataset[k.slice(5)] = v;
  }
  removeAttribute(k) {
    delete this.attrs[k];
  }
  addEventListener() {}
  set innerHTML(s) {
    this.children = [];
    this.html = s;
  }
  get innerHTML() {
    return this.html || "";
  }
}
const elements = new Map(),
  body = new Element(),
  tabs = ["files", "functions", "libraries"].map((view) => {
    const e = new Element();
    e.dataset.view = view;
    return e;
  });
const all = () => {
  const out = [];
  const visit = (e) => {
    out.push(e);
    e.children.forEach(visit);
  };
  elements.forEach(visit);
  return out;
};
const document = {
  body,
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  },
  querySelectorAll(s) {
    return s === "[data-view]"
      ? tabs
      : all().filter((e) =>
          s
            .split(".")
            .filter(Boolean)
            .every((c) => e.classes.has(c)),
        );
  },
  createElement() {
    return new Element();
  },
  createElementNS() {
    return new Element();
  },
  addEventListener() {},
};
const fixture = [
  {
    path: "test.py",
    content:
      "def checkout():\n    create_order()\n    notify()\n\ndef create_order():\n    save_order()\n\ndef save_order():\n    pass\n\ndef notify():\n    pass\n",
  },
];
const context = {
  document,
  console,
  setTimeout,
  fixture,
  assert(value, message) {
    if (!value) throw Error(message);
  },
};
vm.createContext(context);
for (const file of [
  "analyzer.js",
  "analysis-details.js",
  "function-details.js",
  "graph-layout.js",
  "graph-view.js",
  "graph-tabs.js",
  "app.js",
])
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), context);
vm.runInContext(
  `
load(fixture,'Test');view='functions';render();
const checkout=model.nodes.find(n=>n.label==='checkout'),notify=model.nodes.find(n=>n.label==='notify'),save=model.nodes.find(n=>n.label==='save_order');
zoom=.75;$('canvasWrap').scrollLeft=40;$('canvasWrap').scrollTop=90;
openNodeTab(checkout);
assert(graphTabs.length===2,'One new tab');
assert(activeNodeTab()===checkout.id,'Tab anchored to clicked node');
const neighborhood=relatedGraph(model,checkout.id);
assert(neighborhood.nodes.some(n=>n.id===notify.id),'Direct outgoing neighbor');
assert(!neighborhood.nodes.some(n=>n.id===save.id),'Exclude indirect neighbor');
const notifyGraph=relatedGraph(model,notify.id);
assert(notifyGraph.nodes.some(n=>n.id===checkout.id),'Direct incoming neighbor');
assert(neighborhood.edges.every(e=>e.source===checkout.id||e.target===checkout.id),'Only root incident edges');
$('graphDirection').onclick();assert(graphDirection==='TB','Toggle vertical');
openNodeTab(notify);assert(graphTabs.length===3,'Follow another card into a tab');
openNodeTab(checkout);assert(graphTabs.length===3,'Reuse existing tab');
assert(graphDirection==='TB','Restore per-tab direction');
switchGraphTab('overview');assert(zoom===.75,'Restore overview zoom');assert($('canvasWrap').scrollLeft===40&&$('canvasWrap').scrollTop===90,'Restore overview position');assert(graphDirection==='LR','Restore overview direction');
openNodeTab(checkout);closeGraphTab(activeGraphTab);assert(activeGraphTab==='overview','Close active tab');
load(fixture,'Reload');assert(graphTabs.length===1&&activeGraphTab==='overview','New project clears old tabs');
const isolated={nodes:[{id:'alone',type:'function'}],edges:[]};assert(relatedGraph(isolated,'alone').nodes.length===1,'Isolated node remains visible');
`,
  context,
);
console.log(
  "Passed graph tabs: direct neighbors, navigation, deduplication, per-tab direction/zoom/scroll, closing and project reset.",
);
