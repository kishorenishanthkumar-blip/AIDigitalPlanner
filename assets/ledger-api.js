/* UI-01 · Ledger API client · window.LedgerAPI over the ledger agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('LEDGER', tool, args || {}, { timeoutMs: 45000 });
  }
  window.LedgerAPI = {
    openAccount: (a)                       => call('ledger_open_account', a),
    post:        (ref, narrative, lines)   => call('ledger_post', { ref, narrative, lines }),
    balance:     (accountNo)               => call('ledger_balance', { accountNo }),
    statement:   (accountNo, limit)        => call('ledger_statement', { accountNo, limit: limit || 20 })
  };
  try { console.info('[AIDP] LedgerAPI v1 loaded (via gateway)'); } catch (e) {}
})();
