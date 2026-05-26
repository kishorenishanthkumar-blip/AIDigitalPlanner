/* ─────────────────────────────────────────────────────────────────
   AIDP Demo Tenant Seeder · v1
   One-click populate all studios with a realistic banking-modernization
   scenario so a fresh visitor sees every Workspace populated.

   Strategy:
     - Backend-seedable (Governance/Operations/SOW/Knowledge): call
       the agent's seed tool · data persists to D1.
     - Local-only studios (Discovery/Architecture/Requirements/Actions):
       populate localStorage with sample fixtures so legacy + Workspace
       views render immediately. (These agents don't expose a bulk-seed
       endpoint · the user can still backend-persist via per-Workspace
       Add buttons later.)
     - All studios also get the relevant di_handoff_* keys set so the
       "received from upstream" badges light up.

   Usage:
     <button onclick="loadDemoTenant()">Load demo tenant</button>
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Sample data · banking modernization scenario ─── */
  const DEMO = {
    client_name: 'Demo Bank',
    vendor_name: 'Digital Infotech',
    region:      'na-east',
    currency:    'USD',
    capabilities: [
      { id:'core-payments', name:'Core Payments',      domain:'payments',   current_tech:'cobol-mainframe', complexity:'very-high', sensitivity:'regulated',    volume:'very-high', verdict:'REARCH',  chosenCloud:'AWS',   monthly:18260 },
      { id:'core-deposits', name:'Core Banking · Deposits', domain:'core',  current_tech:'as400',           complexity:'high',      sensitivity:'regulated',    volume:'high',      verdict:'REPLAT',  chosenCloud:'AZURE', monthly:11300 },
      { id:'core-loans',    name:'Core Banking · Loans',    domain:'core',  current_tech:'java-monolith',   complexity:'high',      sensitivity:'regulated',    volume:'high',      verdict:'REFACT',  chosenCloud:'GCP',   monthly:13220 },
      { id:'card-fulfill',  name:'Cards · Fulfillment',     domain:'cards', current_tech:'saas-pkg',        complexity:'medium',    sensitivity:'confidential', volume:'medium',    verdict:'REHOST',  chosenCloud:'AZURE', monthly:4455  },
      { id:'card-mgmt',     name:'Card Management',         domain:'cards', current_tech:'java-monolith',   complexity:'high',      sensitivity:'confidential', volume:'high',      verdict:'REFACT',  chosenCloud:'AWS',   monthly:9550  },
      { id:'card-tx',       name:'Card Transactions',       domain:'cards', current_tech:'java-monolith',   complexity:'high',      sensitivity:'regulated',    volume:'very-high', verdict:'REFACT',  chosenCloud:'AWS',   monthly:11800 },
      { id:'aml',           name:'AML / Fraud',             domain:'compliance', current_tech:'saas-pkg',   complexity:'high',      sensitivity:'regulated',    volume:'high',      verdict:'REARCH',  chosenCloud:'AWS',   monthly:12300 },
      { id:'risk-comp',     name:'Risk & Compliance',       domain:'compliance', current_tech:'on-prem-dw', complexity:'very-high', sensitivity:'regulated',    volume:'high',      verdict:'REARCH',  chosenCloud:'AWS',   monthly:14100 },
      { id:'treasury',      name:'Treasury',                domain:'trade',  current_tech:'cobol-mainframe', complexity:'high',     sensitivity:'confidential', volume:'medium',    verdict:'REPLAT',  chosenCloud:'OCI',   monthly:7200  },
      { id:'audit',         name:'Audit Reporting',         domain:'compliance', current_tech:'saas-pkg',   complexity:'medium',    sensitivity:'regulated',    volume:'medium',    verdict:'RETAIN',  chosenCloud:'AZURE', monthly:3200  }
    ],
    raidItems: [
      { kind:'risk',       summary:'Mainframe COBOL talent declining — Payments rearchitect timeline at risk', severity:4, status:'mitigating', owner_role:'cto',                mitigation:'Pair-up with vendor + 12-week upskill cohort.' },
      { kind:'risk',       summary:'BCBS 239 reporting deadline collides with Risk rearchitect wave',         severity:5, status:'open',       owner_role:'head-of-compliance', mitigation:'Defer non-critical risk modules; bring deadline forward 6 weeks.' },
      { kind:'risk',       summary:'Cloud egress underestimated in TCO — FinOps review needed',               severity:3, status:'monitoring', owner_role:'finops',             mitigation:'Re-baseline with VPC endpoint pricing.' },
      { kind:'risk',       summary:'Vendor lock-in if Cards loyalty migrates fully to single SaaS',           severity:3, status:'open',       owner_role:'change-mgr',         mitigation:'Negotiate exit-data clause + parallel-run option.' },
      { kind:'assumption', summary:'Demo Bank provides 1 PO per capability for ≥50% of programme duration',   severity:2, status:'accepted',   owner_role:'program-director' },
      { kind:'assumption', summary:'Existing SSO/identity stack supports all new cloud-native services',      severity:3, status:'open',       owner_role:'ciso' },
      { kind:'assumption', summary:'Hyperscaler enterprise discount of 18%',                                   severity:2, status:'open',       owner_role:'finops' },
      { kind:'issue',      summary:'AS/400 RPG → Postgres test data not anonymised — blocking Deposits Replatform', severity:4, status:'open', owner_role:'head-of-data',     mitigation:'Engage TDM; deliver synthetic dataset by Sprint 6.' },
      { kind:'issue',      summary:'Treasury Solaris servers EOL in 14 months — cutover must finish before then', severity:4, status:'mitigating', owner_role:'head-of-cloud', mitigation:'Lock cutover gate ≤ M-12; escalate slip to Steering.' },
      { kind:'dependency', summary:'Architecture sign-off required before Phase 2 build starts',              severity:3, status:'monitoring', owner_role:'architect' },
      { kind:'dependency', summary:'FinOps tooling installed before M2',                                       severity:3, status:'open',       owner_role:'finops' },
      { kind:'dependency', summary:'Snowflake provisioning for unified risk data platform',                    severity:3, status:'open',       owner_role:'head-of-cloud' }
    ],
    requirements: [
      { id:'REQ-001', type:'functional',     priority:'must',   text:'System must process card transactions with ≤200ms p95 latency.' },
      { id:'REQ-002', type:'non-functional', priority:'must',   text:'All payment endpoints must be PCI-DSS 4.0 compliant.' },
      { id:'REQ-003', type:'compliance',     priority:'must',   text:'BCBS 239 reporting must be generated daily.' },
      { id:'REQ-004', type:'functional',     priority:'must',   text:'Customer onboarding must complete in under 5 minutes via mobile.' },
      { id:'REQ-005', type:'compliance',     priority:'must',   text:'GDPR right-to-be-forgotten supported across all customer data stores.' },
      { id:'REQ-006', type:'non-functional', priority:'should', text:'Core banking services must achieve 99.95% availability.' },
      { id:'REQ-007', type:'functional',     priority:'should', text:'AML alerts must trigger within 60s of suspicious transaction.' },
      { id:'REQ-008', type:'security',       priority:'must',   text:'All data at rest must be encrypted with customer-managed keys.' },
      { id:'REQ-009', type:'functional',     priority:'could',  text:'Loan origination uses ML-based credit scoring.' },
      { id:'REQ-010', type:'non-functional', priority:'should', text:'Disaster recovery RPO ≤ 15 minutes, RTO ≤ 4 hours.' },
      { id:'REQ-011', type:'compliance',     priority:'must',   text:'SOX controls automated and audit-ready.' },
      { id:'REQ-012', type:'functional',     priority:'wont',   text:'Cryptocurrency trading (out of scope for Phase 1).' }
    ],
    actions: [
      { id:'ACT-001', title:'Recruit 4 senior cloud architects',                category:'staffing',  priority:'p0', status:'in-progress', roles:['head-of-cloud','program-director'] },
      { id:'ACT-002', title:'Engage FinOps consultancy for cloud cost baseline', category:'finops',   priority:'p0', status:'accepted',    roles:['finops'] },
      { id:'ACT-003', title:'Set up Cloudability tenant + cost dashboards',     category:'tooling',   priority:'p0', status:'in-progress', roles:['finops','sre'] },
      { id:'ACT-004', title:'Anonymise AS/400 test data',                       category:'data',      priority:'p0', status:'blocked',     roles:['head-of-data'] },
      { id:'ACT-005', title:'Procurement: negotiate hyperscaler enterprise discount', category:'procurement', priority:'p1', status:'accepted', roles:['change-mgr'] },
      { id:'ACT-006', title:'Stand up landing zones across AWS + Azure',         category:'platform',  priority:'p0', status:'in-progress', roles:['head-of-cloud','architect'] },
      { id:'ACT-007', title:'PCI-DSS gap analysis on current payments stack',   category:'compliance', priority:'p0', status:'in-progress', roles:['head-of-compliance','ciso'] },
      { id:'ACT-008', title:'Define cross-cutting observability stack',         category:'platform',  priority:'p1', status:'proposed',    roles:['sre','architect'] },
      { id:'ACT-009', title:'Build COBOL → Java reskilling cohort',             category:'staffing',  priority:'p1', status:'accepted',    roles:['cto','program-director'] },
      { id:'ACT-010', title:'Solaris EOL cutover playbook',                     category:'platform',  priority:'p0', status:'proposed',    roles:['head-of-cloud','sre'] },
      { id:'ACT-011', title:'BCBS 239 daily-reporting POC',                     category:'compliance', priority:'p1', status:'proposed',    roles:['head-of-compliance','engineer'] },
      { id:'ACT-012', title:'Establish Architecture Review Board cadence',     category:'governance', priority:'p1', status:'accepted',    roles:['architect','program-director'] }
    ],
    knowledgeSources: [
      { title:'PCI-DSS v4.0 quick reference',
        kind:'standard', frameworks:['PCI-DSS'],
        text:'PCI-DSS v4.0 requires customer-managed encryption keys for cardholder data, MFA for all administrative access, and quarterly vulnerability scans. Network segmentation between CDE and non-CDE environments must be auditable.' },
      { title:'BCBS 239 data aggregation principles',
        kind:'regulation', frameworks:['BCBS-239'],
        text:'BCBS 239 sets 14 principles for risk data aggregation. Daily aggregation is required for Tier-1 banks. Data lineage must be traceable to source systems within 4 hours of regulator request.' },
      { title:'Banking modernization · 7R playbook',
        kind:'playbook', frameworks:['FFIEC'],
        text:'For COBOL mainframe systems with very-high complexity: rearchitect to microservices is the dominant pattern. Replatform-only saves 30% cost but doesn’t unlock event-driven integration. Rebuild is only justified when the business model itself changes.' }
    ]
  };

  /* ─── Helpers ───────────────────────────────────────── */

  function setLS(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }

  function progress(step, total, label) {
    const evt = new CustomEvent('demo-seed-progress', { detail: { step, total, label } });
    window.dispatchEvent(evt);
    try { console.log('[Demo seed] ' + step + '/' + total + ' · ' + label); } catch (e) {}
  }

  function nowMs() { return Date.now(); }
  function nowIso() { return new Date().toISOString(); }

  /* ─── Per-studio seeders ────────────────────────────── */

  function seedDiscovery() {
    setLS('di_capabilities_v1', DEMO.capabilities.map(c => ({
      id: c.id, name: c.name, domain: c.domain,
      current_tech: c.current_tech, complexity: c.complexity,
      sensitivity: c.sensitivity, volume: c.volume,
      verdict: c.verdict, rationale: 'Auto-seeded by Demo Tenant'
    })));
    setLS('di_handoff_architecture', { capabilities: DEMO.capabilities, filters: { region: DEMO.region, currency: DEMO.currency }, source:'demo-seed' });
  }

  function seedArchitecture() {
    setLS('di_arch_canonical_v1', {
      capabilities: DEMO.capabilities,
      filters: { region: DEMO.region, currency: DEMO.currency, model:'3-yr-savings', discount:18 },
      totals: { monthly: DEMO.capabilities.reduce((s,c) => s + (c.monthly || 0), 0) }
    });
    setLS('di_handoff_requirements', { capabilities: DEMO.capabilities, source:'demo-seed' });
    setLS('di_handoff_governance',   { capabilities: DEMO.capabilities, filters: { region: DEMO.region, currency: DEMO.currency }, source:'demo-seed' });
  }

  function seedRequirementsLocal() {
    const items = DEMO.requirements.map(r => ({ ...r, created_at: nowMs(), source:'demo-seed' }));
    setLS('aidp_req_ws_cache_v1', { items, fetchedAt: nowMs() });
    setLS('di_requirements_v1', items);
  }

  function seedActionsLocal() {
    const items = DEMO.actions.map(a => ({ ...a, created_at: nowMs(), source:'demo-seed' }));
    setLS('aidp_act_ws_cache_v1', { items, fetchedAt: nowMs() });
    setLS('di_actions_v1', items);
  }

  async function seedGovernance() {
    if (!window.GovernanceAPI || !window.GovernanceAPI.upsertRaid) return { skipped: 'GovernanceAPI not loaded' };
    /* Bulk upsert 12 RAID items · sequential to avoid hammering D1. */
    let ok = 0, fail = 0;
    for (let i = 0; i < DEMO.raidItems.length; i++) {
      const s = DEMO.raidItems[i];
      const item = {
        id: 'DEMO-P-' + String(i + 1).padStart(3, '0'),
        kind: s.kind, summary: s.summary, severity: s.severity, status: s.status,
        owner_role: s.owner_role, mitigation: s.mitigation,
        source: 'manual',
        created_at: nowMs(), updated_at: nowMs()
      };
      try { await window.GovernanceAPI.upsertRaid(item); ok++; }
      catch (e) { fail++; }
    }
    /* Mirror to localStorage so the Workspace cache reflects it immediately. */
    setLS('aidp_pg_ws_cache_v1', { items: DEMO.raidItems.map((s, i) => ({
      id: 'DEMO-P-' + String(i + 1).padStart(3, '0'),
      kind: s.kind, summary: s.summary, severity: s.severity, status: s.status,
      owner_role: s.owner_role, mitigation: s.mitigation,
      source: 'manual', created_at: nowMs(), updated_at: nowMs()
    })), changes: [], pack: null, fetchedAt: nowMs(), selectedId: null, tab: 'raid' });
    return { ok, fail };
  }

  async function seedSow() {
    if (!window.SowAPI || !window.SowAPI.assemble) return { skipped: 'SowAPI not loaded' };
    try {
      const r = await window.SowAPI.assemble({
        client_name: DEMO.client_name, vendor_name: DEMO.vendor_name,
        region: DEMO.region, currency: DEMO.currency, contingency_pct: 12, persist: true
      });
      return { ok: 1, sow_id: r && r.sow && r.sow.id };
    } catch (e) { return { ok: 0, error: String(e.message || e) }; }
  }

  async function seedOperations() {
    if (!window.OperationsAPI || !window.OperationsAPI.sloSeedDefaults) return { skipped: 'OperationsAPI not loaded' };
    try {
      const r = await window.OperationsAPI.sloSeedDefaults({});
      /* Also generate a dashboard so KPIs aren't empty. */
      let dashRag = null;
      try {
        const d = await window.OperationsAPI.dashboard({ window_days: 28, persist: true });
        dashRag = d && d.dashboard && d.dashboard.rag_status;
      } catch (e) {}
      return { ok: 1, seeded: (r && r.seeded_count) || (r && r.slos && r.slos.length), rag: dashRag };
    } catch (e) { return { ok: 0, error: String(e.message || e) }; }
  }

  async function seedKnowledge() {
    if (!window.KnowledgeAPI || !window.KnowledgeAPI.ingest) return { skipped: 'KnowledgeAPI not loaded' };
    let ok = 0, fail = 0;
    for (const s of DEMO.knowledgeSources) {
      try { await window.KnowledgeAPI.ingest(s); ok++; }
      catch (e) { fail++; }
    }
    return { ok, fail };
  }

  /* ─── Public API ────────────────────────────────────── */

  async function loadDemoTenant(opts) {
    opts = opts || {};
    const confirmFirst = opts.confirm !== false;
    if (confirmFirst && !confirm('Load demo tenant?\n\nThis seeds all 8 studios with a realistic banking-modernization scenario for "Demo Bank". Existing local data will be replaced. Backend data is additive (idempotent on demo ids).')) {
      return { ok: false, cancelled: true };
    }

    progress(0, 8, 'Starting…');
    const t0 = Date.now();
    const result = {};

    /* Step 1-4 · local-only studios (fast, synchronous). */
    progress(1, 8, 'Discovery'); seedDiscovery();
    progress(2, 8, 'Architecture'); seedArchitecture();
    progress(3, 8, 'Requirements'); seedRequirementsLocal();
    progress(4, 8, 'Actions'); seedActionsLocal();

    /* Step 5-8 · backend seeds (parallel where independent). */
    progress(5, 8, 'SOW · assembling…');
    const [sow, gov, ops, kn] = await Promise.all([
      seedSow(),
      seedGovernance(),
      seedOperations(),
      seedKnowledge()
    ]);
    result.sow = sow; result.governance = gov; result.operations = ops; result.knowledge = kn;
    progress(8, 8, 'Done');

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    if (window.DI && window.DI.toast) {
      window.DI.toast({ kind:'ok', icon:'🌱', title:'Demo tenant ready', message:'Seeded in ' + elapsed + 's · open any studio to see populated content.', duration: 5000 });
    }
    try { console.log('[Demo seed] complete in ' + elapsed + 's', result); } catch (e) {}
    return Object.assign({ ok: true, elapsed }, result);
  }

  window.loadDemoTenant = loadDemoTenant;
  /* Allow programmatic seeds without confirm (e.g. from CI / Playwright). */
  window.loadDemoTenantSilent = function () { return loadDemoTenant({ confirm: false }); };

  try { console.log('[AIDP] Demo Tenant Seeder v1 loaded'); } catch (e) {}
})();
