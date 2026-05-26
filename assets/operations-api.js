/* ─────────────────────────────────────────────────────────────────
   AIDP Operations API client · v1 · Phase 2B
   Thin window.OperationsAPI facade over the OPERATIONS worker.

     window.OperationsAPI.dashboard({window_days?, deploys?, per_agent_uptime?, persist?})
                                            → {dashboard, persisted}
     window.OperationsAPI.sloList({agent?, kind?, status?, measurements?})
                                            → {slos, count, buckets}
     window.OperationsAPI.sloUpsert(slo)    → {ok, saved, total, ...}
     window.OperationsAPI.sloSeedDefaults({agents?}) → {ok, seeded_count, ...}
     window.OperationsAPI.incidents({since_ms?, severity?, source_agent?, status?})
                                            → {incidents, count, buckets}
     window.OperationsAPI.dora({window_days?, deploys?}) → {dora, ...}
     window.OperationsAPI.flushPending()
     window.OperationsAPI.pendingCount()
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  const QUEUE_KEY   = 'aidp_operations_pending_saves';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Operations] AIDP API client not loaded · OperationsAPI cannot reach the worker.');
    return;
  }

  const _timers  = new Map();
  const _pending = new Map();

  function getUserEmail() {
    if (window.AIDPStudio && window.AIDPStudio.getUserEmail) return window.AIDPStudio.getUserEmail();
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
  function queuePush(slo) {
    const q = loadQueue().filter(x => x.id !== slo.id);
    q.push(slo);
    saveQueue(q);
  }
  function queueRemove(id) {
    saveQueue(loadQueue().filter(x => x.id !== id));
  }

  /* ─── Public API ──────────────────────────────────────── */

  async function dashboard(opts) {
    const args = { user_email: getUserEmail(), format: 'json' };
    if (opts?.window_days != null)       args.window_days       = opts.window_days;
    if (opts?.deploys)                   args.deploys           = opts.deploys;
    if (opts?.per_agent_uptime)          args.per_agent_uptime  = opts.per_agent_uptime;
    if (opts?.persist != null)           args.persist           = opts.persist;
    const r = await window.AIDP.callAgent('OPERATIONS', 'operations_dashboard', args);
    if (r && r.error) throw new Error('operations_dashboard: ' + (r.message || r.error));
    return r;
  }

  async function sloList(filters) {
    const args = { user_email: getUserEmail(), format: 'json' };
    if (filters?.agent)        args.agent        = filters.agent;
    if (filters?.kind)         args.kind         = filters.kind;
    if (filters?.status)       args.status       = filters.status;
    if (filters?.measurements) args.measurements = filters.measurements;
    return window.AIDP.callAgent('OPERATIONS', 'operations_slo_list', args);
  }

  async function sloUpsert(slo) {
    const r = await window.AIDP.callAgent('OPERATIONS', 'operations_slo_list', {
      user_email: getUserEmail(), upsert: slo, format: 'json'
    });
    if (r && r.error) throw new Error('operations_slo_list (upsert): ' + (r.message || r.error));
    return r;
  }

  function sloUpsertDebounced(slo) {
    if (!slo || !slo.id) return;
    _pending.set(slo.id, slo);
    const existing = _timers.get(slo.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(slo.id);
      const snap = _pending.get(slo.id);
      if (!snap) return;
      _pending.delete(slo.id);
      sloUpsert(snap)
        .then(() => queueRemove(slo.id))
        .catch(err => {
          console.warn('[Operations] sloUpsert failed · queuing', slo.id, err.message);
          queuePush(snap);
        });
    }, DEBOUNCE_MS);
    _timers.set(slo.id, t);
  }

  async function sloSeedDefaults(opts) {
    const args = { user_email: getUserEmail(), seed_defaults: true, format: 'json' };
    if (opts?.agents) args.agents = opts.agents;
    const r = await window.AIDP.callAgent('OPERATIONS', 'operations_slo_list', args);
    if (r && r.error) throw new Error('operations_slo_list (seed): ' + (r.message || r.error));
    return r;
  }

  async function incidents(filters) {
    const args = { user_email: getUserEmail() };
    if (filters?.since_ms     != null) args.since_ms     = filters.since_ms;
    if (filters?.severity)             args.severity     = filters.severity;
    if (filters?.source_agent)         args.source_agent = filters.source_agent;
    if (filters?.status)               args.status       = filters.status;
    return window.AIDP.callAgent('OPERATIONS', 'operations_incident_query', args);
  }

  async function dora(opts) {
    const args = { user_email: getUserEmail() };
    if (opts?.window_days != null) args.window_days = opts.window_days;
    if (opts?.deploys)             args.deploys     = opts.deploys;
    return window.AIDP.callAgent('OPERATIONS', 'operations_dora_metrics', args);
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0, failed = 0;
    for (const slo of q) {
      try { await sloUpsert(slo); queueRemove(slo.id); flushed++; }
      catch { failed++; }
    }
    return { ok: failed === 0, flushed, failed };
  }

  function pendingCount() {
    return loadQueue().length + _pending.size;
  }

  window.addEventListener('focus', () => {
    if (loadQueue().length > 0) flushPending().catch(() => {});
  });

  window.OperationsAPI = {
    dashboard, sloList, sloUpsert, sloUpsertDebounced, sloSeedDefaults,
    incidents, dora,
    flushPending, pendingCount
  };

  try { console.log('[AIDP] OperationsAPI v1 loaded · debounce ' + DEBOUNCE_MS + 'ms'); } catch {}
})();
