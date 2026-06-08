/* Lorenz attractor — animated projection onto the x–z plane. */
(function () {
  "use strict";
  const canvas = document.getElementById("lorenz-canvas");
  if (!canvas) return;

  let ctx, w, h;
  let sigma = 10, rho = 28, beta = 8 / 3;
  let x = 0.1, y = 0, z = 0;
  const dt = 0.006;
  let trail = [];
  const MAX_TRAIL = 1400;

  function setup() {
    const dims = CX.fitCanvas(canvas, 0.7);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
  }

  function project(px, pz) {
    // map x in ~[-25,25], z in ~[0,50] to canvas
    const sx = w / 2 + px * (w / 60);
    const sy = h - (pz * (h / 55)) - 10;
    return [sx, sy];
  }

  const loop = CX.AnimationLoop(step);

  function step() {
    // several integration substeps per frame for a smooth curve
    for (let i = 0; i < 6; i++) {
      const dx = sigma * (y - x);
      const dy = x * (rho - z) - y;
      const dz = x * y - beta * z;
      x += dx * dt; y += dy * dt; z += dz * dt;
      trail.push([x, z]);
    }
    if (trail.length > MAX_TRAIL) trail.splice(0, trail.length - MAX_TRAIL);
    draw();
  }

  function draw() {
    // fade previous frame for a glowing trail
    ctx.fillStyle = "rgba(7,10,18,0.18)";
    ctx.fillRect(0, 0, w, h);

    ctx.lineWidth = 1.4;
    for (let i = 1; i < trail.length; i++) {
      const t = i / trail.length;
      const [ax, az] = project(trail[i - 1][0], trail[i - 1][1]);
      const [bx, bz] = project(trail[i][0], trail[i][1]);
      ctx.strokeStyle = CX.heat(0.15 + 0.8 * t);
      ctx.beginPath();
      ctx.moveTo(ax, az); ctx.lineTo(bx, bz);
      ctx.stroke();
    }
    // head
    if (trail.length) {
      const [hx, hz] = project(trail[trail.length - 1][0], trail[trail.length - 1][1]);
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(hx, hz, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }

  function reset(perturb) {
    x = 0.1 + (perturb ? 1e-3 : 0); y = 0; z = 0;
    trail = [];
    setup();
  }

  CX.bindSlider("lorenz-sigma", (v) => { sigma = v; }, (v) => v.toFixed(1));
  CX.bindSlider("lorenz-rho", (v) => { rho = v; }, (v) => v.toFixed(1));
  CX.bindSlider("lorenz-beta", (v) => { beta = v; }, (v) => v.toFixed(2));
  CX.bindButton("lorenz-play", function () {
    const running = loop.toggle();
    this.textContent = running ? "⏸ Pause" : "▶ Play";
    this.classList.toggle("primary", !running);
  });
  CX.bindButton("lorenz-reset", () => reset(false));

  CX.onResize(() => { setup(); });
  setup();
  loop.setFps(60);
  loop.start();
  const playBtn = document.getElementById("lorenz-play");
  if (playBtn) { playBtn.textContent = "⏸ Pause"; playBtn.classList.remove("primary"); }
})();
