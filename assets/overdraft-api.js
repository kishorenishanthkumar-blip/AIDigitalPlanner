/* UI-01 · Overdraft API client · window.OverdraftAPI over the overdraft agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('OVERDRAFT', tool, args || {}, { timeoutMs: 45000 });
  }
  window.OverdraftAPI = {
    assess:   (account, monthlyIncome, avgBalance) => call('overdraft_assess', { account, monthlyIncome, avgBalance }),
    setLimit: (account, amount)                    => call('overdraft_set_limit', { account, amount }),
    status:   (account)                            => call('overdraft_status', { account })
  };
  try { console.info('[AIDP] OverdraftAPI v1 loaded (via gateway)'); } catch (e) {}
})();
