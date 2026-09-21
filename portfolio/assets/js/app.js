/* ==========================================================================
   ritik raj — portfolio · app.js
   jQuery 3.7 · no build step · everything is meant to be edited by hand.

   MODULES
     CONFIG    — every number you'd want to tweak, in one place
     Viewport  — real viewport height (mobile url bars lie about vh)
     Hero      — the 50/50 door, hover expansion, the grand exit
     Stage     — one-section-at-a-time scroller (wheel / touch / keys)
     Thread    — the luxurious line down the left, drawn by progress
     Timeline  — case-study dots, in and out with the case-study block
   ========================================================================== */

(function ($) {
  'use strict';

  /* ── CONFIG ───────────────────────────────────────────────────────────── */
  var CONFIG = {
    slideDuration : 1150,  // must match --dur-slide in app.css
    wheelThreshold: 34,    // how hard a trackpad flick has to be
    wheelCooldown : 180,   // quiet time after a slide before wheel counts again
    wheelDecay    : 200,   // reset the accumulator after this much silence
    swipeThreshold: 55,    // px of finger travel to count as a swipe
    heroExit      : 900,   // hero panel expand before the curtain
    curtainHold   : 260,   // beat between curtain up and curtain away
    popsToOpen    : 6      // bubbles burst before the plugin section appears
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) { CONFIG.slideDuration = 1; CONFIG.heroExit = 1; CONFIG.curtainHold = 1; }

  var $win = $(window), $body = $('body');


  /* ── VIEWPORT ─────────────────────────────────────────────────────────── */
  var Viewport = {
    h: 0,
    w: 0,
    init: function () { this.measure(); },
    measure: function () {
      var h = window.innerHeight, w = window.innerWidth;

      // ignore the small height wobble mobile browsers make when the url bar
      // hides, or the whole stage jumps mid-scroll. only when the width has
      // not moved, though: a real resize changes both, and swallowing it here
      // leaves --vh and the thread drawn for the old viewport.
      if (w === this.w && this.h !== 0 && w < 900 && Math.abs(h - this.h) < 90) return false;

      this.h = h;
      this.w = w;
      document.documentElement.style.setProperty('--vh', h + 'px');
      return true;
    }
  };


  /* ── THREAD ───────────────────────────────────────────────────────────
     The bead rides the path itself. CSS can only interpolate a transform
     in a straight line, which cut the corner off every curve — so the two
     properties are tweened together here instead, one rAF, same easing as
     the slide. Nothing about the thread is animated in CSS any more.
     ------------------------------------------------------------------- */
  var ease = bezier(0.16, 1, 0.3, 1);   // keep in step with --ease-lux

  var Thread = {
    p: null,

    init: function () {
      this.$svg = $('#thread');
      this.rail = document.getElementById('threadRail');
      this.live = document.getElementById('threadLive');
      this.bead = document.getElementById('threadBead');
      this.$stops = $('#threadStops');
      this.at = 0;
      if (!this.rail) return;

      var self = this;
      this.$stops.on('click', '.thread__stop', function () {
        Stage.goTo(parseInt(this.getAttribute('data-go'), 10));
      });
      // the first measurement happens before the webfont lands, so take it again
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { self.fit(); });
      }
      this.draw();
      this.set(0, true);
    },

    /* a gently breathing s-curve — a thread, not a border */
    draw: function () {
      var w = this.$svg.width(), h = Viewport.h, x = w / 2, s = Math.min(w * 0.14, 22);
      var d = 'M' + x + ',0' +
              ' C' + (x - s) + ',' + h * 0.20 + ' ' + (x + s) + ',' + h * 0.34 + ' ' + x + ',' + h * 0.52 +
              ' C' + (x - s) + ',' + h * 0.70 + ' ' + (x + s) + ',' + h * 0.84 + ' ' + x + ',' + h;
      this.rail.setAttribute('d', d);
      this.live.setAttribute('d', d);
      this.len = this.live.getTotalLength();
      this.live.style.strokeDasharray = this.len;

      // the sections live on the middle stretch of the thread, not its ends:
      // the top of the screen is under the bar and the bottom is the edge, so
      // a bead parked at either one is a bead nobody can see or reach
      var top = Math.max(96, h * 0.11), bottom = Math.max(64, h * 0.08);
      this.a = this.len * (top / h);
      this.b = this.len * (1 - bottom / h);

      this.stops(this.labels);
    },

    /* progress 0 → 1, as a length along the padded stretch of the thread */
    lenAt: function (p) {
      return this.a + Math.max(0, Math.min(1, p)) * (this.b - this.a);
    },

    /* one bead per section, sitting exactly where the progress bead will come
       to rest on it. the visible pip is 2.2px; the circle that catches the
       click is 11px, which is the whole point. */
    stops: function (labels) {
      if (!labels || !labels.length || !this.len) return;
      this.labels = labels;

      var n = labels.length, html = '', i, pt, p;
      for (i = 0; i < n; i++) {
        p  = n > 1 ? i / (n - 1) : 1;
        pt = this.live.getPointAtLength(this.lenAt(p));
        html += '<g class="thread__stop" data-go="' + i + '" ' +
                  'transform="translate(' + pt.x.toFixed(1) + ',' + pt.y.toFixed(1) + ')">' +
                  '<circle class="thread__hit" r="11"/>' +
                  '<circle class="thread__pip" r="2.2"/>' +
                  '<g class="thread__tip">' +
                    '<rect class="thread__chip" rx="3"/>' +
                    '<text class="thread__label" x="18" y="3.4">' + (labels[i] || '') + '</text>' +
                  '</g>' +
                '</g>';
      }
      this.$stops.html(html);
      this.fit();
      this.mark(this.at);
    },

    /* the label sits over whatever section is behind it, so it needs a scrim.
       sizing it by hand would break the moment a section is renamed, so the
       rect is measured off the text it has to cover. */
    fit: function () {
      this.$stops.children().each(function () {
        var t = this.querySelector('.thread__label'),
            r = this.querySelector('.thread__chip');
        if (!t || !r) return;
        var b = t.getBBox();
        r.setAttribute('x',      (b.x - 9).toFixed(1));
        r.setAttribute('y',      (b.y - 6).toFixed(1));
        r.setAttribute('width',  (b.width + 18).toFixed(1));
        r.setAttribute('height', (b.height + 12).toFixed(1));
      });
    },

    mark: function (i) {
      this.at = i;
      this.$stops.children().each(function (k) {
        this.classList.toggle('is-on', k === i);
      });
    },

    /* progress: 0 → 1 */
    set: function (target, instant) {
      if (!this.len) return;
      var self = this,
          to   = Math.max(0, Math.min(1, target)),
          from = this.p === null ? to : this.p,
          dur  = instant ? 0 : CONFIG.slideDuration,
          t0   = performance.now();

      cancelAnimationFrame(this._raf);
      if (dur < 16 || from === to) { this.p = to; this.paint(to); return; }

      this._raf = requestAnimationFrame(function frame(now) {
        var k = Math.min(1, (now - t0) / dur);
        self.p = from + (to - from) * ease(k);
        self.paint(self.p);
        if (k < 1) self._raf = requestAnimationFrame(frame);
      });
    },

    paint: function (p) {
      var L = this.lenAt(p);
      this.live.style.strokeDashoffset = this.len - L;
      var pt = this.live.getPointAtLength(L);
      this.bead.style.transform = 'translate(' + pt.x + 'px,' + pt.y + 'px)';
    }
  };


  /* ── TYPER ────────────────────────────────────────────────────────────
     The intro line names three jobs by typing one at a time. Decoration
     only: the readable copy of all three words is already in the markup,
     so a screen reader, a crawler and anyone on reduced motion get the
     whole claim without waiting for an animation.

     It pauses while the tab is in the background. It does not try to watch
     the panel itself: the stage slides a track rather than scrolling, so an
     intersection observer answers once, says no, and never fires again.
     ------------------------------------------------------------------- */
  var Typer = {
    words: ['designer', 'developer', 'product owner'],
    typeMs: 62, eraseMs: 26, holdMs: 1900, gapMs: 130,

    init: function () {
      this.out = document.getElementById('typeOut');
      if (!this.out) return;

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) { this.out.textContent = this.words[0]; return; }

      this.i = 0; this.n = 0; this.erasing = false;

      var self = this;
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) self.tick();
      });

      this.tick();
    },

    tick: function () {
      clearTimeout(this._t);
      if (document.hidden) return;

      var word = this.words[this.i], wait;

      if (!this.erasing) {
        this.n++;
        if (this.n >= word.length) { this.erasing = true; wait = this.holdMs; }
        else wait = this.typeMs;
      } else {
        this.n--;
        if (this.n <= 0) {
          this.erasing = false;
          this.i = (this.i + 1) % this.words.length;
          wait = this.gapMs;
        } else wait = this.eraseMs;
      }

      this.out.textContent = word.slice(0, Math.max(0, this.n));

      var self = this;
      this._t = setTimeout(function () { self.tick(); }, wait);
    }
  };

  /* ── BUBBLES ──────────────────────────────────────────────────────────
     A keyword field drifting in the empty half of the intro. Rebuilt every
     time that section comes back into view, with a different nine of the
     twelve words each time, so it is never quite the same field twice.
     Peripheral on purpose: slow, low contrast, and nothing depends on it.
     ------------------------------------------------------------------- */
  var Bubbles = {
    /* what a recruiter or a design manager actually scans for. keep them
       short: every one of these has to sit inside a circle. */
    words: [
      'design systems', 'design ops', 'leadership', '0 → 1',
      'b2b saas', 'ux architecture', 'governance', 'research',
      'figma', 'accessibility', 'tokens', 'mentoring',
      'frontend', 'enterprise'
    ],
    count: 9,

    init: function () {
      var self = this;
      this.$el = $('#bubbles');
      this.$el.on('click', '.bubble', function () { self.pop($(this)); });
    },

    spawn: function () {
      if (!this.$el || !this.$el.length) return;
      if (this.$el.children().length) return;          // already standing

      var W = this.$el.width(), H = this.$el.height();
      if (!W || !H) return;

      var picks = shuffle(this.words.slice()).slice(0, this.count),
          placed = [], html = '', i, k;

      for (i = 0; i < picks.length; i++) {
        var size = Math.max(78, Math.min(124, 60 + picks[i].length * 4.2)),
            spot = this.findSpot(size, placed, W, H);
        if (!spot) continue;
        placed.push({ x: spot.x, y: spot.y, r: size / 2 });

        html += '<button class="bubble" type="button" tabindex="-1" style="' +
                  'left:' + ((spot.x / W) * 100).toFixed(2) + '%;' +
                  'top:'  + ((spot.y / H) * 100).toFixed(2) + '%;' +
                  '--size:' + size.toFixed(0) + 'px;' +
                  this.path(size) +
                  '--dur:' + (8.5 + Math.random() * 5).toFixed(1) + 's;' +
                  '--wob:' + (3.6 + Math.random() * 2.6).toFixed(1) + 's;' +
                  '--drift-delay:-' + (Math.random() * 14).toFixed(1) + 's;' +
                  '--wob-delay:-' + (Math.random() * 6).toFixed(1) + 's;' +
                  '--in:' + (i * 80) + 'ms">' +
                  '<span>' + picks[i] + '</span>' +
                '</button>';
      }

      var $el = this.$el.html(html);
      requestAnimationFrame(function () { $el.addClass('is-in'); });
    },

    /* four waypoints on a closed loop. smaller bubbles are lighter, so they
       travel further — the amplitude scales down with size. */
    path: function (size) {
      var reach = 48 - (size - 78) * 0.2, out = '', k;
      for (k = 1; k <= 3; k++) {
        out += '--x' + k + ':' + ((Math.random() * 2 - 1) * reach).toFixed(0) + 'px;' +
               '--y' + k + ':' + ((Math.random() * 2 - 1) * reach * 1.25).toFixed(0) + 'px;';
      }
      return out;
    },

    /* pack them: candidates pulled toward the middle of the field, rejected
       if they bite too far into a bubble already placed. that gives a cluster
       rather than a grid, which is how bubbles actually sit.

       The search relaxes as it fails — first passes lean hard on the centre
       and keep their distance, later ones spread out and accept a closer
       kiss. Without that the middle fills up and the rest never get placed. */
    findSpot: function (size, placed, W, H) {
      var r = size / 2, tries = 500, i, k;

      for (i = 0; i < tries; i++) {
        var t    = i / tries,
            // 0 → hugs the centre, 1 → anywhere in the field
            bias = t < 0.4 ? (Math.random() + Math.random()) / 2 : Math.random(),
            biasY= t < 0.4 ? (Math.random() + Math.random()) / 2 : Math.random(),
            gap  = 0.95 - t * 0.16,                  // 95% apart, easing to 79%
            x    = r + bias  * (W - size),
            y    = r + biasY * (H - size),
            ok   = true;

        for (k = 0; k < placed.length; k++) {
          var p = placed[k];
          if (Math.hypot(x - p.x, y - p.y) < (r + p.r) * gap) { ok = false; break; }
        }
        if (ok) return { x: x, y: y };
      }
      return null;
    },

    pop: function ($b) {
      if ($b.hasClass('is-pop')) return;
      var drops = '', d, a, dist;
      for (d = 0; d < 7; d++) {
        a    = (d / 7) * 360 + Math.random() * 34;
        dist = 24 + Math.random() * 30;
        drops += '<i style="--a:' + a.toFixed(0) + 'deg;' +
                 '--d:' + dist.toFixed(0) + 'px;' +
                 '--s:' + (2 + Math.random() * 2.4).toFixed(1) + 'px"></i>';
      }
      $b.addClass('is-pop').append(drops);
      setTimeout(function () { $b.remove(); }, 500);

      // someone who pops six is paying attention. say so.
      // the tally is plain memory: a reload is a clean slate.
      this.pops = (this.pops || 0) + 1;
      $('#popCount').text(this.pops);          // the real number, not the threshold
      if (this.pops === CONFIG.popsToOpen) Stage.unlock(true);
    },

    clear: function () {
      if (this.$el) this.$el.removeClass('is-in').empty();
    }
  };

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i];
      a[i] = a[j]; a[j] = t;
    }
    return a;
  }


  /* ── TIMELINE (case-study dots) ───────────────────────────────────────── */
  var Timeline = {
    init: function (cases) {
      var $t = this.$el = $('#timeline');
      this.cases = cases;               // [{index, label}, ...]
      var html = '';
      $.each(cases, function (i, c) {
        html += '<button class="timeline__dot" type="button" data-go="' + c.index + '" ' +
                'aria-label="case study: ' + c.label + '">' +
                  '<span><i>case study</i><b>' + c.label + '</b></span>' +
                '</button>';
      });
      $t.html(html);
      this.$dots = $t.find('.timeline__dot');
      $t.off('click').on('click', '.timeline__dot', function () {
        Stage.goTo(parseInt($(this).data('go'), 10));
      });
    },
    update: function (index, isCase) {
      this.$el.toggleClass('is-on', !!isCase);
      this.$dots.each(function () {
        $(this).toggleClass('is-on', parseInt($(this).data('go'), 10) === index);
      });
    }
  };


  /* ── STAGE — the one-section-at-a-time scroller ───────────────────────── */
  var Stage = {
    index: 0,
    locked: true,       // stays locked until the hero hands over
    acc: 0,
    accAt: 0,

    init: function () {
      this.$stage  = $('#portfolio-a');
      this.$track  = $('#track');
      this.track   = this.$track[0];

      Bubbles.init();
      this.read();
      this.bind();
      this.layout();
      this.render(true);
    },

    /* re-read the running order. anything [hidden] is not in it. */
    read: function () {
      this.$panels = this.$track.children('.panel').not('[hidden]');
      this.count   = this.$panels.length;
      $('#countAll').text(pad(this.count));

      var cases = [];
      this.$panels.each(function (i) {
        if ($(this).is('[data-case]')) {
          cases.push({ index: i, label: $(this).data('label') || ('case ' + $(this).data('case')) });
        }
      });
      Timeline.init(cases);

      var labels = [];
      this.$panels.each(function () { labels.push($(this).data('label') || ''); });
      Thread.stops(labels);
    },

    /* the plugin section joins the running order. `announce` is false when we
       are only restoring it after a page change, so nobody is told twice. */
    unlock: function (announce) {
      var $new = this.$track.children('.panel--aside');
      if (!$new.length || !$new.prop('hidden')) return;

      $new.prop('hidden', false);
      if (announce && window.track) track('plugin_unlocked');
      this.read();
      this.layout();
      this.render(true);

      if (!announce) return;
      var self = this, at = this.$panels.index($new);
      var $n = $('#notice').html(
        'i noticed. <b>a new section</b> opened near the end.<br>' +
        '<a class="notice__go" href="#">take me there' +
          '<svg viewBox="0 0 28 8" aria-hidden="true"><path d="M0 4h26M22 1l4 3-4 3" fill="none" stroke="currentColor" stroke-width="1"/></svg>' +
        '</a>'
      ).addClass('is-on');
      $n.off('click').on('click', '.notice__go', function (e) {
        e.preventDefault();
        clearTimeout(self.noticeT);
        $n.removeClass('is-on');
        self.goTo(at);
      });
      clearTimeout(this.noticeT);
      this.noticeT = setTimeout(function () { $n.removeClass('is-on'); }, 9000);
    },

    bind: function () {
      var self = this;

      // wheel — non-passive so we can own the gesture
      this.track.parentNode.addEventListener('wheel', function (e) {
        if (!self.isLive()) return;
        e.preventDefault();
        self.onWheel(e);
      }, { passive: false });

      // touch. anything marked [data-scroll-x] keeps its own gesture — the
      // principles rail on mobile is one — so we neither block it nor read it
      // as a section swipe.
      var y0 = 0, t0 = 0, inRail = false;
      this.$stage.on('touchstart', function (e) {
        y0 = e.originalEvent.touches[0].clientY;
        t0 = Date.now();
        inRail = !!$(e.target).closest('[data-scroll-x]').length;
      });
      this.$stage.on('touchmove', function (e) {
        if (inRail) return;
        e.preventDefault();
      });
      this.$stage.on('touchend', function (e) {
        if (!self.isLive() || self.locked || inRail) return;
        var dy = e.originalEvent.changedTouches[0].clientY - y0;
        var quick = Date.now() - t0 < 700;
        if (Math.abs(dy) > (quick ? CONFIG.swipeThreshold : CONFIG.swipeThreshold * 1.6)) {
          self.move(dy < 0 ? 1 : -1);
        }
      });

      // keys
      $(document).on('keydown', function (e) {
        if (!self.isLive() || self.locked || Viewer.isOpen) return;
        switch (e.key) {
          case 'ArrowDown': case 'PageDown': case ' ':
            e.preventDefault(); self.move(1); break;
          case 'ArrowUp': case 'PageUp':
            e.preventDefault(); self.move(-1); break;
          case 'Home': e.preventDefault(); self.goTo(0); break;
          case 'End':  e.preventDefault(); self.goTo(self.count - 1); break;
        }
      });

      // resize
      var rt;
      $win.on('resize orientationchange', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
          if (Viewport.measure() === false) return;
          Thread.draw();
          Thread.set(Thread.p === null ? 0 : Thread.p, true);
          self.layout();
          self.render(true);
          Aside.sync();
        }, 120);
      });
    },

    isLive: function () { return this.$stage.hasClass('is-live'); },

    layout: function () {
      this.$track.css('height', Viewport.h * this.count + 'px');
    },

    onWheel: function (e) {
      if (this.locked) { this.acc = 0; return; }
      var d = e.deltaY || 0;
      if (e.deltaMode === 1) d *= 16;              // firefox reports lines
      var now = Date.now();
      if (now - this.accAt > CONFIG.wheelDecay) this.acc = 0;
      if (d * this.acc < 0) this.acc = 0;          // direction flipped
      this.accAt = now;
      this.acc += d;
      if (Math.abs(this.acc) >= CONFIG.wheelThreshold) {
        this.move(this.acc > 0 ? 1 : -1);
        this.acc = 0;
      }
    },

    move: function (dir) { this.goTo(this.index + dir); },

    goTo: function (i) {
      if (this.locked) return;
      i = Math.max(0, Math.min(this.count - 1, i));
      if (i === this.index) return;
      this.index = i;
      this.lock();
      this.render();
    },

    lock: function () {
      var self = this;
      this.locked = true;
      clearTimeout(this._lt);
      this._lt = setTimeout(function () {
        self.locked = false; self.acc = 0;
      }, CONFIG.slideDuration + CONFIG.wheelCooldown);
    },

    /* paint the current index everywhere */
    render: function (instant) {
      var i = this.index, self = this;

      if (instant) this.$track.css('transition', 'none');
      this.$track.css('transform', 'translate3d(0,' + (-i * Viewport.h) + 'px,0)');
      if (instant) { this.$track[0].offsetHeight; this.$track.css('transition', ''); }

      this.$panels.removeClass('is-active').eq(i).addClass('is-active');

      var $cur = this.$panels.eq(i);
      Timeline.update(i, $cur.is('[data-case]'));
      if ($cur.is('[data-bubbles]')) Bubbles.spawn(); else Bubbles.clear();
      Work.active($cur.is('.panel--work'));
      Thread.set(this.count > 1 ? i / (this.count - 1) : 1, instant);
      Thread.mark(i);
      $('#countNow').text(pad(i + 1));
      if (this.isLive()) {
        document.title = ($cur.data('label') ? $cur.data('label') + ' · ' : '') + 'ritik raj';
        if (window.trackView) {
          var lab = String($cur.data('label') || 'section');
          trackView('/a/' + lab.replace(/[^a-z0-9]+/gi, '-'), 'a · ' + lab);
        }
      }
    },

    /* the panel that links to this case study, so a page can send you back
       to where you were rather than to the top */
    indexOfSlug: function (slug) {
      var found = 0;
      this.$panels.each(function (i) {
        if ($(this).find('a[href*="' + slug + '"]').length) { found = i; return false; }
      });
      return found;
    },

    /* called by Hero once the curtain clears */
    start: function (at) {
      var self = this;
      this.$stage.addClass('is-live').attr('aria-hidden', 'false');
      this.index = Math.max(0, Math.min(this.count - 1, at || 0));
      this.layout();
      this.render(true);
      setTimeout(function () { self.locked = false; }, 400);
    },

    stop: function () {
      this.locked = true;
      this.$stage.removeClass('is-live').attr('aria-hidden', 'true');
      this.$panels.removeClass('is-active');
      Timeline.update(-1, false);
      Bubbles.clear();
    }
  };


  /* ── VEIL ─────────────────────────────────────────────────────────────
     The inline-styled panel in index.html that is painted before any
     stylesheet, font or script arrives. Nothing is shown until the page is
     genuinely ready, so a page change is never a flash of raw html.
     ------------------------------------------------------------------- */
  var Veil = {
    lift: function () {
      var el = document.getElementById('veil');
      if (!el) return;
      el.className = 'is-up';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 850);
    },
    /* fonts settled, or 2.2s, whichever lands first */
    ready: function (fn) {
      var done = false;
      function go() { if (done) return; done = true; fn(); }
      setTimeout(go, 2200);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { setTimeout(go, 40); });
      } else {
        $(window).on('load', go);
      }
    }
  };


  /* ── THEME ────────────────────────────────────────────────────────────
     four palettes, each with a dark and a light rendition. the colours are
     in theme.css; this only decides which block is live and remembers it.
     add a palette there, add a line here, done.
     ------------------------------------------------------------------- */
  var PALETTES = [
    { id: 'green',   dot: '#43e08a' },
    { id: 'red',     dot: '#ff5147' },
    { id: 'orchid',  dot: '#b283ee' },
    { id: 'magenta', dot: '#ff5b9e' },
    { id: 'gold',    dot: '#c9a35c' },
    { id: 'signal',  dot: '#5ec8e8' }
  ];

  var Theme = {
    /* portfolio a is the light side, and the light side is green. with this
       set, the stored palette is ignored and the picker is hidden in css.
       set it to null to hand the choice back to the visitor. */
    FIXED: 'green',

    init: function () {
      var self = this, saved = store('rr-mode');

      this.$el   = $('#theme');
      this.i     = index(this.FIXED || store('rr-theme'));
      this.mode  = saved || system();
      this.pinned = !!saved;              /* has he chosen, or is this the os? */

      this.$el.html(
        '<button class="theme__swatch" type="button" aria-label="next palette">' +
          '<i></i><span></span>' +
        '</button>' +
        '<i class="theme__sep"></i>' +
        '<button class="theme__mode" type="button" aria-label="light or dark">' +
          '<svg viewBox="0 0 16 16" aria-hidden="true">' +
            '<circle cx="8" cy="8" r="5.4"/>' +
            '<path d="M8 2.6a5.4 5.4 0 0 0 0 10.8z" fill="currentColor" stroke="none"/>' +
          '</svg>' +
        '</button>'
      );

      this.$el.on('click', '.theme__swatch', function () {
        self.i = (self.i + 1) % PALETTES.length;
        store('rr-theme', PALETTES[self.i].id);
        self.paint();
      });
      this.$el.on('click', '.theme__mode', function () {
        self.mode = self.mode === 'dark' ? 'light' : 'dark';
        self.pinned = true;
        store('rr-mode', self.mode);
        self.paint();
      });

      /* until he picks a side, follow the os */
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: light)');
        var follow = function (e) {
          if (self.pinned) return;
          self.mode = e.matches ? 'light' : 'dark';
          self.paint();
        };
        if (mq.addEventListener) mq.addEventListener('change', follow);
        else if (mq.addListener) mq.addListener(follow);
      }

      this.paint();
    },

    paint: function () {
      var p = PALETTES[this.i], d = document.documentElement;
      d.setAttribute('data-theme', p.id);
      d.setAttribute('data-mode',  this.mode);
      this.$el.find('.theme__swatch i').css('--c', p.dot);
      this.$el.find('.theme__swatch span').text(p.id);
    }
  };

  function index(id) {
    for (var i = 0; i < PALETTES.length; i++) if (PALETTES[i].id === id) return i;
    return 0;
  }
  function system() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
      ? 'light' : 'dark';
  }

  /* localStorage, but never able to throw the page over */
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }


  /* ── HERO ─────────────────────────────────────────────────────────────── */
  var Hero = {
    busy: false,

    init: function () {
      var self = this;
      this.$el = $('#hero');
      this.$panels = this.$el.find('.hero__panel');
      this.$curtain = $('#curtain');

      this.$panels
        .on('mouseenter', function () {
          if (self.busy) return;
          var $p = $(this);
          // side b brings its own fonts — start fetching them on hover, so the
          // curtain never lifts on unstyled text
          if ($p.data('portfolio') === 'b' && window.TheRead) window.TheRead.preload();
          self.$el.addClass('is-hovering')
                  .removeClass('hot-a hot-b')
                  .addClass('hot-' + $p.data('portfolio'));   // the blade takes that side's colour
          $p.addClass('is-hot').css('flex-grow', 1.3).removeClass('is-cold');
          self.$panels.not($p).addClass('is-cold').removeClass('is-hot').css('flex-grow', .7);
        })
        .on('mousemove', function (e) {
          if (self.busy) return;
          var r = this.getBoundingClientRect();
          this.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          this.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        })
        .on('click', function () { self.enter($(this).data('portfolio')); })
        .on('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); self.enter($(this).data('portfolio')); }
        });

      this.$el.on('mouseleave', function () {
        if (self.busy) return;
        self.$el.removeClass('is-hovering hot-a hot-b');
        self.$panels.removeClass('is-hot is-cold').css('flex-grow', 1);
      });

      // anything with data-portfolio-switch jumps worlds
      // every link into a case study wipes out instead of cutting
      $(document).on('click', 'a[href^="case/"], a[href^="journey.html"], a[href^="plugin.html"]', function (e) {
        e.preventDefault();
        var href = $(this).attr('href');
        Hero.wipeTo(href, href.indexOf('v=b') > -1);
      });

      // the strip down the middle: neither side, and a switch of its own
      // starts retracted whatever happens, so the door always opens on an
      // ignition rather than on a blade that was simply already there
      var $saber = $('#saber').addClass('is-off');

      // it deliberately does NOT reset the hover: the strip travels with the
      // seam, so resetting on enter would slide the saber out from under the
      // cursor and hand the hover to the other side.
      $('#saberZone').on('click', function (e) {
        e.stopPropagation();
        $saber.toggleClass('is-off');
        store('rr-saber', $saber.hasClass('is-off') ? 'off' : 'on');
      });

      $(document).on('click', '[data-portfolio-switch]', function (e) {
        e.preventDefault();
        Hero.back($(this).data('portfolio-switch'));
      });

      $('#backToHero').on('click', function () { Hero.back(); });
      $('#heroSkip').on('click', function () { self.enter('a'); });

      // esc is the way out of either portfolio, always
      $(document).on('keydown', function (e) {
        if (e.key !== 'Escape' && e.key !== 'Esc') return;
        if ($body.hasClass('is-hero')) return;
        if (Viewer.isOpen) return;            // esc closes the viewer first
        e.preventDefault();
        Hero.back();
      });
    },

    /* leave the app entirely, curtain first. used for the case study pages. */
    wipeTo: function (href, light) {
      if (this.busy) return;
      this.busy = true;
      this.$curtain.toggleClass('curtain--light', !!light);
      this.$curtain.removeClass('is-away').addClass('is-up');
      setTimeout(function () { location.href = href; }, 760);
    },

    /* the grand exit: chosen side takes the screen → curtain up → swap → curtain away
       `instant` skips the panel choreography — used when you arrive back from a
       case study with #a or #b already in the url and the curtain already down. */
    enter: function (which, instant, slug) {
      if (this.busy) return;
      this.busy = true;
      if (window.track) track('portfolio_enter', { side: which, returning: !!instant });
      var self = this;

      this.$panels.removeClass('is-hot is-cold').css('flex-grow', '');
      this.$el.addClass('is-leaving pick-' + which);
      this.$curtain.toggleClass('curtain--light', which === 'b');

      if (!instant) {
        setTimeout(function () { self.$curtain.removeClass('is-away').addClass('is-up'); }, CONFIG.heroExit);
      }

      setTimeout(function () {
        self.$el.addClass('is-gone').css('pointer-events', 'none');
        $body.removeClass('is-hero').addClass('is-' + which);
        if (which === 'a') {
          // back from the plugin page: the section was earned before the page
          // change, so reopen it quietly. the count reset with the reload.
          if (slug === 'plugin') {
            Stage.unlock(false);
            if (!Aside.plain) {
              $('.panel--aside .aside__tag[data-when="bubbles"]').text('you burst them earlier. i was still counting.');
            }
          }
          Stage.start(slug ? Stage.indexOfSlug(slug) : 0);
        }
        else if (window.TheRead) { window.TheRead.start(slug ? window.TheRead.indexOfSlug(slug) : 0); }

        if (instant) {
          // the veil is doing the covering; the curtain must not sweep as well
          self.$curtain.removeClass('is-up is-away');
          self.busy = false;
          return;
        }
        self.$curtain.addClass('is-away');
        setTimeout(function () {
          self.$curtain.removeClass('is-up is-away');
          self.busy = false;
        }, 950);
      }, instant ? 20 : CONFIG.heroExit + 720 + CONFIG.curtainHold);
    },

    /* back to the door — or straight across to the other portfolio */
    back: function (thenOpen) {
      if (this.busy) return;
      this.busy = true;
      var self = this;

      this.$curtain.removeClass('is-away').addClass('is-up');

      setTimeout(function () {
        Stage.stop();
        if (window.TheRead) window.TheRead.stop();
        // back to a neutral door: the side last hovered (hot-a / hot-b) is what
        // positions and colours the saber, so it has to go with everything else
        self.$el.removeClass('is-leaving is-gone pick-a pick-b is-hovering hot-a hot-b').css('pointer-events', '');
        self.$panels.removeClass('is-hot is-cold').css('flex-grow', '');
        $body.removeClass('is-a is-b').addClass('is-hero');

        self.$curtain.addClass('is-away');
        setTimeout(function () {
          self.$curtain.removeClass('is-up is-away');
          self.busy = false;
          if (thenOpen) { self.enter(thenOpen); return; }
          // the pointer may already be resting on a side; mouseenter fired while
          // the curtain was down and was ignored, so pick that side up now
          self.$panels.filter(':hover').first().trigger('mouseenter');
        }, 950);
      }, 760);
    }
  };


  /* ── HELPERS ──────────────────────────────────────────────────────────── */
  function pad(n) { return (n < 10 ? '0' : '') + n; }


  /* a cubic-bezier as a function of x, so js tweens can match a css curve.
     newton-raphson, five passes, plenty for 60fps. */
  function bezier(x1, y1, x2, y2) {
    function a(p, q) { return 1 - 3 * q + 3 * p; }
    function b(p, q) { return 3 * q - 6 * p; }
    function c(p)    { return 3 * p; }
    function calc(t, p, q)  { return ((a(p, q) * t + b(p, q)) * t + c(p)) * t; }
    function slope(t, p, q) { return 3 * a(p, q) * t * t + 2 * b(p, q) * t + c(p); }
    return function (x) {
      var t = x, i, d;
      for (i = 0; i < 5; i++) {
        d = slope(t, x1, x2);
        if (d === 0) break;
        t -= (calc(t, x1, x2) - x) / d;
      }
      return calc(t, y1, y2);
    };
  }


  /* ── PROJ: THE CASE STUDY SLIDER ──────────────────────────────────────────
     Below 1100px the cards scroll sideways. One dot per card: the dot of the
     card nearest the left edge lights up, and a dot scrolls to its card.
     On desktop the dots are hidden by css and this does nothing visible.
     -------------------------------------------------------------------- */
  var Proj = {
    init: function () {
      var grid  = document.getElementById('projGrid'),
          dots  = document.getElementById('projDots'),
          tabs  = document.getElementById('projTabs'),
          count = document.getElementById('projCount');
      if (!grid || !dots) return;

      var all = [].slice.call(grid.querySelectorAll('.proj-card'));
      var cards = all, buttons = [];

      /* the dots describe what is showing, so they are rebuilt on every
         filter rather than fixed to the six cards that exist in the markup */
      function dotsFor(list) {
        dots.innerHTML = list.map(function (c, i) {
          return '<button type="button" tabindex="-1" aria-label="case study ' + (i + 1) + '"></button>';
        }).join('');
        buttons = [].slice.call(dots.children);
        buttons.forEach(function (b, i) {
          b.addEventListener('click', function () {
            paint(i);
            grid.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
          });
        });
        dots.style.display = list.length > 1 ? '' : 'none';
      }

      function step() { return cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 1; }
      function current() {
        // the last card can never reach the left edge; count the end as the end
        if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4) return cards.length - 1;
        return Math.max(0, Math.min(cards.length - 1, Math.round(grid.scrollLeft / step())));
      }
      function paint(i) {
        if (typeof i !== 'number') i = current();
        buttons.forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
      }

      function filter(tag) {
        cards = all.filter(function (c) {
          var on = tag === 'all' || (' ' + (c.getAttribute('data-tags') || '') + ',').indexOf(tag + ',') > -1;
          c.hidden = !on;
          return on;
        });
        grid.scrollTo({ left: 0, behavior: 'auto' });
        dotsFor(cards);
        paint(0);
        if (count) count.textContent = cards.length + (cards.length === 1 ? ' case study' : ' case studies') + ', ' + tag;
        if (window.track) track('case_filter', { tag: tag, shown: cards.length });
      }

      if (tabs) {
        tabs.addEventListener('click', function (e) {
          var b = e.target.closest('.proj__tab');
          if (!b) return;
          [].slice.call(tabs.children).forEach(function (x) {
            var on = x === b;
            x.classList.toggle('is-on', on);
            x.setAttribute('aria-pressed', on ? 'true' : 'false');
          });
          filter(b.getAttribute('data-filter'));
        });
      }

      // a short timer rather than rAF: rAF pauses in background tabs, and the
      // dots should be right the moment the page is looked at again
      var t = 0;
      grid.addEventListener('scroll', function () {
        clearTimeout(t);
        t = setTimeout(paint, 50);
      }, { passive: true });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });

      dotsFor(cards);
      paint();
    }
  };


  /* ── WORK: THE EXPLORATIONS SECTION ───────────────────────────────────────
     A list of concept screens and one stage. Picking an item shows it whole.
     While the section is on screen it advances every CONFIG-ish `dwell` ms,
     holds while the pointer is over it, and stops for good once someone has
     picked one by hand (they are reading; do not move it under them).
     -------------------------------------------------------------------- */
  var Work = {
    dwell: 6500,
    i: 0,
    live: false,
    held: false,
    still: false,

    init: function () {
      var self = this;
      this.$sec   = $('.panel--work');
      if (!this.$sec.length) return;
      this.$items = this.$sec.find('.work__item');
      this.$img   = this.$sec.find('.work__img');
      this.$vid   = this.$sec.find('.work__vid');
      this.$sec[0].style.setProperty('--work-dwell', this.dwell + 'ms');

      this.$items.on('click', function () {
        self.still = true;
        self.$sec.addClass('is-still');
        self.show(self.$items.index(this));
      });
      this.$sec.find('.work__screen').on('click', function () { Viewer.open(self.i); });

      // hold while pointed at; the fill pauses with it
      this.$sec.find('.work__body')
        .on('mouseenter', function () { self.held = true;  self.$sec.addClass('is-held');  self.pause(); })
        .on('mouseleave', function () { self.held = false; self.$sec.removeClass('is-held'); self.resume(); });

      // warm the small images so switching never waits on the network
      this.$items.each(function () {
        var src = this.getAttribute('data-small');
        if (src) { var im = new Image(); im.src = src; }
      });
    },

    show: function (i) {
      var self = this, $t = this.$items.eq(i), n = this.$items.length;
      this.i = i;
      this.$items.removeClass('is-on');
      $t[0].offsetWidth;                                   // restart the fill
      $t.addClass('is-on');
      this.$sec.find('.work__count').html('<b>' + pad(i + 1) + '</b> / ' + pad(n));
      this.$sec.find('.work__screen').attr('aria-label', $t.data('name') + ', ' + $t.data('what') + '. open larger');

      // keep the active name in view when the list is a sideways row
      var li = $t.parent()[0], list = li.parentNode;
      if (list.scrollWidth > list.clientWidth) {
        var dx = li.getBoundingClientRect().left - list.getBoundingClientRect().left;
        list.scrollBy({ left: dx, behavior: 'smooth' });
      }

      var clip = $t.attr('data-video');
      var $on = clip ? this.$vid : this.$img, $off = clip ? this.$img : this.$vid;
      var $mat = this.$sec.find('.work__mat');

      $off.addClass('is-out');
      $on.addClass('is-out');
      $mat.addClass('is-out');
      setTimeout(function () {
        if (self.i !== i) return;
        $mat.css('background-image', 'url(' + (clip ? $t.attr('data-poster') : $t.attr('data-small')) + ')');
        $mat.removeClass('is-out');
      }, 260);
      setTimeout(function () {
        if (self.i !== i) return;
        $off.prop('hidden', true);
        self.$vid[0].pause();
        $on.prop('hidden', false);
        if (clip) {
          if (self.$vid.attr('src') !== clip) self.$vid.attr({ src: clip, poster: $t.attr('data-poster') });
          self.$vid[0].currentTime = 0;
          if (self.live) self.play();
          requestAnimationFrame(function () { $on.removeClass('is-out'); });
        } else {
          var small = $t.attr('data-small'), full = $t.attr('data-full');
          var reveal = function () { requestAnimationFrame(function () { if (self.i === i) $on.removeClass('is-out'); }); };
          self.$img.off('load').one('load', reveal)
            .attr({ srcset: small + ' 960w, ' + full + ' 2000w', src: small, alt: $t.data('name') + ', ' + $t.data('what') });
          if (self.$img[0].complete) reveal();
        }
      }, 260);

      this.schedule();
    },

    play: function () { var p = this.$vid[0].play(); if (p && p.catch) p.catch(function () {}); },

    schedule: function () {
      clearTimeout(this.t);
      if (!this.live || this.held || this.still || Viewer.isOpen) return;
      var self = this;
      this.t = setTimeout(function () { self.show((self.i + 1) % self.$items.length); }, this.dwell);
    },
    pause:  function () { clearTimeout(this.t); },
    resume: function () { this.schedule(); },

    /* called by Stage on every section change */
    active: function (on) {
      if (!this.$sec || !this.$sec.length) return;
      if (on && this.live) return;                          // a resize re-render, not an arrival
      this.live = on;
      if (!on) { clearTimeout(this.t); this.$vid[0].pause(); return; }
      this.show(this.i);                                    // restart this item's fill
    }
  };


  /* ── VIEWER ───────────────────────────────────────────────────────────────
     The explorations list, full screen. Previous / next, arrow keys, a
     sideways swipe, esc. Opens from the stage at whatever is showing, and
     leaves the section on whatever was last viewed.
     -------------------------------------------------------------------- */
  var Viewer = {
    isOpen: false,
    i: 0,

    init: function () {
      var self = this;
      this.$el    = $('#viewer');
      this.$img   = this.$el.find('.viewer__img');
      this.$video = this.$el.find('.viewer__video');
      if (!this.$el.length) return;

      this.$el.on('click', '[data-step]', function (e) {
        e.stopPropagation();
        self.step(parseInt($(this).attr('data-step'), 10));
      });
      // the backdrop and the close button shut it; the media and the bar do not
      this.$el.on('click', function (e) {
        if ($(e.target).is('.viewer__img, .viewer__video')) return;
        if ($(e.target).closest('.viewer__bar').length) return;
        self.close();
      });
      $(document).on('keydown', function (e) {
        if (!self.isOpen) return;
        if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); e.stopImmediatePropagation(); self.close(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); self.step(1); }
        else if (e.key === 'ArrowLeft')  { e.preventDefault(); self.step(-1); }
      });

      var x0 = 0;
      this.$el.on('touchstart', function (e) { x0 = e.originalEvent.touches[0].clientX; });
      this.$el.on('touchend', function (e) {
        var dx = e.originalEvent.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) self.step(dx < 0 ? 1 : -1);
      });
    },

    open: function (i) {
      this.$tiles = $('.work__item');
      this.last = document.activeElement;
      this.isOpen = true;
      Work.pause();
      if (Work.$vid) Work.$vid[0].pause();
      $body.addClass('is-viewing');
      if (window.track) { var $o = this.$tiles.eq(i); track('concept_open', { concept: $o.data('name') + ' · ' + $o.data('what') }); }
      this.$el.addClass('is-open').attr('aria-hidden', 'false');
      this.show(i);
      this.$el[0].focus({ preventScroll: true });
    },

    close: function () {
      if (!this.isOpen) return;
      this.isOpen = false;
      $body.removeClass('is-viewing');
      this.$el.removeClass('is-open').attr('aria-hidden', 'true');
      this.$video[0].pause();
      if (this.i !== Work.i) { Work.still = true; Work.$sec.addClass('is-still'); Work.show(this.i); }
      else if (Work.live && Work.$items.eq(Work.i).attr('data-video')) Work.play();
      if (this.last) this.last.focus({ preventScroll: true });
    },

    step: function (d) {
      var n = this.$tiles.length;
      this.show((this.i + d + n) % n);
    },

    show: function (i) {
      var $t = this.$tiles.eq(i), n = this.$tiles.length, self = this;
      this.i = i;

      this.$el.find('.viewer__count').html('<b>' + pad(i + 1) + '</b> / ' + pad(n));
      this.$el.find('.viewer__cap b').text($t.data('name'));
      this.$el.find('.viewer__cap i').text($t.data('what'));

      var clip = $t.attr('data-video');
      var $on  = clip ? this.$video : this.$img,
          $off = clip ? this.$img : this.$video;

      $off.removeClass('is-in').prop('hidden', true);
      this.$video[0].pause();
      $on.removeClass('is-in').prop('hidden', false);

      if (clip) {
        this.$video.attr('poster', $t.attr('data-poster'));
        if (this.$video.attr('src') !== clip) this.$video.attr('src', clip);
        var v = this.$video[0];
        v.currentTime = 0;
        var p = v.play(); if (p && p.catch) p.catch(function () {});
        requestAnimationFrame(function () { $on.addClass('is-in'); });
      } else {
        var src = $t.attr('data-full');
        this.$img.attr('alt', $t.data('name') + ', ' + $t.data('what'));
        var reveal = function () { requestAnimationFrame(function () { if (self.i === i) $on.addClass('is-in'); }); };
        this.$img.off('load').one('load', reveal);
        this.$img.attr('src', src);
        if (this.$img[0].complete) reveal();
      }

      [i - 1, i + 1].forEach(function (k) {
        var f = self.$tiles.eq((k + n) % n).attr('data-full');
        if (f) { var im = new Image(); im.src = f; }
      });
    }
  };


  /* ── ASIDE: THE PLUGIN SECTION ────────────────────────────────────────────
     Normally earned by popping six bubbles. Where the bubbles are not shown
     at all (css hides #bubbles below 1320px), there is nothing to pop, so the
     section is open from the start and wears its plain opening instead.
     Checked at boot and on resize. Once earned the bubble way, it keeps that
     copy; once plain, it stays plain for the session.
     -------------------------------------------------------------------- */
  var Aside = {
    plain: false,

    sync: function () {
      if (this.plain) return;
      var $b = $('#bubbles'), $s = $('.panel--aside');
      if (!$s.length) return;
      if ($b.length && $b.css('display') !== 'none') return;   // bubbles are here
      if (!$s.prop('hidden')) return;                          // already earned

      this.plain = true;
      $s.addClass('is-plain');
      Stage.unlock(false);
    }
  };


  /* ── BOOT ─────────────────────────────────────────────────────────────── */
  $(function () {
    Viewport.init();
    Theme.init();
    Thread.init();
    Viewer.init();
    Work.init();
    Proj.init();
    Stage.init();
    Aside.sync();
    Typer.init();
    Hero.init();

    // deep link: index.html#a opens portfolio a straight away
    /* #a · #b · or #a:email-builder coming back from a case study */
    var hash = (location.hash || '').replace('#', '').split(':');
    var side = hash[0], slug = hash[1];
    if (side === 'a' || side === 'b') {
      // arriving from a case page: mount the portfolio behind the veil, so the
      // door is never glimpsed on the way through
      Hero.enter(side, true, slug);
      Veil.ready(function () { setTimeout(Veil.lift, 70); });
    } else {
      Veil.ready(function () {
        Veil.lift();
        if (store('rr-saber') !== 'off') {
          setTimeout(function () { $('#saber').removeClass('is-off'); }, 540);
        }
      });
    }

    // expose for the console while you're tinkering
    window.Portfolio = { Stage: Stage, Hero: Hero, Thread: Thread, Timeline: Timeline, Theme: Theme, Bubbles: Bubbles, CONFIG: CONFIG };
  });

})(jQuery);
