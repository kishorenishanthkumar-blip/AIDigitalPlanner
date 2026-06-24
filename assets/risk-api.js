/* UI-01 · Risk API client · window.RiskAPI over the risk agent (IFRS 9 ECL) via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('RISK', tool, args || {}, { timeoutMs: 45000 });
  }
  window.RiskAPI = {
    stageAssess:  (daysPastDue, sicr) => call('risk_stage_assess', { daysPastDue, sicr }),
    eclCompute:   (a)                 => call('risk_ecl_compute', a),
    portfolioEcl: ()                  => call('risk_portfolio_ecl', {}),
    provisionGet: (provisionId)       => call('risk_provision_get', { provisionId })
  };
  try { console.info('[AIDP] RiskAPI v1 loaded (via gateway)'); } catch (e) {}
})();
