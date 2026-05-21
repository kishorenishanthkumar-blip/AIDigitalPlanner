/* ───────────────────────────────────────────────────────
   DI Platform · shared toast notifications (Phase 14a)
   Auto-mounts a host on body, exposes window.DI.toast(...).
   Variants: info | ok | warn | err
═══════════════════════════════════════════════════════ */
(function() {
  if (window.DI && window.DI._toastReady) return;   // idempotent

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function() {
    // Inject CSS (scoped via .di-toast-* prefix)
    if (!document.getElementById('di-toast-css')) {
      const css = document.createElement('style');
      css.id = 'di-toast-css';
      css.textContent = `
        .di-toast-host{position:fixed;top:14px;right:14px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:380px;font-family:'Outfit',system-ui,sans-serif}
        .di-toast{pointer-events:auto;background:#1A2238;color:#EEF4FF;border-radius:10px;padding:11px 14px;font-size:12.5px;box-shadow:0 18px 38px -10px rgba(20,33,58,.45),0 0 0 1px rgba(200,146,26,.15);display:flex;gap:10px;align-items:flex-start;border-left:3px solid #C8921A;animation:di-toast-in .25s ease;line-height:1.45;min-width:260px}
        .di-toast.di-info{border-left-color:#3D8EFF}
        .di-toast.di-ok  {border-left-color:#0FD49A}
        .di-toast.di-warn{border-left-color:#FFAB00}
        .di-toast.di-err {border-left-color:#FF4D6A}
        .di-toast .di-ic{flex-shrink:0;font-size:14px;line-height:1}
        .di-toast .di-bd{flex:1;min-width:0}
        .di-toast .di-bd .di-tt{font-weight:700;color:#FFD070;font-size:12px;margin-bottom:1px;letter-spacing:.01em}
        .di-toast .di-bd .di-ms{color:#C8D2E2;font-size:11.5px;line-height:1.5;word-wrap:break-word}
        .di-toast .di-cl{background:transparent;border:none;color:#8AA4C8;font-size:14px;cursor:pointer;line-height:1;padding:0 2px;margin-left:4px}
        .di-toast .di-cl:hover{color:#FFD070}
        .di-toast.di-action{padding-bottom:8px}
        .di-toast .di-bd .di-actions{margin-top:8px;display:flex;gap:5px}
        .di-toast .di-bd .di-actions button{background:rgba(200,146,26,.18);border:1px solid #C8921A;color:#FFD070;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit}
        .di-toast .di-bd .di-actions button:hover{background:#C8921A;color:#1A2238}
        @keyframes di-toast-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes di-toast-out{to{opacity:0;transform:translateX(20px)}}
      `;
      document.head.appendChild(css);
    }

    // Mount host
    let host = document.querySelector('.di-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.className = 'di-toast-host';
      host.setAttribute('aria-live', 'polite');
      host.setAttribute('aria-atomic', 'true');
      document.body.appendChild(host);
    }

    window.DI = window.DI || {};
    window.DI._toastReady = true;

    window.DI.toast = function(opts) {
      const o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      const kind = o.kind || 'info';
      const titles = { info:'Notification', ok:'Success', warn:'Heads up', err:'Error' };
      const icons  = { info:'ℹ', ok:'✓', warn:'⚠', err:'✕' };
      const title = o.title || titles[kind] || 'Notification';
      const icon  = o.icon  || icons[kind]  || 'ℹ';
      const msg   = o.message || '';
      const dur   = (typeof o.duration === 'number') ? o.duration : 4500;
      const actions = o.actions || [];   // [{label, onClick}]

      const el = document.createElement('div');
      el.className = 'di-toast di-' + kind + (actions.length ? ' di-action' : '');
      const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
      el.innerHTML =
        '<div class="di-ic">' + escapeHTML(icon) + '</div>' +
        '<div class="di-bd"><div class="di-tt">' + escapeHTML(title) + '</div><div class="di-ms">' + escapeHTML(msg) + '</div>' +
          (actions.length
            ? '<div class="di-actions">' + actions.map((a,i) => '<button data-i="' + i + '">' + escapeHTML(a.label) + '</button>').join('') + '</div>'
            : '') +
        '</div>' +
        '<button class="di-cl" aria-label="Dismiss">×</button>';

      el.querySelector('.di-cl').addEventListener('click', () => window.DI.closeToast(el));
      actions.forEach((a, i) => {
        const btn = el.querySelector('button[data-i="' + i + '"]');
        if (btn) btn.addEventListener('click', () => {
          try { a.onClick && a.onClick(); } catch (e) { console.warn(e); }
          window.DI.closeToast(el);
        });
      });

      host.appendChild(el);
      if (dur > 0) setTimeout(() => window.DI.closeToast(el), dur);
      return el;
    };

    window.DI.closeToast = function(el) {
      if (!el || !el.parentNode) return;
      el.style.animation = 'di-toast-out .2s ease forwards';
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 220);
    };
  });
})();
