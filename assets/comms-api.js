/* UI-01 · Comms API client · window.CommsAPI over the comms agent via the gateway. */
(function () {
  'use strict';
  function call(tool, args) {
    if (!window.AIDP || !window.AIDP.callAgent) return Promise.reject(new Error('AIDP client not loaded — sign in and reload.'));
    return window.AIDP.callAgent('COMMS', tool, args || {}, { timeoutMs: 45000 });
  }
  window.CommsAPI = {
    send:   (a)          => call('comm_send', a),
    status: (messageId)  => call('comm_status', { messageId }),
    list:   (limit)      => call('comm_list', { limit: limit || 20 })
  };
  try { console.info('[AIDP] CommsAPI v1 loaded (via gateway)'); } catch (e) {}
})();
