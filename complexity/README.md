# Complexity.Lab

An interactive website for exploring **complexity science** through hands-on
mini-games and live charts. No build step, no backend — just static HTML,
vanilla JavaScript, Canvas, and [Chart.js](https://www.chartjs.org/) from a CDN.

## What's inside

| Page | Interactive modules |
|------|---------------------|
| **Cellular Automata** | Conway's Game of Life (with live population chart) · Elementary/Wolfram automata (rules 30, 90, 110, 184) |
| **Chaos & Fractals** | Logistic map (cobweb + bifurcation diagram) · Lorenz attractor · Mandelbrot explorer |
| **Emergence & Agents** | Boids flocking · Schelling segregation (happy-% chart) · Forest-fire self-organized criticality (power-law plot) |
| **Networks & Power Laws** | Barabási–Albert preferential attachment (log-log degree distribution) · Watts–Strogatz small-world (C/L curves) |

## Run locally

It's a static site, so any web server works. From the repository root:

```bash
python -m http.server 8000 --directory complexity
```

Then open <http://localhost:8000/>.

> Opening the HTML files directly via `file://` also works, but a local server
> avoids browser quirks and matches how it deploys.

## Deploy (GitHub Pages)

Point GitHub Pages at this repository and the `/complexity` folder, or copy the
`complexity/` directory to the root of a Pages branch. All asset paths are
relative, so it works from any sub-path.

## Project structure

```
complexity/
  index.html              # Landing hub
  cellular-automata.html
  chaos-fractals.html
  emergence.html
  networks.html
  css/style.css           # Shared dark theme
  js/
    utils.js              # CX namespace: RNG, grids, animation loop, canvas + control helpers
    nav.js                # Shared header/footer injection
    sims/                 # One module per simulation
```

Each simulation registers itself only if its target `<canvas>` exists on the
current page, so all sim scripts are safe to load anywhere.
