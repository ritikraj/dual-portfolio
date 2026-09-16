/* ==========================================================================
   THE DOOR, AND THE STRIP
   The question is the product. It is asked once, full screen, and it is a
   real choice: each option previews its own lens with that lens's own
   content, so you can see the consequence before you commit to it.

   Then the door does not vanish. The option you chose travels up and becomes
   the active chip in the strip, which is where the choice lives from then on.
   That is the whole argument of the site in one movement: this is a lens,
   not a gate, and you can change it whenever you like.

   Labels name content, never job titles. People misidentify themselves.
   They do not misidentify what they want to see.

   Keyboard parity throughout: arrows move and preview, enter or space
   chooses, escape takes the short version, focus stays inside the door.
   ========================================================================== */
(function (w, d) {
  var C = w.LENS_CONTENT;

  function node(tag, cls, text) {
    var n = d.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── the strip ─────────────────────────────────────────────────────────── */
  function buildStrip(onPick) {
    var root = node('div', 'chooser chooser--strip');
    var inner = node('div', 'chooser__inner');
    var q = node('p', 'chooser__q', 'reading for');
    q.id = 'strip-q';
    inner.appendChild(q);

    var group = node('div', 'chooser__group');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-labelledby', 'strip-q');

    C.ORDER.forEach(function (id) {
      var L = C.LENSES[id];
      var b = node('button', 'chooser__opt');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('data-lens-opt', id);
      b.tabIndex = -1;
      b.appendChild(node('span', 'chooser__label', L.label));
      b.appendChild(node('span', 'chooser__sub', L.sub));
      b.addEventListener('click', function () { onPick(id, b); });
      group.appendChild(b);
    });
    keys(group, onPick);
    inner.appendChild(group);
    root.appendChild(inner);
    return root;
  }

  /* ── the door ──────────────────────────────────────────────────────────── */
  function buildDoor(onPick, onSkip) {
    var root = node('section', 'door');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-labelledby', 'door-q');

    var head = node('div', 'door__head');
    head.appendChild(node('p', 'door__name', C.PROFILE.name));
    var q = node('h1', 'door__q');
    q.id = 'door-q';
    q.innerHTML = '<em>who</em> is asking?';
    head.appendChild(q);
    head.appendChild(node('p', 'door__hint', 'four ways through the same work. nothing is hidden from any of them, and you can change it whenever you like.'));
    root.appendChild(head);

    var who = node('div', 'door__who');
    who.innerHTML = C.PROFILE.title + '<br>' + C.PROFILE.line.split(' · ').join('<br>');
    root.appendChild(who);

    var bands = node('div', 'door__bands');
    bands.setAttribute('role', 'radiogroup');
    bands.setAttribute('aria-labelledby', 'door-q');

    C.ORDER.forEach(function (id, i) {
      var L = C.LENSES[id];
      var b = node('button', 'door__band');
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.setAttribute('data-lens-opt', id);
      b.tabIndex = i === 0 ? 0 : -1;
      b.style.setProperty('--i', i);

      b.appendChild(node('span', 'door__n', '0' + (i + 1)));
      var mid = node('span', 'door__mid');
      mid.appendChild(node('span', 'door__label', L.label));
      mid.appendChild(node('span', 'door__sub', L.sub));
      b.appendChild(mid);
      b.appendChild(node('span', 'door__prev', L.preview || ''));
      b.appendChild(node('span', 'door__go', '→'));

      b.addEventListener('mouseenter', function () { hot(bands, b); });
      b.addEventListener('focus', function () { hot(bands, b); });
      b.addEventListener('click', function () { onPick(id, b); });
      bands.appendChild(b);
    });

    bands.addEventListener('mouseleave', function () { cool(bands); });
    keys(bands, onPick);
    root.appendChild(bands);

    var skip = node('button', 'door__skip', 'or just show me the short version');
    skip.type = 'button';
    skip.addEventListener('click', onSkip);
    root.appendChild(skip);

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
    });
    return root;
  }

  /* hovering or focusing a band previews that lens: the band grows, the
     others recede, and its own content line appears */
  function hot(bands, b) {
    bands.classList.add('has-hot');
    [].slice.call(bands.children).forEach(function (x) { x.classList.toggle('is-hot', x === b); });
  }
  function cool(bands) {
    bands.classList.remove('has-hot');
    [].slice.call(bands.children).forEach(function (x) { x.classList.remove('is-hot'); });
  }

  /* one keyboard model for both modes */
  function keys(group, onPick) {
    group.addEventListener('keydown', function (e) {
      var opts = [].slice.call(group.querySelectorAll('[data-lens-opt]'));
      var i = opts.indexOf(d.activeElement);
      if (i < 0) return;
      var go = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go = opts[(i + 1) % opts.length];
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go = opts[(i - 1 + opts.length) % opts.length];
      if (e.key === 'Home') go = opts[0];
      if (e.key === 'End')  go = opts[opts.length - 1];
      if (go) {
        e.preventDefault();
        opts.forEach(function (o) { o.tabIndex = -1; });
        go.tabIndex = 0;
        go.focus();
        if (!group.classList.contains('door__bands')) onPick(go.getAttribute('data-lens-opt'), go);
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onPick(opts[i].getAttribute('data-lens-opt'), opts[i]);
      }
    });
  }

  function mark(root, id) {
    if (!root) return;
    [].slice.call(root.querySelectorAll('[data-lens-opt]')).forEach(function (b) {
      var on = b.getAttribute('data-lens-opt') === id;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      if (root.className.indexOf('door') === -1) b.tabIndex = on ? 0 : -1;
    });
  }

  w.Chooser = {
    mount: function (host, mode, opts) {
      opts = opts || {};
      var strip = buildStrip(pickFromStrip);
      host.appendChild(strip);

      var door = null;
      var ask = mode === 'wall' && !w.Lens.returning() && !opts.forceAnswered;

      if (ask) {
        door = buildDoor(pickFromDoor, function () { pickFromDoor(C.DEFAULT_LENS, null); });
        d.documentElement.classList.add('is-door');
        d.body.appendChild(door);
        trap(door);
        if (w.Motion) w.Motion.enter(door.querySelectorAll('.door__band'), 70);
        setTimeout(function () {
          var first = door.querySelector('[data-lens-opt]');
          if (first) first.focus({ preventScroll: true });
        }, 40);
      }

      function trap(root) {
        d.addEventListener('focusin', function (e) {
          if (door && !root.contains(e.target)) {
            var first = root.querySelector('[data-lens-opt]');
            if (first) first.focus({ preventScroll: true });
          }
        });
      }

      function pickFromStrip(id, btn) {
        w.Lens.set(id, { from: 'strip' });
        if (btn) btn.focus({ preventScroll: true });
      }

      /* the chosen band becomes the active chip: one continuous movement,
         so the door is understood as the nav it turns into */
      function pickFromDoor(id, btn) {
        if (!door) return;
        var label = btn && btn.querySelector('.door__label');
        if (label && !w.Motion.still()) label.style.viewTransitionName = 'lens-title';
        if (btn) btn.classList.add('is-chosen');

        var run = function () {
          if (door) { door.remove(); door = null; }
          d.documentElement.classList.remove('is-door');
          d.body.style.overflow = '';
          w.Lens.set(id, { from: 'door', noAnim: true, keepPlace: false });
          mark(strip, id);
        };

        if (w.Motion && !w.Motion.still()) {
          /* let the chosen band fill before the page arrives behind it */
          setTimeout(function () { w.Motion.swap(run); }, 180);
        } else {
          run();
        }
      }

      d.body.style.overflow = ask ? 'hidden' : '';
      w.Lens.onChange(function (id) { mark(strip, id); mark(door, id); });
      mark(strip, w.Lens.get());
      mark(door, w.Lens.get());

      return { strip: strip, isAsking: function () { return !!door; } };
    }
  };
})(window, document);
