/* Logistic map: bifurcation diagram + cobweb plot + time series.
   x_{n+1} = r * x_n * (1 - x_n) */
(function () {
  "use strict";
  const bifCanvas = document.getElementById("logi-bif");
  const cobCanvas = document.getElementById("logi-cobweb");
  if (!bifCanvas || !cobCanvas) return;

  let r = 3.6;

  /* ---------- Bifurcation diagram (static, with moving marker) ---------- */
  let bif = {};
  function drawBifurcation() {
    const dims = CX.fitCanvas(bifCanvas, 0.55);
    const ctx = dims.ctx, w = dims.w, h = dims.h;
    bif = { w, h, rMin: 2.5, rMax: 4.0 };

    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);

    const transient = 150, samples = 220;
    ctx.fillStyle = "rgba(94,234,212,0.5)";
    for (let px = 0; px < w; px++) {
      const rr = bif.rMin + (px / w) * (bif.rMax - bif.rMin);
      let x = 0.5;
      for (let i = 0; i < transient; i++) x = rr * x * (1 - x);
      for (let i = 0; i < samples; i++) {
        x = rr * x * (1 - x);
        const py = h - x * h;
        ctx.fillRect(px, py, 1, 1);
      }
    }
    drawMarker();
  }

  function drawMarker() {
    const ctx = bifCanvas.getContext("2d");
    // redraw is heavy; instead overlay marker by re-running just the line.
    const x = ((r - bif.rMin) / (bif.rMax - bif.rMin)) * bif.w;
    ctx.save();
    ctx.strokeStyle = "rgba(244,114,182,0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, bif.h);
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- Cobweb + time series ---------- */
  function drawCobweb() {
    const dims = CX.fitCanvas(cobCanvas, 0.75);
    const ctx = dims.ctx, w = dims.w, h = dims.h;
    const pad = 28;
    const X = (v) => pad + v * (w - 2 * pad);
    const Y = (v) => h - pad - v * (h - 2 * pad);

    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);

    // axes
    ctx.strokeStyle = "rgba(42,52,80,0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(0));
    ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(1));
    ctx.stroke();

    // diagonal y = x
    ctx.strokeStyle = "rgba(154,166,196,0.5)";
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(1), Y(1)); ctx.stroke();

    // parabola f(x) = r x (1-x)
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = i / 200;
      const y = r * x * (1 - x);
      i === 0 ? ctx.moveTo(X(x), Y(y)) : ctx.lineTo(X(x), Y(y));
    }
    ctx.stroke();

    // cobweb iteration
    ctx.strokeStyle = "rgba(94,234,212,0.85)";
    ctx.lineWidth = 1;
    let x = 0.2;
    ctx.beginPath();
    ctx.moveTo(X(x), Y(0));
    for (let i = 0; i < 120; i++) {
      const y = r * x * (1 - x);
      ctx.lineTo(X(x), Y(y));   // vertical to curve
      ctx.lineTo(X(y), Y(y));   // horizontal to diagonal
      x = y;
    }
    ctx.stroke();

    // labels
    ctx.fillStyle = "#9aa6c4";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("xₙ", w - pad + 4, Y(0) + 4);
    ctx.fillText("xₙ₊₁", X(0) - 6, pad - 8);
  }

  function update() {
    drawCobweb();
    drawBifurcation();
    const lbl = document.getElementById("logi-rval");
    if (lbl) lbl.textContent = r.toFixed(3);
    const regime = document.getElementById("logi-regime");
    if (regime) {
      let txt;
      if (r < 3) txt = "Fixed point — settles to one value.";
      else if (r < 3.449) txt = "Period-2 — oscillates between two values.";
      else if (r < 3.544) txt = "Period-4 — four-value cycle.";
      else if (r < 3.5699) txt = "Period-doubling cascade toward chaos.";
      else if (r < 4) txt = "Chaos — with islands of stability (e.g. period-3 near r≈3.83).";
      else txt = "Edge of chaos (r = 4).";
      regime.textContent = txt;
    }
  }

  CX.bindSlider("logi-r", (v) => { r = v; update(); }, (v) => v.toFixed(3));
  CX.onResize(update);
  update();
})();
