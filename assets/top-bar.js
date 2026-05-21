/* ───────────────────────────────────────────────────────
   DI Platform · shared top bar with Features mega-menu (Phase 14a)
   Mount: any page just adds  <div data-di-topbar></div>
   then includes this script. The script replaces that node
   with the full top bar — logo, nav, Features ▾ mega-menu,
   ⌘K search, 🔔 bell, 🤖 Nishi button, user pill.

   Active-page highlight is derived from location.pathname.
═══════════════════════════════════════════════════════ */
(function () {
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Features catalog — single source of truth (kept in sync with feature-explainer.html)
  const FEATURES = [
    { id: 'rfp',          icon: '📝', name: 'RFP-style Q&A',        desc: 'Role + region aware questionnaires.',                 badge: 'LIVE' },
    { id: 'requirements', icon: '📋', name: 'AI Requirements',      desc: 'Drafts Technical · Business · Product · Regulatory.', badge: 'LIVE' },
    { id: 'discovery',    icon: '🔍', name: 'Discovery autofill',   desc: 'Dropdowns that learn your typed values.',             badge: 'LIVE' },
    { id: 'architecture', icon: '🏗', name: 'Architecture design',  desc: '7R-aligned architectures across 6 clouds.',           badge: 'LIVE' },
    { id: 'blockchain',   icon: '🪙', name: 'Blockchain & RWA',     desc: 'Tokenization & on-chain settlement patterns.',         badge: 'BETA' },
    { id: 'knowledge',    icon: '📚', name: 'Knowledge artifacts',  desc: 'RAG-backed institutional memory.',                     badge: 'BETA' },
    { id: 'export',       icon: '⬇',  name: 'Export reports',       desc: 'Markdown · JSON · MS Project · DR runbook.',          badge: 'LIVE' },
    { id: 'sevenr',       icon: '🔄', name: '7R migration planner', desc: 'Rehost · Replatform · Refactor · …',                  badge: 'LIVE', href: 'discovery-studio.html' }
  ];

  // Top-level navigation
  const NAV = [
    { label: 'Home',       href: 'home.html',           match: /^\/(home(\.html)?)?$/i },
    { label: 'Features',   isMega: true },
    { label: 'Library',    href: 'questionnaire.html',  match: /questionnaire/i },
    { label: 'Operations', href: 'operations.html',     match: /operations/i }
  ];

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function isActive(test) {
    if (!test) return false;
    const p = location.pathname.toLowerCase();
    if (test instanceof RegExp) return test.test(p);
    return p.indexOf(test) !== -1;
  }

  ready(function () {
    // Inject CSS once
    if (!document.getElementById('di-topbar-css')) {
      const css = document.createElement('style');
      css.id = 'di-topbar-css';
      css.textContent = `
        .di-tb{display:flex;align-items:center;justify-content:space-between;padding:11px 24px;background:#fff;border-bottom:1px solid var(--border,#E2E7F1);position:sticky;top:0;z-index:50;font-family:var(--f-ui,'Outfit',system-ui,sans-serif);color:var(--ink,#1A2238)}
        .di-tb-left{display:flex;align-items:center;gap:22px}
        .di-tb-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}
        .di-tb-logo{width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,var(--gold,#C8921A),var(--gold-3,#FFD070));color:var(--ink,#1A2238);font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;letter-spacing:.02em}
        .di-tb-name{font-size:14px;font-weight:700}
        .di-tb-name .muted{color:var(--ink-2,#5B6B8A);font-weight:400}
        .di-tb-nav{display:flex;gap:2px;font-size:13px;font-weight:600;align-items:center}
        .di-tb-nav a, .di-tb-nav button{color:var(--ink,#1A2238);padding:6px 12px;border-radius:8px;text-decoration:none;background:transparent;border:none;font:inherit;cursor:pointer;font-weight:600;display:inline-flex;align-items:center;gap:6px}
        .di-tb-nav a:hover, .di-tb-nav button:hover{background:var(--canvas,#F8FAFD);color:var(--gold,#C8921A)}
        .di-tb-nav a.act, .di-tb-nav button.act{background:var(--aglow,#FFF7E6);border:1px solid var(--gold-2,#E8AC38);color:var(--ink,#1A2238)}
        .di-tb-nav .caret{font-size:9px}
        .di-tb-right{display:flex;align-items:center;gap:8px}
        .di-tb-search{background:var(--canvas,#F8FAFD);border:1px solid var(--border,#E2E7F1);border-radius:8px;padding:6px 11px;font-size:11.5px;color:var(--ink-2,#5B6B8A);cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-family:inherit}
        .di-tb-search:hover{border-color:var(--gold,#C8921A);color:var(--gold,#C8921A)}
        .di-tb-search kbd{background:#fff;border:1px solid var(--border,#E2E7F1);border-radius:4px;padding:1px 5px;font-size:9.5px;font-family:var(--f-mono,monospace);color:var(--ink-2,#5B6B8A)}
        .di-tb-bell{position:relative;background:#fff;border:1px solid var(--border,#E2E7F1);border-radius:8px;padding:6px 10px;font-size:13px;cursor:pointer}
        .di-tb-bell .dot{position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:var(--red,#FF4D6A);border:1.5px solid #fff}
        .di-tb-nishi{background:var(--aglow,#FFF7E6);border:1px solid var(--gold-2,#E8AC38);color:var(--ink,#1A2238);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none}
        .di-tb-nishi:hover{background:var(--gold-3,#FFD070)}
        .di-tb-user{display:flex;align-items:center;gap:8px;padding:3px 6px 3px 11px;background:var(--canvas,#F8FAFD);border:1px solid var(--border,#E2E7F1);border-radius:999px;cursor:pointer;text-decoration:none;color:inherit}
        .di-tb-user:hover{border-color:var(--gold,#C8921A);background:#FFFCF4}
        .di-tb-user-meta{text-align:right;line-height:1.1}
        .di-tb-user-name{font-size:11.5px;font-weight:700;color:var(--ink,#1A2238)}
        .di-tb-user-sub{font-size:9.5px;color:var(--ink-2,#5B6B8A);margin-top:1px}
        .di-tb-avatar{width:28px;height:28px;border-radius:50%;background:var(--ink,#1A2238);color:var(--gold-3,#FFD070);font-weight:700;font-size:10.5px;display:flex;align-items:center;justify-content:center}

        /* Mega menu */
        .di-mega{display:none;position:absolute;top:54px;left:0;right:0;background:#fff;border-bottom:1px solid var(--border,#E2E7F1);box-shadow:0 18px 38px -10px rgba(20,33,58,.15);z-index:48;animation:di-mega-in .2s ease}
        .di-mega.open{display:block}
        @keyframes di-mega-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .di-mega-wrap{max-width:1200px;margin:0 auto;padding:22px 28px;display:grid;grid-template-columns:220px 1fr 260px;gap:24px}
        .di-mega-intro{padding-right:14px;border-right:1px solid var(--border,#E2E7F1)}
        .di-mega-intro .eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--gold,#C8921A);text-transform:uppercase;margin-bottom:6px}
        .di-mega-intro h2{font-family:var(--f-head,Georgia,serif);font-size:18px;font-weight:600;line-height:1.2;color:var(--ink,#1A2238);margin:0 0 8px}
        .di-mega-intro p{font-size:11.5px;color:var(--ink-2,#5B6B8A);line-height:1.55;margin:0}
        .di-mega-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;align-self:start}
        .di-mega-card{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:9px;text-decoration:none;color:inherit;cursor:pointer}
        .di-mega-card:hover{background:var(--aglow,#FFF7E6)}
        .di-mega-card .ic{width:32px;height:32px;border-radius:8px;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,#FFF7E6,#FFE7B3);color:var(--gold,#C8921A)}
        .di-mega-card .bd{min-width:0}
        .di-mega-card .bd .name{font-size:12.5px;font-weight:700;color:var(--ink,#1A2238);display:flex;align-items:center;gap:6px}
        .di-mega-card .bd .badge{font-size:8.5px;font-weight:700;letter-spacing:.04em;padding:1px 6px;border-radius:99px}
        .di-mega-card .bd .badge.LIVE{background:var(--green-bg,#E8FBF4);color:#0A8462}
        .di-mega-card .bd .badge.BETA{background:var(--aglow,#FFF7E6);color:var(--gold,#C8921A)}
        .di-mega-card .bd .desc{font-size:10.5px;color:var(--ink-2,#5B6B8A);margin-top:2px;line-height:1.4}
        .di-mega-spot{padding-left:14px;border-left:1px solid var(--border,#E2E7F1)}
        .di-mega-spot .eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;color:var(--gold,#C8921A);text-transform:uppercase;margin-bottom:6px}
        .di-mega-spot .item{display:block;background:var(--ink,#1A2238);color:#fff;border-radius:11px;padding:14px;margin-bottom:8px;text-decoration:none}
        .di-mega-spot .item .lbl{font-size:9.5px;font-weight:700;color:var(--gold-3,#FFD070);letter-spacing:.08em;margin-bottom:3px}
        .di-mega-spot .item .h{font-size:12.5px;font-weight:600;line-height:1.4}
        .di-mega-spot .item .sub{font-size:10.5px;color:#8AA4C8;margin-top:3px}
        .di-mega-spot .alt{background:#FFFCF4;border:1px solid var(--gold-2,#E8AC38);color:var(--ink,#1A2238);display:block;border-radius:11px;padding:14px;text-decoration:none}
        .di-mega-spot .alt .lbl{color:var(--gold,#C8921A)}
        .di-mega-spot .alt .sub{color:var(--ink-2,#5B6B8A)}

        @media (max-width:1000px){
          .di-tb-search{display:none}
          .di-mega-wrap{grid-template-columns:1fr;gap:14px}
          .di-mega-intro,.di-mega-spot{border:none;padding:0}
          .di-mega-grid{grid-template-columns:1fr}
        }
        @media (max-width:720px){
          .di-tb-nav a:not(.act):not(.di-features),.di-tb-bell{display:none}
          .di-tb-user-meta{display:none}
        }
      `;
      document.head.appendChild(css);
    }

    // Build the top bar HTML
    function makeNav() {
      return NAV.map(item => {
        const active = item.match && isActive(item.match);
        if (item.isMega) {
          return '<button type="button" class="di-features ' + (active ? 'act' : '') + '" id="di-features-btn" aria-haspopup="true" aria-expanded="false">Features <span class="caret">▾</span></button>';
        }
        return '<a href="' + item.href + '" class="' + (active ? 'act' : '') + '">' + escapeHTML(item.label) + '</a>';
      }).join('');
    }

    function makeMega() {
      const cards = FEATURES.map(f => {
        const href = f.href || ('feature-explainer.html?feature=' + f.id);
        return '<a class="di-mega-card" href="' + href + '">' +
          '<div class="ic">' + f.icon + '</div>' +
          '<div class="bd"><div class="name">' + escapeHTML(f.name) + ' <span class="badge ' + f.badge + '">' + f.badge + '</span></div><div class="desc">' + escapeHTML(f.desc) + '</div></div>' +
        '</a>';
      }).join('');

      return '<div class="di-mega" id="di-mega" role="menu">' +
        '<div class="di-mega-wrap">' +
          '<div class="di-mega-intro">' +
            '<div class="eyebrow">FEATURES</div>' +
            '<h2>Everything Nishi can do, in one place.</h2>' +
            '<p>Each card opens an animated walkthrough so you can see the feature in action before opening the workspace.</p>' +
          '</div>' +
          '<div class="di-mega-grid">' + cards + '</div>' +
          '<div class="di-mega-spot">' +
            '<div class="eyebrow">SPOTLIGHT</div>' +
            '<a class="item" href="nishi-chatbot.html"><div class="lbl">NEW IN PHASE 13</div><div class="h">Nishi can now talk — hold-to-talk mic in chat.</div><div class="sub">Try it →</div></a>' +
            '<a class="alt" href="#"><div class="lbl">CASE STUDY</div><div class="h">Tier-1 bank: 38% mainframe footprint cut</div><div class="sub">Open the read-out →</div></a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function readProfile() {
      try { return JSON.parse(sessionStorage.getItem('di_account_profile') || 'null'); }
      catch (e) { return null; }
    }

    function buildTopbar() {
      const profile = readProfile();
      const first = (profile && profile.firstName) || (profile && profile.name && profile.name.split(' ')[0]) || 'Guest';
      const name = (profile && profile.name) || 'Sign in';
      const role = (profile && profile.role) || 'Not signed in';
      const initials = (profile && profile.initials) ||
                       ((profile && profile.firstName && profile.lastName)
                          ? (profile.firstName[0] + profile.lastName[0]).toUpperCase()
                          : (profile && profile.name ? profile.name.slice(0,2).toUpperCase() : '?'));

      const userHref = profile ? 'home.html' : 'index.html';

      const tb = document.createElement('header');
      tb.className = 'di-tb';
      tb.innerHTML =
        '<div class="di-tb-left">' +
          '<a class="di-tb-brand" href="home.html"><div class="di-tb-logo">DI</div><div class="di-tb-name">Digital Infotech <span class="muted">· Platform</span></div></a>' +
          '<nav class="di-tb-nav">' + makeNav() + '</nav>' +
        '</div>' +
        '<div class="di-tb-right">' +
          '<button type="button" class="di-tb-search" title="Global search (Phase 18.2)">🔍 Search anything <kbd>⌘K</kbd></button>' +
          '<button type="button" class="di-tb-bell" title="Notifications">🔔<span class="dot"></span></button>' +
          '<a class="di-tb-nishi" href="nishi-chatbot.html">🤖 Nishi</a>' +
          '<a class="di-tb-user" href="' + userHref + '">' +
            '<div class="di-tb-user-meta"><div class="di-tb-user-name">' + escapeHTML(name) + '</div><div class="di-tb-user-sub">' + escapeHTML(role) + '</div></div>' +
            '<div class="di-tb-avatar">' + escapeHTML(initials) + '</div>' +
          '</a>' +
        '</div>';
      return tb;
    }

    // Mount: replace any [data-di-topbar] placeholder with the real bar.
    // Also append the mega-menu sibling and wire interactions.
    function mount() {
      const placeholders = document.querySelectorAll('[data-di-topbar]');
      if (!placeholders.length) return;
      placeholders.forEach(ph => {
        const bar  = buildTopbar();
        const mega = document.createRange().createContextualFragment(makeMega()).firstChild;
        ph.replaceWith(bar);
        bar.parentNode.insertBefore(mega, bar.nextSibling);

        // Wire mega-menu toggle
        const btn  = bar.querySelector('#di-features-btn');
        const menu = mega;   // div.di-mega
        if (btn && menu) {
          btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const open = menu.classList.toggle('open');
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          });
          document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
              menu.classList.remove('open');
              btn.setAttribute('aria-expanded', 'false');
            }
          });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
              menu.classList.remove('open');
              btn.setAttribute('aria-expanded', 'false');
            }
          });
        }

        // Wire search button (placeholder — full ⌘K palette is Phase 18.2)
        const searchBtn = bar.querySelector('.di-tb-search');
        if (searchBtn) searchBtn.addEventListener('click', function () {
          if (window.DI && window.DI.toast) {
            window.DI.toast({ kind:'info', title:'Search', message:'Global search (⌘K) ships in Phase 18.2.' });
          }
        });

        // Bell placeholder
        const bell = bar.querySelector('.di-tb-bell');
        if (bell) bell.addEventListener('click', function () {
          if (window.DI && window.DI.toast) {
            window.DI.toast({ kind:'info', title:'Notifications', message:'Activity feed ships with Phase 18.4.' });
          }
        });
      });
    }

    mount();
  });
})();
