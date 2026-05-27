/**
 * Bridge · post Playwright results to testing-master's tm_post_external.
 *
 * Reads playwright-report/results.json, converts to LayerProbeResult[],
 * POSTs to the testing-master /mcp endpoint. Result appears in
 * https://aidp-platform.pages.dev/testing-dashboard.html as a fleet
 * scope · e2e-browser layer entry.
 *
 * Run after `playwright test` succeeds OR fails · this script always
 * exits 0 (the workflow's exit code is decided by playwright itself).
 */
import fs from "node:fs";

const TM_URL = process.env.TM_URL
  || "https://aiagenticplanner-testing-master.kishorenishanthkumar.workers.dev/mcp";
const RESULTS_FILE = process.env.PW_RESULTS_FILE || "playwright-report/results.json";
const REF = process.env.GITHUB_SHA ? `${process.env.GITHUB_SHA.slice(0,12)}` : "local";

function probesFromSpec(file) {
  if (!fs.existsSync(file)) {
    console.warn(`[bridge] results file not found at ${file} · skipping`);
    return [];
  }
  const report = JSON.parse(fs.readFileSync(file, "utf-8"));
  const probes = [];
  /* Playwright JSON: { suites: [{ specs: [{ title, tests: [{ status, results: [{duration}] }] }] }] } */
  function walk(suites) {
    for (const s of suites || []) {
      for (const spec of s.specs || []) {
        for (const t of spec.tests || []) {
          const first = (t.results && t.results[0]) || {};
          const status = (first.status === "passed") ? "pass"
                        : (first.status === "skipped") ? "skip"
                        : "fail";
          const probe = {
            name: spec.title,
            status,
            duration_ms: first.duration || 0,
            evidence: { project: t.projectName || "chromium", retries: (t.results || []).length - 1 }
          };
          if (status === "fail") {
            const msg = (first.error && (first.error.message || first.error.value)) || "Playwright test failed";
            /* Minimal payload · tm_post_external fills in id/layer/scope from
             * the run context (scope=fleet, layer=e2e-browser). */
            probe.defect = {
              severity: "high",
              title: `E2E: ${spec.title}`,
              description: String(msg).slice(0, 500),
              evidence: { stack: String(first.error && first.error.stack || "").slice(0, 1500) },
              suggested_fix: "Inspect Playwright trace · check selectors, page load timing, and console errors."
            };
          }
          probes.push(probe);
        }
        walk(spec.suites || []);
      }
      walk(s.suites || []);
    }
  }
  walk(report.suites || []);
  return probes;
}

const probes = probesFromSpec(RESULTS_FILE);
if (!probes.length) {
  console.warn("[bridge] no probes parsed · exiting 0 without posting");
  process.exit(0);
}

const summary = probes.reduce((a, p) => { a[p.status] = (a[p.status] || 0) + 1; return a; }, {});
console.log(`[bridge] parsed ${probes.length} probes ·`, summary);

const body = JSON.stringify({
  jsonrpc: "2.0", id: "bridge-" + Date.now(),
  method: "tools/call",
  params: {
    name: "tm_post_external",
    arguments: { scope: "fleet", layer: "e2e-browser", ref: REF, probes }
  }
});

try {
  const resp = await fetch(TM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });
  const text = await resp.text();
  console.log(`[bridge] POST ${TM_URL} → ${resp.status}`);
  console.log(`[bridge] response: ${text.slice(0, 500)}`);
} catch (err) {
  console.warn(`[bridge] POST failed: ${err.message}`);
}
/* Always exit 0 · playwright's own exit code drives the workflow gate. */
process.exit(0);
