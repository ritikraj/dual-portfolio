/* ==========================================================================
   MOTION
   The concept is that the same work reorders itself for whoever is reading.
   If that happens as an instant innerHTML swap, nobody sees it happen and
   the whole idea reads as four static pages. So every lens change is a
   transition: cards keep their identity and travel to their new positions.

   View Transitions where the browser has them, FLIP everywhere else, and
   nothing at all when the reader has asked for reduced motion.
   ========================================================================== */
(function (w, d) {
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)');

  var running = false;
  function still() { return reduce && reduce.matches; }

  /* FLIP: measure, mutate, invert, play */
  function flip(mutate) {
    var nodes = [].slice.call(d.querySelectorAll('[data-flip]'));
    var first = {};
    nodes.forEach(function (n) { first[n.getAttribute('data-flip')] = n.getBoundingClientRect(); });

    mutate();

    var next = [].slice.call(d.querySelectorAll('[data-flip]'));
    next.forEach(function (n, i) {
      var key = n.getAttribute('data-flip');
      var a = first[key], b = n.getBoundingClientRect();
      if (!a) {                                   /* new to this lens: rise in */
        n.animate(
          [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, delay: Math.min(i * 28, 260), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }
        );
        return;
      }
      var dx = a.left - b.left, dy = a.top - b.top, sx = a.width / b.width;
      if (!dx && !dy && Math.abs(sx - 1) < .01) return;
      n.animate(
        [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scaleX(' + sx + ')', opacity: .75 },
         { transform: 'none', opacity: 1 }],
        { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)' }
      );
    });
  }

  w.Motion = {
    still: still,

    /* run a DOM mutation as a transition. one at a time: a second one
       starting mid-flight aborts the first and rejects its promises */
    swap: function (mutate) {
      if (still()) { mutate(); return; }
      if (running || !d.startViewTransition) { flip(mutate); return; }
      running = true;
      var t = d.startViewTransition(mutate);
      var done = function () { running = false; };
      t.finished.then(done, done);
      t.ready.catch(function () {});
      t.updateCallbackDone.catch(function () {});
    },

    /* stagger a set of nodes in */
    enter: function (nodes, step) {
      if (still()) return;
      [].slice.call(nodes).forEach(function (n, i) {
        n.animate(
          [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay: i * (step || 60), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' }
        );
      });
    },

    /* Sections arrive as you reach them, once.

       Anything already inside the viewport is marked in the same task it was
       built in, so it never paints at zero opacity. Without that, a lens
       change rebuilds the page, the observer fires a frame later, and the
       transition captures the new state while it is still invisible. */
    reveal: function (root) {
      var nodes = [].slice.call((root || d).querySelectorAll('[data-reveal]:not(.is-in)'));
      if (!nodes.length) return;
      if (still() || !('IntersectionObserver' in w)) {
        nodes.forEach(function (n) { n.classList.add('is-in'); });
        return;
      }
      var vh = w.innerHeight || 800, later = [];
      nodes.forEach(function (n) {
        if (n.getBoundingClientRect().top < vh * 0.95) n.classList.add('is-in');
        else later.push(n);
      });
      if (!later.length) return;
      var io = new IntersectionObserver(function (rows) {
        rows.forEach(function (r) {
          if (!r.isIntersecting) return;
          r.target.classList.add('is-in');
          io.unobserve(r.target);
        });
      }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
      later.forEach(function (n) { io.observe(n); });
    }
  };
})(window, document);
