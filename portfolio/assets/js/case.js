/* ==========================================================================
   CASE STUDY PAGES · case.js
   One page holds both voices. ?v=a renders ritik's version, ?v=b renders
   claude's read of the same work. The <html> class is set by the inline
   script in <head> before first paint; everything below is progressive.
   ========================================================================== */
(function () {
  'use strict';

  var side = document.documentElement.className.indexOf('v-b') > -1 ? 'b' : 'a';
  /* the portfolio reopens on the section you left from, not at the top */
  var slug = (location.pathname.split('/').pop() || '').replace('.html', '');
  /* a page that does not live in /case can say where home is, e.g. the
     journey, which sits beside index.html rather than below it */
  var home = document.documentElement.getAttribute('data-home') ||
             ('../index.html#' + side + (slug ? ':' + slug : ''));

  [].slice.call(document.querySelectorAll('.csa__back, .csb__back')).forEach(function (a) {
    a.setAttribute('href', home);
  });

  /* ── the sheet tabs on side b are generated, like they are in the read ── */
  var sheets = [].slice.call(document.querySelectorAll('.csb-sheet'));
  sheets.forEach(function (sheet, i) {
    if (sheet.querySelector('.csb-sheet__tab')) return;
    var tab = document.createElement('header');
    tab.className = 'csb-sheet__tab';
    tab.innerHTML = '<span><b>' + pad(i + 1) + '</b><em>/' + pad(sheets.length) + '</em>' +
                      '&nbsp;&nbsp;·&nbsp;&nbsp;' + (sheet.getAttribute('data-tab') || '') + '</span>' +
                    '<span><em>assessment · claude</em></span>';
    sheet.insertBefore(tab, sheet.firstChild);
  });

  /* ── bar widths on the funnel chart ───────────────────────────────────── */
  [].slice.call(document.querySelectorAll('[data-w]')).forEach(function (el) {
    el.style.setProperty('--w', el.getAttribute('data-w') + '%');
  });

  /* ── reveal on entry ──────────────────────────────────────────────────── */
  var ups = [].slice.call(document.querySelectorAll('[data-up]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (rows) {
      rows.forEach(function (row) {
        if (row.isIntersecting) { row.target.classList.add('is-in'); io.unobserve(row.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    ups.forEach(function (el) { io.observe(el); });
  } else {
    ups.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ── reading progress ─────────────────────────────────────────────────── */
  var rule = document.querySelector('.csa__rule, .csb__rule'), tick = false;
  function paint() {
    tick = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    rule.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }
  if (rule) {
    window.addEventListener('scroll', function () {
      if (!tick) { tick = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ── the veil ─────────────────────────────────────────────────────────────
     It covered the page before anything loaded. Lift it once the fonts have
     settled, park it below the fold, then bring it back up on the way out so
     the portfolio's curtain picks the motion up exactly where this leaves it.
     -------------------------------------------------------------------- */
  var veil = document.getElementById('veil'), leaving = false;

  function lift() {
    if (!veil) return;
    veil.classList.add('is-up');
    setTimeout(function () { veil.classList.remove('is-up'); veil.classList.add('is-down'); }, 800);
  }

  whenReady(lift);

  function leave(href) {
    if (leaving) { return; }
    leaving = true;
    if (!veil) { location.href = href; return; }
    veil.classList.remove('is-up');
    veil.classList.add('is-down');
    veil.offsetHeight;                                   /* reflow, or no tween */
    veil.classList.remove('is-down');
    veil.classList.add('is-shut');
    setTimeout(function () { location.href = href; }, 600);
  }

  /* every internal link leaves through the veil. external, mail and new-tab
     links are left exactly as they are. */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    if (a.target === '_blank' || /^(mailto:|tel:|[a-z]+:\/\/)/i.test(href)) return;
    e.preventDefault();
    leave(href);
  });

  /* don't reveal a page that is still swapping its fonts in */
  function whenReady(fn) {
    var done = false;
    function go() { if (done) return; done = true; fn(); }
    setTimeout(go, 2200);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { setTimeout(go, 40); });
    } else {
      window.addEventListener('load', go);
    }
  }

  /* ── esc goes back to the portfolio you came from ─────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') leave(home);
  });

  function pad(n) { return (n < 10 ? '0' : '') + n; }
})();
