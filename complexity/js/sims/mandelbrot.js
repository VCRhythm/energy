/* Mandelbrot set explorer with click-to-zoom. */
(function () {
  "use strict";
  const canvas = document.getElementById("mandel-canvas");
  if (!canvas) return;

  let ctx, w, h;
  let view = { cx: -0.6, cy: 0, scale: 3.2 }; // scale = width of view in complex plane
  let maxIter = 120;

  function setup() {
    const dims = CX.fitCanvas(canvas, 0.66);
    ctx = dims.ctx; w = dims.w; h = dims.h;
    render();
  }

  function render() {
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const aspect = h / w;
    const reMin = view.cx - view.scale / 2;
    const imMin = view.cy - (view.scale * aspect) / 2;
    const reSpan = view.scale;
    const imSpan = view.scale * aspect;

    for (let py = 0; py < h; py++) {
      const c_im = imMin + (py / h) * imSpan;
      for (let px = 0; px < w; px++) {
        const c_re = reMin + (px / w) * reSpan;
        let zr = 0, zi = 0, iter = 0;
        while (zr * zr + zi * zi <= 4 && iter < maxIter) {
          const t = zr * zr - zi * zi + c_re;
          zi = 2 * zr * zi + c_im;
          zr = t;
          iter++;
        }
        const idx = (py * w + px) * 4;
        let r, g, b;
        if (iter === maxIter) {
          r = g = b = 8;
        } else {
          // smooth coloring
          const mu = iter + 1 - Math.log(Math.log(Math.sqrt(zr * zr + zi * zi))) / Math.log(2);
          const t = Math.max(0, Math.min(1, mu / maxIter));
          const col = parseHeat(Math.pow(t, 0.5));
          r = col[0]; g = col[1]; b = col[2];
        }
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const zEl = document.getElementById("mandel-zoom");
    if (zEl) zEl.textContent = (3.2 / view.scale).toFixed(view.scale < 0.01 ? 0 : 1) + "×";
  }

  function parseHeat(t) {
    const s = CX.heat(t); // "rgb(r,g,b)"
    const m = s.match(/\d+/g);
    return [parseInt(m[0]), parseInt(m[1]), parseInt(m[2])];
  }

  function zoom(e, factor) {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const aspect = h / w;
    const reMin = view.cx - view.scale / 2;
    const imMin = view.cy - (view.scale * aspect) / 2;
    view.cx = reMin + px * view.scale;
    view.cy = imMin + py * view.scale * aspect;
    view.scale *= factor;
    maxIter = Math.min(600, Math.round(120 + 30 * Math.log2(3.2 / view.scale + 1)));
    render();
  }

  canvas.addEventListener("click", (e) => zoom(e, 0.5));
  canvas.addEventListener("contextmenu", (e) => { e.preventDefault(); zoom(e, 2); });

  CX.bindButton("mandel-reset", () => {
    view = { cx: -0.6, cy: 0, scale: 3.2 };
    maxIter = 120;
    render();
  });
  document.querySelectorAll("[data-mandel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [cx, cy, sc] = btn.getAttribute("data-mandel").split(",").map(Number);
      view = { cx, cy, scale: sc };
      maxIter = Math.min(600, Math.round(120 + 30 * Math.log2(3.2 / sc + 1)));
      render();
    });
  });

  CX.onResize(setup);
  setup();
})();
