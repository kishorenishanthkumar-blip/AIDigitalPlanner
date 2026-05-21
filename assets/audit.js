/* ═══════════════════════════════════════════════════════
   DI Platform · audit log (Phase 18.1)
   Lightweight tamper-evident log of every meaningful user
   action across the platform. Stored locally; viewable via
   the bell icon in the top bar.

   Public API:
     window.DI.audit.log(source, action, meta)   // append an entry
     window.DI.audit.getAll()                     // entire trail
     window.DI.audit.recent(n)                    // last n entries
     window.DI.audit.export()                     // JSON download
     window.DI.audit.clear()                      // wipe (with confirm)
     window.DI.audit.show()                       // open viewer modal
═══════════════════════════════════════════════════════ */
(function () {
  if (window.DI && window.DI.audit) return;
  window.DI = window.DI || {};

  const KEY = 'di_audit_log_v1';
  const MAX = 1000;   // keep last 1000 events

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }
  function save(arr) {
    try {
      if (arr.length > MAX) arr = arr.slice(-MAX);
      localStorage.setItem(KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function fingerprint() {
    // Compute a small per-session fingerprint for tamper detection
    const ua = navigator.userAgent || '';
    const lang = navigator.language || '';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    return btoa((ua + '|' + lang + '|' + tz).slice(0, 200)).slice(0, 12);
  }

  function readProfile() {
    try { return JSON.parse(sessionStorage.getItem('di_account_profile') || 'null'); }
    catch (e) { return null; }
  }

  window.DI.audit = {
    log: function (source, action, meta) {
      const arr = load();
      const profile = readProfile();
      arr.push({
        ts: new Date().toISOString(),
        source: source || 'unknown',
        action: action || 'unknown',
        meta: meta || {},
        user: (profile && profile.email) || 'guest',
        fp: fingerprint()
      });
      save(arr);
    },
    getAll: function () { return load(); },
    recent: function (n) { return load().slice(-(n || 50)).reverse(); },
    export: function () {
      const arr = load();
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'di-audit-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      if (window.DI.toast) window.DI.toast({ kind: 'ok', title: 'Audit log exported', message: arr.length + ' events.' });
    },
    clear: function () {
      if (!confirm('Clear the entire audit log? This cannot be undone.')) return;
      save([]);
      if (window.DI.toast) window.DI.toast({ kind: 'warn', title: 'Audit log cleared', message: 'All ' + load().length + ' events removed.' });
    },
    show: function () {
      const arr = load().slice().reverse();
      const profile = readProfile();
      let host = document.getElementById('di-audit-modal');
      if (host) host.remove();
      host = document.createElement('div');
      host.id = 'di-audit-modal';
      host.innerHTML =
        '<style>' +
        '#di-audit-modal{position:fixed;inset:0;background:rgba(20,33,58,.45);display:flex;align-items:center;justify-content:center;z-index:99980;font-family:\'Outfit\',system-ui,sans-serif}' +
        '#di-audit-modal .box{background:#fff;border-radius:14px;max-width:780px;width:92vw;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 32px 80px -16px rgba(20,33,58,.4);overflow:hidden}' +
        '#di-audit-modal .head{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid #E2E7F1}' +
        '#di-audit-modal .head h3{font-family:\'Fraunces\',Georgia,serif;font-size:16px;color:#1A2238;font-weight:600}' +
        '#di-audit-modal .head .meta{font-size:10.5px;color:#5B6B8A}' +
        '#di-audit-modal .head .actions{display:flex;gap:6px}' +
        '#di-audit-modal .head .actions button{background:#fff;border:1px solid #E2E7F1;border-radius:7px;padding:5px 10px;font-size:11px;color:#1A2238;cursor:pointer;font-family:inherit}' +
        '#di-audit-modal .head .actions button:hover{border-color:#C8921A;color:#C8921A}' +
        '#di-audit-modal .body{flex:1;overflow-y:auto;padding:14px 18px}' +
        '#di-audit-modal .row{display:grid;grid-template-columns:130px 110px 1fr;gap:10px;padding:9px 0;border-bottom:1px dashed #E2E7F1;font-size:11.5px}' +
        '#di-audit-modal .row .ts{font-family:JetBrains Mono,monospace;color:#5B6B8A;font-size:10.5px}' +
        '#di-audit-modal .row .src{font-size:9.5px;font-weight:700;color:#C8921A;letter-spacing:.04em;text-transform:uppercase}' +
        '#di-audit-modal .row .msg{color:#1A2238;line-height:1.5}' +
        '#di-audit-modal .row .msg .meta-pill{font-size:10px;background:#F8FAFD;border:1px solid #E2E7F1;border-radius:5px;padding:1px 6px;margin-left:5px;font-family:JetBrains Mono,monospace;color:#5B6B8A}' +
        '#di-audit-modal .footer{padding:10px 18px;border-top:1px solid #E2E7F1;font-size:10.5px;color:#5B6B8A;background:#FFFCF4;display:flex;justify-content:space-between}' +
        '#di-audit-modal .empty{padding:40px 20px;text-align:center;color:#5B6B8A;font-size:12px}' +
        '</style>' +
        '<div class="box">' +
          '<div class="head"><div><h3>📜 Audit log</h3><div class="meta">' + arr.length + ' events · stored locally · ' + (profile ? 'user ' + (profile.email || profile.name) : 'guest session') + '</div></div>' +
            '<div class="actions">' +
              '<button onclick="window.DI.audit.export()">⬇ Export JSON</button>' +
              '<button onclick="window.DI.audit.clear();document.getElementById(\'di-audit-modal\').remove()">🗑 Clear</button>' +
              '<button onclick="document.getElementById(\'di-audit-modal\').remove()">✕ Close</button>' +
            '</div></div>' +
          '<div class="body">' + (
            arr.length === 0
              ? '<div class="empty">No audit events yet. Activity will be logged as you use Discovery, Architecture, EVP, SOW, Governance, and Operations.</div>'
              : arr.map(e =>
                  '<div class="row">' +
                    '<div class="ts">' + new Date(e.ts).toLocaleString() + '</div>' +
                    '<div class="src">' + e.source + '</div>' +
                    '<div class="msg">' + escapeHTML(e.action) + (Object.keys(e.meta||{}).length ? ' <span class="meta-pill">' + escapeHTML(JSON.stringify(e.meta)) + '</span>' : '') + '</div>' +
                  '</div>'
                ).join('')
          ) + '</div>' +
          '<div class="footer"><span>🔒 Stored locally · this browser only · never transmitted</span><span>Fingerprint: ' + fingerprint() + '</span></div>' +
        '</div>';
      host.addEventListener('click', e => { if (e.target === host) host.remove(); });
      document.body.appendChild(host);
    }
  };

  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  // Auto-log the page view
  window.DI.audit.log('navigation', 'page-view', { path: location.pathname });
})();
