/* ─────────────────────────────────────────────────────────────────
   AIDP SOW API client · v1 · Phase 1C
   Thin window.SowAPI facade over the SOW worker.

     window.SowAPI.list()                          → {sow_summary, has_sow}
     window.SowAPI.assemble({client?, vendor?, region?, currency?, contingency_pct?, persist?})
                                                    → {ok, sow, cross_binding_errors}
     window.SowAPI.updateSection(sectionId, body, title?)
                                                    → {ok, section, updated_at}
     window.SowAPI.updateSectionDebounced(id, body, title?)  → schedules, returns immediately
     window.SowAPI.export(format='md')             → {format, content} or {sow}
     window.SowAPI.flushPending()
     window.SowAPI.pendingCount()
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 1200;   // longer than other studios · markdown bodies are bigger payloads
  const QUEUE_KEY   = 'aidp_sow_pending_saves';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[SOW] AIDP API client not loaded · SowAPI cannot reach the worker.');
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
  function queuePush(payload) {
    /* keyed by section_id · latest write wins */
    const q = loadQueue().filter(x => x.section_id !== payload.section_id);
    q.push(payload);
    saveQueue(q);
  }
  function queueRemove(sectionId) {
    saveQueue(loadQueue().filter(x => x.section_id !== sectionId));
  }

  /* ─── Public API ──────────────────────────────────────── */

  async function list() {
    return window.AIDP.callAgent('SOW', 'sow_list', { user_email: getUserEmail() });
  }

  async function assemble(opts) {
    const args = { user_email: getUserEmail(), persist: opts?.persist !== false };
    if (opts?.client_name)     args.client_name     = opts.client_name;
    if (opts?.vendor_name)     args.vendor_name     = opts.vendor_name;
    if (opts?.region)          args.region          = opts.region;
    if (opts?.currency)        args.currency        = opts.currency;
    if (opts?.contingency_pct != null) args.contingency_pct = opts.contingency_pct;
    if (opts?.title)           args.title           = opts.title;
    if (opts?.version)         args.version         = opts.version;
    const r = await window.AIDP.callAgent('SOW', 'sow_assemble', args);
    if (r && r.error) throw new Error('sow_assemble: ' + (r.message || r.error));
    return r;
  }

  async function updateSection(sectionId, body, title) {
    const args = { user_email: getUserEmail(), section_id: sectionId };
    if (body  != null) args.body  = body;
    if (title != null) args.title = title;
    const r = await window.AIDP.callAgent('SOW', 'sow_update_section', args);
    if (r && r.error) throw new Error('sow_update_section: ' + (r.message || r.error));
    return r;
  }

  function updateSectionDebounced(sectionId, body, title) {
    const payload = { section_id: sectionId, body, title };
    _pending.set(sectionId, payload);
    const existing = _timers.get(sectionId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(sectionId);
      const snap = _pending.get(sectionId);
      if (!snap) return;
      _pending.delete(sectionId);
      updateSection(snap.section_id, snap.body, snap.title)
        .then(() => queueRemove(sectionId))
        .catch(err => {
          console.warn('[SOW] updateSection failed · queuing', sectionId, err.message);
          queuePush(snap);
        });
    }, DEBOUNCE_MS);
    _timers.set(sectionId, t);
  }

  async function exportSow(format) {
    const f = (format === 'json' || format === 'summary') ? format : 'md';
    return window.AIDP.callAgent('SOW', 'sow_export', { user_email: getUserEmail(), format: f });
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0, failed = 0;
    for (const p of q) {
      try { await updateSection(p.section_id, p.body, p.title); queueRemove(p.section_id); flushed++; }
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

  window.SowAPI = {
    list, assemble, updateSection, updateSectionDebounced, export: exportSow,
    flushPending, pendingCount
  };

  try { console.log('[AIDP] SowAPI v1 loaded · debounce ' + DEBOUNCE_MS + 'ms'); } catch {}
})();
