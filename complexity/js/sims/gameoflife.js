/* Conway's Game of Life with a live population chart. */
(function () {
  "use strict";
  const canvas = document.getElementById("gol-canvas");
  if (!canvas) return;

  const CELL = 12;          // logical cell size in px
  let cols, rows, grid, ctx, w, h;
  let generation = 0;
  let popHistory = [];
  const rng = CX.mulberry32(7);

  const loop = CX.AnimationLoop(step);
  let chart;

  function setup() {
    const dims = CX.fitCanvas(canvas, 0.6);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    cols = Math.floor(w / CELL);
    rows = Math.floor(h / CELL);
    if (!grid) randomize();
    draw();
  }

  function emptyGrid() {
    return CX.createGrid(cols, rows, 0);
  }

  function randomize() {
    grid = CX.createGrid(cols, rows, () => (rng() < 0.28 ? 1 : 0));
    generation = 0;
    popHistory = [];
    recordPop();
    draw();
  }

  function clear() {
    grid = emptyGrid();
    generation = 0;
    popHistory = [];
    recordPop();
    draw();
  }

  function neighbors(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + cols) % cols; // toroidal wrap
        const ny = (y + dy + rows) % rows;
        n += grid[ny][nx];
      }
    }
    return n;
  }

  function step() {
    const next = emptyGrid();
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const n = neighbors(x, y);
        next[y][x] = grid[y][x] ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
      }
    }
    grid = next;
    generation++;
    recordPop();
    draw();
  }

  function population() {
    let p = 0;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) p += grid[y][x];
    return p;
  }

  function recordPop() {
    popHistory.push(population());
    if (popHistory.length > 200) popHistory.shift();
    updateChart();
    const genEl = document.getElementById("gol-gen");
    const popEl = document.getElementById("gol-pop");
    if (genEl) genEl.textContent = generation;
    if (popEl) popEl.textContent = popHistory[popHistory.length - 1];
  }

  function draw() {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5eead4";
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x]) {
          ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 1, CELL - 1);
        }
      }
    }
    // subtle grid lines
    ctx.strokeStyle = "rgba(42,52,80,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= cols; x++) { ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, rows * CELL); }
    for (let y = 0; y <= rows; y++) { ctx.moveTo(0, y * CELL); ctx.lineTo(cols * CELL, y * CELL); }
    ctx.stroke();
  }

  /* ---------- patterns ---------- */
  function stamp(pattern, ox, oy) {
    pattern.forEach(([dx, dy]) => {
      const x = (ox + dx + cols) % cols;
      const y = (oy + dy + rows) % rows;
      grid[y][x] = 1;
    });
  }

  const PATTERNS = {
    glider: [[0,0],[1,0],[2,0],[2,-1],[1,-2]],
    pulsar: (function () {
      const base = [2,3,4,8,9,10];
      const pts = [];
      base.forEach((b) => { pts.push([b,0]); pts.push([b,12]); pts.push([0,b]); pts.push([12,b]);
        pts.push([b,5]); pts.push([b,7]); pts.push([5,b]); pts.push([7,b]); });
      return pts;
    })(),
    gun: [
      [0,4],[0,5],[1,4],[1,5],
      [10,4],[10,5],[10,6],[11,3],[11,7],[12,2],[12,8],[13,2],[13,8],
      [14,5],[15,3],[15,7],[16,4],[16,5],[16,6],[17,5],
      [20,2],[20,3],[20,4],[21,2],[21,3],[21,4],[22,1],[22,5],
      [24,0],[24,1],[24,5],[24,6],
      [34,2],[34,3],[35,2],[35,3],
    ],
  };

  function loadPattern(name) {
    clear();
    const p = PATTERNS[name];
    if (name === "glider") {
      for (let i = 0; i < 3; i++) stamp(PATTERNS.glider, 4 + i * 14, 8 + i * 6);
    } else if (name === "gun") {
      stamp(p, 2, Math.floor(rows / 2) - 4);
    } else {
      stamp(p, Math.floor(cols / 2) - 6, Math.floor(rows / 2) - 6);
    }
    draw();
  }

  /* ---------- chart ---------- */
  function initChart() {
    const el = document.getElementById("gol-chart");
    if (!el || !window.Chart) return;
    chart = new Chart(el.getContext("2d"), {
      type: "line",
      data: { labels: [], datasets: [{
        label: "Living cells",
        data: [],
        borderColor: "#5eead4",
        backgroundColor: "rgba(94,234,212,0.12)",
        fill: true, tension: 0.25, pointRadius: 0, borderWidth: 2,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
          x: { title: { display: true, text: "generation" }, ticks: { maxTicksLimit: 6 } },
          y: { beginAtZero: true, title: { display: true, text: "population" } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }

  function updateChart() {
    if (!chart) return;
    chart.data.labels = popHistory.map((_, i) => generation - popHistory.length + 1 + i);
    chart.data.datasets[0].data = popHistory;
    chart.update();
  }

  /* ---------- interaction ---------- */
  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (w / rect.width);
    const py = (e.clientY - rect.top) * (h / rect.height);
    return [Math.floor(px / CELL), Math.floor(py / CELL)];
  }

  let painting = false;
  canvas.addEventListener("mousedown", (e) => {
    painting = true;
    const [x, y] = cellFromEvent(e);
    if (x >= 0 && x < cols && y >= 0 && y < rows) { grid[y][x] = grid[y][x] ? 0 : 1; recordPop(); draw(); }
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!painting) return;
    const [x, y] = cellFromEvent(e);
    if (x >= 0 && x < cols && y >= 0 && y < rows && !grid[y][x]) { grid[y][x] = 1; draw(); }
  });
  window.addEventListener("mouseup", () => { painting = false; });

  /* ---------- controls ---------- */
  CX.bindButton("gol-play", function () {
    const running = loop.toggle();
    this.textContent = running ? "⏸ Pause" : "▶ Play";
    this.classList.toggle("primary", !running);
  });
  CX.bindButton("gol-step", () => { if (!loop.isRunning()) step(); });
  CX.bindButton("gol-random", randomize);
  CX.bindButton("gol-clear", clear);
  CX.bindSlider("gol-speed", (v) => loop.setFps(v), (v) => v + " gen/s");
  CX.bindSelect("gol-pattern", (v) => { if (v) loadPattern(v); });

  CX.onResize(setup);
  initChart();
  setup();
})();
