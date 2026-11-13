let graphSize = { width: 1, height: 1 },
  selectedGraphNode = null;
function drawGraph(nodes, edges) {
  const svg = $("graph"),
    map = CodeFlowLayout.layout(nodes, edges, graphDirection);
  graphSize = map;
  svg.setAttribute("viewBox", `0 0 ${map.width} ${map.height}`);
  svg.innerHTML =
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker></defs>';
  const el = (tag, attrs) => {
    const e = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, value] of Object.entries(attrs)) e.setAttribute(key, value);
    return e;
  };
  for (const { edge, d, points } of map.routes) {
    const group = el("g", {
      class: "connection",
      "data-source": edge.source,
      "data-target": edge.target,
      tabindex: "0",
      role: "button",
      "aria-label": `${nodes.find((n) => n.id === edge.source).label} → ${nodes.find((n) => n.id === edge.target).label}`,
    });
    const path = el("path", { d, class: "edge", "marker-end": "url(#arrow)" }),
      hit = el("path", { d, class: "edge-hit" });
    const title = el("title", {});
    title.textContent = edge.sites
      ? edge.sites.map((s) => "Satır " + s.line + ": " + s.source).join("\n")
      : edge.kind === "contains"
        ? "İçerir"
        : "İçe aktarım";
    group.append(path, hit, title);
    if (edge.sites) {
      const label = el("text", { x: points[0][0] + 8, y: points[0][1] - 8, class: "edge-label" });
      label.textContent = edge.sites.length + " çağrı";
      group.append(label);
    }
    const activate = () => {
      document.querySelectorAll(".connection.pinned").forEach((g) => g.classList.remove("pinned"));
      group.classList.add("pinned");
      const source = model.nodes.find((n) => n.id === edge.source);
      detail(source);
    };
    group.onclick = activate;
    group.onkeydown = (e) => {
      if (e.key === "Enter") {
        activate();
      }
    };
    svg.append(group);
  }
  for (const n of nodes) {
    const p = map.positions.get(n.id),
      g = el("g", {
        class: "node",
        "data-id": n.id,
        tabindex: "0",
        role: "button",
        "aria-label": n.label,
        transform: `translate(${p.x},${p.y})`,
      }),
      color = n.type === "function" ? "#a584df" : n.type === "library" ? "#5cbda1" : "#6686ed";
    g.append(
      el("rect", {
        class: "node-card",
        width: map.nodeWidth,
        height: map.nodeHeight,
        rx: 9,
        fill: "#1b2330",
        stroke: "#364254",
      }),
    );
    g.append(el("rect", { x: 0, y: 17, width: 3, height: 42, rx: 2, fill: color }));
    const name = el("text", { x: 16, y: 30, fill: "#e2e8f0", "font-size": 13, "font-weight": 600 });
    name.textContent = n.label.length > 29 ? n.label.slice(0, 27) + "…" : n.label;
    const sub = el("text", { x: 16, y: 53, fill: "#a5b2c5", "font-size": 11 });
    const label =
      n.type === "library"
        ? "Harici / standart modül"
        : n.type === "unresolved"
          ? "Çözümlenemeyen import"
          : n.type === "function"
            ? n.path + ":" + n.line
            : n.language + " · " + n.lines + " satır";
    sub.textContent = label.length > 34 ? label.slice(0, 32) + "…" : label;
    const title = el("title", {});
    title.textContent = n.label + "\n" + n.path + (n.line ? ":" + n.line : "");
    g.append(name, sub, title);
    g.onclick = () => openNodeTab(n);
    g.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openNodeTab(n);
      }
    };
    svg.append(g);
  }
  if (!nodes.length) {
    const text = el("text", { x: 40, y: 80, fill: "#a5b2c5", "font-size": 14 });
    text.textContent = "Bu görünümde eşleşen öğe yok. Filtreleri temizleyin.";
    svg.append(text);
  }
  applyGraphZoom();
  highlightGraph(selectedGraphNode);
}
function highlightGraph(id) {
  selectedGraphNode = id;
  const connections = [...document.querySelectorAll(".connection")],
    neighbors = new Set([id]);
  connections.forEach((g) => {
    if (g.dataset.source === id || g.dataset.target === id) {
      neighbors.add(g.dataset.source);
      neighbors.add(g.dataset.target);
    }
  });
  const present = [...document.querySelectorAll(".node")].some((n) => n.dataset.id === id);
  connections.forEach((g) => {
    const active = g.dataset.source === id || g.dataset.target === id;
    g.classList.toggle("related", present && active);
    g.classList.toggle("muted", present && !active);
  });
  document.querySelectorAll(".node").forEach((g) => {
    g.classList.toggle("selected", g.dataset.id === id);
    g.classList.toggle("muted", present && !neighbors.has(g.dataset.id));
  });
}
function applyGraphZoom() {
  const svg = $("graph");
  svg.setAttribute("width", graphSize.width * zoom);
  svg.setAttribute("height", graphSize.height * zoom);
  $("zoomLevel").textContent = Math.round(zoom * 100) + "%";
}
function changeGraphZoom(next, anchor) {
  const wrap = $("canvasWrap"),
    old = zoom;
  zoom = Math.max(0.08, Math.min(2.5, next));
  const x = anchor?.x ?? wrap.clientWidth / 2,
    y = anchor?.y ?? wrap.clientHeight / 2;
  const left = (wrap.scrollLeft + x) / old,
    top = (wrap.scrollTop + y) / old;
  applyGraphZoom();
  wrap.scrollLeft = left * zoom - x;
  wrap.scrollTop = top * zoom - y;
}
function fitGraph() {
  if (!model) return;
  const wrap = $("canvasWrap");
  zoom = Math.min(
    1,
    Math.max(
      0.08,
      Math.min(
        (wrap.clientWidth - 24) / graphSize.width,
        (wrap.clientHeight - 24) / graphSize.height,
      ),
    ),
  );
  applyGraphZoom();
  wrap.scrollLeft = 0;
  wrap.scrollTop = 0;
}
function initGraphControls() {
  $("fitGraph").onclick = fitGraph;
  $("zoomIn").onclick = () => changeGraphZoom(zoom * 1.2);
  $("zoomOut").onclick = () => changeGraphZoom(zoom / 1.2);
  $("expandMap").onclick = () => {
    const expanded = document.body.classList.toggle("map-expanded");
    if (expanded) {
      document.body.classList.add("details-hidden");
      $("toggleDetails").setAttribute("aria-pressed", "false");
    }
    $("expandMap").textContent = expanded ? "Normal görünüm" : "Haritayı büyüt";
    $("expandMap").setAttribute("aria-pressed", String(expanded));
  };
  $("toggleFiles").onclick = () => {
    const hidden = document.body.classList.toggle("files-hidden");
    $("toggleFiles").setAttribute("aria-pressed", String(!hidden));
  };
  $("toggleDetails").onclick = () => {
    const hidden = document.body.classList.toggle("details-hidden");
    $("toggleDetails").setAttribute("aria-pressed", String(!hidden));
  };
  const wrap = $("canvasWrap");
  let drag = null,
    moved = false;
  wrap.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".node,.connection,button")) return;
    drag = { x: e.clientX, y: e.clientY, left: wrap.scrollLeft, top: wrap.scrollTop };
    moved = false;
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add("dragging");
  });
  wrap.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    wrap.scrollLeft = drag.left - dx;
    wrap.scrollTop = drag.top - dy;
  });
  const end = () => {
    if (drag && !moved) highlightGraph(null);
    drag = null;
    wrap.classList.remove("dragging");
  };
  wrap.addEventListener("pointerup", end);
  wrap.addEventListener("pointercancel", end);
  wrap.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      changeGraphZoom(zoom * Math.exp(-e.deltaY * 0.002), {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    { passive: false },
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.body.classList.remove("map-expanded");
      $("expandMap").textContent = "Haritayı büyüt";
      $("expandMap").setAttribute("aria-pressed", "false");
      highlightGraph(null);
    }
  });
}
