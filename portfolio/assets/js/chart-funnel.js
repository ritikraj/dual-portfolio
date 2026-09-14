/* ==========================================================================
   THE SEND FUNNEL · email builder case study
   Chart.js (loaded from cdnjs in the page) draws the numbers in #funnelData.
   Every colour is read from theme.css at draw time, so the chart wears the
   same palette and mode as the page around it. Drawn once, when it scrolls
   into view, so the bars grow in front of the reader rather than off screen.
   ========================================================================== */
(function () {
  var canvas = document.getElementById('funnelChart');
  var source = document.getElementById('funnelData');
  if (!canvas || !source || !window.Chart) return;

  var data = JSON.parse(source.textContent);
  var css  = getComputedStyle(document.documentElement);
  function token(name, fallback) { return (css.getPropertyValue(name) || '').trim() || fallback; }

  /* the accent, in four strengths: the earliest step is the strongest */
  function alpha(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  var accent = token('--gold', '#43e08a');
  var shades = [1, .66, .42, .24].map(function (a) { return alpha(accent, a); });
  var ink    = token('--cream', '#e6f1e8');
  var dim    = token('--cream-dim', 'rgba(230,241,232,.58)');
  var faint  = token('--cream-faint', 'rgba(230,241,232,.15)');
  var paper  = token('--ink-2', '#0c1711');

  Chart.defaults.font.family = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  Chart.defaults.font.weight = 300;
  Chart.defaults.color = dim;

  function draw() {
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.groups,
        datasets: data.steps.map(function (step, i) {
          return {
            label: step,
            data: data.values.map(function (row) { return row[i]; }),
            backgroundColor: shades[i],
            hoverBackgroundColor: shades[i],
            borderWidth: 0,
            borderRadius: 0,
            categoryPercentage: .62,
            barPercentage: .88
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1100, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        layout: { padding: { top: 4 } },
        plugins: {
          legend: {
            position: 'top', align: 'start',
            labels: {
              usePointStyle: true, pointStyle: 'circle', boxWidth: 7, boxHeight: 7,
              padding: 18, color: ink,
              font: { size: 11 }
            }
          },
          tooltip: {
            backgroundColor: paper,
            borderColor: faint, borderWidth: 1,
            titleColor: ink, bodyColor: dim,
            titleFont: { size: 11, weight: 400 }, bodyFont: { size: 11 },
            padding: 10, cornerRadius: 3,
            usePointStyle: true, boxWidth: 7, boxHeight: 7
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: faint },
            ticks: { color: ink, font: { size: 12 } }
          },
          y: {
            beginAtZero: true,
            grid: { color: faint },
            border: { display: false },
            ticks: { color: dim, font: { size: 11 }, maxTicksLimit: 5, padding: 8 }
          }
        }
      }
    });
  }

  if (!('IntersectionObserver' in window)) { draw(); return; }
  var io = new IntersectionObserver(function (rows) {
    if (!rows[0].isIntersecting) return;
    io.disconnect();
    draw();
  }, { threshold: .35 });
  io.observe(canvas);
})();
