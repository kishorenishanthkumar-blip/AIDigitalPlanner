/* ═══════════════════════════════════════════════════════
   DI Platform · ⌘K command palette (Phase 18.2)
   Fuzzy search across:
     - Pages (Home, Nishi, Discovery, Architecture, etc.)
     - Recent artifacts (from localStorage)
     - RAID items (from di_governance_v1)
     - Discovery capabilities
     - "Ask Nishi: <q>" passthrough

   Public API:
     window.DI.cmdk.open()
     window.DI.cmdk.close()
   Keyboard:
     Ctrl/Cmd + K  → open
     ↑ ↓           → navigate
     Enter         → activate
     Esc           → close
═══════════════════════════════════════════════════════ */
(function () {
  if (window.DI && window.DI.cmdk) return;
  window.DI = window.DI || {};

  const PAGES = [
    { id:'home',         name:'Home',                  href:'home.html',              kind:'page',  hint:'Tile dashboard',           keys:'g h' },
    { id:'nishi',        name:'Nishi · AI assistant',  href:'nishi-chatbot.html',     kind:'page',  hint:'Chat + voice',             keys:'g n' },
    { id:'discovery',    name:'Discovery Studio',      href:'discovery-studio.html',  kind:'page',  hint:'7R wizard + capability picker', keys:'g d' },
    { id:'architecture', name:'Architecture Studio',   href:'architecture-studio.html', kind:'page',hint:'6-cloud pricing grid',      keys:'g a' },
    { id:'evp',          name:'EVP Summary',           href:'evp-summary.html',       kind:'page',  hint:'Board-ready summary',       keys:'g e' },
    { id:'sow',          name:'Draft SOW',             href:'sow.html',               kind:'page',  hint:'Inline-editable Statement of Work', keys:'g s' },
    { id:'governance',   name:'Program Governance',    href:'program-governance.html', kind:'page', hint:'RAID + Gantt + cost + MS Project', keys:'g g' },
    { id:'rfp',          name:'RFP Questionnaire',     href:'questionnaire.html',     kind:'page',  hint:'88-question adaptive RFP', keys:'g q' },
    { id:'operations',   name:'Operations',            href:'operations.html',        kind:'page',  hint:'KPI tiles · FinOps · incidents', keys:'g o' },
    { id:'requirements', name:'AI Requirements',       href:'requirements.html',      kind:'page',  hint:'Role-tagged · 4 lenses · regulatory clauses', keys:'g r' },
    { id:'actions',      name:'Role-based Actions',    href:'actions.html',           kind:'page',  hint:'Filters · KPIs · drill-down · leadership recommendation', keys:'g k' },
    { id:'blockchain',   name:'Blockchain & RWA',      href:'blockchain-rwa.html',    kind:'page',  hint:'Tokenization wizard · jurisdiction stance · roadmap', keys:'g b' }
  ];

  const FEATURE_EXPLAINERS = [
    { id:'fx-rfp',          name:'Walkthrough · RFP-style Q&A',         href:'feature-explainer.html?feature=rfp',          kind:'walkthrough', hint:'Animated explainer' },
    { id:'fx-discovery',    name:'Walkthrough · Discovery autofill',     href:'feature-explainer.html?feature=discovery',    kind:'walkthrough', hint:'Animated explainer' },
    { id:'fx-architecture', name:'Walkthrough · Architecture design',    href:'feature-explainer.html?feature=architecture', kind:'walkthrough', hint:'Animated explainer' },
    { id:'fx-blockchain',   name:'Walkthrough · Blockchain & RWA',       href:'feature-explainer.html?feature=blockchain',   kind:'walkthrough', hint:'Animated explainer' },
    { id:'fx-export',       name:'Walkthrough · Export reports',         href:'feature-explainer.html?feature=export',       kind:'walkthrough', hint:'Animated explainer' }
  ];

  function loadArtifacts() {
    // Pull a few common artifact sources from localStorage
    const items = [];
    try {
      const disc = JSON.parse(localStorage.getItem('di_discovery_v1') || 'null');
      if (disc && disc.selected && disc.selected.length) {
        items.push({ id:'art-disc', name:'Discovery draft · ' + disc.selected.length + ' capabilities', href:'discovery-studio.html', kind:'artifact', hint:'Last saved ' + (disc.updatedAt ? new Date(disc.updatedAt).toLocaleString() : '?') });
      }
    } catch (e) {}
    try {
      const arch = JSON.parse(localStorage.getItem('di_architecture_v1') || 'null');
      if (arch && arch.capabilities && arch.capabilities.length) {
        items.push({ id:'art-arch', name:'Architecture · ' + arch.capabilities.length + ' caps · region ' + (arch.region || 'na-east'), href:'architecture-studio.html', kind:'artifact', hint:'Pricing model: ' + (arch.model || '?') });
      }
    } catch (e) {}
    try {
      const sow = JSON.parse(localStorage.getItem('di_sow_v1') || 'null');
      if (sow && sow.version) {
        items.push({ id:'art-sow', name:'SOW · v' + sow.version + ' · ' + (sow.status || '?'), href:'sow.html', kind:'artifact', hint:'Fixed price configured' });
      }
    } catch (e) {}
    try {
      const gov = JSON.parse(localStorage.getItem('di_governance_v1') || 'null');
      if (gov && gov.raid && gov.raid.length) {
        items.push({ id:'art-gov', name:'Governance · ' + gov.raid.length + ' RAID items', href:'program-governance.html', kind:'artifact', hint:gov.raid.filter(r => r.status === 'Open').length + ' open' });
      }
    } catch (e) {}
    return items;
  }

  function loadRaidItems() {
    try {
      const gov = JSON.parse(localStorage.getItem('di_governance_v1') || 'null');
      if (!gov || !gov.raid) return [];
      return gov.raid.map(r => ({
        id: 'raid-' + r.id,
        name: r.id + ' · ' + (r.desc || '').replace(/<[^>]+>/g, '').slice(0, 80),
        href: 'program-governance.html',
        kind: 'raid',
        hint: r.type + ' · ' + r.sev + ' · ' + r.status
      }));
    } catch (e) { return []; }
  }

  /* Tiny fuzzy match — returns score 0-100; higher is better */
  function fuzzyScore(query, text) {
    if (!query) return 50;
    const q = query.toLowerCase();
    const t = (text || '').toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 90;
    if (t.includes(q)) return 70;
    // Word-by-word
    const qWords = q.split(/\s+/);
    const allMatch = qWords.every(w => t.includes(w));
    if (allMatch) return 50;
    // Letter sequence
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) qi++;
    }
    return qi === q.length ? 30 : 0;
  }

  function inject() {
    if (document.getElementById('di-cmdk-css')) return;
    const css = document.createElement('style');
    css.id = 'di-cmdk-css';
    css.textContent = `
      #di-cmdk-bg{position:fixed;inset:0;background:rgba(20,33,58,.45);display:none;align-items:flex-start;justify-content:center;padding-top:80px;z-index:99985;font-family:'Outfit',system-ui,sans-serif;animation:di-cmdk-in .15s ease}
      #di-cmdk-bg.open{display:flex}
      @keyframes di-cmdk-in{from{opacity:0}to{opacity:1}}
      .di-cmdk-box{background:#fff;border-radius:14px;width:560px;max-width:92vw;max-height:520px;display:flex;flex-direction:column;box-shadow:0 32px 80px -10px rgba(20,33,58,.4);overflow:hidden;border:1px solid #E2E7F1}
      .di-cmdk-input-row{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #E2E7F1}
      .di-cmdk-input-row .icon{color:#5B6B8A;font-size:16px}
      .di-cmdk-input-row input{flex:1;border:none;outline:none;font-size:15px;color:#1A2238;font-family:inherit;background:transparent}
      .di-cmdk-input-row input::placeholder{color:#9AA6BE}
      .di-cmdk-input-row kbd{background:#F8FAFD;border:1px solid #E2E7F1;border-radius:6px;padding:2px 7px;font-size:10px;font-family:'JetBrains Mono',monospace;color:#5B6B8A}
      .di-cmdk-body{flex:1;overflow-y:auto;padding:6px 0}
      .di-cmdk-group{padding:6px 18px 4px;font-size:9.5px;font-weight:700;color:#5B6B8A;letter-spacing:.1em;text-transform:uppercase}
      .di-cmdk-item{display:flex;align-items:center;gap:12px;padding:9px 18px;cursor:pointer;font-size:13px}
      .di-cmdk-item:hover{background:#F8FAFD}
      .di-cmdk-item.act{background:#FFF7E6}
      .di-cmdk-item .ic{width:30px;height:30px;border-radius:8px;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:linear-gradient(135deg,#FFF7E6,#FFE7B3);color:#C8921A}
      .di-cmdk-item.kind-artifact .ic{background:linear-gradient(135deg,#F4F0FF,#E2D5FF);color:#5C3DB8}
      .di-cmdk-item.kind-raid .ic{background:linear-gradient(135deg,#FFF0F8,#FFD9EE);color:#A0357A}
      .di-cmdk-item.kind-walkthrough .ic{background:linear-gradient(135deg,#F0F7FF,#D9E9FF);color:#1A4D99}
      .di-cmdk-item.kind-nishi .ic{background:linear-gradient(135deg,#C8921A,#FFD070);color:#1A2238}
      .di-cmdk-item .bd{flex:1;min-width:0}
      .di-cmdk-item .nm{font-size:13px;font-weight:600;color:#1A2238;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .di-cmdk-item .ht{font-size:10.5px;color:#5B6B8A;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .di-cmdk-item .kb{background:#F8FAFD;border:1px solid #E2E7F1;border-radius:5px;padding:1px 6px;font-size:9.5px;font-family:'JetBrains Mono',monospace;color:#5B6B8A;margin-left:6px}
      .di-cmdk-footer{padding:8px 18px;border-top:1px solid #E2E7F1;font-size:10.5px;color:#5B6B8A;background:#F8FAFD;display:flex;justify-content:space-between;align-items:center}
      .di-cmdk-footer kbd{background:#fff;border:1px solid #E2E7F1;border-radius:5px;padding:1px 5px;font-family:'JetBrains Mono',monospace;font-size:9.5px;margin:0 3px}
      .di-cmdk-empty{padding:30px 20px;text-align:center;color:#5B6B8A;font-size:12px}
    `;
    document.head.appendChild(css);

    const host = document.createElement('div');
    host.id = 'di-cmdk-bg';
    host.innerHTML =
      '<div class="di-cmdk-box">' +
        '<div class="di-cmdk-input-row"><span class="icon">🔍</span><input type="text" id="di-cmdk-input" placeholder="Search pages, artifacts, RAID, or ask Nishi…" autofocus><kbd>ESC</kbd></div>' +
        '<div class="di-cmdk-body" id="di-cmdk-body"></div>' +
        '<div class="di-cmdk-footer"><div><kbd>↑↓</kbd> navigate <kbd>↵</kbd> open <kbd>ESC</kbd> close</div><div id="di-cmdk-count">— results —</div></div>' +
      '</div>';
    host.addEventListener('click', e => { if (e.target === host) close(); });
    document.body.appendChild(host);

    const input = host.querySelector('#di-cmdk-input');
    input.addEventListener('input', renderResults);
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); moveCursor(1); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); moveCursor(-1); return; }
      if (e.key === 'Enter')     { e.preventDefault(); activateSelected(); return; }
    });
  }

  let cursor = 0;
  let results = [];

  function gatherAll() {
    return PAGES.map(p => Object.assign({}, p))
      .concat(FEATURE_EXPLAINERS)
      .concat(loadArtifacts())
      .concat(loadRaidItems());
  }

  function renderResults() {
    const input = document.getElementById('di-cmdk-input');
    const body  = document.getElementById('di-cmdk-body');
    const q = (input.value || '').trim();
    const all = gatherAll();
    const scored = all.map(item => ({ item, score: fuzzyScore(q, item.name + ' ' + (item.hint || '') + ' ' + (item.keys || '')) })).filter(s => s.score > 0);
    scored.sort((a, b) => b.score - a.score);
    results = scored.slice(0, 30).map(s => s.item);
    // Always offer "Ask Nishi" as a fallback if query has text
    if (q.length > 1) {
      results.push({ id:'nishi-ask', name:'Ask Nishi: "' + q + '"', href:'nishi-chatbot.html?q=' + encodeURIComponent(q), kind:'nishi', hint:'Send to Nishi chat with this query pre-filled' });
    }

    if (results.length === 0) {
      body.innerHTML = '<div class="di-cmdk-empty">No matches. Try a page name (e.g. "discovery"), a RAID id, or a question for Nishi.</div>';
      document.getElementById('di-cmdk-count').textContent = '0 results';
      return;
    }

    // Group by kind
    const groups = { page:[], walkthrough:[], artifact:[], raid:[], nishi:[] };
    results.forEach(r => { (groups[r.kind] || (groups[r.kind] = [])).push(r); });
    const order = ['page','artifact','raid','walkthrough','nishi'];
    const titles = { page:'Pages', walkthrough:'Feature walkthroughs', artifact:'Recent artifacts', raid:'RAID items', nishi:'Ask Nishi' };
    let html = '';
    let i = 0;
    order.forEach(k => {
      if (!groups[k] || !groups[k].length) return;
      html += '<div class="di-cmdk-group">' + titles[k] + '</div>';
      groups[k].forEach(r => {
        const icon = k === 'page' ? '📄'
                   : k === 'walkthrough' ? '▶'
                   : k === 'artifact' ? '📁'
                   : k === 'raid' ? '⚠'
                   : '🤖';
        html += '<div class="di-cmdk-item kind-' + k + (i === cursor ? ' act' : '') + '" data-i="' + i + '">' +
          '<div class="ic">' + icon + '</div>' +
          '<div class="bd"><div class="nm">' + escapeHTML(r.name) + '</div>' + (r.hint ? '<div class="ht">' + escapeHTML(r.hint) + '</div>' : '') + '</div>' +
          (r.keys ? '<kbd class="kb">' + escapeHTML(r.keys) + '</kbd>' : '') +
        '</div>';
        i++;
      });
    });
    body.innerHTML = html;
    document.getElementById('di-cmdk-count').textContent = results.length + ' result' + (results.length === 1 ? '' : 's');

    body.querySelectorAll('.di-cmdk-item').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor = +el.dataset.i; updateActive(); });
      el.addEventListener('click', () => activateSelected());
    });
  }

  function moveCursor(dir) {
    cursor = Math.max(0, Math.min(results.length - 1, cursor + dir));
    updateActive();
    const el = document.querySelector('.di-cmdk-item.act');
    if (el && el.scrollIntoView) el.scrollIntoView({ block:'nearest' });
  }
  function updateActive() {
    document.querySelectorAll('.di-cmdk-item').forEach(el => el.classList.toggle('act', +el.dataset.i === cursor));
  }
  function activateSelected() {
    const r = results[cursor];
    if (!r) return;
    if (window.DI && window.DI.audit) window.DI.audit.log('cmdk', 'activate', { kind:r.kind, name:r.name });
    location.href = r.href;
  }

  function open() {
    inject();
    cursor = 0;
    const host = document.getElementById('di-cmdk-bg');
    if (!host) return;
    host.classList.add('open');
    const input = document.getElementById('di-cmdk-input');
    if (input) { input.value = ''; renderResults(); setTimeout(() => input.focus(), 30); }
    if (window.DI && window.DI.audit) window.DI.audit.log('cmdk', 'open', {});
  }
  function close() {
    const host = document.getElementById('di-cmdk-bg');
    if (host) host.classList.remove('open');
  }

  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  window.DI.cmdk = { open, close };
  // Pre-inject so the shortcut works immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
