function showFunctionDetails(n) {
  const host = $("details");
  const heading = (text) => {
    const h = document.createElement("h3");
    h.textContent = text;
    host.append(h);
  };
  const paragraph = (text) => {
    const p = document.createElement("p");
    p.textContent = text;
    host.append(p);
  };
  heading("Ne işe yarıyor?");
  if (n.documentation) {
    const block = document.createElement("blockquote");
    block.textContent = n.documentation;
    host.append(block);
  }
  paragraph(n.summary);
  paragraph(n.summaryBasis);
  heading("Parametreler");
  const signature = document.createElement("pre");
  signature.textContent = n.signature;
  host.append(signature);
  const focus = document.createElement("button");
  focus.className = "link";
  focus.textContent = "Çağrı zincirini şemada göster";
  focus.onclick = () => {
    switchGraphTab("overview");
    focusedFunction = n.id;
    selectedFile = null;
    view = "functions";
    $("search").value = "";
    document
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    renderFiles();
    render();
  };
  host.append(focus);
  heading("Çağrı noktaları");
  if (!n.callSites.length) paragraph("Çağrı saptanmadı.");
  for (const call of n.callSites) {
    const item = document.createElement("div");
    item.className = "call-site";
    const b = document.createElement(call.target ? "button" : "strong");
    b.textContent = call.name + " · satır " + call.line;
    if (call.target) {
      b.className = "link";
      b.onclick = () => detail(model.nodes.find((x) => x.id === call.target));
    }
    const code = document.createElement("code");
    code.textContent = call.source;
    const p = document.createElement("p");
    p.textContent = call.resolution;
    item.append(b, code, p);
    host.append(item);
  }
  heading("Dönüşler");
  if (!n.returns.length) paragraph("Açık dönüş ifadesi bulunamadı.");
  for (const ret of n.returns)
    paragraph("Satır " + ret.line + ": " + ret.expression + (ret.implicit ? " (örtük dönüş)" : ""));
  heading("Kod içindeki adımlar");
  paragraph(
    "Kaynak satırı sırası gösterilir. Gerçek çalışma sırası koşullara ve iç içe çağrılara bağlıdır.",
  );
  const list = document.createElement("ol");
  list.className = "steps";
  for (const step of n.steps) {
    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = "Satır " + step.line + " · " + step.label;
    const code = document.createElement("code");
    code.textContent = step.source;
    li.append(label, code);
    list.append(li);
  }
  host.append(list);
}
