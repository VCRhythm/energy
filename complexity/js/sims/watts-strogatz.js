/* Watts–Strogatz small-world model.
   Start from a ring lattice (each node linked to K nearest neighbors), rewire each
   edge with probability p. The classic result: a tiny bit of rewiring collapses the
   average path length while clustering stays high -> "small world". */
(function () {
  "use strict";
  const canvas = document.getElementById("ws-canvas");
  if (!canvas) return;

  let ctx, w, h;
  const N = 60, K = 4; // K nearest neighbors on each side total
  let p = 0.0;
  const rng = CX.mulberry32(7);
  let chart;

  function ringGraph(prob) {
    const adj = Array.from({ length: N }, () => new Set());
    // base ring lattice: connect to K/2 neighbors each side
    for (let i = 0; i < N; i++) {
      for (let j = 1; j <= K / 2; j++) {
        adj[i].add((i + j) % N);
        adj[(i + j) % N].add(i);
      }
    }
    // rewire
    for (let i = 0; i < N; i++) {
      for (let j = 1; j <= K / 2; j++) {
        const target = (i + j) % N;
        if (rng() < prob) {
          adj[i].delete(target);
          adj[target].delete(i);
          let nt, guard = 0;
          do { nt = Math.floor(rng() * N); guard++; }
          while ((nt === i || adj[i].has(nt)) && guard < 50);
          adj[i].add(nt); adj[nt].add(i);
        }
      }
    }
    return adj;
  }

  function clustering(adj) {
    let sum = 0, count = 0;
    for (let i = 0; i < N; i++) {
      const nb = [...adj[i]];
      const deg = nb.length;
      if (deg < 2) continue;
      let links = 0;
      for (let a = 0; a < nb.length; a++)
        for (let b = a + 1; b < nb.length; b++)
          if (adj[nb[a]].has(nb[b])) links++;
      sum += (2 * links) / (deg * (deg - 1));
      count++;
    }
    return count ? sum / count : 0;
  }

  function avgPathLength(adj) {
    let total = 0, pairs = 0;
    for (let s = 0; s < N; s++) {
      const dist = new Array(N).fill(-1);
      dist[s] = 0;
      const q = [s];
      while (q.length) {
        const u = q.shift();
        for (const v of adj[u]) if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); }
      }
      for (let t = 0; t < N; t++) if (t !== s && dist[t] > 0) { total += dist[t]; pairs++; }
    }
    return pairs ? total / pairs : 0;
  }

  let baseC = 1, baseL = 1, curveData = null;

  function precomputeCurve() {
    // average over a few realizations for each p (log-spaced)
    const ps = [0, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1];
    const Cs = [], Ls = [];
    const r0 = ringGraph(0);
    baseC = clustering(r0); baseL = avgPathLength(r0);
    for (const pp of ps) {
      let cAcc = 0, lAcc = 0; const R = 8;
      for (let r = 0; r < R; r++) {
        const g = ringGraph(pp);
        cAcc += clustering(g); lAcc += avgPathLength(g);
      }
      Cs.push((cAcc / R) / baseC);
      Ls.push((lAcc / R) / baseL);
    }
    curveData = { ps, Cs, Ls };
  }

  function setup() {
    const dims = CX.fitCanvas(canvas, 1);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    drawNetwork();
  }

  let currentAdj = null;
  function drawNetwork() {
    currentAdj = ringGraph(p);
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.4;
    const pos = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      pos.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
    }
    // edges: short ring edges dim, long-range (rewired) shortcuts bright
    for (let i = 0; i < N; i++) {
      for (const j of currentAdj[i]) {
        if (j <= i) continue;
        const ringDist = Math.min(Math.abs(i - j), N - Math.abs(i - j));
        const isShortcut = ringDist > K / 2;
        ctx.strokeStyle = isShortcut ? "rgba(244,114,182,0.7)" : "rgba(129,140,248,0.25)";
        ctx.lineWidth = isShortcut ? 1.4 : 1;
        ctx.beginPath();
        ctx.moveTo(pos[i][0], pos[i][1]);
        ctx.lineTo(pos[j][0], pos[j][1]);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "#5eead4";
    for (let i = 0; i < N; i++) {
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // readouts for this instance
    const cEl = document.getElementById("ws-c");
    const lEl = document.getElementById("ws-l");
    if (cEl) cEl.textContent = clustering(currentAdj).toFixed(3);
    if (lEl) lEl.textContent = avgPathLength(currentAdj).toFixed(2);
  }

  function initChart() {
    const el = document.getElementById("ws-chart");
    if (!el || !window.Chart) return;
    chart = new Chart(el.getContext("2d"), {
      type: "line",
      data: {
        labels: curveData.ps.map((v) => v),
        datasets: [
          { label: "C(p)/C(0) — clustering", data: curveData.Cs,
            borderColor: "#5eead4", backgroundColor: "transparent", pointRadius: 3, tension: 0.2 },
          { label: "L(p)/L(0) — path length", data: curveData.Ls,
            borderColor: "#f472b6", backgroundColor: "transparent", pointRadius: 3, tension: 0.2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
          x: { type: "logarithmic", title: { display: true, text: "rewiring probability p (log)" } },
          y: { min: 0, max: 1.05, title: { display: true, text: "fraction of p=0 value" } },
        },
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  CX.onResize(setup);
  precomputeCurve();
  initChart();
  setup();

  // Bind controls after setup() so ctx exists when the slider fires its initial draw.
  CX.bindSlider("ws-p", (v) => {
    p = v;
    const pe = document.getElementById("ws-pval");
    if (pe) pe.textContent = v.toFixed(3);
    drawNetwork();
  }, (v) => v.toFixed(3));
  CX.bindButton("ws-reroll", drawNetwork);
})();
