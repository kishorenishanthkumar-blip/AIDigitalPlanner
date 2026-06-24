/* UI-01 · KYC/AML API client · thin window.KYCAPI facade over the kyc-aml agent,
   called through the authenticated MCP gateway (AIDP.callAgent). */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) {
      return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    }
    return window.AIDP.callAgent('KYC_AML', tool, args || {}, { timeoutMs: 45000 });
  }
  window.KYCAPI = {
    screenName:    (name, country, threshold) => call('screening_screen_name', { name, country, threshold }),
    screenIso:     (message, threshold)        => call('screening_screen_iso20022', { message, threshold }),
    screenCase:    (caseId, subjectType, name) => call('kyc_screen_sanctions', { caseId, subjectType, name }),
    monitorTxn:    (txnRef, amount, corridor)  => call('aml_monitor_transaction', { txnRef, amount, corridor }),
    caseGet:       (caseId)                     => call('kyc_case_get', { caseId }),
    refreshLists:  ()                           => call('screening_refresh_lists', {})
  };
  try { console.info('[AIDP] KYCAPI v1 loaded (via gateway)'); } catch (e) {}
})();
