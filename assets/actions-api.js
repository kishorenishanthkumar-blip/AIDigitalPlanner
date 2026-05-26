/* ─────────────────────────────────────────────────────────────────
   AIDP Actions API client · v1 · Phase 1B
   Thin window.ActionsAPI facade over the ACTIONS worker.

     window.ActionsAPI.list({role?, status?, category?})
                                       → {actions, count, by_role, by_status, by_priority, by_category, updated_at, filters}
     window.ActionsAPI.add(action)     → {ok, saved, total_actions, updated_at}
     window.ActionsAPI.addDebounced(a) → schedules add · returns immediately
     window.ActionsAPI.generate({for_roles?, persist?})
                                       → {ok, generated_count, actions, cross_binding_errors}
     window.ActionsAPI.export(format)  → {json|md}
     window.ActionsAPI.flushPending()  → manual retry queue
     window.ActionsAPI.pendingCount()  → integer
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  const QUEUE_KEY   = 'aidp_actions_pending_saves';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Actions] AIDP API client not loaded · ActionsAPI cannot reach the worker.');
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
  function queuePush(a) {
    const q = loadQueue().filter(x => x.id !== a.id);
    q.push(a);
    saveQueue(q);
  }
  function queueRemove(id) {
    saveQueue(loadQueue().filter(x => x.id !== id));
  }

  /* ─── Public API ──────────────────────────────────────── */

  async function list(filters) {
    const args = { user_email: getUserEmail() };
    if (filters?.role)     args.role     = filters.role;
    if (filters?.status)   args.status   = filters.status;
    if (filters?.category) args.category = filters.category;
    return window.AIDP.callAgent('ACTIONS', 'actions_list', args);
  }

  async function add(action) {
    const r = await window.AIDP.callAgent('ACTIONS', 'actions_add', {
      user_email: getUserEmail(), action
    });
    if (r && r.error) throw new Error('actions_add rejected: ' + (r.message || r.error));
    return r;
  }

  function addDebounced(action) {
    if (!action || !action.id) return;
    _pending.set(action.id, action);
    const existing = _timers.get(action.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(action.id);
      const snap = _pending.get(action.id);
      if (!snap) return;
      _pending.delete(action.id);
      add(snap).then(() => queueRemove(action.id))
        .catch(err => {
          console.warn('[Actions] add failed · queuing for retry', action.id, err.message);
          queuePush(snap);
        });
    }, DEBOUNCE_MS);
    _timers.set(action.id, t);
  }

  async function generate(opts) {
    const args = { user_email: getUserEmail(), persist: opts?.persist !== false };
    if (opts?.for_roles && opts.for_roles.length) args.for_roles = opts.for_roles;
    const r = await window.AIDP.callAgent('ACTIONS', 'actions_generate', args);
    if (r && r.error) throw new Error('actions_generate: ' + (r.message || r.error));
    return r;
  }

  async function exportSummary(format, role) {
    const args = { user_email: getUserEmail(), format: (format === 'md') ? 'md' : 'json' };
    if (role) args.role = role;
    return window.AIDP.callAgent('ACTIONS', 'actions_export_summary', args);
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0, failed = 0;
    for (const a of q) {
      try { await add(a); queueRemove(a.id); flushed++; }
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

  window.ActionsAPI = {
    list, add, addDebounced, generate, exportSummary, flushPending, pendingCount
  };

  try { console.log('[AIDP] ActionsAPI v1 loaded · debounce ' + DEBOUNCE_MS + 'ms'); } catch {}
})();
