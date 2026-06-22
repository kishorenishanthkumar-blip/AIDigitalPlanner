/* ─────────────────────────────────────────────────────────────────
   AIDP Studio Test · one-line trigger for tm_run_suite from any page
   v1 · Phase 0 of the 8-studio rewrite

   Usage from a studio's action bar:

     <button class="aidp-btn aidp-btn-sm"
             onclick="AIDPTest.runStudioTestSuite('discovery-studio')">
       🧪 Run tests
     </button>

   The helper:
     - calls testing-master's tm_run_suite with the given scope
     - shows a "running" toast immediately, then a verdict toast
     - links to the testing-dashboard if there are defects
     - returns the full TestRunReport via Promise for further inspection

   Requires:
     - window.TM (from assets/testing-api.js) · auto-loads if missing
     - window.AIDPStudio (from assets/studio-shell.js) for toasts

   Public API: window.AIDPTest
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const TM_BASE_URL = 'https://aiagenticplanner-testing-master.kishorenishanthkumar.workers.dev';
  const DASHBOARD_URL = '/testing-dashboard';

  function toast(kind, title, message) {
    if (window.AIDPStudio && window.AIDPStudio.toast) {
      window.AIDPStudio.toast(kind, title, message);
    } else if (window.DI && window.DI.toast) {
      window.DI.toast({ kind, title, message });
    } else {
      console.log('[AIDPTest ' + kind + ']', title, message || '');
    }
  }

  function getUserEmail() {
    if (window.AIDPStudio && window.AIDPStudio.getUserEmail) return window.AIDPStudio.getUserEmail();
    try {
      const ls = window.localStorage;
      return (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || 'browser@aidp.local';
    } catch { return 'browser@aidp.local'; }
  }

  /**
   * Run the full testing-master suite against a given scope.
   * Drops a "running" toast, awaits the result, then surfaces a verdict toast.
   *
   * @param {string} scope - e.g. "discovery-studio", "architecture-studio", "fleet"
   * @param {object} [opts] - { layers?: string[], ref?: string, silent?: boolean }
   * @returns {Promise<TestRunReport | null>} the parsed run report, or null on hard failure
   */
  async function runStudioTestSuite(scope, opts) {
    opts = opts || {};
    const silent = !!opts.silent;
    if (!scope) {
      toast('err', 'No scope', 'runStudioTestSuite needs a scope name');
      return null;
    }
    if (!silent) toast('info', 'Running tests · ' + scope, 'tm_run_suite started · ~3-5s');

    // UI-02 · prefer the authenticated MCP gateway; fall back to direct on failure.
    if (window.AIDP && typeof window.AIDP.callAgent === 'function') {
      try {
        const report = await window.AIDP.callAgent('TESTING_MASTER', 'tm_run_suite', {
          scope: scope, layers: opts.layers,
          ref: opts.ref || ('studio-button://' + (location.pathname || '')),
          trigger_source: 'manual', triggered_by: getUserEmail()
        }, { timeoutMs: 60000 });
        if (!silent) renderVerdictToast(report);
        return report;
      } catch (e) { /* fall through to direct */ }
    }
    try {
      const resp = await fetch(TM_BASE_URL + '/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'studio-' + Math.random().toString(36).slice(2, 8),
          method: 'tools/call',
          params: {
            name: 'tm_run_suite',
            arguments: {
              scope:           scope,
              layers:          opts.layers,
              ref:             opts.ref || ('studio-button://' + (location.pathname || '')),
              trigger_source:  'manual',
              triggered_by:    getUserEmail()
            }
          }
        })
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const env = await resp.json();
      if (env.error) throw new Error('JSON-RPC: ' + (env.error.message || JSON.stringify(env.error)));
      const text = env.result?.content?.[0]?.text;
      if (!text) throw new Error('Empty content from tm_run_suite');
      const report = JSON.parse(text);

      /* Verdict toast · linked to dashboard when defects exist. */
      if (!silent) renderVerdictToast(report);
      return report;
    } catch (err) {
      if (!silent) toast('err', 'Test run failed', err.message || String(err));
      console.warn('[AIDPTest]', err);
      return null;
    }
  }

  function renderVerdictToast(report) {
    const blocking = report.blocking_count || 0;
    const fail     = report.summary?.fail    || 0;
    const pass     = report.summary?.pass    || 0;
    if (report.passed) {
      toast('ok', '✓ Gate green · ' + report.scope,
        pass + ' pass · ' + fail + ' fail · run_id ' + (report.run_id || '').slice(-12));
    } else {
      toast('warn', '⚠ Gate failed · ' + blocking + ' blocking',
        'Open the dashboard for defect detail');
      /* Stash the latest report for chatbot / debug inspection. */
      try { window._lastTmReport = report; } catch {}
    }
  }

  /**
   * Convenience: open testing-dashboard with the given scope pre-filtered.
   * Useful as a "View tests" sibling button next to "Run tests".
   */
  function openDashboard(scope) {
    if (scope) {
      window.location.href = DASHBOARD_URL + '?scope=' + encodeURIComponent(scope);
    } else {
      window.location.href = DASHBOARD_URL;
    }
  }

  /**
   * Quick health probe to testing-master. Used by studios that want to
   * gate the "Run tests" button on testing-master availability.
   */
  async function tmHealth() {
    try {
      const r = await fetch(TM_BASE_URL + '/health');
      if (!r.ok) return { ok: false, status: r.status };
      const body = await r.json();
      return { ok: !!body.ok, body };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  /* ─── Expose ──────────────────────────────────────────── */

  window.AIDPTest = { runStudioTestSuite, openDashboard, tmHealth, TM_BASE_URL };

  /* Typo-tolerant alias · `IDPTest` (no leading A) also works. */
  window.IDPTest = window.AIDPTest;

  try { console.log('[AIDP] studio-test v1 loaded · also available as IDPTest · target', TM_BASE_URL); } catch {}
})();
