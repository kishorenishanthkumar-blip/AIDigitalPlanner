/* UI-01 · Dispute API client · window.DisputeAPI over the dispute agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('DISPUTE', tool, args || {}, { timeoutMs: 45000 });
  }
  window.DisputeAPI = {
    open:       (a)                          => call('dispute_open', a),
    chargeback: (disputeId, amount, currency)=> call('dispute_chargeback', { disputeId, amount, currency }),
    resolve:    (disputeId, outcome)         => call('dispute_resolve', { disputeId, outcome }),
    status:     (disputeId)                  => call('dispute_status', { disputeId })
  };
  try { console.info('[AIDP] DisputeAPI v1 loaded (via gateway)'); } catch (e) {}
})();
