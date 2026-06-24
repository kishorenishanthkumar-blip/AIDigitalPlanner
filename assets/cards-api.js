/* UI-01 · Cards API client · window.CardsAPI over the cards agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('CARDS', tool, args || {}, { timeoutMs: 45000 });
  }
  window.CardsAPI = {
    issue:    (account, product) => call('card_issue', { account, product }),
    activate: (cardId)           => call('card_activate', { cardId }),
    block:    (cardId, reason)   => call('card_block', { cardId, reason }),
    status:   (cardId)           => call('card_status', { cardId })
  };
  try { console.info('[AIDP] CardsAPI v1 loaded (via gateway)'); } catch (e) {}
})();
