/* AIDP portal · shared header + footer injector (keeps all portal pages DRY).
   Mount: add <div data-portal-header></div> and <div data-portal-footer></div>.
   Optional: <body data-page="solutions"> highlights the active nav item. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  var NAV = [
    { id: 'solutions', label: 'Solutions', href: 'solutions.html' },
    { id: 'cefi', label: 'Centralized finance', href: 'cefi.html' },
    { id: 'defi', label: 'Decentralized finance', href: 'defi.html' },
    { id: 'company', label: 'Company', href: 'company.html' }
  ];
  function header(active) {
    var links = NAV.map(function (n) {
      return '<a class="ph-link' + (n.id === active ? ' active' : '') + '" href="' + n.href + '">' + n.label + '</a>';
    }).join('');
    return '<div class="ph"><div class="ph-in">' +
      '<a class="ph-brand" href="index.html"><span class="ph-logo">AI</span>' +
      '<span class="ph-name">AIDP<small>Agentic AI for Banking</small></span></a>' +
      '<nav class="ph-nav">' + links + '</nav>' +
      '<div class="ph-right"><a class="ph-signin" href="signin.html">Sign in</a>' +
      '<a class="cta" href="home.html">Open portal</a></div>' +
      '</div></div>';
  }
  function footer() {
    var P = window.AIDP_PORTAL;
    var cols = '';
    if (P) {
      cols = P.domains.map(function (d) {
        var prods = P.byDomain(d.id).map(function (p) {
          var href = p.route || ('domain.html?d=' + d.id);
          return '<a href="' + href + '">' + p.name + '</a>';
        }).join('');
        return '<div><h4>' + d.name + '</h4>' + prods + '</div>';
      }).slice(0, 4).join('');
    }
    return '<footer class="pf"><div class="pf-in">' +
      '<div><div class="ph-brand" style="margin-bottom:10px"><span class="ph-logo">AI</span>' +
      '<span class="ph-name" style="color:var(--navy)">AIDP</span></div>' +
      '<p class="pf-copy">Agentic AI platform for banking as a solution — centralized and decentralized finance, unified end to end.</p></div>' +
      cols + '</div>' +
      '<div class="pf-bottom"><span>&copy; 2026 Digital Infotech — AIDP. Confidential &amp; proprietary.</span>' +
      '<span>Created by Nishanth Kumar Kishore</span></div></footer>';
  }
  ready(function () {
    var active = (document.body && document.body.dataset && document.body.dataset.page) || '';
    var h = document.querySelector('[data-portal-header]');
    if (h) h.outerHTML = header(active);
    var f = document.querySelector('[data-portal-footer]');
    if (f) f.outerHTML = footer();
  });
})();
