/* ═══════════════════════════════════════════════════════
   DI Platform · canonical exporter (Phase 22.1)
   Public API:
     window.DI.export.workbook(name, sheets)   → builds & downloads .xlsx
     window.DI.export.canonical()              → snapshot of all artifacts as JSON
     window.DI.export.canonicalToWorkbook()    → snapshot exported as multi-sheet .xlsx
     window.DI.export.json(name, data)         → downloads JSON
     window.DI.export.csv(name, headers, rows) → downloads CSV

   Loads SheetJS (xlsx) lazily from CDN only when first xlsx export is needed.
═══════════════════════════════════════════════════════ */
(function () {
  if (window.DI && window.DI.export) return;
  window.DI = window.DI || {};

  const XLSX_CDN = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
  let xlsxPromise = null;

  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (xlsxPromise) return xlsxPromise;
    xlsxPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = XLSX_CDN;
      s.onload = () => resolve(window.XLSX);
      s.onerror = () => reject(new Error('Failed to load SheetJS from CDN'));
      document.head.appendChild(s);
    });
    return xlsxPromise;
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /* ── Build a workbook from a list of sheets ──────────
     sheets = [{ name: 'Requirements', rows: [{...}, ...], headers: ['ID','Title',...], colWidths: [10,40,...] }]
  ═══════════════════════════════════════════════════════ */
  async function workbook(fileName, sheets) {
    try {
      const XLSX = await loadXLSX();
      const wb = XLSX.utils.book_new();
      sheets.forEach(s => {
        const headers = s.headers || (s.rows.length ? Object.keys(s.rows[0]) : []);
        const data = [headers].concat((s.rows || []).map(r => headers.map(h => {
          const v = (typeof r === 'object') ? r[h] : '';
          if (v == null) return '';
          if (Array.isArray(v)) return v.join('; ');
          if (typeof v === 'object') return JSON.stringify(v);
          return v;
        })));
        const ws = XLSX.utils.aoa_to_sheet(data);
        // Column widths
        if (s.colWidths) {
          ws['!cols'] = s.colWidths.map(w => ({ wch: w }));
        } else {
          ws['!cols'] = headers.map((h, i) => ({
            wch: Math.max(h.length, Math.min(60, Math.max.apply(null, data.slice(1).map(r => String(r[i] || '').length).concat([h.length]))))
          }));
        }
        XLSX.utils.book_append_sheet(wb, ws, (s.name || 'Sheet').slice(0, 31));
      });
      const fname = fileName || 'export-' + new Date().toISOString().slice(0,10) + '.xlsx';
      XLSX.writeFile(wb, fname);
      if (window.DI && window.DI.toast) window.DI.toast({ kind:'ok', icon:'⬇', title:'Excel downloaded', message: fname });
      if (window.DI && window.DI.audit) window.DI.audit.log('export', 'xlsx', { fileName: fname, sheets: sheets.length });
      return true;
    } catch (e) {
      if (window.DI && window.DI.toast) window.DI.toast({ kind:'err', title:'Excel export failed', message: e.message });
      return false;
    }
  }

  /* ── Canonical platform snapshot ─────────────────────
     Collects every artifact in localStorage / sessionStorage into a single
     JSON object that follows a stable schema. Useful for backup, handoff,
     and audit. */
  function canonical() {
    const get = (storage, key) => { try { return JSON.parse(storage.getItem(key) || 'null'); } catch (e) { return null; } };
    return {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      generatedBy: (() => { const p = get(sessionStorage, 'di_account_profile'); return (p && p.email) || 'guest'; })(),
      platform: 'DI Platform',
      profile:           get(sessionStorage, 'di_account_profile'),
      questionnaire:     get(sessionStorage, 'di_questionnaire_output'),
      discovery:         get(localStorage,   'di_discovery_v1'),
      architecture:      get(localStorage,   'di_architecture_v1'),
      evpInput:          get(localStorage,   'di_evp_input'),
      sow:               get(localStorage,   'di_sow_v1'),
      governance:        get(localStorage,   'di_governance_v1'),
      requirements:      get(localStorage,   'di_requirements_v1'),
      actions:           get(localStorage,   'di_actions_v1'),
      blockchain:        get(localStorage,   'di_blockchain_v1'),
      auditLog:          get(localStorage,   'di_audit_log_v1') || [],
      handoffs: {
        toArchitecture:    get(localStorage, 'di_handoff_architecture'),
        toGovernance:      get(localStorage, 'di_handoff_governance'),
        fromQuestionnaire: get(localStorage, 'di_handoff_from_questionnaire')
      }
    };
  }

  /* ── Canonical to multi-sheet workbook ────────────── */
  async function canonicalToWorkbook(fileName) {
    const c = canonical();
    const sheets = [];

    // Profile sheet
    if (c.profile) {
      sheets.push({ name: 'Profile', headers: ['Key','Value'], rows: Object.keys(c.profile).map(k => ({ Key:k, Value: c.profile[k] })) });
    }

    // Discovery — capability list + 7R verdicts
    if (c.discovery && c.discovery.results && c.discovery.results.capabilities) {
      sheets.push({
        name: 'Discovery · 7R',
        headers: ['ID','Capability','Verdict','Verdict Name','Current System','Future System','Target Cloud','Risk','Effort','Monthly Cost','3-yr Savings','Critical'],
        rows: c.discovery.results.capabilities.map(x => ({
          ID: x.id, Capability: x.name, Verdict: x.verdict, 'Verdict Name': x.verdictName, 'Current System': x.current,
          'Future System': x.future, 'Target Cloud': x.stack, Risk: x.risk, Effort: x.eff,
          'Monthly Cost': x.monthly || 0, '3-yr Savings': x.savings3yr || 0, Critical: !!x.critical
        })),
        colWidths: [16, 32, 10, 14, 32, 32, 14, 8, 12, 14, 14, 10]
      });
    }

    // Architecture — picks + prices
    if (c.architecture && c.architecture.capabilities && c.architecture.capabilities.length) {
      sheets.push({
        name: 'Architecture',
        headers: ['ID','Capability','Verdict','Chosen Cloud','Monthly Cost','3-yr TCO'],
        rows: c.architecture.capabilities.map(x => ({
          ID: x.id, Capability: x.name, Verdict: x.verdict, 'Chosen Cloud': (c.architecture.picks && c.architecture.picks[x.id]) || x.stack || x.chosenCloud, 'Monthly Cost': x.monthly || 0, '3-yr TCO': (x.monthly || 0) * 36
        })),
        colWidths: [16, 32, 10, 14, 14, 14]
      });
    }

    // Requirements
    if (c.requirements && c.requirements.requirements) {
      sheets.push({
        name: 'Requirements',
        headers: ['ID','Capability','Lens','Title','Description','Roles','Regulators','Priority','Source'],
        rows: c.requirements.requirements.map(r => ({
          ID: r.id, Capability: r.capId, Lens: r.lens, Title: r.title, Description: r.desc,
          Roles: (r.roles || []).join('; '), Regulators: (r.regs || []).join('; '), Priority: r.priority, Source: r.source
        })),
        colWidths: [10, 18, 8, 40, 60, 22, 22, 8, 22]
      });
    }

    // Actions
    if (c.actions && c.actions.actions) {
      sheets.push({
        name: 'Actions',
        headers: ['ID','Title','Role','Owner','Priority','Status','Due','Source','$ Impact','Outcome','Recommendation'],
        rows: c.actions.actions.map(a => ({
          ID: a.id, Title: a.title, Role: a.role, Owner: a.ownerName, Priority: a.priority,
          Status: a.status, Due: a.due, Source: a.source, '$ Impact': a.dollarImpact || 0,
          Outcome: a.outcome, Recommendation: a.recommendation
        })),
        colWidths: [10, 50, 14, 20, 8, 12, 12, 24, 12, 32, 60]
      });
    }

    // Governance RAID
    if (c.governance && c.governance.raid) {
      sheets.push({
        name: 'Governance · RAID',
        headers: ['ID','Type','Severity','Description','Owner','Status','Created At'],
        rows: c.governance.raid.map(r => ({
          ID: r.id, Type: r.type, Severity: r.sev, Description: (r.desc || '').replace(/<[^>]+>/g, ''),
          Owner: r.owner, Status: r.status, 'Created At': r.createdAt
        })),
        colWidths: [10, 6, 8, 60, 18, 12, 22]
      });
    }

    // SOW summary
    if (c.sow) {
      const sheetRows = [
        { Key: 'Version',         Value: c.sow.version },
        { Key: 'Status',          Value: c.sow.status },
        { Key: 'Effective Date',  Value: c.sow.effectiveDate },
        { Key: 'Client',          Value: c.sow.clientLegalName },
        { Key: 'Vendor',          Value: c.sow.vendorName },
        { Key: 'Fixed Price',     Value: c.sow.fixedPrice },
        { Key: 'Duration Months', Value: c.sow.durationMonths }
      ];
      sheets.push({ name: 'SOW', headers: ['Key','Value'], rows: sheetRows, colWidths: [22, 50] });
      if (c.sow.milestones) {
        sheets.push({
          name: 'SOW · Milestones',
          headers: ['#','Title','Deliverable','Month','Payment %'],
          rows: c.sow.milestones.map(m => ({ '#': m.id, Title: (m.title||'').replace(/<[^>]+>/g,''), Deliverable: (m.deliverable||'').replace(/<[^>]+>/g,''), Month: m.month, 'Payment %': m.pct })),
          colWidths: [6, 42, 44, 8, 12]
        });
      }
    }

    // Audit log
    if (c.auditLog && c.auditLog.length) {
      sheets.push({
        name: 'Audit log',
        headers: ['Timestamp','Source','Action','User','Meta'],
        rows: c.auditLog.slice(-500).map(e => ({
          Timestamp: e.ts, Source: e.source, Action: e.action, User: e.user, Meta: e.meta ? JSON.stringify(e.meta) : ''
        })),
        colWidths: [22, 16, 28, 28, 50]
      });
    }

    if (!sheets.length) {
      sheets.push({ name: 'Empty', headers: ['Note'], rows: [{ Note: 'No artifacts to export yet. Run Discovery → Architecture → EVP first.' }], colWidths: [80] });
    }

    return workbook(fileName || 'di-platform-snapshot-' + new Date().toISOString().slice(0,10) + '.xlsx', sheets);
  }

  /* ── JSON / CSV convenience ───────────────────────── */
  function json(fileName, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, fileName || 'export-' + new Date().toISOString().slice(0,10) + '.json');
    if (window.DI && window.DI.toast) window.DI.toast({ kind:'ok', icon:'⬇', title:'JSON downloaded', message: fileName });
    if (window.DI && window.DI.audit) window.DI.audit.log('export', 'json', { fileName });
  }

  function csv(fileName, headers, rows) {
    const escapeCSV = v => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const text = headers.map(escapeCSV).join(',') + '\n' +
      rows.map(r => headers.map(h => escapeCSV((typeof r === 'object') ? r[h] : '')).join(',')).join('\n');
    downloadBlob(new Blob([text], { type: 'text/csv' }), fileName || 'export-' + new Date().toISOString().slice(0,10) + '.csv');
    if (window.DI && window.DI.toast) window.DI.toast({ kind:'ok', icon:'⬇', title:'CSV downloaded', message: fileName });
    if (window.DI && window.DI.audit) window.DI.audit.log('export', 'csv', { fileName });
  }

  window.DI.export = { workbook, canonical, canonicalToWorkbook, json, csv };
})();
