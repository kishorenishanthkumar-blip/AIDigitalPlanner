/* ═══════════════════════════════════════════════════════
   DI Platform · Phase 18.3 + 18.4
   Keyboard shortcuts overlay (?) + font-size & high-contrast controls.

   Public API:
     window.DI.shortcuts.show()           // open the overlay
     window.DI.a11y.setFontScale(n)       // 0.875 / 1 / 1.125 / 1.25
     window.DI.a11y.toggleHighContrast()
═══════════════════════════════════════════════════════ */
(function () {
  if (window.DI && window.DI.shortcuts) return;
  window.DI = window.DI || {};

  /* ── A11y preferences (font scale + high contrast) ──── */
  const A11Y_KEY = 'di_a11y_v1';
  function loadA11y() {
    try { return Object.assign({ fontScale: 1, highContrast: false }, JSON.parse(localStorage.getItem(A11Y_KEY) || '{}')); }
    catch (e) { return { fontScale: 1, highContrast: false }; }
  }
  function saveA11y(s) { try { localStorage.setItem(A11Y_KEY, JSON.stringify(s)); } catch (e) {} }
  function applyA11y(s) {
    const html = document.documentElement;
    html.style.fontSize = (Math.round(13.5 * (s.fontScale || 1) * 100) / 100) + 'px';
    if (s.highContrast) html.classList.add('di-hc'); else html.classList.remove('di-hc');
  }

  window.DI.a11y = {
    setFontScale: function (n) {
      const s = loadA11y(); s.fontScale = n; saveA11y(s); applyA11y(s);
      if (window.DI.toast) window.DI.toast({ kind: 'ok', title: 'Font size', message: 'Set to ' + Math.round(n * 100) + '%.', duration: 1800 });
    },
    toggleHighContrast: function () {
      const s = loadA11y(); s.highContrast = !s.highContrast; saveA11y(s); applyA11y(s);
      if (window.DI.toast) window.DI.toast({ kind: 'ok', title: 'High contrast', message: s.highContrast ? 'Enabled' : 'Disabled', duration: 1800 });
    },
    get: loadA11y
  };

  // Apply on load
  applyA11y(loadA11y());

  // Inject high-contrast CSS once
  if (!document.getElementById('di-hc-css')) {
    const css = document.createElement('style');
    css.id = 'di-hc-css';
    css.textContent = `
      .di-hc{background:#fff !important}
      .di-hc body{background:#fff !important;color:#000 !important}
      .di-hc :root{--canvas:#FFFFFF;--canvas-2:#FFFFFF;--card:#FFFFFF;--ink:#000000;--ink-2:#000000;--ink-3:#222222;--border:#000000;--border-2:#000000}
      .di-hc *{border-color:#000 !important}
      .di-hc a,.di-hc button{outline:1px solid transparent}
      .di-hc a:focus,.di-hc button:focus,.di-hc input:focus,.di-hc select:focus,.di-hc textarea:focus{outline:3px solid #000 !important;outline-offset:2px}
    `;
    document.head.appendChild(css);
  }

  /* ── Shortcuts cheat sheet ──────────────────────────── */
  const SHORTCUTS = {
    'Navigation': [
      ['Ctrl + K', 'Open command palette'],
      ['?',        'Show this shortcuts cheat sheet'],
      ['Esc',      'Close any open modal'],
      ['g h',      'Go to Home'],
      ['g n',      'Go to Nishi'],
      ['g d',      'Go to Discovery Studio'],
      ['g a',      'Go to Architecture Studio'],
      ['g e',      'Go to EVP Summary'],
      ['g s',      'Go to Draft SOW'],
      ['g g',      'Go to Program Governance'],
      ['g o',      'Go to Operations']
    ],
    'Inside pages': [
      ['Enter',          'Submit form / send chat'],
      ['Shift + Enter',  'Newline in chat input'],
      ['Hold 🎤',         'Talk to Nishi (Web Speech)'],
      ['Tab',            'Move to next field'],
      ['Shift + Tab',    'Move to previous field']
    ],
    'Accessibility': [
      ['A−',  'Decrease font size'],
      ['A+',  'Increase font size'],
      ['H',   'Toggle high-contrast mode (when overlay is open)']
    ]
  };

  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function show() {
    let host = document.getElementById('di-shortcuts-modal');
    if (host) host.remove();
    host = document.createElement('div');
    host.id = 'di-shortcuts-modal';

    const a11y = loadA11y();
    const scale = Math.round((a11y.fontScale || 1) * 100);

    let groupsHtml = '';
    Object.keys(SHORTCUTS).forEach(g => {
      groupsHtml += '<div class="grp"><div class="grp-h">' + g + '</div>' +
        SHORTCUTS[g].map(s => '<div class="row"><kbd>' + escapeHTML(s[0]) + '</kbd><span>' + escapeHTML(s[1]) + '</span></div>').join('') + '</div>';
    });

    host.innerHTML =
      '<style>' +
      '#di-shortcuts-modal{position:fixed;inset:0;background:rgba(20,33,58,.45);display:flex;align-items:center;justify-content:center;z-index:99980;font-family:\'Outfit\',system-ui,sans-serif}' +
      '#di-shortcuts-modal .box{background:#fff;border-radius:14px;max-width:680px;width:92vw;max-height:80vh;overflow-y:auto;padding:22px 26px;box-shadow:0 32px 80px -16px rgba(20,33,58,.4)}' +
      '#di-shortcuts-modal h3{font-family:\'Fraunces\',Georgia,serif;font-size:18px;color:#1A2238;font-weight:600;margin-bottom:6px}' +
      '#di-shortcuts-modal .sub{font-size:11.5px;color:#5B6B8A;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #E2E7F1}' +
      '#di-shortcuts-modal .grp{margin-bottom:18px}' +
      '#di-shortcuts-modal .grp-h{font-size:10px;font-weight:700;letter-spacing:.1em;color:#C8921A;text-transform:uppercase;margin-bottom:8px}' +
      '#di-shortcuts-modal .row{display:flex;justify-content:space-between;align-items:center;padding:5px 0}' +
      '#di-shortcuts-modal kbd{background:#F8FAFD;border:1px solid #E2E7F1;border-radius:6px;padding:3px 9px;font-family:\'JetBrains Mono\',monospace;font-size:11px;color:#1A2238}' +
      '#di-shortcuts-modal .row span{font-size:12px;color:#1A2238}' +
      '#di-shortcuts-modal .a11y{margin-top:18px;padding-top:14px;border-top:1px solid #E2E7F1}' +
      '#di-shortcuts-modal .a11y-h{font-size:10px;font-weight:700;letter-spacing:.1em;color:#C8921A;text-transform:uppercase;margin-bottom:10px}' +
      '#di-shortcuts-modal .a11y-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px dashed #E2E7F1}' +
      '#di-shortcuts-modal .a11y-row:last-child{border-bottom:none}' +
      '#di-shortcuts-modal .a11y-row .ctrl{display:flex;gap:5px}' +
      '#di-shortcuts-modal .a11y-row .ctrl button{background:#fff;border:1px solid #E2E7F1;border-radius:7px;padding:5px 11px;font-size:11.5px;color:#1A2238;cursor:pointer;font-family:inherit;font-weight:600}' +
      '#di-shortcuts-modal .a11y-row .ctrl button:hover{border-color:#C8921A;color:#C8921A}' +
      '#di-shortcuts-modal .a11y-row .ctrl button.act{background:#FFF7E6;border-color:#E8AC38;color:#1A2238}' +
      '#di-shortcuts-modal .close{margin-top:14px;background:#C8921A;color:#fff;border:none;border-radius:9px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;float:right;font-family:inherit}' +
      '</style>' +
      '<div class="box">' +
        '<h3>⌨ Keyboard shortcuts</h3>' +
        '<div class="sub">Power-user shortcuts. Press <kbd>?</kbd> from anywhere to reopen this. Press <kbd>Esc</kbd> to close.</div>' +
        groupsHtml +
        '<div class="a11y">' +
          '<div class="a11y-h">Accessibility</div>' +
          '<div class="a11y-row"><span style="font-size:12px">Font size</span><div class="ctrl">' +
            '<button onclick="window.DI.a11y.setFontScale(0.875);refreshSc()"' + (scale === 88 ? ' class="act"' : '') + '>A−</button>' +
            '<button onclick="window.DI.a11y.setFontScale(1);refreshSc()"'    + (scale === 100 ? ' class="act"' : '') + '>A</button>' +
            '<button onclick="window.DI.a11y.setFontScale(1.125);refreshSc()"'+ (scale === 113 ? ' class="act"' : '') + '>A+</button>' +
            '<button onclick="window.DI.a11y.setFontScale(1.25);refreshSc()"' + (scale === 125 ? ' class="act"' : '') + '>A++</button>' +
            '<span style="font-size:11px;color:#5B6B8A;margin-left:8px;align-self:center">' + scale + '%</span>' +
          '</div></div>' +
          '<div class="a11y-row"><span style="font-size:12px">High contrast</span><div class="ctrl">' +
            '<button onclick="window.DI.a11y.toggleHighContrast();refreshSc()" ' + (a11y.highContrast ? 'class="act"' : '') + '>' + (a11y.highContrast ? 'On' : 'Off') + '</button>' +
          '</div></div>' +
          '<div class="a11y-row"><span style="font-size:12px">Reduce motion</span><span style="font-size:11px;color:#5B6B8A">Respected from OS · <code style="font-family:JetBrains Mono,monospace;font-size:10.5px">prefers-reduced-motion</code></span></div>' +
        '</div>' +
        '<button class="close" onclick="document.getElementById(\'di-shortcuts-modal\').remove()">Close</button>' +
      '</div>';

    host.addEventListener('click', e => { if (e.target === host) host.remove(); });
    document.body.appendChild(host);

    // Re-render shortcuts overlay (used after a11y change)
    window.refreshSc = function () {
      document.getElementById('di-shortcuts-modal').remove();
      show();
    };
  }

  /* Listen for `?` key — opens overlay. Listen for `g X` sequences for nav shortcuts. */
  let gPending = false;
  let gTimer = null;
  document.addEventListener('keydown', function (e) {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    const editing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
    if (editing) return;

    // ? opens cheat sheet
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      show();
      return;
    }

    // g X navigation sequences
    if (gPending) {
      const map = { h:'home.html', n:'nishi-chatbot.html', d:'discovery-studio.html', a:'architecture-studio.html', e:'evp-summary.html', s:'sow.html', g:'program-governance.html', q:'questionnaire.html', o:'operations.html', r:'requirements.html', k:'actions.html', b:'blockchain-rwa.html', w:'knowledge.html', i:'iac.html' };
      if (map[e.key]) { e.preventDefault(); location.href = map[e.key]; }
      gPending = false;
      clearTimeout(gTimer);
      return;
    }
    if (e.key === 'g') {
      gPending = true;
      clearTimeout(gTimer);
      gTimer = setTimeout(() => { gPending = false; }, 900);
    }
  });

  window.DI.shortcuts = { show };
})();
