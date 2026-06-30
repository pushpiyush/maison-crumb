/* ===================================================================
   MAISON CRUMB — order.js
   Multi-step order builder: step wipe transitions, animated price
   counter, SVG flavor swatches, real date-logic calendar, and
   localStorage persistence with a restore banner.
   =================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("order-form");
  if (!form) return;

  /* ----------------------------------------------------------------
     DATA
  ---------------------------------------------------------------- */
  var ITEM_PRICES = {
    "custom-cake": { label: "Custom Cake", base: 48 },
    "cupcakes": { label: "Cupcake Box", base: 28 },
    "cookies": { label: "Cookie Box", base: 18 },
    "pastry-box": { label: "Pastry Box", base: 32 }
  };
  var SIZE_MULTIPLIER = { small: 1, medium: 1.4, large: 1.9 };
  var ADDON_PRICES = { message: 5, topper: 8, giftwrap: 4 };
  var FLAVOR_LABELS = {
    vanilla: "Vanilla Bean",
    chocolate: "Chocolate Fudge",
    citrus: "Citrus Curd",
    berry: "Berry Swirl"
  };

  // Hardcoded existing bookings per date (YYYY-MM-DD) -> count of orders.
  // Any date with 3+ bookings is treated as fully booked.
  var BOOKINGS = {};
  (function seedBookings() {
    var today = new Date();
    var offsets = [2, 3, 3, 5, 5, 5, 8, 9, 12, 12, 15];
    var counts  = [1, 2, 3, 1, 2, 3, 2, 3, 1, 2, 1];
    offsets.forEach(function (off, i) {
      var d = new Date(today);
      d.setDate(d.getDate() + off);
      BOOKINGS[dateKey(d)] = counts[i];
    });
  })();

  function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ----------------------------------------------------------------
     STATE
  ---------------------------------------------------------------- */
  var STORAGE_KEY = "maisonCrumbOrder";
  var state = {
    step: 1,
    itemType: null,
    size: null,
    quantity: 1,
    flavor: null,
    addons: { message: false, topper: false, giftwrap: false },
    customMessage: "",
    fulfillment: "delivery",
    deliveryDate: null,
    price: 0
  };

  var TOTAL_STEPS = 6;
  var stepWipeEl = document.getElementById("step-wipe");

  /* ----------------------------------------------------------------
     STEP NAVIGATION
  ---------------------------------------------------------------- */
  function goToStep(n, opts) {
    opts = opts || {};
    n = Math.max(1, Math.min(TOTAL_STEPS, n));

    function swap() {
      document.querySelectorAll(".order-step").forEach(function (el) {
        el.classList.toggle("active", Number(el.dataset.step) === n);
      });
      document.querySelectorAll(".step-dot").forEach(function (dot) {
        var s = Number(dot.dataset.step);
        dot.classList.toggle("active", s === n);
        dot.classList.toggle("done", s < n);
      });
      state.step = n;
      if (n === TOTAL_STEPS) renderReview();
      persist();
      window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
    }

    if (opts.silent || !stepWipeEl) {
      swap();
      return;
    }
    // themed wipe transition (~400ms) between steps
    stepWipeEl.classList.remove("active");
    void stepWipeEl.offsetWidth; // restart animation
    stepWipeEl.classList.add("active");
    setTimeout(swap, 210); // swap content at the midpoint of the wipe
    setTimeout(function () { stepWipeEl.classList.remove("active"); }, 430);
  }

  document.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(state.step)) return;
      goToStep(state.step + 1);
    });
  });
  document.querySelectorAll("[data-prev]").forEach(function (btn) {
    btn.addEventListener("click", function () { goToStep(state.step - 1); });
  });

  function validateStep(step) {
    if (step === 1 && !state.itemType) { flash("Pick an item type to continue."); return false; }
    if (step === 2 && (!state.size || !state.flavor)) { flash("Choose a size and a flavor."); return false; }
    if (step === 5 && !state.deliveryDate) { flash("Choose a delivery/pickup date."); return false; }
    return true;
  }

  function flash(msg) {
    var el = document.getElementById("step-error");
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(function () { el.style.opacity = "0"; }, 2200);
  }

  /* ----------------------------------------------------------------
     STEP 1 — item type
  ---------------------------------------------------------------- */
  document.querySelectorAll("[data-item-type]").forEach(function (card) {
    card.addEventListener("click", function () {
      document.querySelectorAll("[data-item-type]").forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      state.itemType = card.dataset.itemType;
      recalcPrice();
      persist();
    });
  });

  /* ----------------------------------------------------------------
     STEP 2 — size / quantity / flavor
  ---------------------------------------------------------------- */
  document.querySelectorAll("[data-size]").forEach(function (card) {
    card.addEventListener("click", function () {
      document.querySelectorAll("[data-size]").forEach(function (c) { c.classList.remove("selected"); });
      card.classList.add("selected");
      state.size = card.dataset.size;
      recalcPrice();
      persist();
    });
  });

  var qtyInput = document.getElementById("qty-input");
  document.getElementById("qty-minus").addEventListener("click", function () {
    state.quantity = Math.max(1, state.quantity - 1);
    qtyInput.value = state.quantity;
    recalcPrice(); persist();
  });
  document.getElementById("qty-plus").addEventListener("click", function () {
    state.quantity = Math.min(20, state.quantity + 1);
    qtyInput.value = state.quantity;
    recalcPrice(); persist();
  });
  qtyInput.addEventListener("change", function () {
    var v = parseInt(qtyInput.value, 10);
    state.quantity = isNaN(v) || v < 1 ? 1 : Math.min(20, v);
    qtyInput.value = state.quantity;
    recalcPrice(); persist();
  });

  document.querySelectorAll("[data-flavor]").forEach(function (swatch) {
    swatch.addEventListener("click", function () {
      document.querySelectorAll("[data-flavor]").forEach(function (s) { s.classList.remove("selected"); });
      swatch.classList.add("selected");
      state.flavor = swatch.dataset.flavor;
      recalcPrice(); persist();
    });
  });

  /* ----------------------------------------------------------------
     STEP 3 — add-ons
  ---------------------------------------------------------------- */
  document.querySelectorAll("[data-addon]").forEach(function (checkbox) {
    checkbox.addEventListener("change", function () {
      var key = checkbox.dataset.addon;
      state.addons[key] = checkbox.checked;
      var row = checkbox.closest(".addon-row");
      if (key === "message") row.classList.toggle("expanded", checkbox.checked);
      recalcPrice(); persist();
    });
  });
  var messageBox = document.getElementById("custom-message");
  if (messageBox) {
    messageBox.addEventListener("input", function () {
      state.customMessage = messageBox.value;
      persist();
    });
  }

  /* ----------------------------------------------------------------
     PRICE CALCULATION + ANIMATED COUNTER
  ---------------------------------------------------------------- */
  function computePrice() {
    if (!state.itemType || !state.size) return 0;
    var base = ITEM_PRICES[state.itemType].base;
    var mult = SIZE_MULTIPLIER[state.size] || 1;
    var subtotal = base * mult * state.quantity;
    Object.keys(state.addons).forEach(function (key) {
      if (state.addons[key]) subtotal += ADDON_PRICES[key];
    });
    return Math.round(subtotal * 100) / 100;
  }

  function recalcPrice() {
    var newPrice = computePrice();
    animatePrice(state.price, newPrice);
    state.price = newPrice;
    renderPriceBreakdown();
  }

  function animatePrice(from, to) {
    var el = document.getElementById("price-display");
    if (!el) return;
    var duration = 300;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var value = from + (to - from) * progress;
      el.textContent = "$" + value.toFixed(2);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = "$" + to.toFixed(2);
    }
    requestAnimationFrame(step);
  }

  function renderPriceBreakdown() {
    var box = document.getElementById("price-lines");
    if (!box) return;
    var lines = [];
    if (state.itemType) {
      lines.push(ITEM_PRICES[state.itemType].label + " (" + (state.size || "size?") + ") x" + state.quantity);
    }
    Object.keys(state.addons).forEach(function (key) {
      if (state.addons[key]) {
        var nice = key === "giftwrap" ? "Gift wrap" : key === "topper" ? "Custom topper" : "Personalized message";
        lines.push(nice + " (+$" + ADDON_PRICES[key].toFixed(2) + ")");
      }
    });
    box.innerHTML = lines.map(function (l) { return '<div class="line"><span>' + l + "</span></div>"; }).join("");
  }

  /* ----------------------------------------------------------------
     STEP 5 — fulfillment + calendar with real date logic
  ---------------------------------------------------------------- */
  document.querySelectorAll("[data-fulfillment]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("[data-fulfillment]").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      state.fulfillment = btn.dataset.fulfillment;
      persist();
    });
  });

  function buildCalendar() {
    var cal = document.getElementById("calendar");
    if (!cal) return;
    cal.innerHTML = "";

    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach(function (d) {
      var el = document.createElement("div");
      el.className = "dow";
      el.textContent = d;
      cal.appendChild(el);
    });

    var now = new Date();
    var cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48hr from now

    var first = new Date(now.getFullYear(), now.getMonth(), 1);
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var startWeekday = first.getDay();

    for (var i = 0; i < startWeekday; i++) {
      var empty = document.createElement("div");
      empty.className = "cal-day empty";
      cal.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var thisDate = new Date(now.getFullYear(), now.getMonth(), day, 23, 59);
      var key = dateKey(thisDate);
      var bookedCount = BOOKINGS[key] || 0;
      var tooSoon = thisDate < cutoff;
      var fullyBooked = bookedCount >= 3;
      var disabled = tooSoon || fullyBooked;

      var cell = document.createElement("div");
      cell.className = "cal-day" + (disabled ? " disabled" : "");
      cell.textContent = day;
      cell.dataset.date = key;

      if (disabled) {
        var tip = document.createElement("span");
        tip.className = "sticky-note-tip";
        tip.textContent = tooSoon ? "Need 48hrs notice!" : "Fully booked, sorry!";
        cell.appendChild(tip);
      } else {
        cell.addEventListener("click", function () {
          cal.querySelectorAll(".cal-day").forEach(function (c) { c.classList.remove("selected"); });
          this.classList.add("selected");
          state.deliveryDate = this.dataset.date;
          persist();
          var label = document.getElementById("selected-date-label");
          if (label) label.textContent = "Selected: " + this.dataset.date;
        });
      }
      cal.appendChild(cell);
    }
  }
  buildCalendar();

  /* ----------------------------------------------------------------
     STEP 6 — review
  ---------------------------------------------------------------- */
  function renderReview() {
    var box = document.getElementById("review-box");
    if (!box) return;
    var rows = [
      ["Item", state.itemType ? ITEM_PRICES[state.itemType].label : "—"],
      ["Size", state.size || "—"],
      ["Quantity", state.quantity],
      ["Flavor", state.flavor ? FLAVOR_LABELS[state.flavor] : "—"],
      ["Add-ons", Object.keys(state.addons).filter(function (k) { return state.addons[k]; }).join(", ") || "None"],
      ["Message", state.customMessage || "—"],
      ["Fulfillment", state.fulfillment],
      ["Date", state.deliveryDate || "—"],
      ["Total", "$" + computePrice().toFixed(2)]
    ];
    box.innerHTML = rows.map(function (r) {
      return '<div class="rline"><span>' + r[0] + "</span><strong>" + r[1] + "</strong></div>";
    }).join("");

    // sync hidden inputs for Formspree submission
    document.getElementById("hf-item").value = state.itemType || "";
    document.getElementById("hf-size").value = state.size || "";
    document.getElementById("hf-qty").value = state.quantity;
    document.getElementById("hf-flavor").value = state.flavor || "";
    document.getElementById("hf-addons").value = Object.keys(state.addons).filter(function (k) { return state.addons[k]; }).join(", ");
    document.getElementById("hf-message").value = state.customMessage || "";
    document.getElementById("hf-fulfillment").value = state.fulfillment;
    document.getElementById("hf-date").value = state.deliveryDate || "";
    document.getElementById("hf-total").value = "$" + computePrice().toFixed(2);
  }

  form.addEventListener("submit", function (e) {
    if (!state.deliveryDate) {
      e.preventDefault();
      flash("Please select a delivery date before submitting.");
      goToStep(5);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    // form proceeds to submit to Formspree action URL normally
  });

  /* ----------------------------------------------------------------
     PERSISTENCE
  ---------------------------------------------------------------- */
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (err) { /* storage unavailable */ }
  }

  function restoreIfAvailable() {
    var raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch (err) { return; }
    if (!raw) return;
    var saved;
    try { saved = JSON.parse(raw); } catch (err) { return; }
    if (!saved) return;

    Object.assign(state, saved);

    if (state.itemType) {
      var card = document.querySelector('[data-item-type="' + state.itemType + '"]');
      if (card) card.classList.add("selected");
    }
    if (state.size) {
      var sizeCard = document.querySelector('[data-size="' + state.size + '"]');
      if (sizeCard) sizeCard.classList.add("selected");
    }
    qtyInput.value = state.quantity;
    if (state.flavor) {
      var swatch = document.querySelector('[data-flavor="' + state.flavor + '"]');
      if (swatch) swatch.classList.add("selected");
    }
    Object.keys(state.addons).forEach(function (key) {
      if (state.addons[key]) {
        var cb = document.querySelector('[data-addon="' + key + '"]');
        if (cb) {
          cb.checked = true;
          var row = cb.closest(".addon-row");
          if (key === "message") row.classList.add("expanded");
        }
      }
    });
    if (messageBox) messageBox.value = state.customMessage || "";
    document.querySelectorAll("[data-fulfillment]").forEach(function (b) {
      b.classList.toggle("active", b.dataset.fulfillment === state.fulfillment);
    });
    if (state.deliveryDate) {
      var dayCell = document.querySelector('.cal-day[data-date="' + state.deliveryDate + '"]');
      if (dayCell) dayCell.classList.add("selected");
    }

    state.price = computePrice();
    var el = document.getElementById("price-display");
    if (el) el.textContent = "$" + state.price.toFixed(2);
    renderPriceBreakdown();

    goToStep(state.step || 1, { silent: true });
    showRestoreBanner();
  }

  function showRestoreBanner() {
    var banner = document.getElementById("restore-banner");
    if (!banner) return;
    banner.classList.add("show");
    setTimeout(function () {
      banner.classList.add("fade-out");
      setTimeout(function () { banner.classList.remove("show", "fade-out"); }, 700);
    }, 3200);
  }

  /* ----------------------------------------------------------------
     INIT
  ---------------------------------------------------------------- */
  restoreIfAvailable();
  recalcPrice();
})();
