/* ==========================================================================
   PORTFOLIO B — "the read" · read.js

   Deliberately NOT jQuery and deliberately not shaped like app.js. Side A is a
   slow vertical ceremony; this is a fast horizontal instrument. Nothing is
   shared between the two files except the data they describe.

   Public API (app.js calls these):
     TheRead.preload()   fetch fonts early — fired when the hero's light side is hovered
     TheRead.start()     hand the screen over
     TheRead.stop()      give it back
     TheRead.go(i)       jump to a card
   ========================================================================== */

window.TheRead = (function () {
  'use strict';

  /* ── CFG ──────────────────────────────────────────────────────────────── */
  var CFG = {
    duration   : 560,   // keep in step with --pb-dur in read.css
    silence    : 170,   // ms of wheel quiet before a new flick counts
    dragSnap   : 0.22,  // fraction of a screen you must drag to advance
    flickSpeed : 0.55,  // px/ms that counts as a throw regardless of distance
    stagger    : 55,    // ms between revealed elements
    parallax   : 0.18,  // how much the graph paper lags the strip
    countTime  : 900    // metric roll-up
  };

  var FONTS = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700' +
              '&family=IBM+Plex+Mono:wght@300;400;500&display=swap';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { CFG.duration = 1; CFG.countTime = 1; CFG.stagger = 0; }

  /* ── state ────────────────────────────────────────────────────────────── */
  var root, strip, grid, rail, readout,
      cards = [], ticks = [],
      index = 0, width = 0,
      live = false, blocked = false, silenceT = null,
      drag = null, typeT = null, booted = false;


  /* ── boot ─────────────────────────────────────────────────────────────── */
  function boot() {
    if (booted) return;
    booted  = true;
    root    = document.getElementById('portfolio-b');
    strip   = document.getElementById('pbStrip');
    grid    = document.getElementById('pbGrid');
    rail    = document.getElementById('pbRail');
    readout = document.getElementById('pbReadout');
    cards   = [].slice.call(strip.querySelectorAll('.pb-card'));

    mode();
    buildRail();
    buildTabs();
    stampStagger();
    bind();
    measure();
  }

  /* the bottom rail is generated from each card's data-rail — add a card,
     the rail grows. nothing to register anywhere. */
  function buildRail() {
    rail.innerHTML = cards.map(function (card, i) {
      return '<button class="pb-tick" type="button" data-go="' + i + '" ' +
               'title="' + (card.getAttribute('data-rail') || '') + '">' +
               '<span class="pb-tick__n">' + pad(i) + '</span>' +
               (card.getAttribute('data-rail') || '') +
             '</button>';
    }).join('');
    ticks = [].slice.call(rail.children);
    rail.addEventListener('click', function (e) {
      var t = e.target.closest('.pb-tick');
      if (t) go(+t.getAttribute('data-go'));
    });
  }

  /* ── light or dark ──────────────────────────────────────────────────────
     Side b has one preference and no palettes. It follows the operating
     system until someone presses the button, and then it remembers.
     -------------------------------------------------------------------- */
  function mode() {
    var btn = document.getElementById('pbMode');
    if (!btn) return;
    var saved = store('rr-pb-mode'), pinned = !!saved;
    var now = saved || sys();

    function paint() { document.documentElement.setAttribute('data-pb', now); }
    paint();

    btn.addEventListener('click', function () {
      now = now === 'dark' ? 'light' : 'dark';
      pinned = true;
      store('rr-pb-mode', now);
      paint();
    });

    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var follow = function (e) { if (!pinned) { now = e.matches ? 'dark' : 'light'; paint(); } };
      if (mq.addEventListener) mq.addEventListener('change', follow);
      else if (mq.addListener) mq.addListener(follow);
    }
  }

  function sys() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }

  /* every sheet wears the same tab: where you are, what it is, whose voice.
     generated, so adding a card never means hand-numbering anything. */
  function buildTabs() {
    cards.forEach(function (card, i) {
      var sheet = card.querySelector('.pb-sheet');
      if (!sheet || sheet.querySelector('.pb-sheet__tab')) return;
      var tab = document.createElement('header');
      tab.className = 'pb-sheet__tab';
      tab.innerHTML = '<span><b>' + pad(i) + '</b><em>/' + pad(cards.length - 1) + '</em>' +
                        '<i>·</i>' + (card.getAttribute('data-rail') || '') + '</span>' +
                      '<span><em>assessment · claude</em></span>';
      sheet.insertBefore(tab, sheet.firstChild);
    });
  }

  /* each [data-in] gets its own delay — set once, in the DOM, so the CSS
     stays free of a ladder of nth-child rules */
  function stampStagger() {
    cards.forEach(function (card) {
      [].slice.call(card.querySelectorAll('[data-in]')).forEach(function (el, i) {
        el.style.setProperty('--d', (i * CFG.stagger) + 'ms');
      });
    });
  }


  /* ── input ────────────────────────────────────────────────────────────── */
  function bind() {
    // wheel: one flick = one card, momentum swallowed
    root.addEventListener('wheel', function (e) {
      if (!live) return;
      // on narrow screens a card may scroll vertically inside itself
      if (window.innerWidth <= 720 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
      e.preventDefault();

      clearTimeout(silenceT);
      silenceT = setTimeout(function () { blocked = false; }, CFG.silence);
      if (blocked) return;

      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(d) < 2) return;
      blocked = true;
      go(index + (d > 0 ? 1 : -1));
    }, { passive: false });

    // drag / throw — 1:1 with the cursor, then snap
    strip.addEventListener('pointerdown', function (e) {
      if (!live || e.target.closest('a, button, kbd')) return;
      drag = { x: e.clientX, t: performance.now(), dx: 0, id: e.pointerId };
      strip.setPointerCapture(e.pointerId);
      strip.classList.add('is-dragging');
    });

    strip.addEventListener('pointermove', function (e) {
      if (!drag) return;
      drag.dx = e.clientX - drag.x;
      paint(-index * width + drag.dx * 0.92);
    });

    ['pointerup', 'pointercancel'].forEach(function (ev) {
      strip.addEventListener(ev, function () {
        if (!drag) return;
        var dx = drag.dx,
            v  = Math.abs(dx) / Math.max(1, performance.now() - drag.t);
        strip.classList.remove('is-dragging');
        drag = null;
        if (Math.abs(dx) > width * CFG.dragSnap || v > CFG.flickSpeed) {
          go(index + (dx < 0 ? 1 : -1));
        } else {
          render();                       // rubber back
        }
      });
    });

    // keys
    document.addEventListener('keydown', function (e) {
      if (!live) return;
      var k = e.key;
      if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); go(index + 1); }
      else if (k === 'ArrowLeft' || k === 'PageUp')            { e.preventDefault(); go(index - 1); }
      else if (k === 'Home')                                    { e.preventDefault(); go(0); }
      else if (k === 'End')                                     { e.preventDefault(); go(cards.length - 1); }
    });

    // touch swipe is handled by pointer events above; just stop the page
    // rubber-banding sideways
    root.addEventListener('touchmove', function (e) {
      if (live && window.innerWidth > 720) e.preventDefault();
    }, { passive: false });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); render(true); }, 120);
    });
  }


  /* ── movement ─────────────────────────────────────────────────────────── */
  function measure() { width = root.clientWidth; }

  function paint(x) {
    strip.style.transform = 'translate3d(' + x + 'px,0,0)';
    grid.style.transform  = 'translate3d(' + (x * CFG.parallax) + 'px,0,0)';
  }

  function go(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    if (i === index && !drag) { render(); return; }
    index = i;
    render();
  }

  function render(instant) {
    if (instant) { strip.style.transition = 'none'; grid.style.transition = 'none'; }
    paint(-index * width);
    if (instant) { strip.offsetHeight; strip.style.transition = ''; grid.style.transition = ''; }

    cards.forEach(function (c, i) { c.classList.toggle('is-live', i === index); });
    ticks.forEach(function (t, i) {
      t.classList.toggle('is-now',  i === index);
      t.classList.toggle('is-past', i <  index);
    });

    var label = cards[index].getAttribute('data-rail') || '';
    type(label);
    countUp(cards[index]);
    if (live) {
      document.title = label + ' · the read';
      if (window.trackView) trackView('/b/' + label.replace(/[^a-z0-9]+/gi, '-'), 'b · ' + label);
    }
  }


  /* ── the typed readout, top right ─────────────────────────────────────── */
  function type(text) {
    clearTimeout(typeT);
    if (reduced) { readout.textContent = text; return; }
    var i = 0;
    readout.textContent = '';
    (function step() {
      readout.textContent = text.slice(0, ++i);
      if (i < text.length) typeT = setTimeout(step, 26);
    })();
  }


  /* ── metric roll-up ───────────────────────────────────────────────────── */
  /* the markup holds the final values (75.2%, ~3,000, $2M+), so scrapers, link
     previews and anyone without js read the real numbers. this only replays
     them from zero when a sheet comes into view. keep the two in step. */
  function countUp(card) {
    [].slice.call(card.querySelectorAll('b[data-count]')).forEach(function (el) {
      if (el._done) return;
      el._done = true;
      var target = parseFloat(el.getAttribute('data-count')),
          dec    = (el.getAttribute('data-count').split('.')[1] || '').length,
          pre    = el.getAttribute('data-prefix') || '',
          suf    = el.getAttribute('data-suffix') || '',
          thou   = el.getAttribute('data-format') === 'k',
          t0     = performance.now();

      (function frame(now) {
        var p = Math.min(1, (now - t0) / CFG.countTime),
            e = 1 - Math.pow(1 - p, 4),                  // easeOutQuart
            v = (target * e).toFixed(dec);
        el.textContent = pre + (thou ? (+v).toLocaleString('en-US') : v) + suf;
        if (p < 1) requestAnimationFrame(frame);
      })(t0);
    });
  }


  /* ── fonts, fetched the moment the hero's light side is touched ───────── */
  function preload() {
    if (document.getElementById('pbFonts')) return;
    var l = document.createElement('link');
    l.id = 'pbFonts'; l.rel = 'stylesheet'; l.href = FONTS;
    document.head.appendChild(l);
  }


  /* ── lifecycle ────────────────────────────────────────────────────────── */
  function indexOfSlug(slug) {
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].querySelector('a[href*="' + slug + '"]')) return i;
    }
    return 0;
  }

  function start(at) {
    boot(); preload();
    root.classList.add('is-live');
    root.setAttribute('aria-hidden', 'false');
    live = true;
    index = Math.max(0, Math.min(cards.length - 1, at || 0));
    measure();
    // reset the counters so a second visit still rolls up
    [].slice.call(root.querySelectorAll('b[data-count]')).forEach(function (b) { b._done = false; });
    render(true);
  }

  function stop() {
    live = false;
    root.classList.remove('is-live');
    root.setAttribute('aria-hidden', 'true');
    cards.forEach(function (c) { c.classList.remove('is-live'); });
    clearTimeout(typeT);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* the exit button belongs to this side; the hero owns what happens next */
  document.addEventListener('DOMContentLoaded', function () {
    boot();
    document.getElementById('pbExit').addEventListener('click', function () {
      if (window.Portfolio) window.Portfolio.Hero.back();
    });
  });

  return { start: start, stop: stop, go: go, indexOfSlug: indexOfSlug, preload: preload, CFG: CFG };
})();
