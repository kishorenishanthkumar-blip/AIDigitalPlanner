# AIDP Platform · Consolidated Backlog

**As of:** 2026-05-27 (revised after planning-doc audit)
**Status:** Platform is live in production. Backend = 14 Workers + 1 testing-master. Front-end = 18 HTML pages + 12 studios + testing-dashboard. CI = Deploy Pages + Deploy Workers + E2E Playwright (17 tests).

This file replaces the 2026-05-21 backlog (which has since shipped almost entirely). Use this as the menu for what's next. Each item is sized to ≤4 hours of focused work unless flagged as a multi-week program.

**Reference reading** (committed to `docs/planning/`):
- `AGENTIC_ROADMAP.md` — original Batch E plan (Phases E-1 through E-10)
- `EXECUTIVE_OUTPUT_AGENT.md` — output-agent design (fully shipped)
- `INTEGRATED_UPDATES_V2.md` — output-agent v2 + testing-services (fully shipped)
- `LIVE_ARCHITECTURE_DESIGNER.md` — LAD-1 + LAD-2 below
- `CONTAINERIZED_BLOCKCHAIN_ARCHITECTURE.md` — containerization + chain depth (P5 deferred)
- `ENTERPRISE_GRADE_RECOMMENDATIONS.md` — P3.5 enterprise gates below

---

## P1 · Active pending items (suggested for next sprint)

These came up during the testing-dashboard / Playwright / E2E-trigger work in the last few sessions. They're scoped, value-dense, and unblock real triage workflows.

| ID | What it ships | Effort | Why now |
|---|---|---|---|
| **PEND-1** | **Defect status workflow** — dropdown per defect row in /testing-dashboard exposing `tm_patch_status` (open → in_progress → fixed → wont_fix → duplicate). Persists via D1, updates the gate count. | 2 hr | Dashboard already shows defects; today there's no way to act on them. Turns the surface from passive viewing into real triage. |
| **PEND-2** | **Niche-I → testing-master tool-use** — Niche-I can call `tm_run_suite` / `tm_list_runs` / `tm_get_report` via LLM tool-use. Lets users ask "run a fleet test" or "what failed yesterday?" in natural language. | 3 hr | Niche-I already routes to discovery / architecture / etc. agents. Adding the testing-master is one more tool registration. |
| **PEND-3** | **PAT rotation reminder** — scheduled task that emails on Day 80 (≈Aug 14, 2026) and Day 89. The current GitHub PAT (`aidp-testing-master-e2e-trigger-v2`) expires ~Aug 25, 2026. | 30 min | If the PAT silently expires, the "Also run browser E2E" checkbox starts failing silently. Better to get a calendar warning. |
| **PEND-4** | **Data-content E2E tests · phase 2** — Steps 13-17 today are structural (workspace renders, columns exist). Add 5 more tests (Steps 18-22) that actually click Run buttons in each studio, wait for agent response, assert content. | 4 hr | Catches real regressions in the agent ↔ frontend glue, not just page loads. |
| **PEND-5** | **Dashboard · severity rollup chart** — small sparkline showing pass-rate trend over the last 25 runs. Today the dashboard tells you "today's run is green" but not "we've been red for 3 days." | 2 hr | Trend visibility — buyers and SREs look for it. |
| **PEND-6** | **Run Suite modal · "all scopes" sequential mode** — let the modal kick off discovery-studio + architecture-studio + requirements-studio etc. one after another instead of forcing one scope per click. | 2 hr | Saves clicks during regression sweeps. |

---

## P2 · Operational / hardening items

| ID | What it ships | Effort | Why |
|---|---|---|---|
| **OPS-1** | Replace single-PAT for `tm_trigger_e2e` with a GitHub App installation token | 4 hr | PAT is tied to one user; GitHub App is org-scoped, auto-rotates, and survives team changes. |
| **OPS-2** | Better Stack (or equivalent) log ingestion replacing D1 log tables across all 14 Workers | 4 hr | D1 isn't designed for high-volume log writes. Listed in old `E-3-REMAINING-ROADMAP.md` as E-6-a. |
| **OPS-3** | Status page at `status.aiagenticplanner.com` showing each Worker's /health + dashboard run history | 3 hr | External-facing trust signal. Listed in old roadmap as E-8-a. |
| **OPS-4** | Cost analytics dashboard (LLM + Worker + storage spend per tenant per day) | 4 hr | FinOps story for buyers. Listed as E-6-c. |
| **OPS-5** | Per-agent runbooks in `apps/agents/*/RUNBOOK.md` — common failure modes, how to diagnose, how to rollback | 3 hr | Reduces panic when something breaks at 2am. |

---

## P3 · Feature programs (multi-day, lower urgency)

| ID | What it ships | Effort | Notes |
|---|---|---|---|
| **FEAT-1** | **E-3-h · Blockchain sub-agent** — XRPL + EVM + Solana anchoring of SOWs and exception receipts. | ~2 days | Listed in `E-3-REMAINING-ROADMAP.md` Wave D. Requires hot wallet + RPC provider accounts + smart contract deployments. Defer until RWA/tokenization is a confirmed buyer priority. |
| **FEAT-2** | **E-4 · RAG-driven Knowledge enhancements** — ingestion pipeline (cron), hybrid BM25+vector search, embedding cache + model version registry, per-citation source tracker. | ~1 week | Builds on the live Knowledge agent. Major lift for RAG quality. |
| **FEAT-3** | **E-5 · Testing services backend** — 8 testing sub-agents (functional, performance, security, accessibility, compliance, contract, integration, e2e) + TestData generator + closed Defect→CR→Patch loop. | ~2 weeks | Today testing-master has 8 INTERNAL layers but the public testing-services pages are static. This wires them to real agents. |
| **FEAT-4** | **E-7 · Insights agent** — LLM running over platform data to produce per-tenant program-health reports + cross-tenant trend detection (anonymised). | ~1 week | High-value "AI shows me the insights I didn't know to ask for" pitch. |
| **FEAT-5** | **Per-defect drill-down enrichments** — reproduction-step playback, links to the failing test source, attach screenshots/HAR captured by Playwright. | 4 hr | Speeds up triage materially. |
| **FEAT-6** | **Multi-tenant pricing model** — today `tenant: guest` is the only persona. Wire real auth + per-tenant D1 scoping. | ~3 days | Required before any commercial pilot. |
| **LAD-1** | **Live Architecture Designer · static implementation** — clickable 7R verdict pill on Discovery opens a TradFi / DeFi / Hybrid mode picker that renders editable layer-library architectures (cloud-native, blockchain-native, hybrid bank-grade). Sample transaction flow per mode. | ~16 hr | Designed in `docs/planning/LIVE_ARCHITECTURE_DESIGNER.md` but never built. Strong demo addition — visualises the 7R verdict instead of just naming it. |
| **LAD-2** | **Live Architecture Designer · agentic upgrade (Phase E-18)** — converts the static designer to an LLM-driven agent that proposes layer compositions from RFP context + chosen mode. | ~1 week | Builds on LAD-1. |
| **FEED-1** | **Phase E-9 · post-test feedback loop** — testing-master defect patterns + buyer-question logs feed an LLM that auto-suggests new features / studios / capabilities. Closes the learning loop. | ~1 week | Designed in `docs/planning/AGENTIC_ROADMAP.md` Phase E-9. Differentiator vs static demo tools. |

---

## P3.5 · Enterprise gates (required for tier-1 bank sales)

These are derived from `docs/planning/ENTERPRISE_GRADE_RECOMMENDATIONS.md`. They turn the current "great working demo" into a deployable enterprise-grade agentic banking platform. Most are multi-week or multi-sprint efforts; tier-1 banks WILL ask about them during procurement.

| ID | What it ships | Effort | Why a bank cares |
|---|---|---|---|
| **ENT-1** | **Banking trust & safety layer** — (a) Model risk management aligned to SR 11-7 / FFIEC / EBA guidance; (b) Human-in-the-loop approval gates beyond just patch-agent; (c) Explainability & citation enforcement (every LLM output traces to source); (d) Prompt injection / jailbreak defense (input validation + output scanning + monitoring). | ~4 weeks | Banks have model risk committees. No model risk story = no sale. SR 11-7 is the US regulatory floor. |
| **ENT-2** | **Identity, access, multi-tenancy** — RBAC + ABAC, audit-grade access logs, tenant data isolation at every layer, SSO via SAML/OIDC. Extends FEAT-6. | ~2 weeks | Banks won't let a vendor manage their identities — they federate. |
| **ENT-3** | **Data residency / sovereignty / BYOK** — Per-region D1 + R2 placement, customer-managed encryption keys via Cloudflare KV-with-HSM, region-locked tenants. | ~2 weeks | EU (GDPR), India (RBI), Singapore (MAS), UAE (DIFC) all require regional residency. BYOK is table stakes. |
| **ENT-4** | **Immutable, regulator-friendly audit** — Extend the chain_hash design to full WORM audit log + auditor-facing export (Excel/PDF) + retention policy enforcement (7 years for SOX, 11 for MiFID II). | ~1 week | Already partial (chain_hash on exception_index done). Auditors expect this level of evidence. |
| **ENT-5** | **Production resilience** — Chaos testing (Toxiproxy / Litmus), circuit breakers per sub-agent, retry budgets with jitter, graceful-degradation matrix per service, 99.9% SLA dashboards. | ~2 weeks | Banks expect 99.9%+ availability. Current platform has no failure-injection tests. |
| **ENT-6** | **Core banking + payment-rail integration depth** — Reference adapters for Temenos T24, Finacle, FIS Profile, Mambu (core banking) + SWIFT, ACH/FedNow, RTP, UPI, SEPA INST (rails). | ~3 weeks per integration | Each integration is an immediate sales lever for that ecosystem. Start with Temenos + SWIFT if you're chasing tier-1. |
| **ENT-7** | **First-class banking workflows** — KYC/AML pre-built playbook, customer onboarding orchestration, payments orchestration (multi-rail), fraud detection plugins, ECL/IFRS9 model integration. | ~3 weeks per workflow | Differentiates from generic-modernization tools. "We ALSO know banking" wins the demo. |
| **ENT-8** | **AgentOps & continuous evaluation** — Drift detection, prompt-version A/B testing, reproducibility ledgers (replay any past run), eval harness with golden answers, automatic rollback on quality regression. | ~2 weeks | Extends current testing-master from "did it pass?" to "is it still as good as last week?" |
| **ENT-9** | **Build once, deploy three ways** — Same Worker code runs on Cloudflare (default), Kubernetes (banks' own cluster), or AWS Lambda + RDS (banks who already standardised on AWS). Conditional bindings + abstraction layer. | ~3 weeks | Banks with on-prem mandates can't host on Cloudflare. Multi-deploy story unlocks those buyers. |

⚠ Pick AT MOST 2-3 of ENT-1 to ENT-9 per quarter. Each one is real engineering and most require external partners (audit firms for ENT-1, payment rails for ENT-6, etc.). Sequencing depends on which buyer segment you target first.

---

## P4 · Known issues / tech debt

| ID | Issue | Severity | Notes |
|---|---|---|---|
| **DEFECT-1** | OneDrive sync occasionally shows stale file views in WSL mount — caused two near-misses this session (Phase B typecheck phantom-truncation, post-Edit re-reads showing old content). | low (tooling, not platform) | Workaround: use direct Windows terminal to verify. Document in DEPLOY runbook. |
| **DEFECT-2** | Bridge POST silently logs to console — no alert if testing-master returns isError. | low | Could add a CI step that grep's `bridge.*isError` and fails the job. |
| **DEFECT-3** | `tm_post_external` does not yet enforce `ref` schema — accepts any string. Could be tightened to validate git-SHA / URL formats. | low | Defensive hardening only. |
| **DEFECT-4** | Demo tenant seeder writes localStorage keys but does not call agent backends to seed D1. Some studios show "empty" on first visit unless you click Run. | low | Functional gap, not a bug. Acceptable for demos. |
| **DEFECT-5** | `tm_trigger_e2e` only supports the default branch (`main`) — no UI to pick a feature branch for a preview deploy. | low | Edge case until preview-deploy E2E becomes a use case. |

---

## P5 · Explicitly skipped (retained from 2026-05-21 backlog)

These were debated, decided against, kept here so we don't accidentally rebuild them.

| Skipped capability | Why |
|---|---|
| Separate Governance chatbot | Single-Nishi-with-context is the right pattern. Two chatbots confuse users. |
| MP4 / WebM video generator with voice-over | Browser FFmpeg.wasm is heavy; SVG animated explainers cover the demo case. Replaced by the Lottie + Remotion stack delivered in OUT-V2-VIDEO-*. |
| Off-hours auto-remediation | Real auto-fix requires backend + write-access to live systems. Theater without it. Patching agent (already shipped) covers the supervised version. |
| Web3 / wallet auth / on-chain audit / IPFS storage | Banking buyers don't ask for it. Audit log gives the tamper-evidence story without crypto regulatory risk. (FEAT-1 above is the optional re-entry point.) |
| Active Nishi co-pilot inside Discovery wizard | Existing floating dock + per-step hint already cover 90% of the value. |
| Custom SVG illustrations on every empty state | Polish, not value. Existing empty states are clear with CTAs. |
| xterm.js full terminal emulator for Nishi CLI | Existing slash-command-aware chat does the same job with less weight. |
| Container-first architecture migration (OCI / Kubernetes from day-one) | Designed in `docs/planning/CONTAINERIZED_BLOCKCHAIN_ARCHITECTURE.md` §1. Cloudflare Workers covers 95% of use cases at $0-$5/mo with auto-scale and global edge. Re-evaluate ONLY if a buyer mandates on-prem (handled instead via ENT-9 multi-deploy story) or if a non-Cloudflare cost/feature gap appears. |
| Cross-chain bridge + HSM key custody (full blockchain stack from day-one) | `docs/planning/CONTAINERIZED_BLOCKCHAIN_ARCHITECTURE.md` §2.d-e. Folded into FEAT-1 expansion when blockchain becomes a confirmed product priority. |

---

## Recently shipped (last 6 sessions · for context)

This is condensed — full task list in `local-agent-mode-sessions` transcripts.

**Session of 2026-05-27 (today):**
- Fixed bridge ingestion: external defect normalization (tasks #215-216)
- Decoupled `tm_post_external` from `runSuite` to stop layer inflation (#218)
- Added `tm_trigger_e2e` MCP tool + GitHub PAT round-trip (#219)
- 5 new data-content Playwright tests (Steps 13-17) (#220)
- "Re-run with same scope" button in defect panel (#221)
- Testing Dashboard surfaced on home + Features menu, WIP/PLANNED badge infrastructure (#222-223)

**Earlier sessions (2026-05-22 → 26):**
- Tasks #190-214: Phase 0 shared shell + Phase 1A-1C (Requirements/Actions/SOW Workspaces) + Phase 2A-2B (Governance/Operations Workspaces) + Phase 3A-3B-3C (Knowledge/IaC Workspaces + EVP live cross-bind) + demo tenant seeder + manual E2E walkthrough + Pages auto-deploy + Playwright E2E runner.
- Tasks #180-189: Testing-master Worker scaffold + 8 test layers + testing-dashboard + post-deploy gate + 16 Architecture Studio defect patches.

**Batch E backend program (2026-05-22 → 24):**
- Tasks #121-178: monorepo restructure, master-agent + 11 sub-agents, MCP cross-binding, Groq LLM router, Discovery/Architecture/Requirements/Actions/SOW/Governance/Operations/IaC/Knowledge/Exception/Patching agents, validator agent, full retrofit through exception-client. All 14 Workers live.

**Batches A-D (2026-05-21):**
- Tasks #81-90: every item from the original BACKLOG.md Phases 20-23. Discovery rebuild, EVP, SOW, Governance, Operations, Knowledge, IaC Bundle, Excel export, banking taxonomy, per-cloud architecture SVGs. All shipped.

---

## How to use this file

1. **At sprint start:** pick from P1 first (highest leverage), then P2 (hygiene), then P3 if there's runway.
2. **When a buyer asks** for something that's not here, add it to P1/P3 with an estimate.
3. **When a defect surfaces** in production, log it in P4 immediately — don't lose it.
4. **When something ships,** move it from P1-P3 to "Recently shipped" so this file stays accurate.
5. **Quarterly review:** sweep P5 (explicitly skipped) — sometimes context changes and a "no" becomes a "yes."

---

Last updated: 2026-05-27 by AIDP build session.
Previous version archived in git history at this file's prior commit.
