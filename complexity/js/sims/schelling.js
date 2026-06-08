/* Schelling segregation model with a live "happy %" chart. */
(function () {
  "use strict";
  const canvas = document.getElementById("schelling-canvas");
  if (!canvas) return;

  let ctx, w, h, cell;
  const SIZE = 50;            // grid is SIZE x SIZE
  let grid;                   // 0 empty, 1 type A, 2 type B
  let tolerance = 0.30;       // min fraction of same-type neighbors to be happy
  let emptyFrac = 0.1;
  let round = 0;
  let history = [];
  const rng = CX.mulberry32(99);
  const COLORS = { 1: "#5eead4", 2: "#f472b6", 0: "#070a12" };
  let chart;

  const loop = CX.AnimationLoop(step);

  function setup() {
    const dims = CX.fitCanvas(canvas, 1);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    cell = w / SIZE;
    if (!grid) init();
    draw();
  }

  function init() {
    grid = CX.createGrid(SIZE, SIZE, () => {
      const rv = rng();
      if (rv < emptyFrac) return 0;
      return rv < emptyFrac + (1 - emptyFrac) / 2 ? 1 : 2;
    });
    round = 0;
    history = [];
    record();
    draw();
  }

  function neighborsHappy(x, y) {
    const me = grid[y][x];
    if (me === 0) return true;
    let same = 0, total = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= SIZE || ny >= SIZE) continue;
        const v = grid[ny][nx];
        if (v === 0) continue;
        total++;
        if (v === me) same++;
      }
    }
    if (total === 0) return true;
    return same / total >= tolerance;
  }

  function stats() {
    let happy = 0, agents = 0;
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (grid[y][x] !== 0) { agents++; if (neighborsHappy(x, y)) happy++; }
    return { pct: agents ? (100 * happy) / agents : 100, agents };
  }

  function step() {
    // collect unhappy agents and empty cells
    const unhappy = [];
    const empties = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (grid[y][x] === 0) empties.push([x, y]);
        else if (!neighborsHappy(x, y)) unhappy.push([x, y]);
      }
    }
    // shuffle empties
    for (let i = empties.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [empties[i], empties[j]] = [empties[j], empties[i]];
    }
    let moved = 0;
    for (const [ux, uy] of unhappy) {
      if (!empties.length) break;
      const [ex, ey] = empties.pop();
      grid[ey][ex] = grid[uy][ux];
      grid[uy][ux] = 0;
      empties.push([ux, uy]);
      moved++;
    }
    round++;
    record();
    draw();
    if (moved === 0) {
      loop.stop();
      const btn = document.getElementById("schelling-play");
      if (btn) { btn.textContent = "▶ Play"; btn.classList.add("primary"); }
      const done = document.getElementById("schelling-status");
      if (done) done.textContent = "Equilibrium reached — everyone is content.";
    }
  }

  function record() {
    const s = stats();
    history.push(s.pct);
    if (history.length > 120) history.shift();
    const r = document.getElementById("schelling-round");
    const hp = document.getElementById("schelling-happy");
    if (r) r.textContent = round;
    if (hp) hp.textContent = s.pct.toFixed(1) + "%";
    updateChart();
  }

  function draw() {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = grid[y][x];
        if (v === 0) continue;
        ctx.fillStyle = COLORS[v];
        ctx.fillRect(x * cell, y * cell, cell - 0.5, cell - 0.5);
      }
    }
  }

  function initChart() {
    const el = document.getElementById("schelling-chart");
    if (!el || !window.Chart) return;
    chart = new Chart(el.getContext("2d"), {
      type: "line",
      data: { labels: [], datasets: [{
        label: "% happy", data: [],
        borderColor: "#818cf8", backgroundColor: "rgba(129,140,248,0.12)",
        fill: true, tension: 0.25, pointRadius: 0, borderWidth: 2,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
          x: { title: { display: true, text: "round" }, ticks: { maxTicksLimit: 6 } },
          y: { min: 0, max: 100, title: { display: true, text: "% content" } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
  function updateChart() {
    if (!chart) return;
    chart.data.labels = history.map((_, i) => round - history.length + 1 + i);
    chart.data.datasets[0].data = history;
    chart.update();
  }

  CX.bindButton("schelling-play", function () {
    const status = document.getElementById("schelling-status");
    if (status) status.textContent = "";
    const running = loop.toggle();
    this.textContent = running ? "⏸ Pause" : "▶ Play";
    this.classList.toggle("primary", !running);
  });
  CX.bindButton("schelling-step", () => { if (!loop.isRunning()) step(); });
  CX.bindButton("schelling-reset", () => {
    const status = document.getElementById("schelling-status");
    if (status) status.textContent = "";
    init();
  });
  CX.bindSlider("schelling-tol", (v) => {
    tolerance = v;
    const pc = document.getElementById("schelling-tolpct");
    if (pc) pc.textContent = Math.round(v * 100) + "%";
  }, (v) => Math.round(v * 100) + "%");
  CX.bindSlider("schelling-speed", (v) => loop.setFps(v), (v) => v + "/s");

  CX.onResize(setup);
  initChart();
  setup();
})();
