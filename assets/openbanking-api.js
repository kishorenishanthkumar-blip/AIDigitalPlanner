/* UI-01 · Open Banking API client · window.OpenBankingAPI over the openbanking agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('OPENBANKING', tool, args || {}, { timeoutMs: 45000 });
  }
  window.OpenBankingAPI = {
    createConsent: (a)          => call('ob_create_consent', a),
    getConsent:    (consentId)  => call('ob_get_consent', { consentId }),
    revokeConsent: (consentId)  => call('ob_revoke_consent', { consentId }),
    accounts:      (consentId)  => call('ob_accounts', { consentId })
  };
  try { console.info('[AIDP] OpenBankingAPI v1 loaded (via gateway)'); } catch (e) {}
})();
