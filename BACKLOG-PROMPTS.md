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
| **1 (this week)** | Wave 1 | W1-A, B, C, D | ~6 | LOW |
| **2 (next week)** | Wave 2 | W2-A, W2-B | ~7 | MED |
| **3** | Wave 3 | W3-A + W3-B | ~5 | LOW |
| **4** | Wave 3 cont. | W3-C, D, E | ~11 | MED |
| **5** | Wave 4 | W4-A | ~4 | MED-HIGH |
| **6+** | Wave 5 | pick one FEAT per 1-2 week sprint | varies | varies |

After Sprint 1 the dashboard becomes a real triage tool. After Sprint 2 Niche-I is multi-modal. By Sprint 5 the platform is on robust auth. Sprints 6+ are growth features.

---

Last updated: 2026-05-27. Companion to BACKLOG.md (inventory) and DEPLOY.md (process).
