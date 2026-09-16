/* ==========================================================================
   LENS · the engine
   Resolves which lens is active, applies it, remembers it, and keeps the
   reader's place when it changes. URL wins, then storage, then the default.
   Nothing here knows what a project is.
   ========================================================================== */
(function (w, d) {
  var C = w.LENS_CONTENT, KEY = 'rr.lens', listeners = [], live;

  function valid(id) { return !!(id && C.LENSES[id]); }

  function fromURL() {
    var m = location.search.match(/[?&]lens=([a-z-]+)/);
    return m && valid(m[1]) ? m[1] : '';
  }
  function fromStore() {
    try { return valid(localStorage.getItem(KEY)) ? localStorage.getItem(KEY) : ''; }
    catch (e) { return ''; }
  }
  function remember(id) { try { localStorage.setItem(KEY, id); } catch (e) {} }

  /* Has this visitor ever chosen before? This decides whether a wall is
     shown again, so it has to be read once at init, before init itself
     writes the stored lens. Otherwise every visitor looks like a returning
     one and the wall never appears. */
  var wasReturning = null;
  function returning() { return wasReturning === null ? !!fromStore() : wasReturning; }

  /* keep the reader's place across a reframe: find the heading nearest the
     top of the viewport, then put it back where it was afterwards */
  function anchor() {
    var hs = d.querySelectorAll('[data-anchor]'), best = null, bestTop = -1e9;
    for (var i = 0; i < hs.length; i++) {
      var t = hs[i].getBoundingClientRect().top;
      if (t <= 120 && t > bestTop) { bestTop = t; best = hs[i]; }
    }
    return best ? { id: best.getAttribute('data-anchor'), off: bestTop } : null;
  }
  function restore(a) {
    if (!a) return;
    var el = d.querySelector('[data-anchor="' + a.id + '"]');
    if (!el) return;
    var now = el.getBoundingClientRect().top;
    w.scrollBy({ top: now - a.off, behavior: 'auto' });
  }

  function announce(id) {
    if (!live) {
      live = d.createElement('div');
      live.className = 'vh'; live.setAttribute('aria-live', 'polite');
      d.body.appendChild(live);
    }
    var n = C.PROJECTS.filter(function (p) {
      var l = p.lenses[id]; return l && l.visible !== false;
    }).length;
    live.textContent = C.LENSES[id].label + '. ' + n + ' projects, reordered.';
  }

  var current = '';

  function set(id, opts) {
    if (!valid(id) || id === current) return;
    opts = opts || {};
    var a = opts.keepPlace === false ? null : anchor();
    current = id;
    d.documentElement.setAttribute('data-lens', id);
    remember(id);
    if (!opts.silentURL) {
      var url = location.pathname + '?lens=' + id + location.hash;
      history.replaceState({ lens: id }, '', url);
    }
    for (var i = 0; i < listeners.length; i++) listeners[i](id);
    restore(a);
    if (!opts.quiet) announce(id);
    if (w.track) w.track('lens_switch', { lens: id, from: opts.from || 'chooser' });
  }

  w.Lens = {
    get: function () { return current; },
    set: set,
    valid: valid,
    returning: returning,
    onChange: function (fn) { listeners.push(fn); },
    init: function () {
      wasReturning = !!fromStore();
      var id = fromURL() || fromStore() || C.DEFAULT_LENS;
      current = '';
      set(id, { quiet: true, keepPlace: false, silentURL: !fromURL(), from: 'load' });
      return id;
    }
  };
})(window, document);
