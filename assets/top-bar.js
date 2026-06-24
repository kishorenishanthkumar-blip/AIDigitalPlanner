/* ───────────────────────────────────────────────────────
   DI Platform · shared top bar with Features mega-menu (Phase 14a)
   Mount: any page just adds  <div data-di-topbar></div>
   then includes this script. The script replaces that node
   with the full top bar — logo, nav, Features ▾ mega-menu,
   ⌘K search, 🔔 bell, 🤖 Niche-I button, user pill.

   Active-page highlight is derived from location.pathname.
═══════════════════════════════════════════════════════ */
(function () {
  /* App-wide: load the select enhancer (checkbox dropdowns + bulk select)
     on every page that includes the top bar. */
  try {
    if (!window.__aidpSelectEnhanceLoaded) {
      window.__aidpSelectEnhanceLoaded = true;
      var se = document.createElement('script');
      se.src = 'assets/select-enhance.js';
      document.head.appendChild(se);
    }
  } catch (e) {}

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  // Features catalog — single source of truth (kept in sync with feature-explainer.html)
  // To mark something as work-in-progress, set badge: 'WIP' instead of 'LIVE'.
  const FEATURES = [
    { id: 'rfp',          icon: '📝', name: 'RFP-style Q&A',        desc: 'Role + region aware questionnaires.',                 badge: 'LIVE' },
    { id: 'requirements', icon: '📋', name: 'AI Requirements',      desc: 'Drafts Technical · Business · Product · Regulatory.', badge: 'LIVE', href: 'requirements.html' },
    { id: 'discovery',    icon: '🔍', name: 'Discovery autofill',   desc: 'Dropdowns that learn your typed values.',             badge: 'LIVE' },
    { id: 'architecture', icon: '🏗', name: 'Architecture design',  desc: '7R-aligned architectures across 6 clouds.',           badge: 'LIVE' },
    { id: 'blockchain',   icon: '🪙', name: 'Blockchain & RWA',     desc: 'Tokenization & on-chain settlement patterns.',         badge: 'LIVE', href: 'blockchain-rwa.html' },
    { id: 'actions',      icon: '🎯', name: 'Role-based Actions',   desc: 'Aggregated actions by role · KPIs · drill-down.',      badge: 'LIVE', href: 'actions.html' },
    { id: 'sow',          icon: '📄', name: 'Draft SOW',            desc: '11-section Statement of Work · pricing · milestones · staffing · RAID.', badge: 'LIVE', href: 'sow.html' },
    { id: 'governance',   icon: '📋', name: 'Program Governance',   desc: 'RAID register · 7-R timeline · steering pack · runlog.', badge: 'LIVE', href: 'program-governance.html' },
    { id: 'evp',          icon: '📊', name: 'EVP Summary',          desc: 'Executive value proposition · board-ready one-pager.', badge: 'LIVE', href: 'evp-summary.html' },
    { id: 'knowledge',    icon: '📚', name: 'Knowledge artifacts',  desc: 'Repository of past artifacts, templates, playbooks, regulatory checklists, patterns.', badge: 'LIVE', href: 'knowledge.html' },
    { id: 'export',       icon: '⬇',  name: 'Export reports',       desc: 'Markdown · JSON · MS Project · DR runbook.',          badge: 'LIVE' },
    { id: 'sevenr',       icon: '🔄', name: '7R migration planner', desc: 'Rehost · Replatform · Refactor · …',                  badge: 'LIVE', href: 'discovery-studio.html' },
    { id: 'iac',          icon: '⚙', name: 'IaC bundle generator', desc: 'Terraform · Helm · GitHub Actions scaffolds.',         badge: 'LIVE', href: 'iac.html' },
    { id: 'testing-svc',  icon: '🧪', name: 'Testing Services',     desc: 'Audit-ready continuous testing · TDM · strategy · plans · evidence packs.', badge: 'LIVE', href: 'testing-services.html' },
    { id: 'test-design',  icon: '📐', name: 'Test Design',          desc: 'Generate test strategy · plans · test cases per discipline, per requirement.', badge: 'LIVE', href: 'test-design.html' },
    { id: 'test-data',    icon: '🧬', name: 'Test Data',            desc: 'Synthetic, compliant banking test data (US/CA/IN) · PII-tagged · download & save.', badge: 'LIVE', href: 'testdata.html' },
    { id: 'testing-dash', icon: '🩺', name: 'Testing Dashboard',    desc: 'testing-master runs · Playwright E2E · defect manifest · re-run with same scope.', badge: 'LIVE', href: 'testing-dashboard.html' },
    { id: 'status',       icon: '🟢', name: 'Platform Status',      desc: 'Live /health probe across all 14 Workers · D1 + bindings + latency per worker.', badge: 'LIVE', href: 'status.html' },
    { id: 'cost',         icon: '💰', name: 'Cost analytics',       desc: 'LLM spend, model breakdown, cache hit rate, per-user history · 24h/7d/30d windows.', badge: 'LIVE', href: 'cost.html' },
    { id: 'program-flow', icon: '🕸', name: 'Program Flow',         desc: 'The unified agentic spine · run the lifecycle DAG and watch the lineage graph + correlation trace build.', badge: 'LIVE', href: 'program.html' },
    { id: 'fleet',        icon: '🛰', name: 'Fleet Architecture',   desc: 'Every worker in the fleet, grouped by tier, with live /health — the runtime architecture as one view.', badge: 'LIVE', href: 'fleet.html' },
    { id: 'insights',     icon: '📈', name: 'Program Insights',     desc: 'Per-program R/A/G health score, scoring drivers, AI executive narrative, and cross-program trends.', badge: 'LIVE', href: 'insights.html' },
    { id: 'console',      icon: '🎛', name: 'Console',              desc: 'Fleet control center · live health, version, latency, quick-run actions and studio links for every agent.', badge: 'LIVE', href: 'console.html' },
    { id: 'demo',         icon: '🎬', name: 'E2E Demo & Video',     desc: 'Drive the whole fleet end-to-end on a live canvas · record the run to WebM or export a GIF.', badge: 'LIVE', href: 'demo.html' },
    { id: 'arch-diagram', icon: '🗺', name: 'Architecture Diagram', desc: 'Full fleet flow diagram — router, orchestrator spine, agents, testing fan-out, stores and data flows.', badge: 'LIVE', href: 'arch-diagram.html' },
    { id: 'flow-diagram', icon: '🔀', name: 'Program Flow Diagram', desc: 'The lifecycle DAG — every stage’s entity nodes and the relationship edges that build one lineage graph.', badge: 'LIVE', href: 'flow-diagram.html' },
    { id: 'onboarding',   icon: '\uD83E\uDEAA', name: 'Onboarding',      desc: 'Open a KYC/KYB case, run screening, and record a decision \u2014 live banking agent.', badge: 'LIVE', href: 'onboarding.html' },
    { id: 'kyc',          icon: '\uD83D\uDEE1', name: 'KYC & Screening', desc: 'Sanctions name & ISO 20022 screening plus AML transaction monitoring.', badge: 'LIVE', href: 'kyc.html' },
    { id: 'payments',     icon: '\uD83D\uDCB8', name: 'Payments',        desc: 'Route, initiate, track and reconcile payments across rails.', badge: 'LIVE', href: 'payments.html' }
  ];

  // Top-level navigation
  const NAV = [
    { label: 'Home',       href: 'home.html',           match: /^\/(home(\.html)?)?$/i },
    { label: 'Features',   isMega: true },
    { label: 'Console',    href: 'console.html',        match: /console/i },
    { label: 'Demo',       href: 'demo.html',           match: /demo/i },
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
        .di-tb-nishi{background:var(--aglow,#FFF7E6);border:1px solid var(--gold-2,#E8AC38);color:var(--ink,#1A2238);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;white-space:nowrap}
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
        .di-mega-card .bd .badge.WIP{background:#FEF3C7;color:#92400E}
        .di-mega-card .bd .badge.PLANNED{background:#F1F5F9;color:#475569}
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
            '<h2>Everything Niche-I can do, in one place.</h2>' +
            '<p>Each card opens an animated walkthrough so you can see the feature in action before opening the workspace.</p>' +
          '</div>' +
          '<div class="di-mega-grid">' + cards + '</div>' +
          '<div class="di-mega-spot">' +
            '<div class="eyebrow">SPOTLIGHT</div>' +
            '<a class="item" href="nishi-chatbot.html"><div class="lbl">NEW IN PHASE 13</div><div class="h">Niche-I can now talk — hold-to-talk mic in chat.</div><div class="sub">Try it →</div></a>' +
            '<a class="alt" href="#"><div class="lbl">CASE STUDY</div><div class="h">Tier-1 bank: 38% mainframe footprint cut</div><div class="sub">Open the read-out →</div></a>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    function readProfile() {
      try { return JSON.parse(sessionStorage.getItem('di_account_profile') || 'null'); }
      catch (e) { return null; }
    }

    /* Phase 18.1 · session info helpers */
    function detectBrowser() {
      const ua = navigator.userAgent || '';
      if (/Edg\//.test(ua))      return 'Edge';
      if (/Chrome\//.test(ua))   return 'Chrome';
      if (/Firefox\//.test(ua))  return 'Firefox';
      if (/Safari\//.test(ua))   return 'Safari';
      return 'Browser';
    }
    function detectOS() {
      const ua = navigator.userAgent || '';
      if (/Windows/.test(ua))    return 'Windows';
      if (/Mac OS X/.test(ua))   return 'macOS';
      if (/Linux/.test(ua))      return 'Linux';
      if (/Android/.test(ua))    return 'Android';
      if (/iPhone|iPad/.test(ua)) return 'iOS';
      return 'OS';
    }
    function detectRegion() {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'; }
      catch (e) { return 'Local'; }
    }
    function timeSince(iso) {
      if (!iso) return 'now';
      const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (s < 60)    return s + 's ago';
      if (s < 3600)  return Math.floor(s/60) + ' min ago';
      if (s < 86400) return Math.floor(s/3600) + ' h ago';
      return Math.floor(s/86400) + ' d ago';
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
      const sessionSub = profile
        ? (timeSince(profile.signedInAt || profile.createdAt) + ' · ' + detectBrowser())
        : 'Not signed in';

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
          '<a class="di-tb-nishi" href="nishi-chatbot.html">🤖 Niche-I</a>' +
          '<button type="button" class="di-tb-user" id="di-tb-user-btn" title="Session info">' +
            '<div class="di-tb-user-meta"><div class="di-tb-user-name">' + escapeHTML(name) + '</div><div class="di-tb-user-sub">' + escapeHTML(sessionSub) + '</div></div>' +
            '<div class="di-tb-avatar">' + escapeHTML(initials) + '</div>' +
          '</button>' +
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

        // Wire search button → ⌘K command palette (Phase 18.2)
        const searchBtn = bar.querySelector('.di-tb-search');
        if (searchBtn) searchBtn.addEventListener('click', function () {
          if (window.DI && window.DI.cmdk && window.DI.cmdk.open) {
            window.DI.cmdk.open();
          } else if (window.DI && window.DI.toast) {
            window.DI.toast({ kind:'warn', title:'Loading…', message:'Command palette is still loading. Try again in a moment.' });
          }
        });

        // Bell → audit log viewer (Phase 18.1)
        const bell = bar.querySelector('.di-tb-bell');
        if (bell) bell.addEventListener('click', function () {
          if (window.DI && window.DI.audit && window.DI.audit.show) {
            window.DI.audit.show();
          } else if (window.DI && window.DI.toast) {
            window.DI.toast({ kind:'info', title:'Audit log', message:'Audit library not loaded on this page yet.' });
          }
        });

        // User pill → session info modal (Phase 18.1)
        const userBtn = bar.querySelector('#di-tb-user-btn');
        if (userBtn) userBtn.addEventListener('click', function () {
          showSessionModal();
        });

        // Keyboard shortcut: Ctrl+K / Cmd+K opens command palette
        document.addEventListener('keydown', function (e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (window.DI && window.DI.cmdk && window.DI.cmdk.open) window.DI.cmdk.open();
          }
        });
      });
    }

    mount();

    /* ── Session info modal (Phase 18.1) ──────────────────── */
    function showSessionModal() {
      const profile = readProfile();
      let host = document.getElementById('di-session-modal');
      if (host) host.remove();
      host = document.createElement('div');
      host.id = 'di-session-modal';
      host.innerHTML =
        '<style>' +
        '#di-session-modal{position:fixed;inset:0;background:rgba(20,33,58,.45);display:flex;align-items:center;justify-content:center;z-index:99970;font-family:\'Outfit\',system-ui,sans-serif}' +
        '#di-session-modal .box{background:#fff;border-radius:14px;max-width:440px;width:92vw;padding:22px 26px;box-shadow:0 32px 80px -16px rgba(20,33,58,.4)}' +
        '#di-session-modal h3{font-family:\'Fraunces\',Georgia,serif;font-size:17px;color:#1A2238;font-weight:600;margin-bottom:6px}' +
        '#di-session-modal .sub{font-size:11.5px;color:#5B6B8A;margin-bottom:14px}' +
        '#di-session-modal .row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed #E2E7F1;font-size:12px}' +
        '#di-session-modal .row strong{font-family:JetBrains Mono,monospace;color:#1A2238;font-size:11.5px}' +
        '#di-session-modal .row .key{color:#5B6B8A}' +
        '#di-session-modal .pill-ok{background:#E8FBF4;color:#0A8462;font-size:9.5px;font-weight:700;padding:2px 9px;border-radius:99px;letter-spacing:.04em}' +
        '#di-session-modal .pill-warn{background:#FFFCF4;color:#C8921A;font-size:9.5px;font-weight:700;padding:2px 9px;border-radius:99px;letter-spacing:.04em;border:1px solid #E8AC38}' +
        '#di-session-modal .actions{margin-top:14px;display:flex;gap:6px;justify-content:flex-end}' +
        '#di-session-modal .actions button{padding:8px 14px;font-size:12px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:700;border:none}' +
        '#di-session-modal .actions .ghost{background:#fff;border:1px solid #E2E7F1;color:#1A2238}' +
        '#di-session-modal .actions .primary{background:#C8921A;color:#fff}' +
        '#di-session-modal .actions .danger{background:#fff;border:1px solid #FF4D6A;color:#FF4D6A}' +
        '</style>' +
        '<div class="box">' +
          '<h3>Session info</h3>' +
          '<div class="sub">' + (profile ? 'You\'re signed in. All session data is stored locally in this browser.' : 'No session active.') + '</div>' +
          (profile ? (
            '<div class="row"><span class="key">Name</span><strong>' + escapeHTML(profile.name || '?') + '</strong></div>' +
            '<div class="row"><span class="key">Email</span><strong>' + escapeHTML(profile.email || '?') + '</strong></div>' +
            '<div class="row"><span class="key">Role</span><strong>' + escapeHTML(profile.role || '?') + '</strong></div>' +
            '<div class="row"><span class="key">Region</span><strong>' + escapeHTML(profile.region || 'NA') + '</strong></div>' +
            '<div class="row"><span class="key">Signed in</span><strong>' + (profile.signedInAt ? new Date(profile.signedInAt).toLocaleString() + ' (' + timeSince(profile.signedInAt) + ')' : 'unknown') + '</strong></div>' +
            '<div class="row"><span class="key">Browser</span><strong>' + detectBrowser() + ' on ' + detectOS() + '</strong></div>' +
            '<div class="row"><span class="key">Timezone</span><strong>' + detectRegion() + '</strong></div>' +
            '<div class="row"><span class="key">Data residency</span><span class="pill-ok">🔒 LOCAL · this browser only</span></div>' +
            '<div class="row"><span class="key">Server transmission</span><span class="pill-ok">NONE</span></div>' +
            '<div class="row"><span class="key">Audit events</span><strong>' + ((window.DI && window.DI.audit && window.DI.audit.getAll()) || []).length + '</strong></div>'
          ) : '<div class="sub" style="color:#1A2238;font-size:13px">Click <a href="index.html" style="color:#C8921A;font-weight:700">Sign in</a> to access the platform.</div>') +
          '<div class="actions">' +
            (profile ? '<button class="ghost" onclick="window.DI.audit&&window.DI.audit.show();document.getElementById(\'di-session-modal\').remove()">📜 View audit log</button>' : '') +
            (profile ? '<button class="danger" onclick="signOutNow()">Sign out</button>' : '') +
            '<button class="primary" onclick="document.getElementById(\'di-session-modal\').remove()">Close</button>' +
          '</div>' +
        '</div>';
      host.addEventListener('click', e => { if (e.target === host) host.remove(); });
      document.body.appendChild(host);
    }

    // Global sign-out helper
    window.signOutNow = function () {
      if (!confirm('Sign out now? Local data is preserved; you can sign back in.')) return;
      try { sessionStorage.removeItem('di_account_profile'); } catch (e) {}
      if (window.DI && window.DI.audit) window.DI.audit.log('auth', 'sign-out', {});
      location.href = 'index.html';
    };
  });
})();

/* ENT-01 · Reflect the real auth-bff session in the top bar (Day 2).
   Calls /me cross-site with cookie credentials; shows the signed-in
   operator. Only the non-sensitive session profile is cached (no tokens). */
(function () {
  var BFF = 'https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev';
  function applyProfile(me) {
    var email = me.principal || '';
    var role  = (me.roles && me.roles[0]) || 'user';
    var prof = {
      name: email, email: email, role: role,
      tenantId: me.tenantId || '', region: me.tenantId || 'NA',
      initials: email ? email.slice(0, 2).toUpperCase() : '?',
      signedInAt: new Date().toISOString(), source: 'oidc'
    };
    try { sessionStorage.setItem('di_account_profile', JSON.stringify(prof)); } catch (e) {}
    return prof;
  }
  function paint(prof, tries) {
    tries = tries || 0;
    var nameEl = document.querySelector('.di-tb-user-name');
    if (nameEl) {
      nameEl.textContent = prof.email;
      var subEl = document.querySelector('.di-tb-user-sub');
      var avEl  = document.querySelector('.di-tb-avatar');
      if (subEl) subEl.textContent = prof.role + ' \u00b7 signed in';
      if (avEl)  avEl.textContent  = prof.initials;
      return;
    }
    if (tries < 40) setTimeout(function () { paint(prof, tries + 1); }, 100);
  }
  window.addEventListener('load', function () {
    window.signOutNow = function () {
      if (!confirm('Sign out now?')) return;
      try { sessionStorage.removeItem('di_account_profile'); } catch (e) {}
      location.href = BFF + '/logout';
    };
  });
  fetch(BFF + '/me', { credentials: 'include' })
    .then(function (r) { return r.json(); })
    .then(function (me) {
      if (me && me.authenticated) { paint(applyProfile(me)); return; }
      try {
        var cur = JSON.parse(sessionStorage.getItem('di_account_profile') || 'null');
        if (cur && cur.source === 'oidc') sessionStorage.removeItem('di_account_profile');
      } catch (e) {}
    })
    .catch(function () {});
})();

/* ENT-ACT-01 · Front-end activity capture -> auth-bff /api/activity.
   Sensitive data is redacted SERVER-SIDE; this only sends action context.
   No-ops cleanly when signed out (401) or when the flag is off (204). */
(function () {
  var BFF = 'https://aiagenticplanner-auth-bff.kishorenishanthkumar.workers.dev';
  function post(ev) {
    try {
      fetch(BFF + '/api/activity', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ev), keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }
  // Public API for agent actions:
  //   window.aidpTrack('agent.tool_call', { agent:'fraud', resource:'case:1', summary:'Reviewed alert', detail:{...} })
  window.aidpTrack = function (action, opts) {
    opts = opts || {};
    post({ action: action || 'agent.action', agent: opts.agent, resource: opts.resource,
           summary: opts.summary, detail: opts.detail, risk: opts.risk });
  };
  // Auto-capture: page views.
  window.addEventListener('load', function () {
    post({ action: 'nav.page', resource: 'page:' + location.pathname,
           summary: 'Viewed ' + ((document.title || location.pathname) + '').slice(0, 140) });
  });
  // Auto-capture: clicks on elements tagged data-aidp-action="...".
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-aidp-action]') : null;
    if (!el) return;
    post({ action: el.getAttribute('data-aidp-action') || 'ui.click',
           agent: el.getAttribute('data-aidp-agent') || undefined,
           resource: el.getAttribute('data-aidp-resource') || ('page:' + location.pathname),
           summary: ((el.getAttribute('data-aidp-summary') || el.textContent || '') + '').trim().slice(0, 140) });
  }, true);
})();
