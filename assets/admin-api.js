/* GOV-02 / ENT-06 · Tenant admin client · window.AdminAPI over the BFF /api/admin endpoints. */
(function () {
  'use strict';
  var BFF = 'https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev';
  function asJson(r) {
    if (!r.ok) { return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.error || e.message || ('HTTP ' + r.status)); }); }
    return r.json();
  }
  function get(p) { return fetch(BFF + p, { credentials: 'include' }).then(asJson); }
  function post(p, b) { return fetch(BFF + p, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b || {}) }).then(asJson); }
  window.AdminAPI = {
    listTenants: function () { return get('/api/admin/tenants'); },
    provision:   function (b) { return post('/api/admin/tenants', b); },
    revokeKey:   function (keyId) { return post('/api/admin/keys/revoke', { keyId: keyId }); },
    secrets:     function () { return get('/api/admin/secrets'); }
  };
  try { console.info('[AIDP] AdminAPI v1 loaded (via BFF)'); } catch (e) {}
})();
