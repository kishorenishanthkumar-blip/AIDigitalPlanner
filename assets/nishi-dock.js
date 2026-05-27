/* ───────────────────────────────────────────────────────
   Persistent Niche-I dock — Phase 13
   Drops a floating "🤖 Niche-I" button at bottom-right of any
   page that includes this script. Clicking opens Niche-I.
   Auto-hides on the Niche-I chat page itself.
═══════════════════════════════════════════════════════ */
(function() {
  // Don't render the dock on the Niche-I chat page itself
  const onNicheIPage = /nishi-chatbot\.html/i.test(location.pathname);
  if (onNicheIPage) return;

  // Wait for DOM ready
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function() {
    // Style block (scoped via unique class names)
    if (!document.getElementById('nishi-dock-css')) {
      const css = document.createElement('style');
      css.id = 'nishi-dock-css';
      css.textContent = `
        .nd-host{position:fixed;bottom:22px;right:22px;z-index:99990;display:flex;flex-direction:column;align-items:flex-end;gap:10px;font-family:'Outfit',system-ui,sans-serif}
        .nd-tip{background:#fff;border:1px solid #E2E7F1;border-radius:14px;padding:11px 13px;box-shadow:0 18px 38px -10px rgba(20,33,58,.18);max-width:260px;font-size:12px;color:#1A2238;line-height:1.5;animation:ndIn .3s ease;position:relative}
        .nd-tip .nd-x{position:absolute;top:5px;right:7px;background:transparent;border:none;color:#9AA6BE;font-size:14px;cursor:pointer;padding:2px}
        .nd-tip .nd-x:hover{color:#1A2238}
        .nd-tip strong{color:#C8921A}
        .nd-fab{width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#C8921A,#FFD070);border:none;color:#1A2238;font-size:22px;cursor:pointer;box-shadow:0 12px 32px -8px rgba(200,146,26,.55);position:relative;transition:.2s}
        .nd-fab:hover{transform:scale(1.06)}
        .nd-fab .nd-online{position:absolute;top:2px;right:2px;width:11px;height:11px;border-radius:50%;background:#0FD49A;border:2px solid #fff}
        .nd-pop{font-size:9.5px;font-weight:700;color:#fff;background:#1A2238;border-radius:99px;padding:2px 7px;position:absolute;top:-4px;left:-6px;letter-spacing:.04em}
        @keyframes ndIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @media (max-width:640px){.nd-host{bottom:14px;right:14px} .nd-tip{max-width:200px;font-size:11px}}
      `;
      document.head.appendChild(css);
    }

    // Build dock
    const host = document.createElement('div');
    host.className = 'nd-host';

    // Contextual tip (random pick from a small set)
    const tips = [
      'Need help with this page? Ask me anything — I can talk too.',
      'Tap me to get a 60-second tour of any feature.',
      'I can draft RAID items, RFP answers, and migration backlogs.',
      'Lost? I remember every feature on this platform.',
    ];
    const tipText = tips[Math.floor(Math.random() * tips.length)];
    const tipDismissed = sessionStorage.getItem('nd_tip_dismissed') === '1';

    host.innerHTML =
      (tipDismissed ? '' :
        '<div class="nd-tip" id="nd-tip">' +
          '<button class="nd-x" id="nd-x" title="Dismiss">×</button>' +
          '💡 <strong>Niche-I:</strong> ' + tipText +
        '</div>'
      ) +
      '<button class="nd-fab" id="nd-fab" title="Open Niche-I">' +
        '<span class="nd-pop">AI</span>' +
        '🤖' +
        '<span class="nd-online"></span>' +
      '</button>';

    document.body.appendChild(host);

    // Wire up
    document.getElementById('nd-fab').addEventListener('click', function() {
      location.href = 'nishi-chatbot.html?from=' + encodeURIComponent(location.pathname);
    });
    const x = document.getElementById('nd-x');
    if (x) {
      x.addEventListener('click', function(e) {
        e.stopPropagation();
        const tip = document.getElementById('nd-tip');
        if (tip) tip.remove();
        sessionStorage.setItem('nd_tip_dismissed', '1');
      });
    }
  });
})();
