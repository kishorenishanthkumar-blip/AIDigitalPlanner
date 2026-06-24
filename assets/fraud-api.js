/* UI-01 · Fraud API client · window.FraudAPI over the fraud agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('FRAUD', tool, args || {}, { timeoutMs: 45000 });
  }
  window.FraudAPI = {
    score:      (a)        => call('fraud_score_transaction', a),
    caseGet:    (caseId)   => call('fraud_case_get', { caseId }),
    listAlerts: (limit)    => call('fraud_list_alerts', { limit: limit || 20 })
  };
  try { console.info('[AIDP] FraudAPI v1 loaded (via gateway)'); } catch (e) {}
})();
