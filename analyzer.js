(function (root) {
  const supported = /\.(?:[cm]?[jt]sx?|py)$/i;
  const ignored =
    /(^|\/)(?:node_modules|\.git|dist|build|coverage|\.venv|venv|__pycache__|vendor|\.next)(\/|$)/;
  function normalize(path) {
    const out = [];
    for (const p of path.replace(/\\/g, "/").split("/")) {
      if (p === "..") out.pop();
      else if (p && p !== ".") out.push(p);
    }
    return out.join("/");
  }
  function mask(source) {
    return source.replace(
      /\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
      (m) => m.replace(/[^\n]/g, " "),
    );
  }
  function analyze(input) {
    const files = input
      .filter((f) => supported.test(f.path) && !ignored.test(f.path))
      .map((f) => ({ ...f, path: normalize(f.path) }));
    const nodes = [],
      edges = [],
      functions = [],
      imports = [];
    const paths = new Set(files.map((f) => f.path));
    const addEdge = (source, target, kind) => {
      if (!edges.some((e) => e.source === source && e.target === target && e.kind === kind))
        edges.push({ source, target, kind });
    };
    function resolve(path, spec, python) {
      const dir = path.split("/").slice(0, -1).join("/");
      let base;
      if (python) {
        if (spec.startsWith(".")) {
          const dots = spec.match(/^\.+/)[0].length;
          base = normalize(
            dir + "/" + "../".repeat(dots - 1) + spec.slice(dots).replace(/\./g, "/"),
          );
        } else base = spec.replace(/\./g, "/");
      } else {
        if (!spec.startsWith(".")) return null;
        base = normalize(dir + "/" + spec);
      }
      const choices = [
        base,
        ...[
          ".js",
          ".jsx",
          ".ts",
          ".tsx",
          ".mjs",
          ".cjs",
          ".py",
          "/index.js",
          "/index.ts",
          "/index.tsx",
          "/__init__.py",
        ].map((x) => base + x),
      ];
      if (/\.js$/.test(base)) choices.push(base.slice(0, -3) + ".ts", base.slice(0, -3) + ".tsx");
      return choices.find((x) => paths.has(x)) || null;
    }
    for (const f of files) {
      const id = "file:" + f.path,
        py = f.path.endsWith(".py"),
        clean = mask(f.content),
        lines = f.content.split("\n");
      nodes.push({
        id,
        type: "file",
        label: f.path.split("/").pop(),
        path: f.path,
        line: 1,
        lines: lines.length,
        language: py ? "Python" : /tsx?$/.test(f.path) ? "TypeScript" : "JavaScript",
        code: f.content,
      });
      const specs = [];
      let m;
      const re = py
        ? /(?:^|\n)\s*(?:from\s+([.\w]+)\s+import|import\s+([^\n#]+))/g
        : /\b(?:import|export)\s+(?:[^;\n]*?\s+from\s*)?["']([^"']+)["']|\b(?:require|import)\s*\(\s*["']([^"']+)["']\s*\)/g;
      const importSource = f.content
        .replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, " "))
        .replace(/^\s*(?:\/\/|#).*$/gm, "");
      while ((m = re.exec(importSource))) {
        if (py && m[2]) specs.push(...m[2].split(",").map((x) => x.trim().split(/\s+/)[0]));
        else specs.push(m[1] || m[2]);
      }
      for (const spec of new Set(specs)) {
        const local = resolve(f.path, spec, py);
        if (local) {
          addEdge(id, "file:" + local, "import");
          imports.push({ file: f.path, spec, target: local });
        } else {
          const relative = spec.startsWith("."),
            name = relative
              ? spec
              : py
                ? spec.split(".")[0]
                : spec.startsWith("@")
                  ? spec.split("/").slice(0, 2).join("/")
                  : spec.split("/")[0];
          const lid = (relative ? "unresolved:" + f.path + ":" : "lib:") + name;
          if (!nodes.some((n) => n.id === lid))
            nodes.push({
              id: lid,
              type: relative ? "unresolved" : "library",
              label: name,
              path: relative ? f.path : spec,
              line: 0,
            });
          addEdge(id, lid, relative ? "unresolved" : "import");
        }
      }
      const patterns = py
        ? [/^([\t ]*)(?:async\s+)?def\s+(\w+)\s*\(/gm]
        : [
            /\b(?:async\s+)?function\s+(\w+)\s*\(/g,
            /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/g,
          ];
      const found = [];
      for (const pattern of patterns) {
        while ((m = pattern.exec(clean))) {
          let start = m.index;
          if (py) start += m[1].length;
          const name = py ? m[2] : m[1];
          let end = clean.length,
            body = start;
          if (py) {
            const lineStart = clean.lastIndexOf("\n", start - 1) + 1,
              indent = start - lineStart;
            body = clean.indexOf("\n", start);
            if (body < 0) body = clean.length;
            const rest = clean.slice(body + 1);
            const boundary = /^([\t ]*)\S/gm;
            let b;
            while ((b = boundary.exec(rest))) {
              const prefix = b[1];
              if (prefix.includes("\n")) continue;
              if (prefix.length <= indent) {
                end = body + 1 + b.index;
                break;
              }
            }
          } else {
            const brace = clean.indexOf("{", start),
              arrow = clean.indexOf("=>", start),
              isArrow = pattern === patterns[1];
            if (
              isArrow &&
              brace !== clean.slice(0, arrow + 2).length + clean.slice(arrow + 2).search(/\S/)
            ) {
              body = arrow + 2;
              const semi = clean.indexOf(";", body),
                nl = clean.indexOf("\n", body);
              end = Math.min(...[semi, nl, clean.length].filter((x) => x >= body));
            } else if (brace >= 0) {
              body = brace + 1;
              let depth = 1,
                i = body;
              while (i < clean.length && depth) {
                if (clean[i] === "{") depth++;
                if (clean[i] === "}") depth--;
                i++;
              }
              end = i;
            }
          }
          const line = f.content.slice(0, start).split("\n").length;
          const fn = {
            id: "fn:" + f.path + ":" + line + ":" + name,
            type: "function",
            label: name,
            path: f.path,
            line,
            endLine: f.content.slice(0, end).split("\n").length,
            code: f.content.slice(start, end),
            start,
            end,
            body,
            clean,
          };
          found.push(fn);
          functions.push(fn);
          nodes.push(fn);
        }
      }
      for (const fn of found) addEdge(id, fn.id, "contains");
    }
    const keywords = new Set([
      "if",
      "for",
      "while",
      "switch",
      "catch",
      "function",
      "return",
      "super",
      "print",
      "len",
      "range",
      "str",
      "int",
      "list",
      "dict",
      "set",
      "console",
    ]);
    for (const fn of functions) {
      const body = fn.clean.slice(fn.body, fn.end);
      const calls = /\b([A-Za-z_$][\w$]*)\s*\(/g;
      let c;
      while ((c = calls.exec(body))) {
        const absolute = fn.body + c.index;
        if (
          functions.some(
            (other) =>
              other !== fn &&
              other.path === fn.path &&
              other.start > fn.start &&
              other.start <= absolute &&
              other.end > absolute,
          )
        )
          continue;
        if (keywords.has(c[1])) continue;
        let targets = functions.filter((x) => x.label === c[1] && x.path === fn.path);
        if (!targets.length) {
          const allowed = imports.filter((x) => x.file === fn.path).map((x) => x.target);
          targets = functions.filter((x) => x.label === c[1] && allowed.includes(x.path));
        }
        if (targets.length === 1) addEdge(fn.id, targets[0].id, "call");
      }
    }
    for (const n of nodes) {
      delete n.clean;
      delete n.start;
      delete n.end;
      delete n.body;
    }
    return {
      nodes,
      edges,
      files: files.length,
      functions: functions.length,
      libraries: nodes.filter((n) => n.type === "library").length,
      calls: edges.filter((e) => e.kind === "call").length,
    };
  }
  root.CodeFlowAnalyzer = { analyze, supported, ignored };
})(typeof globalThis !== "undefined" ? globalThis : window);
