/* UI-05 · Audit viewer client · window.AuditAPI over the BFF /api/audit endpoints. */
(function () {
  'use strict';
  var BFF = 'https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev';
  function asJson(r) {
    if (!r.ok) { return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.error || e.message || ('HTTP ' + r.status)); }); }
    return r.json();
  }
  function qs(o) { var p = []; for (var k in o) { if (o[k] != null && o[k] !== '') p.push(encodeURIComponent(k) + '=' + encodeURIComponent(o[k])); } return p.length ? ('?' + p.join('&')) : ''; }
  window.AuditAPI = {
    list: function (filters) { return fetch(BFF + '/api/audit' + qs(filters || {}), { credentials: 'include' }).then(asJson); },
    verify: function () { return fetch(BFF + '/api/audit/verify', { credentials: 'include' }).then(asJson); }
  };
  try { console.info('[AIDP] AuditAPI v1 loaded (via BFF)'); } catch (e) {}
})();
