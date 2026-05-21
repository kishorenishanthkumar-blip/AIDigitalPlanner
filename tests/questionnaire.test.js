/* DI-Platform · Phase 2 — Self-contained test (positive / negative / edge).
   Uses an inline minimal pack so the test is independent of any mount state.
   The real pack on disk has 88 questions; this minimal pack exercises every
   question type, every scope dimension, and every validation rule. */
'use strict';
const path = require('path');

// ── Shim DOM + sessionStorage ─────────────────────────────
const storage = {};
global.sessionStorage = { getItem:k=>k in storage?storage[k]:null, setItem:(k,v)=>{storage[k]=String(v);}, removeItem:k=>{delete storage[k];} };
global.window = global.window || {};
global.document = { readyState:'complete', createElement:()=>({ style:{}, addEventListener:()=>{}, classList:{add:()=>{},remove:()=>{},toggle:()=>{},contains:()=>false}, innerHTML:'' }), addEventListener:()=>{}, getElementById:()=>null, head:{appendChild:()=>{}}, body:{appendChild:()=>{}} };

const QEngine = require(path.join(__dirname, '..', 'assets', 'questionnaire-engine.js'));

// ── Minimal inline pack — exercises every code path ────────
const PACKS = {
  sections: [
    { id:'org',     title:'Organization' },
    { id:'tech',    title:'Technical' },
    { id:'compl',   title:'Compliance' }
  ],
  roles:   ['CTO','CRO','Business Owner','Head of Compliance'],
  regions: ['North America','Europe','Asia Pacific','South East Asia','South Western Asia'],
  domains: ['Core Banking — Payments','Cards','AML','Trade Finance'],
  questions: [
    { id:'Q1', section:'org', type:'text',     label:'Program name', required:true, mapsTo:['discovery'] },
    { id:'Q2', section:'org', type:'text',     label:'Sponsor email',
      validate:{ regex:'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', errorMessage:'Enter a valid email.' } },
    { id:'Q3', section:'org', type:'text',     label:'Go-live date',
      validate:{ regex:'^\\d{4}-\\d{2}-\\d{2}$', errorMessage:'Use ISO format.' } },
    { id:'Q4', section:'org', type:'longtext', label:'Pain points',
      validate:{ minLength:20, maxLength:500 }, mapsTo:['raid'] },
    { id:'Q5', section:'org', type:'single',   label:'Sponsor', options:['CIO','CTO','CRO'] },
    { id:'Q6', section:'org', type:'multi',    label:'Outcomes', options:['Cost','Latency','Risk'] },
    { id:'Q7', section:'org', type:'scale',    label:'Risk appetite', min:1, max:5, default:3 },
    { id:'Q8', section:'org', type:'boolean',  label:'Board approved?', mapsTo:['raid'] },
    { id:'Q9', section:'org', type:'date',     label:'Kickoff' },
    { id:'Q10',section:'org', type:'ranked',   label:'Priorities', options:['Latency','Cost','UX'] },

    // Role-scoped
    { id:'Q-CTO',section:'tech', type:'text', label:'CTO-only',  roleScope:['CTO'], mapsTo:['discovery'] },
    { id:'Q-CRO',section:'tech', type:'text', label:'CRO-only',  roleScope:['CRO'], mapsTo:['raid'] },

    // Region-scoped
    { id:'Q-NA', section:'compl', type:'boolean', label:'SOX?',  regionScope:['North America'], regulator:'SOX', mapsTo:['compliance'], weight:3 },
    { id:'Q-EU', section:'compl', type:'boolean', label:'GDPR?', regionScope:['Europe'],        regulator:'GDPR', mapsTo:['compliance'], weight:3 },

    // Domain-scoped
    { id:'Q-CARDS', section:'tech', type:'multi', label:'Schemes', options:['Visa','Mastercard'], domainScope:['Cards'], mapsTo:['requirement'] },

    // Branching
    { id:'Q-BCK',  section:'tech', type:'boolean', label:'Blockchain?' },
    { id:'Q-RWA',  section:'tech', type:'boolean', label:'RWA tokenization?', showIf:{ 'Q-BCK':'Yes' } },

    // Numeric validation
    { id:'Q-PCT',  section:'tech', type:'scale', label:'% savings', min:0, max:60, default:30,
      validate:{ min:0, max:60 } },

    // maxLength only
    { id:'Q-LONG', section:'org', type:'longtext', label:'Other context', validate:{ maxLength:50 } }
  ]
};

let pass = 0, fail = 0; const failures = [];
const ok = (n, c, d) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (d?' — '+d:'')); failures.push(n + (d?': '+d:'')); } };
const mockRoot = { innerHTML:'', querySelectorAll:()=>[], querySelector:()=>null };
function mountFor(role, region, domain) {
  for (const k of Object.keys(storage)) delete storage[k];
  QEngine._root = mockRoot; QEngine._packs = PACKS;
  QEngine._state = { role, region, domain, answers:{}, currentSection:0, onComplete:()=>{}, onProgress:()=>{} };
}
const findQ = id => PACKS.questions.find(q => q.id === id);

// ═══════════════════════════════════════════════
console.log('\n── 1. Pack integrity ──');
const ids = new Set(); let dup = null;
for (const q of PACKS.questions){ if (ids.has(q.id)){dup=q.id;break;} ids.add(q.id); }
ok('All question IDs unique', !dup, dup);
const secSet = new Set(PACKS.sections.map(s=>s.id));
ok('Every question has valid section', PACKS.questions.every(q=>secSet.has(q.section)));
const types = new Set(['text','longtext','single','multi','scale','boolean','date','ranked']);
ok('All types known', PACKS.questions.every(q=>types.has(q.type)));

// ═══════════════════════════════════════════════
console.log('\n── 2. Positive — five personas walk through ──');
const personas = [
  ['CTO','North America','Core Banking — Payments'],
  ['Business Owner','Europe','Cards'],
  ['CRO','South East Asia','AML'],
  ['Head of Compliance','Asia Pacific','Trade Finance'],
  ['CTO','South Western Asia','Cards']
];
for (const [role, region, domain] of personas) {
  mountFor(role, region, domain);
  const v = QEngine.visibleQuestions();
  ok(`${role} / ${region} / ${domain} → visible.length > 0`, v.length > 0);
  for (const q of v) {
    let val;
    switch (q.type) {
      case 'text':     val = q.id==='Q2' ? 'a@b.co' : q.id==='Q3' ? '2026-12-15' : 'sample'; break;
      case 'longtext': val = (q.validate && q.validate.maxLength && q.validate.maxLength < 60) ? 'a'.repeat(Math.max(1, q.validate.maxLength - 5)) : 'This is a sufficiently long answer to satisfy validation rules.'; break;
      case 'single':   val = q.options[0]; break;
      case 'multi':    val = [q.options[0]]; break;
      case 'scale':    val = q.default ?? q.min ?? 1; break;
      case 'boolean':  val = 'Yes'; break;
      case 'date':     val = '2026-12-15'; break;
      case 'ranked':   val = q.options; break;
    }
    QEngine.saveAnswer(q.id, val);
  }
  const errs = QEngine.validateAll();
  ok(`${role} → completes with 0 validation errors`, errs.length === 0, errs.length ? errs[0].qid+': '+errs[0].error : '');
  const out = QEngine.consolidate();
  ok(`${role} → consolidate() returns full structure`,
     !!(out.profile && out.responses.length >= v.length && out.derivedArtifacts && out.derivedArtifacts.requirements && out.derivedArtifacts.raidItems && out.derivedArtifacts.complianceChecklist));
}

// ═══════════════════════════════════════════════
console.log('\n── 3. Negative — invalid inputs caught ──');
mountFor('CTO','North America','Cards');

const eml = findQ('Q2');
ok('Email rejects "not-an-email"', !QEngine.validateQuestion(eml, 'not-an-email').ok);
ok('Email accepts "good@example.com"', QEngine.validateQuestion(eml, 'good@example.com').ok);

const dt = findQ('Q3');
ok('Date rejects "12/15/2026"', !QEngine.validateQuestion(dt, '12/15/2026').ok);
ok('Date accepts "2026-12-15"',  QEngine.validateQuestion(dt, '2026-12-15').ok);

const lt = findQ('Q4');
ok('Longtext rejects too-short input', !QEngine.validateQuestion(lt, 'short').ok);
ok('Longtext accepts long input',       QEngine.validateQuestion(lt, 'This is a long-enough answer for the test.').ok);
ok('Longtext rejects > maxLength',     !QEngine.validateQuestion(lt, 'x'.repeat(600)).ok);

const sg = findQ('Q5');
ok('Single rejects unknown option', !QEngine.validateQuestion(sg, 'BadValue').ok);
ok('Single accepts known option',    QEngine.validateQuestion(sg, 'CTO').ok);

const mt = findQ('Q6');
ok('Multi rejects array with unknown', !QEngine.validateQuestion(mt, ['Cost','BadValue']).ok);
ok('Multi accepts array of known',      QEngine.validateQuestion(mt, ['Cost','Latency']).ok);

const bl = findQ('Q8');
ok('Boolean rejects "maybe"', !QEngine.validateQuestion(bl, 'maybe').ok);
ok('Boolean accepts "Yes"',    QEngine.validateQuestion(bl, 'Yes').ok);

const pct = findQ('Q-PCT');
ok('Scale rejects below min', !QEngine.validateQuestion(pct, -1).ok);
ok('Scale rejects above max', !QEngine.validateQuestion(pct, 100).ok);
ok('Scale accepts in-range',   QEngine.validateQuestion(pct, 30).ok);

ok('Required + missing → error', !QEngine.validateQuestion(findQ('Q1'), '').ok);

// ═══════════════════════════════════════════════
console.log('\n── 4. Edge cases ──');
mountFor('CTO','North America','Cards');

// XSS payload stored verbatim; _esc neutralises on render
const xss = '<script>alert("x")</script>';
QEngine.saveAnswer('Q1', xss);
ok('XSS stored verbatim in state', QEngine._state.answers['Q1'] === xss);
ok('XSS escaped by _esc()', QEngine._esc(xss) === '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');

// Unicode + emoji
const u = 'Café · 中文 · 🚀 · مرحبا';
QEngine.saveAnswer('Q4', u);
ok('Unicode/emoji round-trips', QEngine._state.answers['Q4'] === u);

// Whitespace-only
ok('Whitespace-only text not answered', !QEngine._isAnswered({ type:'text', id:'WS', section:'org' }));
QEngine._state.answers['WS'] = '   ';
ok('Triple-space text not answered',     !QEngine._isAnswered({ type:'text', id:'WS', section:'org' }));

// Empty multi
QEngine._state.answers['EM'] = [];
ok('Empty multi not answered', !QEngine._isAnswered({ type:'multi', id:'EM', section:'org' }));

// Branching toggles dynamically
const beforeRWA = QEngine.visibleQuestions().find(q => q.id === 'Q-RWA');
ok('Q-RWA hidden when Q-BCK unset', !beforeRWA);
QEngine.saveAnswer('Q-BCK', 'Yes');
const afterRWA = QEngine.visibleQuestions().find(q => q.id === 'Q-RWA');
ok('Q-RWA visible when Q-BCK=Yes', !!afterRWA);
QEngine.saveAnswer('Q-BCK', 'No');
ok('Q-RWA hidden after Q-BCK=No', !QEngine.visibleQuestions().find(q => q.id === 'Q-RWA'));

// Region scope
mountFor('CTO','Europe','Cards');
ok('NA-only hidden in EU', !QEngine.visibleQuestions().find(q => q.id === 'Q-NA'));
ok('EU-only visible in EU',  !!QEngine.visibleQuestions().find(q => q.id === 'Q-EU'));

// Domain scope
mountFor('CTO','North America','Trade Finance');
ok('Cards-only hidden in Trade Finance', !QEngine.visibleQuestions().find(q => q.id === 'Q-CARDS'));
mountFor('CTO','North America','Cards');
ok('Cards-only visible in Cards',         !!QEngine.visibleQuestions().find(q => q.id === 'Q-CARDS'));

// Role scope
mountFor('Business Owner','North America','Cards');
ok('Role CTO-only hidden for Business Owner', !QEngine.visibleQuestions().find(q => q.id === 'Q-CTO'));
ok('Role CRO-only hidden for Business Owner', !QEngine.visibleQuestions().find(q => q.id === 'Q-CRO'));
mountFor('CTO','North America','Cards');
ok('Role CTO-only visible for CTO',           !!QEngine.visibleQuestions().find(q => q.id === 'Q-CTO'));

// Resume across remount
mountFor('CTO','North America','Cards');
QEngine.saveAnswer('Q1', 'Resume Project');
QEngine.mount({ rootEl:mockRoot, packs:PACKS, role:'CTO', region:'North America', domain:'Cards' });
ok('Answers persist across remount', QEngine._state.answers['Q1'] === 'Resume Project');

QEngine.reset();
ok('Reset() clears answers', Object.keys(QEngine._state.answers).length === 0);

// Empty pack
QEngine._root = mockRoot; QEngine._packs = { sections:[{id:'x',title:'X'}], questions:[], roles:[], regions:[], domains:[] };
QEngine._state = { role:'X', region:'X', domain:'X', answers:{}, currentSection:0, onComplete:()=>{}, onProgress:()=>{} };
ok('Empty pack → progress 0/0', QEngine.progress().total === 0);
ok('Empty pack → no errors',     QEngine.validateAll().length === 0);

// Output structure
mountFor('CTO','North America','Cards');
QEngine.saveAnswer('Q1', 'X');
const c = QEngine.consolidate();
ok('Output.profile.role=CTO',                       c.profile.role === 'CTO');
ok('Output.derivedArtifacts.requirements is array', Array.isArray(c.derivedArtifacts.requirements));
ok('Output.derivedArtifacts.raidItems is array',    Array.isArray(c.derivedArtifacts.raidItems));
ok('Output.derivedArtifacts.complianceChecklist is array', Array.isArray(c.derivedArtifacts.complianceChecklist));
ok('Output.derivedArtifacts.discoveryFields is object', typeof c.derivedArtifacts.discoveryFields === 'object');

// JSON serializable
ok('Consolidate output JSON-serializable', (()=>{ try { JSON.parse(JSON.stringify(c)); return true; } catch(e){ return false; } })());

console.log('\n══════════════════════════════════════════');
console.log(`  ${pass} passed · ${fail} failed`);
console.log('══════════════════════════════════════════');
if (fail > 0) { console.log('\nFailures:'); failures.forEach(f=>console.log('  · '+f)); process.exit(1); }
process.exit(0);
