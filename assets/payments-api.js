/* UI-01 · Payments API client · thin window.PaymentsAPI facade over the payments
   agent, called through the authenticated MCP gateway (AIDP.callAgent). */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) {
      return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    }
    return window.AIDP.callAgent('PAYMENTS', tool, args || {}, { timeoutMs: 45000 });
  }
  window.PaymentsAPI = {
    route:     (amount, currency, corridor, urgency) => call('payments_route', { amount, currency, corridor, urgency }),
    initiate:  (a)          => call('payments_initiate', a),
    status:    (paymentId)  => call('payments_status', { paymentId }),
    reconcile: (rail, window)=> call('payments_reconcile', { rail, window })
  };
  try { console.info('[AIDP] PaymentsAPI v1 loaded (via gateway)'); } catch (e) {}
})();
