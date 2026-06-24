/* UI-04 · HITL approvals client · window.HITLAPI over the BFF /api/hitl endpoints. */
(function () {
  'use strict';
  var BFF = 'https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev';
  function asJson(r) {
    if (!r.ok) { return r.json().catch(function () { return {}; }).then(function (e) { throw new Error(e.error || e.message || ('HTTP ' + r.status)); }); }
    return r.json();
  }
  window.HITLAPI = {
    list: function (status) {
      return fetch(BFF + '/api/hitl?status=' + encodeURIComponent(status || 'pending'), { credentials: 'include' }).then(asJson);
    },
    decide: function (approvalId, approve, reason) {
      return fetch(BFF + '/api/hitl/decide', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId: approvalId, approve: !!approve, reason: reason || undefined })
      }).then(asJson);
    }
  };
  try { console.info('[AIDP] HITLAPI v1 loaded (via BFF)'); } catch (e) {}
})();
