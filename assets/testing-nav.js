/* ─────────────────────────────────────────────────────────────────
   AIDP Testing workspace nav · injects a pill nav interlinking every
   testing-related UI page. Include on any testing page:
     <script src="assets/testing-nav.js" defer></script>
   Mounts right after the shared top-bar.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var LINKS = [
    { h: 'testing-services',  t: 'Testing Services' },
    { h: 'test-design',       t: 'Test Design' },
    { h: 'testdata',          t: 'Test Data' },
    { h: 'testing-dashboard', t: 'Testing Dashboard' },
    { h: 'status',            t: 'Platform Status' }
  ];
  function mount() {
    if (document.getElementById('aidp-testing-nav')) return;
    var tb = document.querySelector('[data-di-topbar]');
    if (!tb) return;
    var here = location.pathname.replace(/^\//, '').replace(/\.html$/, '');
    var bar = document.createElement('div');
    bar.id = 'aidp-testing-nav';
    bar.style.cssText = 'max-width:1180px;margin:0 auto;padding:10px 22px 0;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-family:Inter,system-ui,sans-serif';
    bar.innerHTML =
      '<span style="font-size:10px;color:#94A3B8;margin-right:4px;text-transform:uppercase;letter-spacing:.06em">Testing workspace</span>' +
      LINKS.map(function (l) {
        var on = here === l.h;
        return '<a href="' + l.h + '" style="font-size:12px;font-weight:600;text-decoration:none;padding:4px 11px;border-radius:14px;' +
          (on ? 'background:#1E40AF;color:#fff' : 'background:#F1F5F9;color:#334155;border:1px solid #E2E8F0') + '">' + l.t + '</a>';
      }).join('');
    tb.parentNode.insertBefore(bar, tb.nextSibling);
  }
  if (document.readyState !== 'loading') mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
