/* ─────────────────────────────────────────────────────────────────
   AIDP Requirements API client · v1 · Phase 1A
   Thin window.RequirementsAPI facade over the REQUIREMENTS worker.
   Adds debounced auto-save + retry queue for offline resilience.

     window.RequirementsAPI.list({type?, priority?})
                                          → Promise<{requirements, count, by_priority, by_type, invest_summary, ...}>
     window.RequirementsAPI.add(req)      → Promise<{ok, saved, invest_score, total_requirements, updated_at}>
     window.RequirementsAPI.addDebounced(req) → schedules add · returns immediately
     window.RequirementsAPI.suggestCompliance({domain, sensitivity, region, capability_id?, persist?})
                                          → Promise<{frameworks, requirements, count}>
     window.RequirementsAPI.export(format='json'|'md')
                                          → Promise<{json|md}>
     window.RequirementsAPI.flushPending() → manual retry of queued saves
     window.RequirementsAPI.pendingCount() → integer

   Same pattern as DiscoveryAPI · localStorage queue + window focus retry.
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const DEBOUNCE_MS = 800;
  const QUEUE_KEY   = 'aidp_requirements_pending_saves';

  if (!window.AIDP || !window.AIDP.callAgent) {
    console.warn('[Requirements] AIDP API client not loaded · RequirementsAPI cannot reach the worker.');
    return;
  }

  const _timers  = new Map();   // capId → timeoutId
  const _pending = new Map();   // capId → cap snapshot

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
  function queuePush(req) {
    const q = loadQueue();
    const filtered = q.filter(x => x.id !== req.id);
    filtered.push(req);
    saveQueue(filtered);
  }
  function queueRemove(reqId) {
    saveQueue(loadQueue().filter(x => x.id !== reqId));
  }

  /* ─── Public API ──────────────────────────────────────── */

  async function list(filters) {
    const args = { user_email: getUserEmail() };
    if (filters?.type)     args.type     = filters.type;
    if (filters?.priority) args.priority = filters.priority;
    return window.AIDP.callAgent('REQUIREMENTS', 'requirements_list', args);
  }

  async function add(req) {
    const result = await window.AIDP.callAgent('REQUIREMENTS', 'requirements_add', {
      user_email: getUserEmail(),
      requirement: req
    });
    if (result && result.error) {
      throw new Error('requirements_add rejected: ' + (result.message || result.error));
    }
    return result;
  }

  function addDebounced(req) {
    if (!req || !req.id) return;
    _pending.set(req.id, req);
    const existing = _timers.get(req.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      _timers.delete(req.id);
      const snap = _pending.get(req.id);
      if (!snap) return;
      _pending.delete(req.id);
      add(snap).then(() => {
        queueRemove(req.id);
      }).catch(err => {
        console.warn('[Requirements] add failed · queuing for retry', req.id, err.message);
        queuePush(snap);
      });
    }, DEBOUNCE_MS);
    _timers.set(req.id, t);
  }

  /**
   * Ask the agent to infer compliance frameworks for a (domain, sensitivity, region)
   * tuple and OPTIONALLY persist the derived boilerplate requirements.
   * Returns { frameworks, requirements (preview), count }.
   */
  async function suggestCompliance(input) {
    const args = {
      domain:      input.domain,
      sensitivity: input.sensitivity,
      region:      input.region
    };
    if (input.capability_id) args.capability_id = input.capability_id;
    if (input.persist) {
      args.user_email = getUserEmail();
      args.persist    = true;
    }
    const result = await window.AIDP.callAgent('REQUIREMENTS', 'requirements_suggest_compliance', args);
    if (result && result.error) {
      throw new Error('requirements_suggest_compliance: ' + (result.message || result.error));
    }
    return result;
  }

  async function exportSummary(format) {
    return window.AIDP.callAgent('REQUIREMENTS', 'requirements_export_summary', {
      user_email: getUserEmail(),
      format: (format === 'md') ? 'md' : 'json'
    });
  }

  async function flushPending() {
    const q = loadQueue();
    if (!q.length) return { ok: true, flushed: 0 };
    let flushed = 0, failed = 0;
    for (const req of q) {
      try { await add(req); queueRemove(req.id); flushed++; }
      catch { failed++; }
    }
    return { ok: failed === 0, flushed, failed };
  }

  function pendingCount() {
    return loadQueue().length + _pending.size;
  }

  /* Opportunistic retry on focus */
  window.addEventListener('focus', () => {
    if (loadQueue().length > 0) flushPending().catch(() => {});
  });

  /* ─── Expose ──────────────────────────────────────────── */

  window.RequirementsAPI = {
    list, add, addDebounced, suggestCompliance, exportSummary,
    flushPending, pendingCount
  };

  try { console.log('[AIDP] RequirementsAPI v1 loaded · debounce ' + DEBOUNCE_MS + 'ms'); } catch {}
})();
