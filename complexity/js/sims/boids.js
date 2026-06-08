/* Boids — Reynolds' flocking model (cohesion / alignment / separation). */
(function () {
  "use strict";
  const canvas = document.getElementById("boids-canvas");
  if (!canvas) return;

  let ctx, w, h;
  const rng = CX.mulberry32(11);
  let boids = [];
  const N = 120;

  const params = {
    cohesion: 0.6,
    alignment: 0.7,
    separation: 1.2,
    radius: 60,
    speed: 2.6,
  };

  function setup() {
    const dims = CX.fitCanvas(canvas, 0.6);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    if (!boids.length) spawn();
  }

  function spawn() {
    boids = [];
    for (let i = 0; i < N; i++) {
      const a = rng() * Math.PI * 2;
      boids.push({
        x: rng() * w, y: rng() * h,
        vx: Math.cos(a) * params.speed, vy: Math.sin(a) * params.speed,
      });
    }
  }

  function limit(b, max) {
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > max) { b.vx = (b.vx / sp) * max; b.vy = (b.vy / sp) * max; }
  }

  const loop = CX.AnimationLoop(step);

  function step() {
    const R2 = params.radius * params.radius;
    for (const b of boids) {
      let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
      for (const o of boids) {
        if (o === b) continue;
        const dx = o.x - b.x, dy = o.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0) {
          cx += o.x; cy += o.y;
          ax += o.vx; ay += o.vy;
          sx -= dx / d2; sy -= dy / d2; // separation weighted by closeness
          n++;
        }
      }
      if (n > 0) {
        // cohesion: steer toward center of mass
        cx = cx / n - b.x; cy = cy / n - b.y;
        b.vx += (cx * 0.0009) * params.cohesion;
        b.vy += (cy * 0.0009) * params.cohesion;
        // alignment
        ax = ax / n - b.vx; ay = ay / n - b.vy;
        b.vx += ax * 0.04 * params.alignment;
        b.vy += ay * 0.04 * params.alignment;
        // separation
        b.vx += sx * 1.4 * params.separation;
        b.vy += sy * 1.4 * params.separation;
      }
      limit(b, params.speed);
      b.x += b.vx; b.y += b.vy;
      // wrap
      if (b.x < 0) b.x += w; if (b.x > w) b.x -= w;
      if (b.y < 0) b.y += h; if (b.y > h) b.y -= h;
    }
    draw();
  }

  function draw() {
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);
    for (const b of boids) {
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(ang);
      ctx.fillStyle = "#5eead4";
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(-5, 4); ctx.lineTo(-2, 0); ctx.lineTo(-5, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  CX.bindSlider("boids-cohesion", (v) => (params.cohesion = v), (v) => v.toFixed(2));
  CX.bindSlider("boids-alignment", (v) => (params.alignment = v), (v) => v.toFixed(2));
  CX.bindSlider("boids-separation", (v) => (params.separation = v), (v) => v.toFixed(2));
  CX.bindSlider("boids-radius", (v) => (params.radius = v), (v) => Math.round(v) + "px");
  CX.bindButton("boids-reset", spawn);

  CX.onResize(setup);
  setup();
  loop.setFps(60);
  loop.start();
})();
