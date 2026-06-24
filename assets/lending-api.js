/* UI-01 · Lending API client · window.LendingAPI over the lending agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('LENDING', tool, args || {}, { timeoutMs: 45000 });
  }
  window.LendingAPI = {
    apply:      (a)               => call('lending_apply', a),
    underwrite: (loanId)          => call('lending_underwrite', { loanId }),
    decision:   (loanId, d)       => call('lending_decision', { loanId, decision: d }),
    status:     (loanId)          => call('lending_status', { loanId })
  };
  try { console.info('[AIDP] LendingAPI v1 loaded (via gateway)'); } catch (e) {}
})();
