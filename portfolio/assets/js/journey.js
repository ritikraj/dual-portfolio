/* ==========================================================================
   JOURNEY · journey.js
   Draws the accent down the rail as you read, and lights each bead as the
   fill reaches it — the index page's thread, for a page that scrolls.
   Chrome, reveals, the veil and page transitions come from case.js.
   ========================================================================== */
(function () {
  'use strict';

  var list  = document.getElementById('jrList'),
      rail  = document.getElementById('jrRail'),
      items = [].slice.call(document.querySelectorAll('.jr-item, .jr-group')),
      tick  = false;

  if (!list || !rail) return;

  function paint() {
    tick = false;
    // the fill leads the eye slightly: it tracks a line a little below the
    // middle of the screen, which is roughly where you are reading
    var line = window.innerHeight * 0.58,
        r    = rail.getBoundingClientRect(),
        p    = r.height > 0 ? (line - r.top) / r.height : 0;

    p = Math.max(0, Math.min(1, p));
    rail.style.setProperty('--p', p.toFixed(4));

    items.forEach(function (el) {
      var dot = el.querySelector('.jr-dot');
      if (!dot) return;
      el.classList.toggle('is-past', dot.getBoundingClientRect().top < line);
    });
  }

  function ask() { if (!tick) { tick = true; requestAnimationFrame(paint); } }

  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  paint();
})();
