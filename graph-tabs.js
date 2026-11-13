let graphTabs = [],
  activeGraphTab = "overview",
  graphDirection = "LR";
function tabState() {
  const wrap = $("canvasWrap");
  return {
    view,
    selectedFile,
    focusedFunction,
    selectedGraphNode,
    query: $("search").value,
    zoom,
    direction: graphDirection,
    left: wrap.scrollLeft,
    top: wrap.scrollTop,
  };
}
function saveGraphTab() {
  const tab = graphTabs.find((t) => t.id === activeGraphTab);
  if (tab) tab.state = tabState();
}
function resetGraphTabs() {
  graphDirection = "LR";
  activeGraphTab = "overview";
  graphTabs = [{ id: "overview", nodeId: null, label: "Genel harita", state: tabState() }];
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
  renderGraphTabs();
  updateDirectionButton();
}
function activeNodeTab() {
  return graphTabs.find((t) => t.id === activeGraphTab)?.nodeId || null;
}
function relatedGraph(model, nodeId) {
  const node = model.nodes.find((n) => n.id === nodeId);
  if (!node) return { nodes: [], edges: [] };
  const edges = model.edges.filter(
    (e) =>
      (e.source === nodeId || e.target === nodeId) &&
      (node.type !== "function" || e.kind === "call"),
  );
  const ids = new Set([nodeId]);
  edges.forEach((e) => {
    ids.add(e.source);
    ids.add(e.target);
  });
  return { nodes: [node, ...model.nodes.filter((n) => n.id !== nodeId && ids.has(n.id))], edges };
}
function switchGraphTab(id) {
  if (!graphTabs.some((t) => t.id === id)) return;
  saveGraphTab();
  activeGraphTab = id;
  const tab = graphTabs.find((t) => t.id === id),
    s = tab.state;
  view = s.view;
  selectedFile = s.selectedFile;
  focusedFunction = s.focusedFunction;
  selectedGraphNode = s.selectedGraphNode;
  zoom = s.zoom;
  graphDirection = s.direction;
  $("search").value = s.query;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", !tab.nodeId && b.dataset.view === view));
  renderGraphTabs();
  updateDirectionButton();
  renderFiles();
  render();
  if (tab.nodeId) {
    const n = model.nodes.find((n) => n.id === tab.nodeId);
    if (n) detail(n);
  } else {
    document.body.classList.add("details-hidden");
    $("toggleDetails").setAttribute("aria-pressed", "false");
  }
  if (tab.fresh) {
    fitGraph();
    tab.fresh = false;
  } else {
    $("canvasWrap").scrollLeft = s.left;
    $("canvasWrap").scrollTop = s.top;
  }
}
function openNodeTab(node) {
  if (!node) return;
  const id = "node:" + node.id;
  if (!graphTabs.some((t) => t.id === id))
    graphTabs.push({
      id,
      nodeId: node.id,
      label: node.label,
      fresh: true,
      state: {
        view,
        selectedFile: null,
        focusedFunction: null,
        selectedGraphNode: node.id,
        query: "",
        zoom: 1,
        direction: graphDirection,
        left: 0,
        top: 0,
      },
    });
  switchGraphTab(id);
}
function closeGraphTab(id) {
  if (id === "overview") return;
  const index = graphTabs.findIndex((t) => t.id === id);
  if (index < 0) return;
  const next = graphTabs[index - 1]?.id || "overview";
  if (activeGraphTab === id) switchGraphTab(next);
  graphTabs = graphTabs.filter((t) => t.id !== id);
  renderGraphTabs();
}
function renderGraphTabs() {
  const host = $("graphTabs");
  host.replaceChildren();
  for (const tab of graphTabs) {
    const item = document.createElement("div");
    item.className = "graph-tab" + (tab.id === activeGraphTab ? " active" : "");
    const button = document.createElement("button");
    button.textContent = tab.label;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(tab.id === activeGraphTab));
    button.setAttribute("aria-controls", "canvasWrap");
    button.title = tab.nodeId
      ? model.nodes.find((n) => n.id === tab.nodeId)?.path || tab.label
      : "Tüm proje";
    button.onclick = () => switchGraphTab(tab.id);
    item.append(button);
    if (tab.nodeId) {
      const close = document.createElement("button");
      close.className = "close-tab";
      close.textContent = "×";
      close.setAttribute("aria-label", tab.label + " sekmesini kapat");
      close.onclick = () => closeGraphTab(tab.id);
      item.append(close);
    }
    host.append(item);
  }
}
function updateDirectionButton() {
  const b = $("graphDirection");
  b.textContent = graphDirection === "TB" ? "Yön: Yukarıdan aşağı" : "Yön: Soldan sağa";
  b.setAttribute("aria-pressed", String(graphDirection === "TB"));
}
function initGraphTabs() {
  $("graphDirection").onclick = () => {
    graphDirection = graphDirection === "LR" ? "TB" : "LR";
    updateDirectionButton();
    render();
    fitGraph();
  };
  resetGraphTabs();
}
