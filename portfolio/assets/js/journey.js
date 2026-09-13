/* ==========================================================================
   JOURNEY · journey.js
   The index page's thread, for a page that scrolls: the same breathing
   curve, repeated down the length of the list, drawn in the accent as you
   read. Every bead is seated on the curve at its own height, and lights as
   the fill reaches it.

   Chrome, reveals, the veil and page transitions come from case.js.
   ========================================================================== */
(function () {
  'use strict';

  var list = document.getElementById('jrList'),
      svg  = document.getElementById('jrThread'),
      base = document.getElementById('jrBase'),
      live = document.getElementById('jrLive');
  if (!list || !svg || !base || !live) return;

  var rows = [].slice.call(list.querySelectorAll('.jr-item, .jr-group')),
      len = 0, end = 0, lut = [], seats = [], tick = false;

  /* ── the curve ────────────────────────────────────────────────────────── */
  function draw() {
    var W = svg.clientWidth;
    if (!W || !list.offsetHeight) return;

    // measure the beads before drawing anything: the thread should start at
    // the top of the list and stop dead at the last bead, not trail on past
    // it into nothing. offsets ignore the reveal transforms, so an item that
    // has not animated in yet still measures where it will finally sit.
    var listY = docY(list);
    seats = rows.map(function (row) {
      var dot = row.querySelector('.jr-dot');
      return dot ? { row: row, dot: dot, y: docY(dot) + dot.offsetHeight / 2 - listY } : null;
    }).filter(Boolean);
    if (!seats.length) return;

    var H = seats[seats.length - 1].y;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + list.offsetHeight);

    // the same bend the index thread makes, laid end to end
    var x = W / 2, s = W < 40 ? 5 : 17, seg = 440, y = 0, flip = 1,
        d = 'M' + x + ',0';
    while (y < H) {
      var y1 = Math.min(H, y + seg), h = y1 - y;
      d += ' C' + (x - s * flip).toFixed(1) + ',' + (y + h * 0.38).toFixed(1) +
           ' '  + (x + s * flip).toFixed(1) + ',' + (y + h * 0.66).toFixed(1) +
           ' '  + x + ',' + y1.toFixed(1);
      y = y1; flip = -flip;
    }
    base.setAttribute('d', d);
    live.setAttribute('d', d);
    len = live.getTotalLength();
    live.style.strokeDasharray = len;

    // height down the list → position along the curve. the path only ever
    // travels downward, so height is a clean key.
    lut = [];
    var N = Math.max(60, Math.round(len / 12)), i, pt;
    for (i = 0; i <= N; i++) {
      pt = live.getPointAtLength(len * i / N);
      lut.push({ y: pt.y, x: pt.x, l: len * i / N });
    }

    // seat each bead on the curve at its own height
    seats.forEach(function (st) {
      st.dot.style.transform = 'translateX(' + (at(st.y, 'x') - W / 2).toFixed(1) + 'px)';
    });

    end = H;
    paint();
  }

  /* distance from the top of the document, summed up the offsetParent chain.
     a single offsetTop is relative to whatever ancestor the browser picks,
     which is not reliably the list: summing all the way up and subtracting
     the list's own total is correct whichever one it is. */
  function docY(el) {
    var y = 0;
    while (el) { y += el.offsetTop; el = el.offsetParent; }
    return y;
  }

  /* interpolate the table at a height */
  function at(y, key) {
    if (!lut.length) return 0;
    if (y <= lut[0].y) return lut[0][key];
    var last = lut[lut.length - 1];
    if (y >= last.y) return last[key];
    var lo = 0, hi = lut.length - 1;
    while (hi - lo > 1) {
      var mid = (lo + hi) >> 1;
      if (lut[mid].y < y) lo = mid; else hi = mid;
    }
    var a = lut[lo], b = lut[hi], t = (y - a.y) / ((b.y - a.y) || 1);
    return a[key] + (b[key] - a[key]) * t;
  }

  /* ── the fill ─────────────────────────────────────────────────────────── */
  function paint() {
    tick = false;
    if (!len) return;

    var vh   = window.innerHeight,
        top  = list.getBoundingClientRect().top,
        line = vh * 0.58;

    // near the bottom of the page there may be no scroll left to carry the
    // reading line past the last bead. over the final screen of scroll, ease
    // the line down to wherever the thread ends, so it always completes.
    var max      = Math.max(0, document.documentElement.scrollHeight - vh),
        endAtMax = (top + window.scrollY) + end - max;   /* where the thread ends on screen at full scroll */
    if (endAtMax > line) {
      var k = Math.max(0, Math.min(1, (window.scrollY - (max - vh)) / vh));
      line = line + (endAtMax + 2 - line) * k;
    }

    var y = line - top;
    live.style.strokeDashoffset = (len - at(y, 'l')).toFixed(1);
    seats.forEach(function (st) { st.row.classList.toggle('is-past', st.y <= y); });
  }

  function ask() { if (!tick) { tick = true; requestAnimationFrame(paint); } }

  var rt;
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(draw, 120); });
  // type settling moves everything; measure again once the webfonts land
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
