/* ─────────────────────────────────────────────────────────────────
   AIDP Discovery API client · v1
   Thin window.DiscoveryAPI facade over the DISCOVERY worker's MCP tools.
   Adds a debounced auto-save layer + retry queue for offline resilience.

     window.DiscoveryAPI.list()                       → Promise<{capabilities, with_recommendations}>
     window.DiscoveryAPI.save(cap)                    → Promise<{ok, saved, total_capabilities, updated_at}>
     window.DiscoveryAPI.saveDebounced(cap)           → schedules a save · returns immediately
     window.DiscoveryAPI.recommend7r(cap)             → Promise<{recommendation}>
     window.DiscoveryAPI.export(format='json')        → Promise<{md|json}>
     window.DiscoveryAPI.flushPending()               → manual retry of queued saves
     window.DiscoveryAPI.pendingCount()               → integer

   Always writes to localStorage immediately. D1 sync via the DISCOVERY agent
   is best-effort · queued on failure, retried on next save or focus event.
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  const QUEUE_KEY   = 'aidp_discovery_pending_saves';
  const TIMEOUT_MS  = 30_000;

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Discovery] AIDP API client not loaded · DiscoveryAPI cannot reach the worker.');
    return;
  }

  /* ─── Per-cap debounce timers (Map<capId, timeoutId>) ────── */
  const _timers = new Map();
  /* ─── In-flight + queued saves (capId → cap snapshot to send) ─ */
  const _pending = new Map();

  function getUserEmail() {
    try {
      const ls = window.localStorage;
      return (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || 'guest@aidp.demo';
    } catch { return 'guest@aidp.demo'; }
  }

  function loadQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveQueue(arr) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr)); } catch {}
  }
  function queuePush(cap) {
    const q = loadQueue();
    // Replace any existing entry with the same id (latest write wins).
    const filtered = q.filter(x => x.id !== cap.id);
    filtered.push(cap);
    saveQueue(filtered);
  }
  function queueRemove(capId) {
    saveQueue(loadQueue().filter(x => x.id !== capId));
  }

  /* ─── Public API ──────────────────────────────────────────── */

  async function list() {
    return window.AIDP.callAgent('DISCOVERY', 'discovery_list_capabilities', {
      user_email: getUserEmail()
    });
  }

  async function save(cap) {
    const result = await window.AIDP.callAgent('DISCOVERY', 'discovery_save_capability', {
      user_email: getUserEmail(),
      capability: cap
    });
    if (result && result.error) {
      throw new Error('discovery_save_capability rejected: ' + (result.message || result.error));
    }
    return result;
  }

  function saveDebounced(cap) {
    if (!cap || !cap.id) return;
    _pending.set(cap.id, cap);
    const existing = _timers.get(cap.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(cap.id);
      const snap = _pending.get(cap.id);
      if (!snap) return;
      _pending.delete(cap.id);
      save(snap).then(() => {
        queueRemove(cap.id);
      }).catch(err => {
        console.warn('[Discovery] save failed · queuing for retry', cap.id, err.message);
        queuePush(snap);
      });
    }, DEBOUNCE_MS);
    _timers.set(cap.id, t);
  }

  async function recommend7r(cap) {
    const result = await window.AIDP.callAgent('DISCOVERY', 'discovery_recommend_7r', {
      capability: cap,
      user_email: ''   // suppress auto-injected user_email so the agent uses the inline cap
    });
    if (result && result.error) {
      throw new Error('discovery_recommend_7r rejected: ' + (result.message || result.error));
    }
    return result;
  }

  async function exportSummary(format) {
    return window.AIDP.callAgent('DISCOVERY', 'discovery_export_summary', {
      user_email: getUserEmail(),
      format: (format === 'md') ? 'md' : 'json'
    });
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0;
    let failed = 0;
    for (const cap of q) {
      try {
        await save(cap);
        queueRemove(cap.id);
        flushed++;
      } catch {
        failed++;
      }
    }
    return { ok: failed === 0, flushed, failed };
  }

  function pendingCount() {
    return loadQueue().length + _pending.size;
  }

  /* On window focus, opportunistically retry queued saves. */
  window.addEventListener('focus', () => {
    if (loadQueue().length > 0) flushPending().catch(() => {});
  });

  /* Expose */
  window.DiscoveryAPI = {
    list, save, saveDebounced, recommend7r, exportSummary,
    flushPending, pendingCount
  };

  try {
    console.log('[Discovery] DiscoveryAPI client v1 loaded · debounce ' + DEBOUNCE_MS + 'ms');
  } catch {}
})();
