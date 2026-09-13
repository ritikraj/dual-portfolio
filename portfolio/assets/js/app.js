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
                'aria-label="' + c.label + '"><span>' + c.label + '</span></button>';
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
      this.read();
      this.layout();
      this.render(true);

      if (!announce) return;
      var $n = $('#notice').html(
        'i noticed. <b>a new section</b> opened near the end.'
      ).addClass('is-on');
      setTimeout(function () { $n.removeClass('is-on'); }, 6000);
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
        if (!self.isLive() || self.locked) return;
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
      Thread.set(this.count > 1 ? i / (this.count - 1) : 1, instant);
      Thread.mark(i);
      $('#countNow').text(pad(i + 1));
      if (this.isLive()) {
        document.title = ($cur.data('label') ? $cur.data('label') + ' · ' : '') + 'ritik raj';
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
    { id: 'red',     dot: '#ff5147' },
    { id: 'orchid',  dot: '#b283ee' },
    { id: 'magenta', dot: '#ff5b9e' },
    { id: 'gold',    dot: '#c9a35c' },
    { id: 'signal',  dot: '#5ec8e8' }
  ];

  var Theme = {
    init: function () {
      var self = this, saved = store('rr-mode');

      this.$el   = $('#theme');
      this.i     = index(store('rr-theme'));
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
      $(document).on('click', 'a[href^="case/"], a[href^="journey.html"]', function (e) {
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
        if (which === 'a') { Stage.start(slug ? Stage.indexOfSlug(slug) : 0); }
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
        self.$el.removeClass('is-leaving is-gone pick-a pick-b is-hovering').css('pointer-events', '');
        self.$panels.removeClass('is-hot is-cold').css('flex-grow', '');
        $body.removeClass('is-a is-b').addClass('is-hero');

        self.$curtain.addClass('is-away');
        setTimeout(function () {
          self.$curtain.removeClass('is-up is-away');
          self.busy = false;
          if (thenOpen) self.enter(thenOpen);
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


  /* ── BOOT ─────────────────────────────────────────────────────────────── */
  $(function () {
    Viewport.init();
    Theme.init();
    Thread.init();
    Stage.init();
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
