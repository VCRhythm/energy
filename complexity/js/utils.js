/* Shared utilities for complexity-science simulations.
   Exposed on the global `CX` namespace (no build step). */
(function (global) {
  "use strict";

  /* ---------- Seeded RNG (mulberry32) ---------- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Grid helpers ---------- */
  function createGrid(cols, rows, fill) {
    const g = new Array(rows);
    for (let y = 0; y < rows; y++) {
      g[y] = new Array(cols).fill(typeof fill === "function" ? 0 : fill || 0);
      if (typeof fill === "function") {
        for (let x = 0; x < cols; x++) g[y][x] = fill(x, y);
      }
    }
    return g;
  }

  /* ---------- Animation loop with FPS throttle ---------- */
  function AnimationLoop(stepFn) {
    let raf = null;
    let last = 0;
    let fps = 20;
    let running = false;

    function frame(ts) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const interval = 1000 / fps;
      if (ts - last >= interval) {
        last = ts - ((ts - last) % interval);
        stepFn();
      }
    }
    return {
      start() {
        if (running) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      },
      stop() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      },
      toggle() { running ? this.stop() : this.start(); return running; },
      isRunning() { return running; },
      setFps(v) { fps = Math.max(1, v); },
    };
  }

  /* ---------- Control binding helpers ---------- */
  function bindSlider(id, onChange, fmt) {
    const el = document.getElementById(id);
    if (!el) return null;
    const out = document.querySelector(`[data-val="${id}"]`);
    const update = () => {
      const v = parseFloat(el.value);
      if (out) out.textContent = fmt ? fmt(v) : v;
      if (onChange) onChange(v);
    };
    el.addEventListener("input", update);
    update();
    return el;
  }

  function bindButton(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", fn);
    return el;
  }

  function bindSelect(id, onChange) {
    const el = document.getElementById(id);
    if (!el) return null;
    el.addEventListener("change", () => onChange(el.value));
    return el;
  }

  /* ---------- Color helpers ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  // Map value in [0,1] across a multi-stop palette -> "rgb(...)"
  function heat(t) {
    t = Math.max(0, Math.min(1, t));
    const stops = [
      [13, 27, 62],    // deep blue
      [49, 84, 184],   // blue
      [94, 234, 212],  // teal
      [251, 191, 36],  // amber
      [244, 114, 182], // pink
    ];
    const seg = t * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(seg));
    const local = seg - i;
    const c = lerpColor(stops[i], stops[i + 1], local);
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  function rgb(arr, alpha) {
    return alpha == null
      ? `rgb(${arr[0]},${arr[1]},${arr[2]})`
      : `rgba(${arr[0]},${arr[1]},${arr[2]},${alpha})`;
  }

  /* ---------- Canvas helpers ---------- */
  // Size a canvas to its CSS box and account for devicePixelRatio.
  function fitCanvas(canvas, aspect) {
    const parent = canvas.parentElement;
    const cssW = parent.clientWidth;
    const cssH = aspect ? Math.round(cssW * aspect) : parent.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: cssW, h: cssH };
  }

  function onResize(fn) {
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(fn, 120);
    });
  }

  /* ---------- Chart.js dark defaults ---------- */
  function applyChartDefaults() {
    if (!global.Chart) return;
    const C = global.Chart;
    C.defaults.color = "#9aa6c4";
    C.defaults.font.family =
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    C.defaults.borderColor = "rgba(42,52,80,0.6)";
    if (C.defaults.plugins && C.defaults.plugins.legend) {
      C.defaults.plugins.legend.labels.boxWidth = 12;
    }
  }

  global.CX = {
    mulberry32,
    createGrid,
    AnimationLoop,
    bindSlider,
    bindButton,
    bindSelect,
    lerp,
    lerpColor,
    heat,
    rgb,
    fitCanvas,
    onResize,
    applyChartDefaults,
  };

  document.addEventListener("DOMContentLoaded", applyChartDefaults);
})(window);
