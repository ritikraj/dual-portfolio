/* ==========================================================================
   LAB · phase 0 controls only
   Three themes, two chooser modes, and a reset so the wall can be seen again.
   None of this ships. When the theme and the mode are chosen, this file and
   lab.css are deleted and the winners become the defaults.
   ========================================================================== */
(function (w, d) {
  var THEMES = [['blueprint', 'blueprint'], ['riso', 'risograph'], ['signal', 'signal']];
  var MODES  = [['strip', 'strip'], ['wall', 'wall']];
  var TK = 'rr.lab.theme', MK = 'rr.lab.mode';

  function get(k, f) { try { return localStorage.getItem(k) || f; } catch (e) { return f; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  w.Lab = {
    theme: function () { return get(TK, 'blueprint'); },
    mode : function () { return get(MK, 'wall'); },
    mount: function (host, onMode) {
      var bar = d.createElement('div');
      bar.className = 'lab';
      bar.setAttribute('aria-label', 'prototype controls');

      function set(list, key, current, apply) {
        var wrap = d.createElement('div');
        wrap.className = 'lab__set';
        var k = d.createElement('span');
        k.className = 'lab__k'; k.textContent = key;
        wrap.appendChild(k);
        list.forEach(function (row) {
          var b = d.createElement('button');
          b.type = 'button'; b.className = 'lab__b';
          b.textContent = row[1];
          b.setAttribute('aria-pressed', row[0] === current() ? 'true' : 'false');
          b.addEventListener('click', function () {
            apply(row[0]);
            [].slice.call(wrap.querySelectorAll('.lab__b')).forEach(function (x) {
              x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
            });
          });
          wrap.appendChild(b);
        });
        return wrap;
      }

      bar.appendChild(set(THEMES, 'theme', w.Lab.theme, function (v) {
        put(TK, v); d.documentElement.setAttribute('data-theme', v);
      }));
      var sep = d.createElement('div'); sep.className = 'lab__sep'; bar.appendChild(sep);
      bar.appendChild(set(MODES, 'chooser', w.Lab.mode, function (v) {
        put(MK, v); onMode(v);
      }));
      var sep2 = d.createElement('div'); sep2.className = 'lab__sep'; bar.appendChild(sep2);

      var reset = d.createElement('button');
      reset.type = 'button'; reset.className = 'lab__b';
      reset.textContent = 'reset first visit';
      reset.addEventListener('click', function () {
        try { localStorage.removeItem('rr.lens'); } catch (e) {}
        location.href = location.pathname;
      });
      bar.appendChild(reset);

      host.appendChild(bar);
    }
  };
})(window, document);
