/* ─────────────────────────────────────────────────────────────────
   AIDP Studio Shell · reusable helpers for the enterprise pattern
   v1 · Phase 0 of the 8-studio rewrite

   Exposes `window.AIDPStudio` · used by every Phase 1+ studio:
     escapeHtml / fmtFresh / fmtCurrency / fmtNumber / fmtDate
     getUserEmail / getTenantShort
     renderFreshnessPill   · paints into <span data-aidp-fresh>
     renderTenantBadge     · paints into <span data-aidp-tenant>
     wireSourceToggle      · attaches click handlers to .aidp-source-toggle
     wireFilterRail        · binds <select> changes into a state object
     wireKeyboardShortcuts · S/X/R/L/V style hotkeys, scoped per page
     toast                 · convenience wrapper over window.DI.toast
     showError / clearError
     sendToStudio          · localStorage handoff + navigation
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Formatting primitives ───────────────────────────── */

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtFresh(ts) {
    if (!ts) return 'Never';
    const sec = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (sec < 60)    return sec + 's ago';
    if (sec < 3600)  return Math.floor(sec / 60) + 'm ago';
    if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
    return Math.floor(sec / 86400) + 'd ago';
  }

  function isStale(ts, hours) {
    if (!ts) return true;
    return (Date.now() - new Date(ts).getTime()) > (hours || 24) * 3600 * 1000;
  }

  const CCY_SYMBOL = { USD: '$', EUR: '€', GBP: '£', SGD: 'S$', INR: '₹', JPY: '¥', CAD: 'C$', AUD: 'A$' };
  const CCY_LOCALE = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', SGD: 'en-SG', INR: 'en-IN', JPY: 'ja-JP', CAD: 'en-CA', AUD: 'en-AU' };
  function fmtCurrency(n, currency) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    const c = currency || 'USD';
    return (CCY_SYMBOL[c] || '$') + Math.round(n).toLocaleString(CCY_LOCALE[c] || 'en-US');
  }

  function fmtNumber(n) {
    if (typeof n !== 'number' || !isFinite(n)) return '—';
    return n.toLocaleString('en-US');
  }

  function fmtDate(d) {
    if (!d) return '—';
    const t = (d instanceof Date) ? d : new Date(d);
    if (isNaN(t.getTime())) return '—';
    return t.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function fmtDuration(ms) {
    if (typeof ms !== 'number') return '—';
    if (ms < 1000)   return ms + 'ms';
    if (ms < 60000)  return (ms / 1000).toFixed(2) + 's';
    return Math.floor(ms / 60000) + 'm ' + Math.floor((ms % 60000) / 1000) + 's';
  }

  /* ─── Tenant context ──────────────────────────────────── */

  function getUserEmail() {
    try {
      const ls = window.localStorage;
      return (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || 'guest@aidp.demo';
    } catch { return 'guest@aidp.demo'; }
  }

  function getTenantShort() {
    return getUserEmail().split('@')[0];
  }

  /* ─── Render helpers ──────────────────────────────────── */

  /**
   * Paint the freshness pill into elements that match the selector.
   * The element should have inner structure: `<span class="dot"></span><span data-aidp-fresh-text></span>`.
   *
   * State: 'fresh' | 'stale' | 'fail' | 'queued' | 'loading'
   */
  function renderFreshnessPill(selector, state, text) {
    const el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (!el) return;
    el.className = 'aidp-freshness' + (state && state !== 'fresh' ? ' ' + state : '');
    const t = el.querySelector('[data-aidp-fresh-text]');
    if (t) t.textContent = text || '';
  }

  /** Paint tenant short name into <strong data-aidp-tenant-name></strong>. */
  function renderTenantBadge(selector) {
    const el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (!el) return;
    el.textContent = getTenantShort();
  }

  /* ─── Source toggle (Local | Live) ───────────────────── */

  /**
   * Wire a `<div class="aidp-source-toggle">` with two buttons.
   * Each button needs `data-aidp-source="local"` (or "live") and the
   * one to start active should carry `.active`.
   *
   * @param {string|HTMLElement} container - selector or element
   * @param {(source: string) => void} onChange - callback when user clicks
   * @returns {(source: string) => void} setter so the page can flip programmatically
   */
  function wireSourceToggle(container, onChange) {
    const root = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!root) return () => {};
    const set = (source) => {
      root.querySelectorAll('button[data-aidp-source]').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-aidp-source') === source);
      });
      if (typeof onChange === 'function') onChange(source);
    };
    root.querySelectorAll('button[data-aidp-source]').forEach(b => {
      b.addEventListener('click', () => set(b.getAttribute('data-aidp-source')));
    });
    return set;
  }

  /* ─── Filter rail ─────────────────────────────────────── */

  /**
   * Bind <select data-aidp-filter="domain"> elements into a state object.
   * On change, updates state[name] and invokes onChange(name, value, state).
   */
  function wireFilterRail(container, state, onChange) {
    const root = (typeof container === 'string') ? document.querySelector(container) : container;
    if (!root) return;
    root.querySelectorAll('[data-aidp-filter]').forEach(el => {
      const name = el.getAttribute('data-aidp-filter');
      /* Set initial value from state */
      if (state[name] != null) el.value = state[name];
      el.addEventListener('change', e => {
        state[name] = e.target.value;
        if (typeof onChange === 'function') onChange(name, e.target.value, state);
      });
    });
  }

  /* ─── Keyboard shortcuts ──────────────────────────────── */

  /**
   * Wire single-key shortcuts. Each entry: { key: 's', fn: () => loadSample(), label?: 'Load sample' }.
   * Ignored when the user is typing in INPUT/TEXTAREA/SELECT/contentEditable.
   * Modifier keys (Ctrl/Cmd/Alt) also bypass the handler · those belong to the OS/browser.
   *
   * Returns a disposer fn that removes the listener.
   */
  function wireKeyboardShortcuts(map, opts) {
    opts = opts || {};
    const visibleCheck = opts.isVisible || (() => true);
    const handler = (e) => {
      if (!visibleCheck()) return;
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = (e.key || '').toLowerCase();
      const match = map.find(m => m.key === k);
      if (match) {
        e.preventDefault();
        try { match.fn(); } catch (err) { console.warn('[Shortcut]', match.key, err); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }

  /* ─── Toast + error banner ────────────────────────────── */

  function toast(kind, title, message) {
    if (window.DI && window.DI.toast) {
      window.DI.toast({ kind, title, message });
    } else {
      const prefix = kind === 'err' ? '❌' : kind === 'warn' ? '⚠️' : kind === 'ok' ? '✅' : 'ℹ️';
      console.log(prefix, title, message || '');
    }
  }

  function showError(selector, msg) {
    const el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (!el) { toast('err', msg); return; }
    el.className = 'aidp-error';
    el.innerHTML = '<span class="ic">⚠</span><div>' + escapeHtml(msg) + '</div>';
    el.style.display = 'flex';
  }

  function clearError(selector) {
    const el = (typeof selector === 'string') ? document.querySelector(selector) : selector;
    if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  }

  /* ─── Handoff between studios ─────────────────────────── */

  /**
   * Store a handoff payload in localStorage and navigate to the target.
   * Target studios consume `localStorage.di_handoff_<studio>` on init.
   *
   *   sendToStudio('architecture', { capabilities, verdicts })
   *   sendToStudio('governance',   { actions, raid_items })
   */
  function sendToStudio(target, payload, options) {
    const opts = options || {};
    const slug = String(target).toLowerCase();
    const key = 'di_handoff_' + slug;
    const enriched = Object.assign({
      from:   opts.from || window.location.pathname.replace(/^\/|\.html$/g, ''),
      ts:     Date.now()
    }, payload || {});
    try { localStorage.setItem(key, JSON.stringify(enriched)); } catch (e) {
      toast('err', 'Handoff failed', 'Could not store payload: ' + e.message);
      return false;
    }
    if (opts.navigate !== false) {
      const path = opts.path || (slug + '-studio');
      const q = opts.query || ('from=' + (enriched.from || 'studio'));
      window.location.href = path + (q ? ('?' + q) : '');
    }
    return true;
  }

  /** Consume a handoff payload set by a prior studio. */
  function readHandoff(name) {
    try {
      const raw = localStorage.getItem('di_handoff_' + String(name).toLowerCase());
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  /** Clear a consumed handoff so it doesn't reappear on next load. */
  function clearHandoff(name) {
    try { localStorage.removeItem('di_handoff_' + String(name).toLowerCase()); } catch {}
  }

  /* ─── Download helpers ────────────────────────────────── */

  /** Trigger a Blob download with the given filename. */
  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  function downloadJson(filename, data) {
    const name = filename.endsWith('.json') ? filename : (filename + '.json');
    downloadBlob(name, new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  }

  /* ─── Expose ──────────────────────────────────────────── */

  window.AIDPStudio = {
    /* Formatting */
    escapeHtml, fmtFresh, isStale, fmtCurrency, fmtNumber, fmtDate, fmtDuration,
    /* Tenant */
    getUserEmail, getTenantShort,
    /* Render helpers */
    renderFreshnessPill, renderTenantBadge,
    /* Wiring */
    wireSourceToggle, wireFilterRail, wireKeyboardShortcuts,
    /* UX */
    toast, showError, clearError,
    /* Handoff */
    sendToStudio, readHandoff, clearHandoff,
    /* Downloads */
    downloadBlob, downloadJson
  };

  try { console.log('[AIDP] studio-shell v1 loaded'); } catch {}
})();
