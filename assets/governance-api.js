/* ─────────────────────────────────────────────────────────────────
   AIDP Governance API client · v1 · Phase 2A
   Thin window.GovernanceAPI facade over the GOVERNANCE worker.

     window.GovernanceAPI.listRaid({kind?, status?, severity?, owner_role?, hide_closed?})
                                          → {items, count, by_kind, by_status, ...}
     window.GovernanceAPI.upsertRaid(item) → {ok, item_id, total}
     window.GovernanceAPI.upsertRaidDebounced(item)
     window.GovernanceAPI.seedRaid(from = 'sow' | 'actions') → {ok, seeded_count}
     window.GovernanceAPI.changeRequest(cr)          → {ok, cr_id, status}
     window.GovernanceAPI.steeringPack({cadence?, format?, persist?})
                                          → {ok, pack: {rag, narrative, milestones, raid_rollup, change_rollup, ...}}
     window.GovernanceAPI.flushPending()
     window.GovernanceAPI.pendingCount()
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  const QUEUE_KEY   = 'aidp_governance_pending_saves';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Governance] AIDP API client not loaded · GovernanceAPI cannot reach the worker.');
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
  function queuePush(item) {
    const q = loadQueue().filter(x => x.id !== item.id);
    q.push(item);
    saveQueue(q);
  }
  function queueRemove(id) {
    saveQueue(loadQueue().filter(x => x.id !== id));
  }

  /* ─── Public API ──────────────────────────────────────── */

  async function listRaid(filters) {
    const args = { user_email: getUserEmail(), format: 'json' };
    if (filters?.kind)        args.kind        = filters.kind;
    if (filters?.status)      args.status      = filters.status;
    if (filters?.severity)    args.severity    = filters.severity;
    if (filters?.owner_role)  args.owner_role  = filters.owner_role;
    if (filters?.hide_closed) args.hide_closed = filters.hide_closed;
    return window.AIDP.callAgent('GOVERNANCE', 'governance_raid_list', args);
  }

  async function upsertRaid(item) {
    const r = await window.AIDP.callAgent('GOVERNANCE', 'governance_raid_upsert', {
      user_email: getUserEmail(), item
    });
    if (r && r.error) throw new Error('governance_raid_upsert: ' + (r.message || r.error));
    return r;
  }

  function upsertRaidDebounced(item) {
    if (!item || !item.id) return;
    _pending.set(item.id, item);
    const existing = _timers.get(item.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(item.id);
      const snap = _pending.get(item.id);
      if (!snap) return;
      _pending.delete(item.id);
      upsertRaid(snap)
        .then(() => queueRemove(item.id))
        .catch(err => {
          console.warn('[Governance] upsert failed · queuing', item.id, err.message);
          queuePush(snap);
        });
    }, DEBOUNCE_MS);
    _timers.set(item.id, t);
  }

  async function seedRaid(from) {
    const src = (from === 'actions') ? 'actions' : 'sow';
    const r = await window.AIDP.callAgent('GOVERNANCE', 'governance_raid_upsert', {
      user_email: getUserEmail(), seed_from: src
    });
    if (r && r.error) throw new Error('governance_raid_upsert (seed): ' + (r.message || r.error));
    return r;
  }

  async function changeRequest(cr) {
    const r = await window.AIDP.callAgent('GOVERNANCE', 'governance_change_request', {
      user_email: getUserEmail(), change_request: cr
    });
    if (r && r.error) throw new Error('governance_change_request: ' + (r.message || r.error));
    return r;
  }

  async function steeringPack(opts) {
    const args = {
      user_email: getUserEmail(),
      cadence: opts?.cadence || 'biweekly',
      format:  opts?.format  || 'json',
      persist: opts?.persist !== false
    };
    const r = await window.AIDP.callAgent('GOVERNANCE', 'governance_steering_pack', args);
    if (r && r.error) throw new Error('governance_steering_pack: ' + (r.message || r.error));
    return r;
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0, failed = 0;
    for (const item of q) {
      try { await upsertRaid(item); queueRemove(item.id); flushed++; }
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

  window.GovernanceAPI = {
    listRaid, upsertRaid, upsertRaidDebounced, seedRaid,
    changeRequest, steeringPack,
    flushPending, pendingCount
  };

  try { console.log('[AIDP] GovernanceAPI v1 loaded · debounce ' + DEBOUNCE_MS + 'ms'); } catch {}
})();
