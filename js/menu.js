/* ===================================================================
   MAISON CRUMB — menu.js
   Live category + keyword filtering with FLIP-technique animation,
   plus per-category hover SVG reveal.
   =================================================================== */

(function () {
  "use strict";

  var grid = document.getElementById("menu-grid");
  if (!grid) return;

  var items = Array.prototype.slice.call(grid.querySelectorAll(".menu-item"));
  var pills = document.querySelectorAll(".filter-pill");
  var searchInput = document.getElementById("menu-search");
  var noResults = document.getElementById("no-results");

  var activeCategory = "all";
  var activeQuery = "";

  function matches(item) {
    var cat = item.dataset.category;
    var keywords = (item.dataset.keywords || "").toLowerCase();
    var name = (item.querySelector("h4") ? item.querySelector("h4").textContent : "").toLowerCase();
    var catOk = activeCategory === "all" || cat === activeCategory;
    var queryOk = activeQuery === "" ||
      keywords.indexOf(activeQuery) !== -1 ||
      name.indexOf(activeQuery) !== -1;
    return catOk && queryOk;
  }

  function applyFilter() {
    // ---- FLIP: First — record current positions of all items ----
    var first = {};
    items.forEach(function (item) {
      first[item.dataset.id] = item.getBoundingClientRect();
    });

    // ---- determine which items should be visible now ----
    var anyVisible = false;
    items.forEach(function (item) {
      var show = matches(item);
      if (show) anyVisible = true;
      item.classList.toggle("hidden", !show);
    });
    noResults.classList.toggle("show", !anyVisible);

    // ---- Last — record new positions, then invert + play ----
    items.forEach(function (item) {
      if (item.classList.contains("hidden")) return;
      var last = item.getBoundingClientRect();
      var f = first[item.dataset.id];
      if (!f) return;
      var dx = f.left - last.left;
      var dy = f.top - last.top;
      if (dx || dy) {
        item.style.transition = "none";
        item.style.transform = "translate(" + dx + "px," + dy + "px)";
        // force reflow
        item.getBoundingClientRect();
        item.style.transition = "transform 420ms cubic-bezier(.4,0,.2,1)";
        item.style.transform = "translate(0,0)";
      }
    });
  }

  pills.forEach(function (pill) {
    pill.addEventListener("click", function () {
      pills.forEach(function (p) { p.classList.remove("active"); });
      pill.classList.add("active");
      activeCategory = pill.dataset.category;
      applyFilter();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      activeQuery = searchInput.value.trim().toLowerCase();
      applyFilter();
    });
  }

  // initial layout pass
  applyFilter();
})();
