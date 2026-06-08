/* Injects the shared header/nav so every page stays in sync. */
(function () {
  "use strict";
  const links = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "cellular-automata.html", label: "Cellular Automata", key: "ca" },
    { href: "chaos-fractals.html", label: "Chaos & Fractals", key: "chaos" },
    { href: "emergence.html", label: "Emergence", key: "emergence" },
    { href: "networks.html", label: "Networks", key: "networks" },
  ];

  function build() {
    const active = document.body.getAttribute("data-page") || "";
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML =
      '<div class="nav-inner">' +
      '<a class="brand" href="index.html">Complexity<span class="dot">.</span>Lab</a>' +
      '<nav class="nav-links">' +
      links
        .map(
          (l) =>
            `<a href="${l.href}" class="${l.key === active ? "active" : ""}">${l.label}</a>`
        )
        .join("") +
      "</nav></div>";
    document.body.insertBefore(header, document.body.firstChild);
  }

  function footer() {
    const f = document.createElement("footer");
    f.className = "site-footer";
    f.innerHTML =
      '<div class="wrap">Complexity.Lab — an interactive playground for the science of ' +
      "emergent systems. Built with vanilla JS, Canvas &amp; Chart.js.</div>";
    document.body.appendChild(f);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { build(); footer(); });
  } else {
    build();
    footer();
  }
})();
