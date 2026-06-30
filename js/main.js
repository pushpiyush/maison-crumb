/* ===================================================================
   MAISON CRUMB — main.js
   Shared across all pages: page-transition wipe, mobile nav, active link
   =================================================================== */

(function () {
  "use strict";

  /* ---------- Page-load wipe-in ---------- */
  // Overlay element is injected at the very top of <body> in every page.
  document.addEventListener("DOMContentLoaded", function () {
    var overlay = document.getElementById("wipe-overlay");
    if (overlay) {
      overlay.classList.add("wipe-in");
      // once the wipe finishes covering+revealing, remove it from flow
      setTimeout(function () {
        overlay.classList.remove("wipe-in");
        overlay.style.transform = "scaleX(0)";
      }, 260);
    }
    document.body.classList.add("page-enter");

    setActiveNavLink();
    initMobileNav();
    interceptInternalLinks();
  });

  /* ---------- Highlight current page in nav ---------- */
  function setActiveNavLink() {
    var path = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".main-nav a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        a.classList.add("active");
      }
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  function initMobileNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  /* ---------- Wipe-out transition before navigating to another local page ---------- */
  function interceptInternalLinks() {
    var overlay = document.getElementById("wipe-overlay");
    if (!overlay) return;

    document.querySelectorAll("a").forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") ||
          href.startsWith("mailto:") || link.target === "_blank") return;
      if (!href.endsWith(".html")) return;

      link.addEventListener("click", function (e) {
        e.preventDefault();
        document.body.classList.remove("page-enter");
        overlay.style.transform = "scaleX(0)";
        overlay.classList.add("wipe-out-start"); // forces reflow context
        // play wipe covering the screen then navigate
        overlay.style.transformOrigin = "left";
        overlay.style.transition = "transform 250ms ease";
        requestAnimationFrame(function () {
          overlay.style.transform = "scaleX(1)";
        });
        setTimeout(function () {
          window.location.href = href;
        }, 250);
      });
    });
  }
})();
