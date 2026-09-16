/* ==========================================================================
   RENDER · content model to DOM
   Every lens renders through the same functions. A lens changes which
   modules run, in what order, and which props go in. Nothing is duplicated
   per lens, and no lens can reach content another lens cannot.
   ========================================================================== */
(function (w, d) {
  var C = w.LENS_CONTENT;

  function el(tag, cls, html) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]; }); }

  /* {{metric.id}} in shared prose resolves from the registry, so a number
     written once is a number corrected once */
  function fill(s) {
    return String(s).replace(/\{\{([a-z0-9.]+)\}\}/gi, function (all, id) {
      return C.METRICS[id] ? C.METRICS[id].value : all;
    });
  }

  function metric(id, withNote) {
    var m = C.METRICS[id];
    if (!m) return null;
    var n = el('div', 'metric' + (String(m.value).length > 7 ? ' is-long' : ''));
    n.appendChild(el('span', 'metric__v', esc(m.value)));
    n.appendChild(el('span', 'metric__l', esc(m.label)));
    if (withNote && m.note) n.appendChild(el('span', 'metric__n', esc(m.note)));
    return n;
  }

  /* projects visible in a lens, in that lens's order */
  function projectsFor(lensId) {
    return C.PROJECTS
      .map(function (p) {
        var v = p.lenses[lensId];
        if (!v || v.visible === false) return null;
        if (!v.headline) v = p.lenses[C.DEFAULT_LENS];      /* graceful fallback */
        return v && v.headline ? { p: p, v: v } : null;
      })
      .filter(Boolean)
      .sort(function (a, b) { return (a.v.rank || 99) - (b.v.rank || 99); });
  }

  function item(row, lens) {
    var p = row.p, v = row.v;
    var a = el(p.body ? 'a' : 'div', 'pitem' + (p.status === 'did-not-land' ? ' pitem--failed' : ''));
    if (p.body) { a.href = p.body; a.setAttribute('data-case', p.id); }
    a.setAttribute('data-anchor', 'p-' + p.id);
    /* the same card in two lenses is the same card: it travels to its new
       position and size instead of being destroyed and rebuilt */
    a.setAttribute('data-flip', 'p-' + p.id);
    a.style.viewTransitionName = 'p-' + p.id;

    var top = el('div', 'pitem__top');
    top.appendChild(el('h3', 'pitem__title', esc(p.title)));
    top.appendChild(el('span', 'pitem__org', esc(p.org) + ' · ' + p.date.slice(0, 4)));
    a.appendChild(top);

    a.appendChild(el('p', 'pitem__head', esc(v.headline)));

    var depth = Math.min(v.depth == null ? 1 : v.depth, lens.maxDepth);
    if (depth >= 1 && v.summary) a.appendChild(el('p', 'pitem__sum', esc(v.summary)));

    if (v.metrics && v.metrics.length) {
      var wrap = el('div', 'pitem__metrics');
      v.metrics.forEach(function (id) { var m = metric(id, depth >= 2); if (m) wrap.appendChild(m); });
      a.appendChild(wrap);
    }
    if (p.body) a.appendChild(el('span', 'pitem__more', 'read the case'));
    return a;
  }

  /* ── modules ──────────────────────────────────────────────────────────── */
  var MOD = {
    profile: function (lens) {
      var s = section('', null);
      var card = el('article', 'profile');
      var top = el('div', 'profile__top');
      top.appendChild(el('h1', 'profile__name', esc(C.PROFILE.name)));
      top.appendChild(el('p', 'profile__title', esc(C.PROFILE.title)));
      top.appendChild(el('p', 'profile__line', esc(C.PROFILE.line)));
      card.appendChild(top);
      var dl = el('dl', 'profile__facts');
      C.PROFILE.facts.forEach(function (f) {
        var row = el('div', f[0] === 'availability' ? 'is-now' : '');
        row.appendChild(el('dt', 'label', esc(f[0])));
        row.appendChild(el('dd', '', esc(fill(f[1]))));
        dl.appendChild(row);
      });
      card.appendChild(dl);
      s.body.appendChild(card);
      return s.node;
    },

    wall: function () {
      var s = section('the numbers', 'every figure here exists once in the content model and is referenced, not retyped. that is why no two views can disagree.');
      var grid = el('div', 'wall');
      C.WALL.forEach(function (id) { var m = metric(id, true); if (m) grid.appendChild(m); });
      s.body.appendChild(grid);
      return s.node;
    },

    diagnosis: function () {
      var s = section('', null);
      s.body.appendChild(el('p', 'diag__intro', esc(C.DIAGNOSIS.intro)));
      var list = el('div', 'diag__list');
      C.DIAGNOSIS.lines.forEach(function (pid, i) {
        var p = C.PROJECTS.filter(function (x) { return x.id === pid; })[0];
        if (!p || !p.lenses.decisions) return;
        var row = el('div', 'diag__line');
        row.appendChild(el('span', 'diag__n', String(i + 1).padStart(2, '0')));
        var col = el('div');
        col.appendChild(el('p', 'diag__q', esc(p.lenses.decisions.headline)));
        col.appendChild(el('p', 'diag__src', esc(p.title) + ' · ' + esc(p.org)));
        row.appendChild(col);
        list.appendChild(row);
      });
      s.body.appendChild(list);
      return s.node;
    },

    spec: function () {
      var s = section('the spec', 'what your team actually inherits.');
      var dl = el('dl', 'spec');
      C.SPEC.forEach(function (r) {
        var row = el('div');
        row.appendChild(el('dt', '', esc(r[0])));
        row.appendChild(el('dd', '', esc(r[1])));
        dl.appendChild(row);
      });
      s.body.appendChild(dl);
      return s.node;
    },

    projects: function (lens) {
      var rows = projectsFor(lens.id);
      var failures = rows.filter(function (r) { return r.p.status === 'did-not-land'; });
      var main = rows.filter(function (r) { return r.p.status !== 'did-not-land'; });
      var s = section('the work', main.length + ' projects, ordered for this view. nothing is hidden from you: every view reaches every case study.');
      var list = el('div', 'plist plist--' + lens.listVariant);
      main.forEach(function (r) { list.appendChild(item(r, lens)); });
      s.body.appendChild(list);
      if (failures.length) {
        var h = el('h3', 'section__title', 'what did not work');
        h.style.marginTop = 'var(--s7)';
        h.setAttribute('data-anchor', 'failures');
        s.body.appendChild(h);
        var fl = el('div', 'plist plist--' + lens.listVariant);
        fl.style.marginTop = 'var(--s3)';
        failures.forEach(function (r) { fl.appendChild(item(r, lens)); });
        s.body.appendChild(fl);
      }
      return s.node;
    },

    timeline: function () {
      var s = section('the timeline', null);
      var ul = el('ul', 'tl');
      C.PROFILE.timeline.forEach(function (t) {
        var li = el('li');
        li.appendChild(el('span', '', esc(t[0])));
        li.appendChild(el('b', '', esc(t[1])));
        li.appendChild(el('em', '', esc(t[2])));
        ul.appendChild(li);
      });
      s.body.appendChild(ul);
      return s.node;
    },

    failures: function () { return null; }   /* folded into projects */
  };

  function section(title, note) {
    var node = el('section', 'section');
    if (title) {
      var head = el('div', 'section__head');
      var h = el('h2', 'section__title', esc(title));
      h.setAttribute('data-anchor', title.replace(/\s+/g, '-'));
      head.appendChild(h);
      if (note) head.appendChild(el('p', 'section__note', esc(note)));
      node.appendChild(head);
    }
    node.setAttribute('data-reveal', '');
    var body = el('div');
    node.appendChild(body);
    return { node: node, body: body };
  }

  function cta(lens) {
    var wrap = el('div', 'cta');
    var a = el('a', 'cta__main', esc(lens.cta.text));
    a.href = lens.cta.href;
    a.setAttribute('data-cta', lens.id);
    wrap.appendChild(a);
    if (lens.cta.second) {
      var b = el('a', 'cta__second', esc(lens.cta.second.text));
      b.href = lens.cta.second.href;
      wrap.appendChild(b);
    }
    if (lens.cta.note) wrap.appendChild(el('p', 'cta__note', esc(lens.cta.note)));
    return wrap;
  }

  /* the sideways pointer: never let a reader think a view is all there is */
  function sideways(lens) {
    var others = C.ORDER.filter(function (id) { return id !== lens.id; });
    var pick = C.LENSES[others[0]];
    var p = el('p', 'foot__sideways');
    p.innerHTML = 'looking for ' + esc(pick.label) + '? that is the <a href="?lens=' + pick.id + '" data-lens-link="' + pick.id + '">' + esc(pick.sub) + '</a>.';
    return p;
  }

  w.Render = {
    page: function (mount, lensId) {
      var lens = C.LENSES[lensId];
      mount.innerHTML = '';
      lens.modules.forEach(function (name) {
        var fn = MOD[name];
        if (!fn) return;
        var node = fn(lens);
        if (node) mount.appendChild(node);
      });
      var foot = el('footer', 'foot');
      foot.setAttribute('data-reveal', '');
      foot.appendChild(el('p', 'label', esc(lens.question)));
      foot.appendChild(cta(lens));
      foot.appendChild(sideways(lens));
      mount.appendChild(foot);

      if (w.Motion) w.Motion.reveal(mount);
    },
    projectsFor: projectsFor
  };
})(window, document);
