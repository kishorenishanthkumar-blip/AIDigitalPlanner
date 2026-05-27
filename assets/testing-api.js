/* ─────────────────────────────────────────────────────────────────
   AIDP testing-master API client · v1
   Thin window.TM facade over the testing-master Worker's MCP surface.

     window.TM.runSuite(scope, opts?)   → Promise<TestRunReport>
     window.TM.runLayer(layer, scope?)  → Promise<TestRunReport>
     window.TM.getReport(runId)         → Promise<TestRunReport | { error }>
     window.TM.listRuns(opts?)          → Promise<{ runs, count }>
     window.TM.knownLayers()            → Promise<{ internal, external }>
     window.TM.patchStatus(defId, st)   → Promise<{ ok, def_id, status }>
     window.TM.postExternal(scope, layer, probes) → Promise<TestRunReport>
     window.TM.health()                 → Promise<HealthBlob>

   All calls auto-handle JSON-RPC envelope unwrap + the standard
   `{ result: { content: [{ text: <stringified JSON> }] } }` MCP
   response shape. Errors come back as thrown Error objects.
═════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const SUBDOMAIN = 'kishorenishanthkumar';
  const BASE_URL  = `https://aiagenticplanner-testing-master.${SUBDOMAIN}.workers.dev`;
  const TIMEOUT_MS = 60_000;
  const DEFAULT_TRIGGERED_BY = () => {
    try {
      const ls = window.localStorage;
      const u  = (ls && (ls.getItem('aidp_user_email') || ls.getItem('user_email'))) || '';
      return u || 'browser@aidp.local';
    } catch { return 'browser@aidp.local'; }
  };

  async function callTool(toolName, args) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(`${BASE_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
          method: 'tools/call',
          params: { name: toolName, arguments: args || {} }
        }),
        signal: controller.signal
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status} from testing-master`);
      const env = await resp.json();
      if (env.error) throw new Error(`JSON-RPC error: ${env.error.message || JSON.stringify(env.error)}`);
      const text = env.result?.content?.[0]?.text;
      if (text === undefined) throw new Error(`Empty content from ${toolName}`);
      if (env.result?.isError) throw new Error(`Tool error: ${text}`);
      try { return JSON.parse(text); }
      catch { return { raw: text }; }
    } finally {
      clearTimeout(timer);
    }
  }

  /* ─── Public API ────────────────────────────────── */

  async function runSuite(scope, opts) {
    opts = opts || {};
    return callTool('tm_run_suite', {
      scope:          scope || 'fleet',
      layers:         opts.layers,
      ref:            opts.ref,
      trigger_source: opts.trigger_source || 'manual',
      triggered_by:   opts.triggered_by   || DEFAULT_TRIGGERED_BY()
    });
  }

  async function runLayer(layer, scope) {
    return callTool('tm_run_layer', { layer: layer, scope: scope || 'fleet' });
  }

  async function getReport(runId) {
    return callTool('tm_get_report', { run_id: runId });
  }

  async function listRuns(opts) {
    opts = opts || {};
    return callTool('tm_list_runs', { scope: opts.scope, limit: opts.limit || 25 });
  }

  async function knownLayers() {
    return callTool('tm_known_layers', {});
  }

  async function patchStatus(defId, status, patchPr) {
    return callTool('tm_patch_status', { def_id: defId, status, patch_pr: patchPr });
  }

  async function postExternal(scope, layer, probes) {
    return callTool('tm_post_external', { scope, layer, probes });
  }

  async function health() {
    const resp = await fetch(`${BASE_URL}/health`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} from /health`);
    return resp.json();
  }

  async function triggerE2e(opts) {
    opts = opts || {};
    return callTool('tm_trigger_e2e', { ref: opts.ref, inputs: opts.inputs });
  }

  /* ─── Expose ────────────────────────────────────── */

  window.TM = {
    runSuite, runLayer, getReport, listRuns,
    knownLayers, patchStatus, postExternal, health, triggerE2e,
    BASE_URL
  };

  // Helpful console banner so devs know the API is loaded.
  try {
    console.log('[AIDP] testing-master API client v1 loaded ·', BASE_URL);
  } catch {}
})();
