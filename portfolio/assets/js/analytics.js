/* ==========================================================================
   ANALYTICS · google analytics 4
   One file, loaded by every page. Put your measurement id below and nothing
   else needs to change. While the id is the placeholder, or the site runs on
   localhost, nothing loads and nothing is sent: window.track() is a no-op.

   What gets recorded
     page_view            every real page (automatic), plus a virtual page view
                          for each portfolio A section and portfolio B sheet,
                          so "views per section" works like "views per page"
     portfolio_enter      which side of the door someone picked (a or b)
     case_study_click     a click into a case study, and where it came from
     case_voice_switch    "read claude's take" or "ritik's version"
     next_case_click      the next-case link at the bottom of a case study
     journey_click        any link to the journey
     plugin_click         any link to the plugin page
     plugin_unlocked      the bubble section opened by popping six bubbles
     concept_open         a concept screen opened large in explorations
     contact_click        an email link
     outbound click / scroll depth: recorded by GA's enhanced measurement
   ========================================================================== */
(function () {
  var ID = 'G-QHZBG0L8M1';                         /* ← your measurement id */

  var off = /X{6}/.test(ID) ||
            /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  window.track = function (name, params) {
    if (off) return;
    gtag('event', name, params || {});
  };

  /* a virtual page for single-page moments: a section or a sheet */
  var lastVirtual = '';
  window.trackView = function (path, title) {
    if (off || path === lastVirtual) return;
    lastVirtual = path;
    gtag('event', 'page_view', {
      page_location: location.origin + path,
      page_path: path,
      page_title: title
    });
  };

  if (off) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', ID);

  /* one click listener for every link on every page */
  function slugOf(href) {
    var m = href.match(/case\/([a-z0-9-]+)\.html/);
    return m ? m[1] : '';
  }
  function whereAmI() {
    var p = location.pathname;
    if (/\/case\//.test(p)) return 'case:' + slugOf(p) + (/v=b/.test(location.search) ? ':b' : ':a');
    if (/journey/.test(p)) return 'journey';
    if (/plugin/.test(p)) return 'plugin';
    return document.body.classList.contains('is-b') ? 'portfolio-b' :
           document.body.classList.contains('is-a') ? 'portfolio-a' : 'door';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var from = whereAmI();

    if (/^mailto:/.test(href)) return track('contact_click', { from: from });
    if (a.classList.contains('jr-next') || a.closest('.csb__foot')) {
      return track('next_case_click', { from: from, to: slugOf(href) || href });
    }
    if (/^\?v=[ab]/.test(href)) return track('case_voice_switch', { case: slugOf(location.pathname), to: href.slice(-1) });
    if (/case\/[a-z0-9-]+\.html/.test(href)) {
      return track('case_study_click', { case: slugOf(href), voice: /v=b/.test(href) ? 'b' : 'a', from: from });
    }
    if (/journey\.html/.test(href)) return track('journey_click', { from: from });
    if (/plugin\.html/.test(href)) return track('plugin_click', { from: from });
  }, true);
})();
