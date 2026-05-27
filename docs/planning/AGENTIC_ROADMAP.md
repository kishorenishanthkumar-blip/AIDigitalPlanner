# AIDigitalPlanner · Agentic Transformation Roadmap

**Goal:** Convert the current static client-side platform into a live multi-agent system where Nishi acts as a Master Agent, routing intent through an MCP server to feature-specific sub-agents and a parallel agentic test framework. Self-improving via a defect→CR→patch loop. **Zero-cost** by living entirely within free tiers.

**Current baseline:** Static HTML/CSS/JS on Cloudflare Pages · all state in `localStorage` · Nishi is a chat-only frontend wrapper.

**Target end-state:** Master Agent + MCP server + 10 feature sub-agents + 8-agent test framework + Vector DB / RAG + GitHub-issues-based CR loop + Cloudflare-free-tier-only hosting.

---

## Zero-cost stack (the entire system lives here)

| Layer | Service | Free tier ceiling |
|---|---|---|
| **Static hosting** | Cloudflare Pages | Unlimited requests · 500 builds/mo |
| **Compute (MCP servers, sub-agents)** | Cloudflare Workers | 100 K req/day + 10 ms CPU/req |
| **LLM inference** | Groq (Llama 3.3 70B / Mixtral) | 30 RPM, 14 K TPM, free forever |
| **Backup LLM** | Cloudflare Workers AI (Llama 3.1 8B) | 10 K neurons/day free |
| **Embedding model** | Workers AI `@cf/baai/bge-base-en-v1.5` | Free with Workers AI quota |
| **Vector DB** | Cloudflare Vectorize | 5 M vectors · 30 M queries/mo free |
| **Relational DB** | Cloudflare D1 (SQLite) | 5 GB · 5 M reads/day · 100 K writes/day |
| **Object storage** | Cloudflare R2 | 10 GB · 1 M reads/mo · 1 M writes/mo |
| **Queue** | Cloudflare Queues | 1 M operations/mo free |
| **Cron / scheduled** | Cloudflare Triggers | Free with Workers |
| **CI / runners** | GitHub Actions | Unlimited for public repos · 2 K min/mo private |
| **Browser testing** | Playwright on GH Actions | Bundled with Actions free tier |
| **Load / perf testing** | k6 OSS on GH Actions | Free (self-hosted runner not required) |
| **Auth** | Existing localStorage + EmailJS OTP | Already in place |
| **Observability** | Better Stack (free) + Cloudflare Analytics | 3 GB logs/mo · unlimited Workers analytics |
| **Issue / CR tracking** | GitHub Issues | Free |
| **Doc generation** | Existing SheetJS + docx + jsPDF (browser-side) | Free, no quota |

**Total monthly cost ceiling at full operation: $0.** Designed to stay within all free tiers under reasonable demo load (≈100 active users, ≈500 agent calls/day).

---

## Architecture at a glance

```
                          ┌──────────────────────────┐
   Browser (Cowork app)   │   User → Nishi chat UI   │
                          └────────────┬─────────────┘
                                       │ HTTPS
                ┌──────────────────────▼───────────────────────┐
                │   MASTER AGENT WORKER  (Cloudflare Worker)    │
                │     · intent parsing  · MCP client            │
                │     · tool-use loop (Groq / Workers AI)       │
                │     · audit + cost guard                      │
                └──┬────────────────────────────────────────┬───┘
                   │ MCP protocol (JSON-RPC over fetch)     │
   ┌───────────────┼──────────────────────────────┐         │
   │               │                              │         │
   ▼               ▼                              ▼         ▼
┌────────────┐ ┌──────────────┐ ... 10 feature  ┌────────────────────┐
│ Discovery  │ │ Architecture │     sub-agents  │ TEST MASTER AGENT  │
│  Worker    │ │   Worker     │                 │  (Cloudflare CRON  │
│            │ │              │                 │   or GH Actions)   │
└─────┬──────┘ └──────┬───────┘                 └────────┬───────────┘
      │               │                                  │
      ▼               ▼                                  ▼
   ┌────────────────────────┐                ┌──────────────────────────┐
   │   D1 + R2 + Vectorize  │◄──RAG over─────┤  8 Test Sub-Agents:       │
   │   (state · artifacts · │   test fixtures│   UI · Backend · SIT ·    │
   │   embeddings)          │                │   Functional · E2E ·      │
   └────────────────────────┘                │   PerfVolStress ·         │
                                             │   TestData · Evidence     │
                                             └────────┬─────────────────┘
                                                      │
                                                      ▼
                                       ┌────────────────────────────────┐
                                       │  Defect → CR → Patch loop      │
                                       │  GitHub Issues + Auto-PR Worker│
                                       └────────────────────────────────┘
```

---

## Naming convention

Every sub-agent is a Cloudflare Worker with an MCP-compatible JSON-RPC endpoint. Workers are deployed under a single `*.workers.dev` zone via `wrangler`. Each worker exposes `/mcp` (JSON-RPC) and `/health`. Agents are stateless; durable state lives in D1 / R2 / Vectorize.

---

# Phase Plan (10 phases · ~80 hours · still $0)

Each phase below has: **goal**, **free-tier resources used**, **deliverables**, and a set of **paste-back prompts** you give me to do the work. Prompts are written tight so I don't ask follow-ups.

---

## Phase E-1 · Foundation infrastructure (zero-cost setup)

**Goal:** Stand up the Cloudflare account scaffolding (D1, R2, Vectorize, Queues, Workers project) and a monorepo layout that holds the existing site + N new workers.

**Free resources:** Cloudflare Workers · D1 · R2 · Vectorize · Queues.

**Deliverables:**
- `wrangler.toml` for the master agent worker + 1 example sub-agent.
- `infra/cloudflare-setup.md` with the exact `wrangler` CLI commands to create D1, R2, Vectorize bindings.
- Monorepo layout: `apps/web/` (existing site) · `apps/master-agent/` · `apps/agents/<feature>/` · `apps/test-master/` · `packages/mcp-protocol/`.
- CI workflow that deploys workers on push to main.

**Prompts to paste back:**

> **Prompt E-1-a:** Reorganize the repo into a monorepo with `apps/web/` (move all current static files there), `apps/master-agent/`, `apps/test-master/`, `packages/mcp-protocol/`. Create a root-level `package.json` workspace config. Don't change any feature behavior — Cloudflare Pages must still serve `apps/web/` as the root.

> **Prompt E-1-b:** Write `infra/cloudflare-setup.md` with the exact shell commands to create: D1 database `aidp-state`, R2 bucket `aidp-artifacts`, Vectorize index `aidp-kb` (768-dim, cosine), and Queues `aidp-test-runs`. Include the `wrangler.toml` binding snippets each worker will need.

> **Prompt E-1-c:** Scaffold `apps/master-agent/` as a Hono worker with `/mcp`, `/health`, and `/chat` routes. Wire it to D1 + R2 + Vectorize via bindings. No agent logic yet — just the worker boilerplate that returns 200 on `/health` and echoes input on `/chat`.

> **Prompt E-1-d:** Add a GitHub Actions workflow `.github/workflows/deploy-workers.yml` that on push to main, runs `wrangler deploy` for `apps/master-agent/`. Use OIDC-only auth (Cloudflare API token via secret). Verify the worker URL is reachable via curl after deploy.

---

## Phase E-2 · Master Agent (Nishi gets a brain)

**Goal:** Wire Nishi's chat UI to the Master Agent worker. The worker runs the Anthropic / Groq tool-use loop, parses intent, and (for now) routes to one hardcoded sub-agent.

**Free resources:** Groq API (Llama 3.3 70B free) · Cloudflare Workers.

**Deliverables:**
- `apps/master-agent/src/llm.ts` — Groq tool-use client.
- `apps/master-agent/src/router.ts` — intent → sub-agent name mapping.
- `apps/master-agent/src/mcp-client.ts` — JSON-RPC client for talking to sub-agent workers.
- `apps/web/assets/nishi.js` updated to POST to `/chat` on the master worker.
- Audit trail in D1 (`agent_calls` table).

**Prompts to paste back:**

> **Prompt E-2-a:** Build `apps/master-agent/src/llm.ts` — a thin client around Groq's `chat.completions` with `tools` support (use Llama 3.3 70B). It accepts a system prompt, message history, and tool registry, and returns either a text reply or a tool call instruction. Cache responses in D1 for identical (user, prompt) pairs in the last 60 s.

> **Prompt E-2-b:** Build `apps/master-agent/src/router.ts` — a function that takes a user message and decides which sub-agent should handle it. Use a hardcoded keyword map for now (e.g. "discovery" → discovery agent, "rfp" → questionnaire). Return `{ agentId, toolName, args }`.

> **Prompt E-2-c:** Build `apps/master-agent/src/mcp-client.ts` — given an agent worker URL and a tool name + args, sends a JSON-RPC `tools/call` request and returns the result. Implement the MCP `initialize` handshake plus `tools/list` and `tools/call` methods only.

> **Prompt E-2-d:** Update `apps/web/assets/nishi.js` so the chat input posts to `https://aidp-master.your-subdomain.workers.dev/chat` instead of calling the Anthropic API directly. Stream the response back token-by-token. Show a tool-use pill in the chat bubble when the master decides to invoke a sub-agent.

> **Prompt E-2-e:** Add a D1 schema migration creating `agent_calls (id, ts, user_email, master_session, target_agent, tool_name, args_json, result_json, latency_ms, cost_usd)`. Every master call writes one row. Add `apps/master-agent/src/audit.ts` to handle the insert.

---

## Phase E-3 · Feature sub-agents (10 workers, one per feature)

**Goal:** Convert each existing feature page into a backed MCP sub-agent with a documented tool set. The browser feature pages remain as the UI; the worker becomes the source of truth and exposes deterministic tools the master can call.

**Free resources:** Cloudflare Workers (one per agent stays well within 100 K req/day shared).

**The 10 sub-agents and their headline tools:**

| # | Agent | Tools |
|---|---|---|
| 1 | **Discovery** | `select_capabilities`, `generate_7r_map`, `save_discovery_state`, `import_questionnaire_handoff` |
| 2 | **Architecture** | `compute_cloud_pricing`, `pick_cloud_for_capability`, `generate_blueprint_svg`, `generate_specs_modal` |
| 3 | **Requirements** | `generate_requirements`, `filter_by_lens`, `add_regulatory_clause` |
| 4 | **Actions** | `aggregate_actions`, `mark_status`, `assign_owner`, `generate_recommendation` |
| 5 | **SOW** | `draft_sow`, `update_milestone`, `compute_fixed_price` |
| 6 | **Governance** | `add_raid`, `compute_gantt`, `generate_msproject_xml`, `compute_cost_breakdown` |
| 7 | **Operations** | `compute_dora`, `compute_slo_burn`, `aggregate_l1_l4_tickets`, `compute_cost_per_tx` |
| 8 | **Blockchain** | `compute_blockchain_fit`, `generate_roadmap`, `pick_jurisdiction_stance` |
| 9 | **Knowledge** | `snapshot_state`, `restore_snapshot`, `search_kb`, `embed_document` |
| 10 | **IaC** | `generate_terraform`, `generate_helm`, `generate_workflows`, `assemble_bundle_zip`, `push_to_github` (uses GH App) |

**Prompts to paste back (one per agent, paste them in batches of 2-3):**

> **Prompt E-3-a:** Scaffold `apps/agents/discovery/` as a Hono worker exposing MCP `tools/list` returning the 4 Discovery tools and `tools/call` dispatching to handlers. Reuse the existing 7R engine from `apps/web/discovery-studio.html` — extract it into `packages/discovery-engine/` so both browser and worker share the same logic. Write 4 tool handler stubs that read/write D1 (`discovery_states` table keyed by user_email).

> **Prompt E-3-b:** Same as E-3-a but for `apps/agents/architecture/`. Extract `assets/pricing.js` into `packages/pricing-lib/`. Tools must read picked capabilities from the Discovery agent's D1 table via cross-binding service-to-service call.

> **Prompt E-3-c:** Same for `apps/agents/requirements/` — 3 tools. Reuse `requirements.html`'s requirement-generation logic.

> **Prompt E-3-d:** Same for `apps/agents/actions/` — 4 tools.

> **Prompt E-3-e:** Same for `apps/agents/sow/` — 3 tools.

> **Prompt E-3-f:** Same for `apps/agents/governance/` — 4 tools.

> **Prompt E-3-g:** Same for `apps/agents/operations/` — 4 tools. Operations tools read DORA/SLO fixtures from D1 (seed with current sample data).

> **Prompt E-3-h:** Same for `apps/agents/blockchain/` — 3 tools.

> **Prompt E-3-i:** Same for `apps/agents/knowledge/` — 4 tools. The `embed_document` tool calls Workers AI `@cf/baai/bge-base-en-v1.5` and writes to Vectorize. `search_kb` does a Vectorize query.

> **Prompt E-3-j:** Same for `apps/agents/iac/` — 5 tools. The `push_to_github` tool uses a GitHub App installation token (set up the App in this step) to create a repo and push the bundle on the user's behalf — requires explicit user permission, never auto-runs.

> **Prompt E-3-k:** Update `apps/master-agent/src/router.ts` to discover all 10 sub-agents via service bindings, fetch their `tools/list` at boot, and build a unified tool registry. Replace the keyword router with Llama-driven tool selection — the master sends the registry as the `tools` array in the Groq call and lets the LLM pick.

---

## Phase E-4 · Vector DB + RAG over knowledge artifacts

**Goal:** Make the knowledge repository semantically searchable. Ingest seed templates, playbooks, regulatory checklists, patterns, and every user snapshot. RAG-enrich Nishi's responses.

**Free resources:** Cloudflare Vectorize (free 5 M vectors) · Workers AI for embeddings (free `bge-base-en-v1.5`).

**Deliverables:**
- `packages/rag/` with `embed.ts`, `chunk.ts`, `retrieve.ts`.
- Seed ingestion of all 16 reference cards in `knowledge.html`.
- Master agent injects top-3 RAG hits into Nishi's system prompt on every chat turn.
- `/kb/search` endpoint on the Knowledge agent.

**Prompts to paste back:**

> **Prompt E-4-a:** Build `packages/rag/` with `chunk.ts` (sliding window 512 tokens, 50 token overlap), `embed.ts` (calls Workers AI `@cf/baai/bge-base-en-v1.5`), and `retrieve.ts` (Vectorize topK query). Add a seed script `scripts/seed-kb.ts` that reads all 16 seed cards from `knowledge.html`, plus all DEPLOY-*.md notes, plus reference banking docs from a `seed-docs/` folder.

> **Prompt E-4-b:** Wire RAG into the master agent: before each Groq call, retrieve top-3 chunks for the user message and prepend them to the system prompt as `<context>` blocks. Cap injected context at 1500 tokens. Log which chunks were used in the audit table.

> **Prompt E-4-c:** Add `/kb/ingest` endpoint on the Knowledge agent that accepts a `{ title, type, body, tags }` payload, chunks + embeds + writes to Vectorize + records the metadata in D1 `kb_documents`. Wire the "📥 Save current as artifact" button on `knowledge.html` to call this endpoint.

---

## Phase E-5 · Test Data Generator Agent

**Goal:** A dedicated agent that fabricates realistic mock data (capabilities, RAID items, RFP answers, transaction logs) and optionally pulls real-world data from free public APIs (World Bank, OpenBanking sandbox, FFIEC, Polygon free tier) for volume/perf testing.

**Free resources:** Cloudflare Workers · D1 · R2 (large fixture storage) · free public APIs.

**Deliverables:**
- `apps/agents/testdata/` worker with tools: `generate_capabilities`, `generate_raid_items`, `generate_rfp_answers`, `generate_transactions`, `pull_worldbank_data`, `pull_openbanking_sandbox`.
- Fixture seeds (10 K capabilities, 100 K transactions) stored in R2.
- `packages/testdata-lib/` for shared faker schemas.

**Prompts to paste back:**

> **Prompt E-5-a:** Build `apps/agents/testdata/` with 6 generator tools. Use `@faker-js/faker` for synthetic data and add a `seed` argument for deterministic output. Each tool writes the fixture to R2 under `testdata/<run-id>/<scenario>.jsonl` and returns the URL + row count.

> **Prompt E-5-b:** Add 3 real-world pull tools: `pull_worldbank_indicators` (GDP, banking sector size by country), `pull_openbanking_sandbox` (UK Open Banking Sandbox API), `pull_fred_rates` (US Federal Reserve free API for interest rates). Cache responses in D1 for 24h. Use only free unauthenticated endpoints.

> **Prompt E-5-c:** Add `scripts/seed-volume-fixtures.ts` that generates 10 K capability records and 100 K transaction records, uploads to R2 as `.jsonl.gz`. This is the corpus used by the Performance agent in Phase E-6.

---

## Phase E-6 · Agentic Test Framework (8 testing sub-agents)

**Goal:** Build the parallel agent tree under a Test Master. Each test agent is independently runnable; the Test Master orchestrates a full suite run.

**Free resources:** GitHub Actions (unlimited public repo minutes) · Playwright · Vitest · k6 · Cloudflare Workers for the test-master orchestrator.

**The 8 test agents:**

| # | Agent | Owns | Driver |
|---|---|---|---|
| T1 | **TestMaster** | Orchestrate, schedule, report | Cloudflare Worker + Queue |
| T2 | **TestData** (re-uses Phase E-5) | Fabricate fixtures per run | Worker |
| T3 | **UITest** | Page-level browser tests | Playwright on GH Actions |
| T4 | **BackendTest** | Agent / API contract tests | Vitest + supertest on GH Actions |
| T5 | **SITest** (System Integration) | Cross-agent flows · MCP contract checks | Vitest + MCP test client |
| T6 | **FunctionalTest** | Per-feature scenario coverage | Playwright |
| T7 | **E2ETest** | Multi-feature business journeys | Playwright |
| T8 | **PerfVolStress** | Load · stress · volume · soak | k6 |
| T9 | **EvidenceCapture** | Generates xlsx · docx · pdf evidence packs | Worker + SheetJS + docx + jsPDF |

**Test categories each agent covers:**

| Category | Owner | Examples |
|---|---|---|
| **Business** | E2E + Functional | "CRO can see RAID register for a Cards modernization scope and export to Excel" |
| **Functional** | Functional + UI | "Filtering Requirements by `Regulatory` lens hides Tech requirements" |
| **Product** | UI + E2E | "Onboarding flow completes in ≤4 steps · ⌘K reachable from every page" |
| **Technical** | Backend + SIT + Perf | "MCP `tools/call` p99 < 250 ms · D1 writes idempotent · Vectorize topK returns 3 results" |
| **Regulatory** | Functional + Evidence | "GDPR data-residency selector forces region · audit log immutable · BCBS 239 traceability present" |

**Prompts to paste back:**

> **Prompt E-6-a:** Scaffold `apps/test-master/` as a Cloudflare Worker that exposes `POST /runs` (kick off a full test suite). It writes a row to D1 `test_runs`, enqueues 7 jobs in Cloudflare Queue `aidp-test-runs` (one per T2–T9 agent), and returns a run ID. Add a `/runs/:id` endpoint that streams progress.

> **Prompt E-6-b:** Build `apps/agents/testdata/run-handler.ts` (T2 worker handler that listens on the queue). On `test-data-generate` messages, it fabricates the scenario fixtures and writes them to R2 under `test-runs/<run-id>/fixtures/`. Reports back to TestMaster via D1.

> **Prompt E-6-c:** Build the UI test runner (T3) as a GH Actions workflow `tests/ui/.github/workflows/ui.yml`. It runs Playwright against the deployed `apps/web/` URL. The workflow is triggered by the TestMaster via `repository_dispatch`. Add 12 starter Playwright specs covering Discovery, Architecture, Requirements, Actions, SOW, Governance, Operations, Blockchain, Knowledge, IaC, ⌘K palette, and Nishi chat smoke.

> **Prompt E-6-d:** Build the Backend test runner (T4) as `tests/backend/` with Vitest + supertest. 8 spec files — one per sub-agent — each calling `tools/list` and round-tripping every tool with mock inputs from T2's fixtures. Trigger via `repository_dispatch`.

> **Prompt E-6-e:** Build the SIT runner (T5) as `tests/sit/` — Vitest specs that drive multi-agent flows through the MasterAgent's `/chat` endpoint. 6 starter scenarios: RFP→Discovery→Architecture→EVP, Discovery→Requirements→Actions, SOW draft, Governance RAID add+gantt, Operations DORA fetch+SLO burn, Knowledge snapshot+restore.

> **Prompt E-6-f:** Build the Functional test runner (T6) in `tests/functional/` — Playwright specs grouped by feature, each asserting the feature's invariants (e.g. lens filter excludes other lenses, RAID delete confirms, MS Project XML validates).

> **Prompt E-6-g:** Build the E2E business-flow runner (T7) in `tests/e2e/` — 5 Playwright scripts for full multi-feature journeys: ("CTO at a Tier-1 bank does an end-to-end RFP through to SOW signoff", "CRO reviews Operations dashboard then files a RAID risk", etc.).

> **Prompt E-6-h:** Build the Performance/Volume/Stress agent (T8) as `tests/perf/k6/` — 4 k6 scripts: smoke, load (100 VU), stress (ramp to 1000 VU), soak (50 VU × 30 min). Each reads the 100 K transaction fixture from R2. Output JSON results into R2 under `test-runs/<run-id>/perf/`.

> **Prompt E-6-i:** Build the Evidence Capture agent (T9) as a Worker that listens for `evidence-pack` queue messages. On message, it reads all T3–T8 results from R2/D1 and generates 3 artifacts: `test-cases.xlsx` (one sheet per agent, columns: ID, Scenario, Steps, Expected, Actual, Status, Evidence URL), `test-summary.docx` (executive summary), and `test-report.pdf` (full report with screenshots). Files land in R2 under `test-runs/<run-id>/evidence/` and a signed URL is returned.

> **Prompt E-6-j:** Wire the full pipeline: pushing to `main` → master agent CI runs → on green deploy, GH Actions calls `POST /runs` on the TestMaster → TestMaster enqueues T2–T8 → all agents run in parallel where possible (T2 first, T3–T7 + T8 in parallel, T9 last) → final summary posted as GitHub commit status.

---

## Phase E-7 · Defect → Change Request → Patch loop

**Goal:** Every test failure flows into GitHub Issues as a Change Request. A patch agent proposes fixes via auto-PRs. Severity gates control auto-merge vs human review.

**Free resources:** GitHub Issues + Actions · Anthropic Claude Sonnet 4.6 (cheap, ≈$0.003 per fix attempt — keep budget at <$5/mo via cost guard).

**Deliverables:**
- `apps/agents/defect-manager/` worker with tools: `triage_failure`, `open_cr`, `propose_patch`, `auto_pr`, `close_cr_on_green`.
- Severity matrix: P1 (regulatory / data loss) → human review · P2 (functional regression) → auto-PR + 1 reviewer · P3 (cosmetic) → auto-PR + auto-merge after CI green.
- `tests/patch-validation/` — every auto-PR must pass the affected suites before merge.

**Prompts to paste back:**

> **Prompt E-7-a:** Build `apps/agents/defect-manager/` worker. On `test-failure` queue messages from TestMaster, it calls `triage_failure` (Claude Haiku categorizes the failure: regression / regulatory / cosmetic / flaky / new-bug), then opens a GitHub Issue with template (`.github/ISSUE_TEMPLATE/agent-cr.md`) including stack trace, run ID, evidence URL.

> **Prompt E-7-b:** Add `propose_patch` tool. Given an issue, it pulls the failing code (using GH API), constructs a focused prompt for Claude Sonnet 4.6, and gets a unified-diff back. Validates the diff applies cleanly to the repo.

> **Prompt E-7-c:** Add `auto_pr` tool. It creates a branch `patch/<cr-id>`, applies the diff, pushes, opens a PR. Adds a `severity-P3` / `severity-P2` / `severity-P1` label based on the triage. P3 auto-merges if CI is green; P2 requires 1 approver; P1 requires 2 approvers + manual deploy.

> **Prompt E-7-d:** Add a cost guard worker that checks Anthropic spend daily. If >$5/mo, downgrades all `propose_patch` calls to Llama via Groq (free) and posts a Slack notification (use Slack incoming webhook free tier).

---

## Phase E-8 · Comprehensive testing strategy & scenario libraries

**Goal:** Curate the actual test scenarios. Without good scenarios, the agents test nothing useful.

**Free resources:** No new infra · just content.

**Deliverables:**
- `tests/scenarios/business.yaml` — 30 scenarios.
- `tests/scenarios/functional.yaml` — 60 scenarios.
- `tests/scenarios/product.yaml` — 20 scenarios.
- `tests/scenarios/technical.yaml` — 40 scenarios.
- `tests/scenarios/regulatory.yaml` — 30 scenarios per region (US · EU · UK · APAC · India · MENA).

Each YAML entry: `{ id, category, feature, persona, prompt, expected_outcome, evidence_required }`.

**Prompts to paste back:**

> **Prompt E-8-a:** Author `tests/scenarios/business.yaml` with 30 scenarios. Mix of CTO, CRO, CFO, CIO, Head of Architecture personas. Each scenario is a sentence-form business question the platform must answer correctly (e.g. "Show me the 5 highest-cost capabilities across the modernization plan and which cloud is cheapest for each").

> **Prompt E-8-b:** Author `tests/scenarios/functional.yaml` with 60 scenarios, 6 per feature. Each covers: happy path, filter, edge case, error state, export, persistence.

> **Prompt E-8-c:** Author `tests/scenarios/product.yaml` with 20 scenarios. Focus on UX invariants: ⌘K reachability, mobile responsive, accessibility (A+/A−/contrast), pin/recent items work, audit log immutable.

> **Prompt E-8-d:** Author `tests/scenarios/technical.yaml` with 40 scenarios. MCP contract, idempotency, retries, queue backpressure, D1 write latency, Vectorize topK accuracy, cost guard correctness.

> **Prompt E-8-e:** Author `tests/scenarios/regulatory.yaml` — 30 scenarios per region (US SOX/GLBA · EU GDPR/DORA · UK FCA · APAC MAS/HKMA · India RBI · MENA SAMA/VARA). Each tests a specific clause's enforcement in the UI or agent output.

> **Prompt E-8-f:** Convert all five YAML files into the canonical test-case Excel via `scripts/yaml-to-xlsx.ts`. One workbook with 5 sheets: Business · Functional · Product · Technical · Regulatory. Stored in R2 as `test-catalog-vN.xlsx`. Wire the EvidenceCapture agent (T9) to reference this catalog when building per-run evidence.

---

## Phase E-9 · Post-test feedback loop · new-feature suggestions

**Goal:** After each test run, an analysis agent reads results and proposes (a) new features to add and (b) urgent fixes to redeploy as patches.

**Free resources:** Cloudflare Workers · Claude Sonnet 4.6 (small budget) or Llama 3.3 70B via Groq.

**Deliverables:**
- `apps/agents/insights/` worker with tools: `analyze_run`, `propose_features`, `propose_patches`, `publish_release_notes`.
- Weekly digest in GitHub Discussions + Cowork notification.
- Pinned dashboard tile on `home.html` showing "Latest insights · N proposed".

**Prompts to paste back:**

> **Prompt E-9-a:** Build `apps/agents/insights/analyze_run.ts` — given a test run ID, reads pass/fail counts, perf p99, regulatory pass rate, and writes a JSON `{ healthScore, regressions, slowdowns, regulatoryGaps, featureGaps }` to D1.

> **Prompt E-9-b:** Add `propose_features` tool. Reads the last 4 weeks of analyze_run outputs, asks Claude/Llama for 5 candidate new features ranked by user-value × build-effort, posts as GitHub Discussions.

> **Prompt E-9-c:** Add `propose_patches` tool. Reads open CRs (Phase E-7), groups related ones, and proposes a batched patch release. Generates a draft `DEPLOY-PATCH-N.md`.

> **Prompt E-9-d:** Add a `home.html` tile "🧠 Insights" that shows the latest health score (0–100), 2 most recent proposed features, and 1 most recent proposed patch. Click → opens `/insights` page (build a simple read-only dashboard).

---

## Phase E-10 · Observability, cost guards, hardening

**Goal:** Stay free forever. Visibility into all agent calls, queue depths, RPM, cost. Auto-throttle if any free tier nears 80%.

**Free resources:** Cloudflare Workers Analytics (built-in) + Better Stack (3 GB logs/mo free).

**Deliverables:**
- All workers wired to `console.log` JSON events ingested by Better Stack.
- Cost guard worker checks Groq/Anthropic usage hourly via their APIs.
- Free-tier-utilization page on `home.html` showing % consumed for Workers requests, D1 rows, R2 reads, Vectorize queries, Groq RPM.

**Prompts to paste back:**

> **Prompt E-10-a:** Add structured JSON logging to every worker — `{ ts, worker, route, user, latency_ms, tokens_in, tokens_out, cost_usd }`. Forward to Better Stack via their HTTP ingest endpoint (free tier supports 3 GB/mo · we'll be well under).

> **Prompt E-10-b:** Build `apps/agents/cost-guard/` — runs as a Cron trigger every hour. Reads quotas from Groq API, Anthropic API, Cloudflare Analytics. If any approaches 80% of free-tier ceiling, sets a flag in D1 `system_flags.degraded_mode = true`. All worker entrypoints check this flag and fall back to cached / cheaper paths (Llama via Workers AI · drop RAG to 1 result · skip non-critical writes).

> **Prompt E-10-c:** Add a `/system/utilization` endpoint on the master worker that returns current % of each free tier consumed. Build a `home.html` tile that polls this every 30 s and shows green/amber/red.

> **Prompt E-10-d:** Run a chaos test: shut down each sub-agent worker one at a time and verify the master agent (a) detects the outage within 5 s, (b) returns a graceful fallback message to the user, (c) re-routes around the broken agent for unrelated requests. Document results in `DEPLOY-BATCH-E-CHAOS.md`.

---

# Sequencing & effort

| Phase | Effort | Dependencies | Live-by milestone |
|---|---:|---|---|
| E-1 Foundation | 6 h | — | Workers responding to /health |
| E-2 Master Agent | 8 h | E-1 | Nishi chat through MCP master |
| E-3 Sub-agents (×10) | 20 h | E-2 | All features have MCP backing |
| E-4 RAG | 6 h | E-3 (knowledge agent) | Nishi answers cite KB chunks |
| E-5 TestData agent | 4 h | E-1 | Fixtures generate-able |
| E-6 Test framework | 14 h | E-3, E-5 | Push to main → green suite |
| E-7 Defect loop | 6 h | E-6 | Failures auto-CR auto-PR |
| E-8 Scenario libs | 8 h | E-6 | Suites have substance |
| E-9 Insights agent | 4 h | E-6, E-7 | Weekly digest live |
| E-10 Observability | 4 h | All | Free-tier never breached |
| **Total** | **80 h** | | |

If you want a faster MVP: phases E-1, E-2, E-3 (top 3 sub-agents only — Discovery, Knowledge, IaC), E-4, E-6 (T3 + T4 + T9 only) gives you a working agentic platform in ≈25 hours.

---

# Risks & mitigations

| Risk | Mitigation |
|---|---|
| Groq RPM (30 RPM free) exhausted during demos | Per-user rate limit at master agent · cache identical prompts in D1 · auto-fallback to Workers AI Llama |
| Cloudflare Workers CPU 10 ms cap | All LLM calls use `waitUntil` + Queue · streaming responses · keep per-request CPU work tiny |
| D1 5 M read/day limit | Every read goes through a 60 s LRU in Workers KV (free) |
| Anthropic cost on patch agent | Cost guard caps to $5/mo · falls back to Llama on overspend |
| Vector DB drift / stale chunks | Re-embed weekly via Cron trigger · version-stamp every chunk |
| Auto-PR introduces regression | P3 only auto-merges · P1/P2 gated · every patch must pass full T3+T4 suite before merge |
| Demo session hits 100+ users | Pre-warm workers · static fallbacks on each page (current behavior) so platform still works if backend is down |

---

# Getting started

When you're ready, paste back **Prompt E-1-a** to begin. I'll work through each prompt sequentially. You can pace it — one batch per session is fine. After each phase I'll ship a `DEPLOY-BATCH-E-<phase>.md` with the verification checklist, exactly like Batches A-D.

The platform stays demoable at every checkpoint: each phase ships behind a feature flag so the current static experience keeps working until you choose to enable the agent path.
