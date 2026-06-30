/* ===================================================================
   MAISON CRUMB — particles.js
   Lightweight canvas flour-dust effect. Particle spawn rate is tied
   to scroll velocity: the faster the user scrolls, the more "flour"
   drifts down and settles toward the bottom of the hero section.
   =================================================================== */

(function () {
  "use strict";

  var canvas = document.getElementById("flour-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var hero = canvas.closest(".hero");
  var particles = [];
  var lastScrollY = window.scrollY;
  var scrollVelocity = 0;
  var width, height;

  function resize() {
    width = canvas.width = hero.offsetWidth;
    height = canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function Particle(vel) {
    this.x = Math.random() * width;
    this.y = -10;
    this.r = Math.random() * 2.2 + 0.6;
    this.vy = 0.3 + Math.random() * 0.6 + Math.min(vel * 0.02, 2.5);
    this.vx = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.5 + 0.25;
    this.settled = false;
    this.life = 0;
  }
  Particle.prototype.update = function () {
    if (this.settled) { this.life++; return; }
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.y * 0.02) * 0.3;
    if (this.y >= height - 4) { this.y = height - 4; this.settled = true; }
  };
  Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.fillStyle = "rgba(248,239,223," + this.opacity + ")";
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  };

  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    scrollVelocity = Math.abs(y - lastScrollY);
    lastScrollY = y;
  }, { passive: true });

  function spawnRate() {
    return 1 + Math.min(Math.round(scrollVelocity / 4), 8);
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    var toSpawn = spawnRate();
    for (var i = 0; i < toSpawn; i++) {
      if (particles.length < 500) particles.push(new Particle(scrollVelocity));
    }

    particles = particles.filter(function (p) { return !(p.settled && p.life > 240); });
    particles.forEach(function (p) { p.update(); p.draw(); });

    scrollVelocity *= 0.9;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
