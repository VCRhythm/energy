/* Barabasi–Albert preferential attachment + live degree distribution.
   New nodes attach to m existing nodes chosen with probability ∝ degree
   ("the rich get richer"), producing a scale-free, power-law network. */
(function () {
  "use strict";
  const canvas = document.getElementById("net-canvas");
  if (!canvas) return;

  let ctx, w, h;
  const rng = CX.mulberry32(2024);
  let nodes = [];   // {x,y,vx,vy,deg}
  let edges = [];   // [i,j]
  let targetList = []; // for preferential attachment sampling
  let m = 2;        // edges added per new node
  let chart;

  const loop = CX.AnimationLoop(grow);

  function setup() {
    const dims = CX.fitCanvas(canvas, 0.62);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    if (!nodes.length) init();
    layoutTick();
    draw();
  }

  function newNode() {
    return { x: w / 2 + (rng() - 0.5) * 60, y: h / 2 + (rng() - 0.5) * 60, vx: 0, vy: 0, deg: 0 };
  }

  function init() {
    nodes = []; edges = []; targetList = [];
    // seed: small connected core
    for (let i = 0; i < 3; i++) nodes.push(newNode());
    connect(0, 1); connect(1, 2); connect(2, 0);
    addManyUntil(15);
    updateChart();
  }

  function connect(i, j) {
    edges.push([i, j]);
    nodes[i].deg++; nodes[j].deg++;
    targetList.push(i, j); // each endpoint added -> degree-proportional sampling
  }

  function grow() {
    addNode();
    layoutTick();
    draw();
    updateChart();
    const nEl = document.getElementById("net-nodes");
    const eEl = document.getElementById("net-edges");
    const maxEl = document.getElementById("net-maxdeg");
    if (nEl) nEl.textContent = nodes.length;
    if (eEl) eEl.textContent = edges.length;
    if (maxEl) maxEl.textContent = Math.max(...nodes.map((n) => n.deg));
    if (nodes.length >= 220) {
      loop.stop();
      const btn = document.getElementById("net-play");
      if (btn) { btn.textContent = "▶ Grow"; btn.classList.add("primary"); }
    }
  }

  function addNode() {
    const idx = nodes.length;
    nodes.push(newNode());
    const chosen = new Set();
    const mm = Math.min(m, idx);
    let guard = 0;
    while (chosen.size < mm && guard < 500) {
      guard++;
      let t;
      if (targetList.length === 0) t = Math.floor(rng() * idx);
      else t = targetList[Math.floor(rng() * targetList.length)];
      if (t !== idx) chosen.add(t);
    }
    chosen.forEach((t) => connect(idx, t));
  }

  function addManyUntil(n) { while (nodes.length < n) addNode(); }

  /* ---------- light force-directed layout ---------- */
  function layoutTick() {
    const k = 32;            // ideal spring length influence
    const repulse = 900;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      let fx = 0, fy = 0;
      // repulsion (sampled for performance on big graphs)
      const sample = nodes.length > 120 ? 0.5 : 1;
      for (let j = 0; j < nodes.length; j++) {
        if (i === j || rng() > sample) continue;
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy + 0.01;
        const f = repulse / d2;
        fx += dx * f / sample * 0.5;
        fy += dy * f / sample * 0.5;
      }
      // gentle pull to center
      fx += (w / 2 - a.x) * 0.006;
      fy += (h / 2 - a.y) * 0.006;
      a.vx = (a.vx + fx) * 0.82;
      a.vy = (a.vy + fy) * 0.82;
    }
    // springs
    for (const [i, j] of edges) {
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - k) * 0.02;
      const ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f;
      b.vx -= ux * f; b.vy -= uy * f;
    }
    for (const n of nodes) {
      n.x = Math.max(6, Math.min(w - 6, n.x + n.vx));
      n.y = Math.max(6, Math.min(h - 6, n.y + n.vy));
    }
  }

  function draw() {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    // edges
    ctx.strokeStyle = "rgba(129,140,248,0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [i, j] of edges) {
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
    }
    ctx.stroke();
    // nodes — size & color by degree (hubs stand out)
    const maxDeg = Math.max(1, ...nodes.map((n) => n.deg));
    for (const n of nodes) {
      const t = n.deg / maxDeg;
      const r = 2.5 + Math.sqrt(n.deg) * 1.6;
      ctx.fillStyle = CX.heat(0.2 + 0.8 * t);
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- degree distribution (log-log) ---------- */
  function degreeDist() {
    const counts = {};
    for (const n of nodes) counts[n.deg] = (counts[n.deg] || 0) + 1;
    return Object.keys(counts)
      .map(Number)
      .filter((k) => k > 0)
      .sort((a, b) => a - b)
      .map((k) => ({ x: k, y: counts[k] }));
  }

  function initChart() {
    const el = document.getElementById("net-chart");
    if (!el || !window.Chart) return;
    chart = new Chart(el.getContext("2d"), {
      type: "scatter",
      data: { datasets: [{
        label: "nodes with degree k",
        data: [], showLine: false,
        pointBackgroundColor: "#5eead4", pointRadius: 4,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
          x: { type: "logarithmic", title: { display: true, text: "degree k (log)" } },
          y: { type: "logarithmic", title: { display: true, text: "count (log)" } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
  function updateChart() {
    if (!chart) return;
    chart.data.datasets[0].data = degreeDist();
    chart.update();
  }

  let layoutLoop = CX.AnimationLoop(() => { layoutTick(); draw(); });

  CX.bindButton("net-play", function () {
    const running = loop.toggle();
    this.textContent = running ? "⏸ Pause" : "▶ Grow";
    this.classList.toggle("primary", !running);
    if (running) layoutLoop.start(); else layoutLoop.stop();
  });
  CX.bindButton("net-reset", () => { init(); layoutLoop.stop(); draw(); updateChart(); });
  CX.bindSlider("net-m", (v) => (m = Math.round(v)), (v) => Math.round(v));

  CX.onResize(setup);
  initChart();
  loop.setFps(6);
  layoutLoop.setFps(40);
  setup();
})();
