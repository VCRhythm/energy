/* Elementary (Wolfram) cellular automaton space-time diagram. */
(function () {
  "use strict";
  const canvas = document.getElementById("eca-canvas");
  if (!canvas) return;

  let ctx, w, h;
  let rule = 30;
  let startMode = "single"; // "single" | "random"
  const rng = CX.mulberry32(42);

  function ruleBits(r) {
    // bits[n] = output for neighborhood pattern n (0..7), n = 4*left+2*center+1*right
    const bits = [];
    for (let i = 0; i < 8; i++) bits[i] = (r >> i) & 1;
    return bits;
  }

  function render() {
    const dims = CX.fitCanvas(canvas, 0.62);
    ctx = dims.ctx; w = dims.w; h = dims.h;

    const cells = Math.min(401, Math.floor(w / 2) | 1); // odd count so a single cell is centered
    const px = w / cells;
    const generations = Math.min(Math.floor(h / px), Math.floor(cells / 2));
    const bits = ruleBits(rule);

    // initial row
    let row = new Uint8Array(cells);
    if (startMode === "single") {
      row[(cells - 1) >> 1] = 1;
    } else {
      for (let i = 0; i < cells; i++) row[i] = rng() < 0.5 ? 1 : 0;
    }

    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, w, h);

    for (let gen = 0; gen < generations; gen++) {
      for (let i = 0; i < cells; i++) {
        if (row[i]) {
          const t = gen / Math.max(1, generations - 1);
          ctx.fillStyle = CX.heat(0.25 + 0.6 * t);
          ctx.fillRect(i * px, gen * px, Math.ceil(px), Math.ceil(px));
        }
      }
      // next row (toroidal)
      const next = new Uint8Array(cells);
      for (let i = 0; i < cells; i++) {
        const l = row[(i - 1 + cells) % cells];
        const c = row[i];
        const r = row[(i + 1) % cells];
        next[i] = bits[(l << 2) | (c << 1) | r];
      }
      row = next;
    }

    const label = document.getElementById("eca-rulenum");
    if (label) label.textContent = rule;
  }

  CX.bindSlider("eca-rule", (v) => { rule = Math.round(v); render(); });
  CX.bindSelect("eca-start", (v) => { startMode = v; render(); });

  document.querySelectorAll("[data-rule]").forEach((btn) => {
    btn.addEventListener("click", () => {
      rule = parseInt(btn.getAttribute("data-rule"), 10);
      const slider = document.getElementById("eca-rule");
      if (slider) { slider.value = rule; slider.dispatchEvent(new Event("input")); }
      else render();
    });
  });

  CX.onResize(render);
  render();
})();
