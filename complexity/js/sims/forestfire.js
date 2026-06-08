/* Forest-fire model — self-organized criticality.
   Trees grow with prob p; lightning strikes with prob f and burns connected stands.
   Fire (avalanche) sizes follow a power law -> straight line on a log-log plot. */
(function () {
  "use strict";
  const canvas = document.getElementById("fire-canvas");
  if (!canvas) return;

  const SIZE = 90;
  let ctx, w, h, cell;
  let grid; // 0 empty, 1 tree, 2 burning
  let pGrow = 0.03;
  let fLightning = 0.0006;
  const rng = CX.mulberry32(123);
  let fireSizes = []; // log of fire sizes for histogram
  let totalFires = 0;
  let chart;

  const EMPTY = 0, TREE = 1, FIRE = 2;
  const loop = CX.AnimationLoop(step);

  function setup() {
    const dims = CX.fitCanvas(canvas, 1);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    cell = w / SIZE;
    if (!grid) init();
    draw();
  }

  function init() {
    grid = CX.createGrid(SIZE, SIZE, () => (rng() < 0.3 ? TREE : EMPTY));
    fireSizes = [];
    totalFires = 0;
    updateChart();
    draw();
  }

  function inBounds(x, y) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE; }

  // Burn a connected cluster of trees starting at (x,y); returns size.
  function burnCluster(x, y) {
    const stack = [[x, y]];
    let size = 0;
    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (!inBounds(cx, cy) || grid[cy][cx] !== TREE) continue;
      grid[cy][cx] = EMPTY;
      size++;
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    return size;
  }

  function step() {
    // growth
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++)
        if (grid[y][x] === EMPTY && rng() < pGrow) grid[y][x] = TREE;

    // lightning: each tree can ignite; igniting burns its whole stand at once
    let strikes = 0;
    for (let y = 0; y < SIZE && strikes < 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (grid[y][x] === TREE && rng() < fLightning) {
          const size = burnCluster(x, y);
          fireSizes.push(size);
          if (fireSizes.length > 4000) fireSizes.shift();
          totalFires++;
          strikes++;
          break;
        }
      }
    }
    draw();
    if (totalFires % 5 === 0 || strikes) updateChart();
    const tEl = document.getElementById("fire-count");
    if (tEl) tEl.textContent = totalFires;
  }

  function draw() {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = grid[y][x];
        if (v === EMPTY) continue;
        ctx.fillStyle = v === TREE ? "#34d399" : "#f87171";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }

  /* ---------- log-log histogram of fire sizes ---------- */
  function histogram() {
    // logarithmic bins
    const bins = {};
    for (const s of fireSizes) {
      const b = Math.floor(Math.log10(s) * 4) / 4; // quarter-decade bins
      bins[b] = (bins[b] || 0) + 1;
    }
    const xs = Object.keys(bins).map(Number).sort((a, b) => a - b);
    return xs.map((b) => ({ x: Math.pow(10, b), y: bins[b] }));
  }

  function initChart() {
    const el = document.getElementById("fire-chart");
    if (!el || !window.Chart) return;
    chart = new Chart(el.getContext("2d"), {
      type: "scatter",
      data: { datasets: [{
        label: "fire-size frequency",
        data: [], showLine: false,
        pointBackgroundColor: "#fbbf24", pointRadius: 3,
      }]},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
          x: { type: "logarithmic", title: { display: true, text: "fire size (cells, log)" } },
          y: { type: "logarithmic", title: { display: true, text: "frequency (log)" } },
        },
        plugins: { legend: { display: false } },
      },
    });
  }
  function updateChart() {
    if (!chart) return;
    chart.data.datasets[0].data = histogram();
    chart.update();
  }

  CX.bindButton("fire-play", function () {
    const running = loop.toggle();
    this.textContent = running ? "⏸ Pause" : "▶ Play";
    this.classList.toggle("primary", !running);
  });
  CX.bindButton("fire-reset", init);
  CX.bindSlider("fire-grow", (v) => (pGrow = v), (v) => v.toFixed(3));
  CX.bindSlider("fire-light", (v) => (fLightning = v / 10000), (v) => (v / 10000).toFixed(5));
  CX.bindSlider("fire-speed", (v) => loop.setFps(v), (v) => v + "/s");

  CX.onResize(setup);
  initChart();
  setup();
  loop.setFps(20);
})();
