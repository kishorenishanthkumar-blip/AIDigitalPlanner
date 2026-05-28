# AIDP Platform · Backlog · Executable Prompts

**Companion to:** `BACKLOG.md` (inventory)
**Generated:** 2026-05-27
**Purpose:** Each pending item is a copy-pasteable prompt sized to a single focused session, ordered so that risk and complexity ramp up gradually.

## Prioritization criteria

Each item was scored on four axes (HIGH / MED / LOW):

| Axis | Definition |
|---|---|
| **Criticality** | What hurts if we don't ship it? Silent operational failure = HIGH. Nice-to-have = LOW. |
| **UX uplift** | How much does it improve what the user sees / does? Major new capability = HIGH. Cosmetic = LOW. |
| **Perf impact** | Does it add load to D1 / Workers / LLM tokens? Heavy = HIGH. Read-only or client-only = LOW. |
| **Deploy risk** | Chance of regression on rollout. New auth path = HIGH. Pure additive UI = LOW. |

**Order rule:** ship LOW-risk + HIGH-UX items first to build confidence. Defer HIGH-risk items until they're worth the disruption.

---

## Wave 1 · Quick wins · ~6 hr · zero-to-low deploy risk

These all add value without touching the agent fleet or auth model. Safe to ship one after another in a single afternoon.

---

### W1-A · PEND-3 · PAT rotation reminder

**Effort:** 30 min · **Criticality:** HIGH · **UX:** LOW · **Perf:** ZERO · **Risk:** ZERO

If the PAT silently expires ~Aug 25, 2026, the "Also run browser E2E" checkbox starts failing silently. A scheduled reminder eliminates that risk.

````prompt
Create two scheduled reminders for the AIDP platform owner:

1. A one-off task that fires at 2026-08-14 09:00 local time with the message:
   "AIDP testing-master GITHUB_TOKEN PAT expires in ~11 days (≈2026-08-25).
   Rotate it: github.com/settings/personal-access-tokens → revoke
   aidp-testing-master-e2e-trigger-v2 → create v3 with same scopes
   (Actions: Read+Write on AIDigitalPlanner) → wrangler secret put GITHUB_TOKEN
   on the testing-master worker."

2. A one-off task that fires at 2026-08-24 09:00 local time with the same message,
   tagged "FINAL WARNING — expires tomorrow."

Use mcp__scheduled-tasks__create_scheduled_task with fireAt timestamps.
Confirm both tasks appear in mcp__scheduled-tasks__list_scheduled_tasks.
````

**Acceptance:** Two tasks scheduled. No CI changes. No code changes.

---

### W1-B · PEND-1 · Defect status workflow dropdown

**Effort:** 2 hr · **Criticality:** MED · **UX:** HIGH · **Perf:** ZERO · **Risk:** LOW

`tm_patch_status` backend tool already exists. `window.TM.patchStatus(defId, status, patchPr)` wrapper already exists. The dashboard just doesn't expose it. This is pure frontend.

````prompt
Goal: turn /testing-dashboard from passive defect viewing into real triage.

In testing-dashboard.html, locate `renderDefects(report)` (around line 470).
Today each defect row shows: severity | layer | agent | tool | title | defect ID.

Add a new column "Status" between "Defect ID" and the end. The cell contains a
<select> with options: open · in_progress · fixed · wont_fix · duplicate.
Default selection comes from defect.patch_status (defaults to "open" if missing).

When the select's value changes:
1. Call window.TM.patchStatus(defectId, newStatus).
2. On success: show a window.DI.toast({kind:'ok', title:'Status updated', message:`${defectId} → ${newStatus}`}).
3. On failure: revert the select and toast({kind:'err',...}).
4. Update the defect in STATE.selectedReport.defects in-place so re-renders don't
   wipe the change.

Also update the KPI tile "OPEN DEFECTS" to count only defects where
patch_status is "open" or "in_progress" (skip fixed/wont_fix/duplicate).

Use the existing chip styling for the dropdown (font-family, sizes match other
table elements). Add 5 lines of CSS for the .chip-status-{value} colors:
- open: red-tinted background
- in_progress: amber
- fixed: green
- wont_fix: grey
- duplicate: grey with strikethrough

Acceptance:
- Click a defect row, change status, refresh — change persists (D1 round-trip).
- KPI tile recounts.
- No console errors.
- Existing 17 Playwright tests still pass.

Push backend? NO — backend is unchanged. Push frontend? YES.
````

**Acceptance:** Defects can be triaged from the dashboard, status persists across reloads, OPEN DEFECTS KPI is accurate.

---

### W1-C · PEND-5 · Severity rollup sparkline

**Effort:** 2 hr · **Criticality:** LOW · **UX:** HIGH · **Perf:** ZERO · **Risk:** ZERO

Pure client-side rendering over already-loaded run data.

````prompt
Goal: add a trend sparkline to /testing-dashboard so users see "we've been red
for 3 days" not just "today's run is green."

In testing-dashboard.html, add a new card below the 4 KPI tiles called "Trend
(last 25 runs)" with an inline SVG sparkline 480×60 px.

Each of the 25 most-recent runs becomes one vertical bar:
- Green (#0A8462) if r.passed === true AND r.blocking_count === 0
- Amber (#C8921A) if !r.passed but blocking_count === 0
- Red (#DC2626) if blocking_count > 0
- Bar height = log10(r.summary.pass + r.summary.fail + 1) × 8 px (capped at 50px)

Order: oldest left, newest right. Hover over a bar shows a tooltip with
run_id, scope, pass/fail/blocking, and started_at.

Data source: STATE.runs (already populated by loadRuns()). If fewer than 25
runs, render whatever exists.

When the user clicks a bar, set STATE.selectedRunId = that run_id and call
selectRun(...) — same behavior as clicking a row in the runs table.

Acceptance:
- Card renders on page load with current data.
- Bars correctly colored.
- Hover tooltip works.
- Click-to-select works.
- No new network calls (read-only over existing state).
- Mobile responsive (sparkline scales to container width via viewBox).

Push frontend only.
````

**Acceptance:** Trend visible at-a-glance, no backend changes, no perf impact.

---

### W1-D · PEND-6 · Run Suite "all scopes" sequential mode

**Effort:** 1-2 hr · **Criticality:** LOW · **UX:** HIGH · **Perf:** LOW · **Risk:** LOW

Saves clicks during regression sweeps. Pure orchestration over existing API.

````prompt
Goal: add a "Run all scopes sequentially" option to the Run Suite modal in
/testing-dashboard so a regression sweep doesn't require 5 manual clicks.

In testing-dashboard.html, in the #m-scope <select> (around line 285),
add a new option at the top:
  <option value="__all__">All scopes (sequential · ~25 sec)</option>

In window.triggerRun, detect when scope === "__all__":
1. Define the sweep list: ["discovery-studio", "architecture-studio",
   "requirements-studio", "operations-studio", "fleet"].
2. For each scope in the list:
   a. Update the button text: "⏳ Running ${scope}…"
   b. Call window.TM.runSuite(scope, { ref }).
   c. Accumulate the result in a local array.
3. After all 5 complete, show a single summary toast:
   "Sweep complete · 5 runs · X pass · Y fail · Z blocking"
   (sum across all 5 results).
4. Show a window.DI.toast({kind: any-fail ? 'warn' : 'ok', ...}).
5. Set STATE.selectedReport to the LAST run's report and refresh the table.

Do not run in parallel — sequential keeps the worker quota predictable and
the user sees progress one scope at a time.

Add the "Also run browser E2E" checkbox behavior: if checked, fire
TM.triggerE2e ONCE at the end (not 5 times).

Acceptance:
- Modal opens, "All scopes" option visible.
- Clicking Run Now triggers 5 sequential calls, button text updates per scope.
- After all 5, single summary toast.
- Recent runs table shows 5 new rows.
- "Also run browser E2E" fires exactly once.
- Cancel button mid-sweep aborts cleanly (no zombie call).

Push frontend only.
````

**Acceptance:** One click → 5 sequential runs → 1 summary toast. Optional E2E fires once.

---

## Wave 2 · UX uplift · ~7 hr · medium deploy risk

These add observable new capabilities. Test thoroughly before pushing.

---

### W2-A · PEND-2 · Niche-I → testing-master tool-use

**Effort:** 3 hr · **Criticality:** MED · **UX:** HIGH · **Perf:** LOW · **Risk:** MED

Niche-I already routes to 11 sub-agents via the master-agent LLM router. Adding testing-master is one more cross-binding + tool catalog entry.

````prompt
Goal: let users ask Niche-I in natural language "run a fleet test", "what's
red right now?", "show me the last 5 runs", and have it call tm_run_suite /
tm_list_runs / tm_get_report via tool-use.

Step 1 — backend cross-binding (Agentic AI Planner repo):
In apps/master-agent/wrangler.toml, add a [[services]] binding for
TESTING_MASTER pointing to "aiagenticplanner-testing-master".

In apps/master-agent/src/env.ts, add:
  TESTING_MASTER?: Fetcher;

In apps/master-agent/src/router.ts (the LLM-driven router from E-3-k):
- Include the testing-master MCP catalogue when calling
  mcp.discoverAllAgentTools(env). The discovery loop is keyed off env bindings —
  add TESTING_MASTER to the list it walks.
- No prompt template changes needed; the LLM already knows how to pick a tool
  by description.

In apps/master-agent/src/mcp-client.ts (or wherever the catalogue assembler is),
add a friendly description override for the testing-master tools so the LLM
routes intent correctly:
  tm_run_suite → "Run the full test matrix for AIDP. Use for 'run tests', 'fleet test', 'regression sweep'."
  tm_list_runs → "List recent test runs. Use for 'what's red', 'recent failures', 'show me last N runs'."
  tm_get_report → "Get details on a specific test run by ID. Use for 'show me run X'."
  tm_trigger_e2e → "Trigger a browser E2E run via GitHub Actions. Use for 'run browser tests'."
  (tm_patch_status and tm_known_layers stay generic — not user-facing.)

Step 2 — verify:
Push backend, wait for Deploy Workers green, then in /nishi-chatbot try:
  - "run a fleet test"      → should call tm_run_suite scope=fleet
  - "what failed yesterday?" → should call tm_list_runs limit=10, filter client-side
  - "trigger e2e"            → should call tm_trigger_e2e

Step 3 — frontend (DI-Platform Planner repo):
Niche-I should render run results inline. Find where chat responses are
rendered. If the tool-call response shape is a TestRunReport, render a small
card with: scope · pass/fail/blocking · "Open in dashboard →" link.

Acceptance:
- Niche-I correctly picks testing-master for the 3 prompts above.
- The card renders inline.
- Existing routing (discovery, requirements, etc.) still works.

Risks to watch:
- The LLM router may over-route to testing-master if descriptions are too
  broad. Use words like "test", "run", "regression" in descriptions to scope.
- Cross-binding deploy must happen before frontend → otherwise tool calls
  return "TESTING_MASTER binding not found".
````

**Acceptance:** Niche-I responds to natural-language test commands. Existing routing untouched.

---

### W2-B · PEND-4 · Data-content E2E tests · phase 2

**Effort:** 4 hr · **Criticality:** LOW · **UX:** LOW (developer UX) · **Perf:** LOW · **Risk:** MED

Today's Steps 13-17 verify Workspace UI renders. Phase 2 verifies the studio actually responds to user input. Higher flake risk because real agents are involved.

````prompt
Goal: extend tests/e2e/happy-path.spec.ts with 5 new tests (Steps 18-22) that
exercise the agent ↔ frontend glue — not just page load.

Pattern for each test:
1. Navigate to /studio
2. Click into the Workspace (existing #${prefix}-view-workspace toggle)
3. Click the primary action button (Run / Generate / etc.)
4. Wait up to 20s for a sentinel element that only appears after the agent
   responds.
5. Assert the sentinel has substantive content (length > N).

Test sketches:
- Step 18 · Discovery agent round-trip
  Click #disc-run-7r (or whatever the Run button id is — find it via:
  `await page.locator('button:has-text("Run 7R")').first().click()`).
  Wait for a card with [data-rec-id] to appear.
  Assert ≥1 card exists with a recommendation text.

- Step 19 · Architecture agent round-trip
  Click "Generate Architecture" button.
  Wait for #arch-cost-banner or a cost-display element.
  Assert text contains "$".

- Step 20 · Requirements list renders
  In Workspace, wait for #rq-kpi-must to show a number (not "—").
  If still "—" after 15s, the agent didn't respond → test fails informatively.

- Step 21 · Actions kanban has cards
  Wait for any .ac-kanban-card to exist.
  Assert ≥1 card.

- Step 22 · Governance RAID has items
  Wait for .pgw-card inside #pg-workspace.
  Assert ≥1 card across the 4 columns combined.

Robustness tactics (anti-flake):
- Set timeout: 25_000 per test (these can be slower than smoke).
- Before clicking Run, ensure demo tenant seeder has run (page.evaluate
  loadDemoTenantSilent if not already).
- If Run button isn't visible, fall through with test.skip("Run button not found").
- Catch any networkidle failures via { waitUntil: 'domcontentloaded' }, not
  'networkidle' (agent calls happen post-load).

Acceptance:
- npx playwright test runs 22 tests total (12 + 5 + 5).
- New tests pass ≥9/10 times locally.
- CI green.

Push frontend only.
````

**Acceptance:** Real agent round-trips covered. Test count goes 17 → 22.

---

## Wave 3 · Hardening · ~10 hr · low deploy risk

Operational hygiene. Each item is independent — pick the ones you care about.

---

### W3-A · OPS-5 · Per-agent runbooks (doc-only, zero risk)

**Effort:** 3 hr · **Risk:** ZERO · **Criticality:** MED (incident response)

````prompt
Goal: write a RUNBOOK.md for each of the 12 agents in apps/agents/* so the
next person on-call doesn't have to reverse-engineer the worker.

For each agent (master, testing-master, discovery, architecture, requirements,
actions, sow, governance, operations, exception, knowledge, iac, patch, validator),
create apps/agents/${agent}/RUNBOOK.md with these sections:

1. **What this agent does** (3-5 sentences in plain English)
2. **MCP tools it exposes** (table: tool name · what it does · who calls it)
3. **Cross-bindings** (services it cross-binds to, why)
4. **Secrets / env vars it needs** (table from wrangler.toml + env.ts)
5. **D1 migrations** (file list under migrations/)
6. **Common failure modes** (bullet list with diagnosis + fix)
7. **How to deploy this agent alone** (wrangler deploy command)
8. **How to rollback** (wrangler rollback OR revert + redeploy)
9. **Health check URL**
10. **Recent on-call incidents** (start empty, append over time)

Start each file with the boilerplate template, then fill from the agent's
README.md, source code, and wrangler.toml.

Acceptance:
- 12 RUNBOOK.md files exist.
- Each is at least 100 lines (not a stub).
- Push backend repo.
````

---

### W3-B · DEFECT-* sweep (bridge isError alerting, schema validation)

**Effort:** 2 hr · **Risk:** LOW

````prompt
Goal: close out the 5 small defects logged in BACKLOG.md P4.

DEFECT-2 (bridge silent failures):
In .github/workflows/e2e-playwright.yml, after the "Post to testing-master" step,
add a verification step that fails the job if the bridge response contains
'isError'. Capture the bridge stdout to a file, then:
  if grep -q 'isError' bridge.log; then
    echo "::error::Bridge POST returned an MCP error"; exit 1
  fi

DEFECT-3 (tm_post_external ref schema):
In apps/agents/testing-master/src/handlers.ts handlePostExternal, add a regex
check on args.ref before persisting:
  if (ref && !/^[a-f0-9]{6,40}$|^https?:\/\/.+$|^[a-z0-9-]+$/.test(ref)) {
    return [{ type: "text", text: JSON.stringify({ error: "invalid ref format" }) }];
  }

DEFECT-4 (demo seeder doesn't seed D1):
In assets/demo-tenant.js loadDemoTenantSilent(), add an optional second phase:
after localStorage is set, fire 3 MCP calls in parallel:
  governance_seed_demo, operations_seed_demo, sow_seed_demo
if those tools exist on the respective agents (they may not — log gracefully).

DEFECT-5 (tm_trigger_e2e branch picker):
In testing-dashboard.html Run Suite modal, add an optional text input
"Branch (default: main)" that gets passed as ref in TM.triggerE2e({ref: ...}).

DEFECT-1 (OneDrive stale views):
Pure doc — add a section to DEPLOY.md titled "OneDrive sync gotchas" with
the workaround: "If npm run typecheck reports phantom-truncation errors, the
WSL mount is stale. Wait 10s and retry, or run from native Windows terminal."

Push both repos (backend for DEFECT-2/3, frontend for DEFECT-4/5/1).
Acceptance: 5 closed P4 items, no regressions.
````

---

### W3-C · OPS-3 · Status page (status.aiagenticplanner.com)

**Effort:** 3 hr · **Risk:** LOW

````prompt
Goal: create a public-facing status page that polls every Worker's /health
endpoint and renders a colored grid.

Option A (recommended · ship today): static HTML at /status.html in
DI-Platform Planner that does fetch() to each /health endpoint and renders.
Pros: no new infra. Cons: client-side polling.

Option B (later · production): hosted on Better Stack / Statuspage. Skip
for now.

Implementation A:
Create /status.html with:
- Header: "AIDP Platform Status"
- Grid of 14 cards, one per Worker:
  master, testing-master, discovery, architecture, requirements, actions,
  sow, governance, operations, exception, knowledge, iac, patching, validator
- Each card: GET ${BASE}/health, parse the response.
  - Green dot if ok: true
  - Yellow if ok: true but expected != bound_count (partial bindings)
  - Red if !resp.ok or ok: false
- Show response.bindings.cross.bound_count and built_at.
- Auto-refresh every 60 seconds.

Use the same theme.css as the rest of the platform.
Add to top-bar.js NAV: { label: 'Status', href: 'status.html', match: /status/i }
Add to home.html: one more tile linking to /status.

Acceptance:
- /status loads and shows 14 cards.
- Cards update every 60s.
- Failure mode: if a worker's /health returns 5xx, card goes red with the
  status code visible.

Push frontend only.
````

---

### W3-D · OPS-2 · Better Stack log ingestion

**Effort:** 4 hr · **Risk:** MED (changes logging across 14 workers)

````prompt
Goal: replace D1 log table writes with Better Stack HTTP ingestion. D1 isn't
sized for high-volume log writes; Better Stack is and has search + alerting.

Step 1 — Better Stack setup (one-time, human):
1. Sign up at betterstack.com (free tier: 1GB/month).
2. Create a "Source" of type "Cloudflare Workers".
3. Copy the source token.

Step 2 — backend wiring (per-worker, ~5 min each × 14 = ~1 hr):
For each worker, edit src/audit.ts (or wherever the log INSERT lives):
- Add env.BETTER_STACK_TOKEN (optional).
- If token present: POST to https://in.logs.betterstack.com with:
    Headers: Authorization: Bearer ${token}, Content-Type: application/json
    Body: { dt: new Date().toISOString(), agent, level, message, ...meta }
- Keep the D1 INSERT as fallback for the first 30 days (dual-write).

Step 3 — secrets:
wrangler secret put BETTER_STACK_TOKEN on every worker.

Step 4 — validate:
After 24h, query Better Stack UI for events from all 14 workers.
Then schedule a cutover: stop D1 writes, run for 7 days, then drop the
D1 log tables.

Acceptance:
- Every worker dual-writes for 30 days.
- Better Stack receives events from all 14 sources.
- No latency regression (POST to Better Stack is fire-and-forget via
  c.executionCtx.waitUntil()).

Push backend in 2 stages: instrumentation + secrets first, then 30 days
later, drop D1.

Risks:
- Forgetting waitUntil makes log writes block the request → latency.
- Token rotation: same 90-day pattern as PAT.
````

---

### W3-E · OPS-4 · Cost analytics dashboard

**Effort:** 4 hr · **Risk:** MED

````prompt
Goal: aggregate per-tenant LLM tokens + Worker requests + D1 reads/writes +
Vectorize ops into a dashboard tile / page so FinOps story has data.

Step 1 — emit cost events:
Wherever the Groq client wraps an LLM call (apps/master-agent/src/llm.ts or
similar), after each completion emit a cost event:
  await env.DB.prepare(`INSERT INTO cost_events
    (ts, tenant, agent, kind, model, input_tokens, output_tokens, est_cost_usd)
    VALUES (?,?,?,?,?,?,?,?)`).bind(...).run();

For Workers/D1/Vectorize, sample via /health endpoint emission (every poll,
the worker self-reports its own cf-ray metrics).

Step 2 — frontend:
Create /cost.html that queries an aggregator endpoint
(/cost/summary?since=YYYY-MM-DD&tenant=X) and renders:
- Total cost this month
- Breakdown by agent (bar chart)
- Breakdown by kind: LLM / Worker requests / D1 ops / Vectorize ops
- Per-tenant if more than 1 tenant exists

Use Chart.js (or roll-your-own SVG).

Acceptance:
- /cost loads with non-zero numbers after 1 day of traffic.
- Cost estimates within 20% of actual Cloudflare bill at month-end.
- No perf hit on hot path (waitUntil for cost writes).

Risks:
- Sampling errors compound — validate by spot-checking 3 days against bill.
- D1 cost_events table grows fast → set TTL or roll up daily.
````

---

## Wave 4 · Auth hardening · 4 hr · medium-high risk

### W4-A · OPS-1 · GitHub App replaces single PAT

**Effort:** 4 hr · **Risk:** MED-HIGH (auth-system change)

````prompt
Goal: replace the user-owned PAT (which expires every 90 days, dies if the
user leaves) with a GitHub App installation token (1-hour token, auto-refreshed,
org-scoped).

Step 1 — create the GitHub App (one-time, human):
1. github.com/settings/apps/new
2. Name: "AIDP Testing Master Trigger"
3. Webhook: unchecked (we don't receive events)
4. Repository permissions: Actions = Read and write
5. "Where can this GitHub App be installed?" → Only on this account
6. Generate a private key (.pem file), download it
7. Note the App ID

Step 2 — install on AIDigitalPlanner:
1. App settings → Install App → choose AIDigitalPlanner repo
2. Note the Installation ID (in the URL after install)

Step 3 — backend (testing-master):
Add @octokit/auth-app dependency to apps/agents/testing-master/package.json.

In src/env.ts replace GITHUB_TOKEN with:
  GITHUB_APP_ID?: string;
  GITHUB_APP_PRIVATE_KEY?: string;   // the .pem contents
  GITHUB_APP_INSTALLATION_ID?: string;

In src/handlers.ts handleTriggerE2e, replace the PAT logic with:
  import { createAppAuth } from '@octokit/auth-app';
  const auth = createAppAuth({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY,
    installationId: env.GITHUB_APP_INSTALLATION_ID
  });
  const { token } = await auth({ type: 'installation' });
  // ... use token in Authorization: Bearer ${token}

Step 4 — secrets:
wrangler secret put GITHUB_APP_ID
wrangler secret put GITHUB_APP_PRIVATE_KEY  (paste the .pem, including newlines)
wrangler secret put GITHUB_APP_INSTALLATION_ID

Step 5 — keep PAT for 7-day rollback window:
Don't delete GITHUB_TOKEN / GITHUB_REPO yet. If the App auth fails, the
handler can fall back to PAT. After 7 days of stability, delete both PAT
secrets and the PAT itself from github.com/settings.

Acceptance:
- Verify curl against /mcp tm_trigger_e2e returns ok:true.
- Workflow dispatches successfully.
- Cancel PAT after 7-day soak.

Risks:
- @octokit/auth-app uses crypto APIs — verify Cloudflare Workers compatibility
  (it should work, but test in staging first).
- Private key in env var — store carefully, never log.
````

---

## Wave 5 · Feature programs · multi-day each · ship one per sprint

These each need their own planning session before code. The prompts below are
**planning prompts** that produce a detailed sub-plan, not direct execution.

### W5-A · FEAT-5 · Per-defect drill-down enrichments

**Effort:** 4 hr (fits in a single session) · **Risk:** LOW-MED

````prompt
Goal: when a Playwright test fails, surface the screenshot + stack trace +
network HAR in the defect detail panel of /testing-dashboard.

Step 1 — Playwright config (frontend repo):
In playwright.config.ts, ensure on-failure artifacts:
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  }

Step 2 — bridge upload:
In tests/e2e/post-to-testing-master.mjs, when probe.status === "fail":
- Read the playwright-report/${testName}/test-failed-1.png file (if exists).
- Upload to Cloudflare R2 via the testing-master /tm/upload-screenshot endpoint
  (new — to be built).
- Include the R2 URL in probe.defect.evidence.screenshot_url.

Step 3 — testing-master /tm/upload-screenshot:
Add R2 binding to apps/agents/testing-master/wrangler.toml.
Add endpoint POST /tm/upload-screenshot that:
- Accepts multipart/form-data with file + def_id.
- Stores at r2://${bucket}/screenshots/${def_id}.png.
- Returns the public URL.

Step 4 — dashboard render:
In testing-dashboard.html renderDefectDetail(d), if d.evidence?.screenshot_url:
  html += `<div class="row"><h4>Screenshot</h4>
    <a href="${url}" target="_blank">
      <img src="${url}" style="max-width:100%;border:1px solid #ccc"/>
    </a></div>`;

Acceptance:
- A failing E2E test produces a defect with screenshot URL.
- Dashboard shows the image inline.
- Image clickable to open full-size.

Risks:
- R2 cost: ~$0.015/GB/month. Cap retention at 30 days via R2 lifecycle.
- Bridge upload adds ~5s per failure × max N failures.
````

---

### W5-B · FEAT-2 · E-4 RAG Knowledge enhancements

**Effort:** ~1 week (split into 4 sub-prompts) · **Risk:** MED

````prompt
Plan E-4 (RAG enhancements) as 4 prompts of ~½ day each:

E-4-a · Knowledge ingestion pipeline:
A scheduled task that runs nightly via Workers Cron. For each new file uploaded
to R2://knowledge-sources/, chunks it (1000 tokens with 200 overlap), embeds
each chunk with Workers AI BAAI/bge-small-en-v1.5, and inserts into
Vectorize namespace "knowledge".
Acceptance: drop a PDF in R2, see chunks appear in vectorize within 1 hour.

E-4-b · Hybrid BM25 + vector search:
Today knowledge_search uses vector-only. Add a parallel D1 full-text search,
score each candidate by max(bm25_norm, vector_norm), return top 10 merged.
Use SQLite FTS5 module on D1.
Acceptance: searches for exact keyword phrases return better results than vector-only.

E-4-c · Embedding cache + model version registry:
Add a cache_embeddings D1 table keyed by text_hash + model_id. Before calling
Workers AI, check cache. Insert on cache miss. Track which model_id produced
each embedding so re-indexing knows what to invalidate when models upgrade.
Acceptance: re-embedding the same corpus a second time is 95% faster.

E-4-d · Citation tracker:
Every LLM response that uses RAG returns a list of source chunk IDs.
Frontend (in any studio that uses knowledge) renders a "Sources:" footer
with clickable links to the source documents at their exact chunk.
Acceptance: open any RAG answer, click a citation, scroll to the cited chunk.

Each prompt should follow the standard pattern from E-3-a..k: env.ts changes,
handlers.ts new tool, manifest.ts type updates, migrations file, prompt template
update in master-agent.
````

---

### W5-C · FEAT-3 · E-5 Testing services backend (~2 weeks)

````prompt
Plan E-5 (Testing Services backend) as 9 prompts:

E-5-a · TestData generator agent (~3 hr):
New agent that produces synthetic but compliant test data for banking domains.
PII-tagged + auto-anonymized. Per-region rules (US-SSN format, IN-PAN format, etc.).

E-5-b through E-5-i · 8 testing sub-agents (~3 hr each):
functional · performance · security · accessibility · compliance · contract
· integration · e2e. Each one wraps existing tooling (k6, Lighthouse,
Pa11y, Snyk, Pact, etc.) behind an MCP interface.

E-5-j · Closed Defect → CR → Patch loop (~6 hr):
Defect raised in testing-master automatically creates a CR in governance,
which (if approved) creates a patch plan in patching-agent, which (if
validated) opens a PR. End-to-end audit chain.

Each prompt should specify:
- D1 migration
- Tools exposed
- Cross-bindings
- Health check expectations
- Smoke test in testing-master functional layer
````

---

### W5-D · FEAT-4 · E-7 Insights agent (~1 week)

````prompt
Plan E-7 (Insights agent) as 3 prompts:

E-7-a · Per-tenant health reports (~½ day):
New sub-agent insights-agent. Runs nightly. For each tenant, queries D1
across discovery/architecture/sow/governance/operations and asks Groq:
"Summarize this tenant's program health in 200 words for the program director."
Saves output to D1 + emails the tenant.

E-7-b · Cross-tenant trend detection (~1 day):
Anonymized aggregation: "73% of buyers picked AWS in 2026-Q2; up from 58%
in Q1." Drift detection on every numeric field.

E-7-c · Trend dashboard (~½ day):
Frontend tile + page rendering the insights with charts.
````

---

### W5-E · FEAT-6 · Multi-tenant auth (~3 days)

````prompt
Plan multi-tenant auth as 4 prompts:

Phase 1 · Cloudflare Access in front of every Worker (~½ day):
Wrap each Worker behind Access with email-based identity. Free tier supports 50 users.

Phase 2 · Tenant identity flow (~1 day):
Every API call passes through Access → JWT in CF-Access-Jwt-Assertion header
→ middleware extracts tenant_id from email domain. Reject if missing.

Phase 3 · Per-tenant D1 row scoping (~1 day):
Every SELECT/UPDATE/DELETE adds WHERE tenant_id = ?. Code-gen helper:
  await tenantDb(env, tenant).select('discovery_runs', { passed: true });
Audit pass over all D1 queries to ensure none bypass.

Phase 4 · Tenant management UI (~½ day):
Admin page to provision new tenants, set quotas, view their D1 footprint.

Acceptance: 3 test tenants, each can only see their own data.
````

---

### W5-F · FEAT-1 · E-3-h Blockchain agent (deferred · ~2 days when activated)

````prompt
Blockchain agent (XRPL + EVM + Solana). Currently deferred per
E-3-REMAINING-ROADMAP.md Wave D. Re-activate ONLY when:
1. A buyer specifically asks for on-chain SOW anchoring, OR
2. RWA tokenization becomes a product priority.

When activated, full design lives in:
apps/agents/blockchain/README.md (to be written)
+ infra/blockchain-setup.md (XRPL faucet, RPC provider sign-up, contract deploys)

Estimated as 4 sub-prompts:
- blockchain-a · XRPL anchoring SOW signatures
- blockchain-b · EVM (Polygon testnet) RWA token mint
- blockchain-c · Solana anchor proof (devnet)
- blockchain-d · Verify endpoint that checks all 3 chains for a given hash

Cross-bindings: SOW (signed events), EXCEPTION (anchor critical exceptions).
Risk: HIGH — wallet keys, gas costs, smart-contract bugs.
````

---

### W5-G · LAD-1 · Live Architecture Designer · static implementation

**Effort:** ~16 hr · **Risk:** LOW (pure additive frontend)

````prompt
Goal: build the Live Architecture Designer described in docs/planning/
LIVE_ARCHITECTURE_DESIGNER.md. Click any 7R verdict pill (REHOST, REPLAT,
REFACT, REARCH, REBUILD, REPLACE, RETAIN) on Discovery → opens a designer
with three mode tabs: TradFi (cloud-native), DeFi (blockchain-native),
Hybrid (the realistic bank-grade pattern).

Architecture:
- New page: live-architecture-designer.html
- New asset: assets/lad-engine.js (layer libraries + transaction flow renderer)
- discovery-studio.html sends ?verdict=X&capability=Y to the designer

Layer libraries (from the design doc § 2):
- TradFi: ALB → API Gateway → Lambda/ECS → Aurora/RDS → S3 → CloudWatch
- DeFi: Web3 wallet → smart contract → on-chain settlement → IPFS → indexer
- Hybrid: trad core + DeFi tokenization wing + bridge contract
Sample transaction flow per mode rendered as editable SVG.

Top-bar entry: add tile to home.html and a FEATURES catalog entry to
top-bar.js with badge='LIVE' once shipped.

Acceptance:
- 3 mode tabs render with their layer libraries.
- Click a verdict pill on /discovery-studio → designer opens with verdict
  pre-selected.
- Layer composition exports as JSON (round-trips to localStorage).
- 1 new Playwright test (Step 23 · LAD page loads + 3 mode tabs visible).

Static-now implementation. Agentic upgrade is LAD-2 (W5-H).
Push: frontend only.
````

---

### W5-H · LAD-2 · Live Architecture Designer · agentic upgrade (Phase E-18)

**Effort:** ~1 week · **Risk:** MED

````prompt
Plan E-18 (LAD agent) as 3 prompts:

E-18-a · live-architecture-agent sub-agent (~½ day):
Cross-binds DISCOVERY (read 7R verdict) + ARCHITECTURE (cost model) +
KNOWLEDGE (similar bank patterns).
Tools: lad_propose_design, lad_score_design (cost/risk/compliance),
       lad_export_svg.

E-18-b · Designer ↔ agent wiring (~1 day):
Replace static layer-library JS with LAD-agent calls. Each mode tab
fetches an LLM-proposed composition instead of hardcoded layers.

E-18-c · Saved designs persistence (~1 day):
D1 migration 1200_lad_designs.sql (tenant_id, capability_id, verdict,
mode, design_json, created_at). Save/load buttons in the UI.

Each sub-prompt follows the standard E-3 pattern: env.ts, handlers.ts,
manifest.ts, migration file, router prompt template update.
````

---

### W5-I · FEED-1 · Phase E-9 post-test feedback loop

**Effort:** ~1 week · **Risk:** MED

````prompt
Plan Phase E-9 (post-test feedback loop) as 4 prompts:

E-9-a · Defect-pattern miner (~½ day):
Nightly cron in testing-master. Aggregates 30-day defects by
(agent, tool, severity, layer). Identifies clusters.

E-9-b · Buyer-question log (~½ day):
D1 table buyer_questions (id, question, source, captured_at, tenant_id).
Niche-I logs every user message that didn't route to a tool.

E-9-c · Insights LLM (~2 days):
New insights-agent (or extend FEAT-4). Weekly job: defect clusters +
question log + roadmap → Groq → 5 feature proposals ranked impact × ease.

E-9-d · Suggestions UI (~1 day):
New /insights.html. Each suggestion: title, rationale, impact, effort,
"Add to BACKLOG" button.

Acceptance: at week 2, page shows ≥3 LLM-generated suggestions.
````

---

## Wave 6 · Enterprise gates · multi-week each · pick 2-3 per quarter

Derived from `docs/planning/ENTERPRISE_GRADE_RECOMMENDATIONS.md`. **These
are the questions tier-1 banks ask during procurement.** Each is real
engineering. Sequencing depends on which buyer segment you target first.

Most prompts here are **scoping prompts** that produce sub-plans, because
each item is 1-4 weeks and can't fit a single session.

---

### W6-A · ENT-1 · Banking trust & safety layer

**Effort:** ~4 weeks · **Risk:** HIGH (touches every LLM call)

````prompt
Scope a banking trust & safety layer per ENTERPRISE_GRADE_RECOMMENDATIONS.md §2.

Sub-items (each ~1 week):

ENT-1a · Model risk management (SR 11-7 aligned):
- New @aidp/model-risk package
- Every LLM call logs: model_id, prompt_hash, input/output classes,
  confidence, fallback_used, latency, cost
- New /model-risk dashboard for the model risk committee
- Inventory tables: models_in_use, model_validation_evidence, model_changes
- Export pack: SR 11-7-aligned PDF for annual model validation

ENT-1b · Human-in-the-loop gates (beyond patch-agent):
- HITL on Architecture redesigns (>$500K impact)
- HITL on SOW pricing changes (>10% delta)
- HITL on Governance steering-pack publication
- All HITL events logged with approver email + reason + sla_breached flag

ENT-1c · Explainability + citation enforcement:
- Every RAG response MUST return source chunk IDs
- Every numeric output MUST trace to its arithmetic source
- Frontend renders "show sources" link on every LLM output
- Citation drift alerts wired to exception agent

ENT-1d · Prompt injection / jailbreak defense:
- New @aidp/prompt-guard package wrapping every callLlm
- Input scanning for known injection patterns
- Output scanning for leaked system prompts
- Per-tenant block lists + continuous red-team eval

Acceptance per sub-item:
- Documented in apps/master-agent/docs/trust-safety.md
- 1 integration test per sub-item in testing-master functional layer
- Compliance sign-off (mock now, real later)

Risk: HIGH. Stage rollout per agent over 4 weeks.
````

---

### W6-B · ENT-2 · Identity, access, multi-tenancy (extends FEAT-6)

**Effort:** ~2 weeks · **Risk:** HIGH

````prompt
Build on FEAT-6 to add RBAC + ABAC + audit-grade access logs + SAML/OIDC SSO.

Sub-items:
- ENT-2a · Cloudflare Access in front of every Worker (prereq from FEAT-6)
- ENT-2b · RBAC schema (1d): roles, role_permissions, user_roles, tenant_users.
  Every MCP handler checks permission before running.
- ENT-2c · ABAC overlay (1d): attributes tenant_size, region, regulatory_zone, role_level.
  Policy DSL: deny if user.region != tenant.region.
- ENT-2d · SAML / OIDC SSO (2d): map SSO claims → AIDP roles via role_claim_map JSON.
- ENT-2e · Audit-grade access logs (1d): audit_access_log (ts, user, tenant,
  action, resource, allowed, reason, ip, ua). Auditor query API.
- ENT-2f · Admin UI (2d): /admin/users CRUD roles + /admin/audit log search.

Acceptance: 3 tenants × 3 roles, each role limited correctly, every decision
in the audit log.
````

---

### W6-C · ENT-3 · Data residency / sovereignty / BYOK

**Effort:** ~2 weeks · **Risk:** HIGH

````prompt
Per-region D1 + R2 placement and BYOK per
ENTERPRISE_GRADE_RECOMMENDATIONS.md §4.

Sub-items:
- ENT-3a · Per-region D1 + R2 (4d): location hints 'enam'/'weur'/'apac',
  tenant_region field, region-aware query middleware.
- ENT-3b · Customer-managed encryption keys (4d): tenant supplies KMS key,
  sensitive D1 columns encrypted at rest, background re-encryption on rotation.
- ENT-3c · Region-locked tenant policy (2d): worker-level enforcement
  ("refuse to fetch from cross-region binding").
- ENT-3d · Compliance reporting (2d): per-tenant signed PDF showing D1
  region, R2 region, model-API region commitments.

Acceptance: 3 tenants in 3 regions; data never crosses; audit pack proves it.
````

---

### W6-D · ENT-4 · Immutable, regulator-friendly audit (extend chain_hash)

**Effort:** ~1 week · **Risk:** LOW

````prompt
Extend existing chain_hash (already on exception_index) to full WORM
audit log + auditor-facing export.

Sub-items:
- ENT-4a · WORM-style audit_log table (1d): append-only, chain_hash,
  triggers from every state change.
- ENT-4b · Retention policies (1d): 7y SOX, 11y MiFID II, 5y GDPR-ops.
  Nightly archive to R2 cold storage past N years.
- ENT-4c · Auditor export (2d): /audit/export?since=&until=&tenant= returns
  Excel + PDF cover letter with chain_hash verification + optional zipped
  signed bundle.
- ENT-4d · External anchor (optional, 2d): hourly hash → external immutable
  store (S3 Object Lock / QLDB / blockchain).

Acceptance: regulator pulls 12-month audit pack in < 30 sec.
````

---

### W6-E · ENT-5 · Production resilience (chaos + circuit breakers)

**Effort:** ~2 weeks · **Risk:** MED

````prompt
Add production resilience per ENTERPRISE_GRADE_RECOMMENDATIONS.md §6.

Sub-items:
- ENT-5a · Circuit breakers per sub-agent (3d): wrap callAgentTool.
  Open after N failures, half-open after timeout, fallback to cache/error.
- ENT-5b · Retry budgets (1d): token bucket per (caller, callee).
  Prevents retry storms during degradation.
- ENT-5c · Graceful degradation matrix (2d): doc + banner per user flow
  describing what works in each degraded state.
- ENT-5d · Chaos testing (3d): new 'chaos' layer in testing-master.
  Injects latency/errors/timeouts into one sub-agent per run.
- ENT-5e · SLA dashboard (2d): /sla page · 99.9% uptime track-record per
  worker over 30/90 days from /health probes.

Acceptance: kill any sub-agent, platform stays usable. Add chaos run to
nightly schedule.
````

---

### W6-F · ENT-6 · Core banking + payment-rail integration depth

**Effort:** ~3 weeks PER integration · **Risk:** MED-HIGH

````prompt
Reference adapters for major banking systems and payment rails.

Pick ONE core banking + ONE rail to start, based on your first-target buyer:

| Buyer profile | Recommended pair |
|---|---|
| Tier-1 EU bank | Temenos T24 + SWIFT |
| Tier-2/3 US bank | FIS Profile + ACH/FedNow |
| India private bank | Finacle + UPI |
| Neo-bank | Mambu + RTP/SEPA-INST |

Per integration:
1. Sandbox account · vendor's free dev tier · auth flow doc.
2. New @aidp/connector-${vendor} package · 5-10 most-common operations.
3. End-to-end demo workflow + home-page tile.

Risk: every vendor has its own auth quirks, breaking changes, rate limits.
Plan 1.5x buffer.

⚠ DON'T START until a buyer has explicitly asked for the integration.
Speculative integrations are a sink. Wait for procurement signal.
````

---

### W6-G · ENT-7 · First-class banking workflows

**Effort:** ~3 weeks PER workflow · **Risk:** MED

````prompt
Pre-baked banking workflows that differentiate AIDP from generic
modernization tools. Pick ONE; each is multi-week.

Candidates (ranked by buyer-frequency):
1. KYC/AML pre-built playbook (CDD, sanctions, PEP, adverse-media, SAR)
2. Customer onboarding orchestration (intake, IDV, KYC handoff, account opening)
3. Payments orchestration · multi-rail (route by amount/currency/urgency/cost)
4. Fraud detection plugins (Featurespace, Sift, Feedzai integration)
5. ECL / IFRS9 model integration (3-stage, scenario-weighted ECL output)

Per workflow:
- New top-level tile on home.html
- End-to-end 10-min demo
- docs/workflows/${workflow}.md

Don't build all 5 — pick 1-2 that match your pipeline. The rest are
"we have a roadmap for that" answers at procurement.
````

---

### W6-H · ENT-8 · AgentOps & continuous evaluation

**Effort:** ~2 weeks · **Risk:** MED

````prompt
Extend testing-master from "did it pass today?" to "is it still as good as
last week?" per ENTERPRISE_GRADE_RECOMMENDATIONS.md §9.

Sub-items:
- ENT-8a · Drift detection (3d): nightly compare today's tm_run_suite
  scores vs 7-day rolling avg. Alert if pass-rate -5% or any tool -10%.
- ENT-8b · Prompt-version A/B testing (3d): prompt_versions table,
  router picks A/B per request, auto-promote winner on significance.
- ENT-8c · Reproducibility ledger (3d): every LLM call logs model_id,
  prompt_id, input_hash, output_hash, seed. /replay/:call_id endpoint.
- ENT-8d · Eval harness with golden answers (3d): 20-50 goldens per agent.
  Nightly run, flags drift. New 'goldens' layer in testing-master.
- ENT-8e · Auto-rollback on quality regression (2d): if drift triggers AND
  last deploy < 24h, auto-revert + open CR in governance.

Acceptance: simulate a bad prompt push; auto-rollback fires within 1 hour.
````

---

### W6-I · ENT-9 · Build once, deploy three ways

**Effort:** ~3 weeks · **Risk:** HIGH (cross-platform compatibility)

````prompt
Make every Worker portable across Cloudflare (today), Kubernetes (banks'
own cluster), and AWS Lambda + RDS per ENTERPRISE_GRADE_RECOMMENDATIONS.md §1.

Approach:
1. Runtime abstraction layer (1w): @aidp/runtime package wraps KV/D1/R2/
   Vectorize/Queues so handlers don't know the underlying provider.
2. Adapters (1w): @aidp/runtime-cloudflare (current), @aidp/runtime-kubernetes
   (Postgres + Redis + MinIO + RabbitMQ + pgvector), @aidp/runtime-aws (RDS +
   ElastiCache + S3 + SQS + Pinecone).
3. Deployment matrix (1w): /deploy/cloudflare, /deploy/kubernetes (Helm),
   /deploy/aws (Terraform). CI builds all three on every push.

Acceptance: same source code → all three targets → smoke tests pass on each.

Risk: HIGH. SQL dialect quirks, S3 vs R2 multi-part semantics. Plan 2x buffer.

⚠ DON'T START until a buyer mandates a non-Cloudflare target. Premature
multi-target work doubles maintenance for zero revenue.
````

---

## Execution discipline · do this every time

Before pushing any item from this file:

1. **Typecheck both repos** (`npm run typecheck`)
2. **Run the 17 Playwright tests locally** if any frontend change touches a studio
3. **Smoke the new feature** before pushing (curl the worker, click the button)
4. **Watch CI** until both Deploy Pages + Deploy Workers + E2E Playwright are green
5. **Move the item from BACKLOG.md P1-P3 to "Recently shipped"** — keep the docs honest
6. **If something breaks**, revert immediately. Don't try to fix forward unless the regression is obvious.

---

## Recommended sprint shape

| Sprint | Wave | Items | Hours | Risk |
|---|---|---|---|---|
| **1 ✅** | Wave 1 | W1-A, B, C, D | ~6 | LOW |
| **2 (current)** | Wave 2 | W2-A ✅, W2-B | ~7 | MED |
| **3** | Wave 3 | W3-A + W3-B | ~5 | LOW |
| **4** | Wave 3 cont. | W3-C, D, E | ~11 | MED |
| **5** | Wave 4 | W4-A | ~4 | MED-HIGH |
| **6** | Wave 5 (small) | W5-A + W5-G (LAD-1) | ~20 | LOW-MED |
| **7-8** | Wave 5 (rest) | W5-B/C/D/E/F/H/I — pick one FEAT or program per 1-2 week sprint | varies | varies |
| **9+** | Wave 6 | Pick 1-2 enterprise gates (W6-A through W6-I) per quarter based on buyer pipeline | weeks | HIGH |

After Sprint 1 the dashboard becomes a real triage tool. After Sprint 2 Niche-I is multi-modal. By Sprint 5 the platform is on robust auth. Sprints 6-8 are growth features. Wave 6 enterprise gates start when there's a confirmed bank buyer to pull them — building them speculatively burns engineering with zero revenue.

## Buyer-segment routing for Wave 6

When you DO start Wave 6, sequence by your target buyer:

| First buyer | Suggested Wave 6 sequence |
|---|---|
| Tier-1 EU bank | W6-A (trust+safety) → W6-D (audit) → W6-B (IAM) → W6-F (Temenos+SWIFT) |
| Tier-2 US bank | W6-D (audit) → W6-A (trust+safety) → W6-F (FIS+ACH/FedNow) |
| India private bank | W6-C (RBI residency) → W6-F (Finacle+UPI) → W6-A (trust+safety) |
| Neo-bank | W6-H (AgentOps) → W6-G (#1 KYC/AML) → W6-E (resilience) |

---

Last updated: 2026-05-27 (revised after planning-doc audit). Companion to BACKLOG.md (inventory) and DEPLOY.md (process).
