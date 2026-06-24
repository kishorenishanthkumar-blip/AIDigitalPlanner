/* UI-01 · Onboarding API client · thin window.OnboardingAPI facade over the
   onboarding agent, called through the authenticated MCP gateway (AIDP.callAgent). */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) {
      return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    }
    return window.AIDP.callAgent('ONBOARDING', tool, args || {}, { timeoutMs: 45000 });
  }
  window.OnboardingAPI = {
    start:    (a)            => call('onboarding_start', a),
    screen:   (caseId)       => call('onboarding_screen', { caseId }),
    decision: (caseId, d)    => call('onboarding_decision', { caseId, decision: d }),
    get:      (caseId)       => call('onboarding_case_get', { caseId })
  };
  try { console.info('[AIDP] OnboardingAPI v1 loaded (via gateway)'); } catch (e) {}
})();
