/* ==========================================================================
   CHOOSER · one component, two modes
   Labelled by content, never by job title: people misidentify themselves,
   they do not misidentify what they want to see.

   wall  · a full screen question, first visit only. a returning visitor is
           never asked twice, they get the strip and their stored view.
   strip · a nav element. sticky, scrollable on a phone, always present.

   Semantics: radiogroup, roving tabindex, arrows to move, enter or space to
   choose, focus preserved through the reframe.
   ========================================================================== */
(function (w, d) {
  var C = w.LENS_CONTENT;

  function build(mode, onPick) {
    var C_ = C.LENSES;
    var root = d.createElement('div');
    root.className = 'chooser chooser--' + mode;
    var inner = d.createElement('div');
    inner.className = 'chooser__inner';

    var q = d.createElement('p');
    q.className = 'chooser__q';
    q.id = 'chooser-q-' + mode;
    q.textContent = mode === 'wall' ? 'what do you need to see?' : 'reading for';
    inner.appendChild(q);

    var group = d.createElement('div');
    group.className = 'chooser__group';
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', q.id);

    C.ORDER.forEach(function (id) {
      var L = C_[id];
      var b = d.createElement('button');
      b.type = 'button';
      b.className = 'chooser__opt';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('data-lens-opt', id);
      b.tabIndex = -1;
      b.innerHTML = '<span class="chooser__label"></span><span class="chooser__sub"></span>';
      b.querySelector('.chooser__label').textContent = L.label;
      b.querySelector('.chooser__sub').textContent = L.sub;
      b.addEventListener('click', function () { onPick(id, b); });
      group.appendChild(b);
    });

    group.addEventListener('keydown', function (e) {
      var opts = [].slice.call(group.querySelectorAll('[data-lens-opt]'));
      var i = opts.indexOf(d.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = opts[(i + 1) % opts.length];
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   next = opts[(i - 1 + opts.length) % opts.length];
      if (e.key === 'Home') next = opts[0];
      if (e.key === 'End')  next = opts[opts.length - 1];
      if (next) {
        e.preventDefault();
        next.focus();
        onPick(next.getAttribute('data-lens-opt'), next);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onPick(opts[i].getAttribute('data-lens-opt'), opts[i]);
      }
    });

    inner.appendChild(group);

    if (mode === 'wall') {
      var skip = d.createElement('button');
      skip.type = 'button';
      skip.className = 'chooser__skip';
      skip.textContent = 'just show me the short version';
      skip.addEventListener('click', function () { onPick(C.DEFAULT_LENS, null); });
      inner.appendChild(skip);
    }

    root.appendChild(inner);
    return root;
  }

  function mark(root, id) {
    if (!root) return;
    [].slice.call(root.querySelectorAll('[data-lens-opt]')).forEach(function (b) {
      var on = b.getAttribute('data-lens-opt') === id;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });
  }

  w.Chooser = {
    /* mode: 'strip' | 'wall'. wall shows over the page on a first visit only */
    mount: function (host, mode, opts) {
      opts = opts || {};
      var strip = build('strip', pick);
      var wall = null;
      host.appendChild(strip);

      var askFirst = mode === 'wall' && !w.Lens.returning() && !opts.forceAnswered;
      if (askFirst) {
        wall = build('wall', pick);
        d.body.appendChild(wall);
        d.body.style.overflow = 'hidden';
        setTimeout(function () {
          var first = wall.querySelector('[data-lens-opt]');
          if (first) { first.tabIndex = 0; first.focus(); }
        }, 30);
      }

      function closeWall() {
        if (!wall) return;
        wall.remove(); wall = null;
        d.body.style.overflow = '';
      }
      function pick(id, btn) {
        w.Lens.set(id, { from: wall ? 'wall' : 'strip' });
        closeWall();
        if (btn && !wall) btn.focus();
      }

      w.Lens.onChange(function (id) { mark(strip, id); mark(wall, id); });
      mark(strip, w.Lens.get()); mark(wall, w.Lens.get());

      return { strip: strip, closeWall: closeWall, hasWall: function () { return !!wall; } };
    }
  };
})(window, document);
