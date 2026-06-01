/* ─────────────────────────────────────────────────────────────────
   AIDP STLC phase stepper. Drop <div data-phase-stepper="N"></div> on a
   phase page and include this script — it renders the 1→8 stepper with
   the current phase highlighted, plus Prev / Next links.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var PHASES = [
    { n: 1, name: 'Requirements Analysis', href: 'phase-1-requirements' },
    { n: 2, name: 'Test Planning',         href: 'phase-2-planning' },
    { n: 3, name: 'Test Design',           href: 'phase-3-design' },
    { n: 4, name: 'Test Data Setup',       href: 'phase-4-data' },
    { n: 5, name: 'Environment Setup',     href: 'phase-5-environment' },
    { n: 6, name: 'Test Execution',        href: 'phase-6-execution' },
    { n: 7, name: 'Defect Management',     href: 'phase-7-defects' },
    { n: 8, name: 'Test Closure',          href: 'phase-8-closure' }
  ];
  window.AIDP_PHASES = PHASES;

  function css() {
    if (document.getElementById('aidp-ps-css')) return;
    var st = document.createElement('style'); st.id = 'aidp-ps-css';
    st.textContent =
      '.aidp-ps{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 4px;font-family:Inter,system-ui,sans-serif}' +
      '.aidp-ps a{font-size:11.5px;font-weight:600;text-decoration:none;padding:5px 9px;border-radius:8px;border:1px solid #E2E8F0;background:#F8FAFC;color:#475569;white-space:nowrap}' +
      '.aidp-ps a:hover{border-color:#1E40AF;color:#1E40AF}' +
      '.aidp-ps a.on{background:#1E40AF;color:#fff;border-color:#1E40AF}' +
      '.aidp-ps a .n{font-family:IBM Plex Mono,monospace;opacity:.7;margin-right:4px}' +
      '.aidp-ps-nav{display:flex;gap:8px;margin:10px 0 0}' +
      '.aidp-ps-nav a{font-size:12.5px;font-weight:600;text-decoration:none;padding:6px 12px;border-radius:6px;border:1px solid #E2E8F0;color:#334155}' +
      '.aidp-ps-nav a:hover{border-color:#1E40AF;color:#1E40AF}';
    document.head.appendChild(st);
  }

  function mount(el) {
    var cur = parseInt(el.getAttribute('data-phase-stepper'), 10) || 1;
    el.className = 'aidp-ps';
    el.innerHTML = PHASES.map(function (p) {
      return '<a class="' + (p.n === cur ? 'on' : '') + '" href="' + p.href + '"><span class="n">' + p.n + '</span>' + p.name + '</a>';
    }).join('');
    var prev = PHASES[cur - 2], next = PHASES[cur];
    var nav = document.createElement('div'); nav.className = 'aidp-ps-nav';
    nav.innerHTML =
      (prev ? '<a href="' + prev.href + '">← Phase ' + prev.n + ' · ' + prev.name + '</a>' : '<a href="testing-services">← Testing Services</a>') +
      (next ? '<a href="' + next.href + '">Phase ' + next.n + ' · ' + next.name + ' →</a>' : '<a href="testing-services">Back to Testing Services →</a>');
    if (el.parentNode) el.parentNode.insertBefore(nav, el.nextSibling);
  }

  function start() {
    css();
    var els = document.querySelectorAll('[data-phase-stepper]');
    Array.prototype.forEach.call(els, mount);
  }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();
