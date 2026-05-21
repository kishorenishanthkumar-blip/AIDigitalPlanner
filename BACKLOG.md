# DI Platform · Deferred backlog

**Status:** Build paused 2026-05-21 for buyer validation
**Total deferred:** 14 phases · ~50 hrs of focused build work
**Plus:** 1 multi-week backend program (Phase 24)

When you're ready to resume, this file is the menu. Each entry is sized to ≤ 4 hours of focused work so phases stay shippable.

---

## Batch A · Change requests on existing pages (~17 hrs · highest demo ROI)

These polish what's already shipped. Lowest risk, fastest visible improvement.

| Phase | What it ships | Estimate | Why it matters |
|---|---|---|---|
| **20.1** | Current vs Future side-by-side view restored on Discovery 7R result | 3 hr | The EY-style executive view buyers expect. Strongest single visual for board demos. |
| **20.2** | Auto-fill questionnaire answers → Discovery wizard fields | 3 hr | Eliminates the most-painful double-entry between RFP and Discovery. |
| **20.3** | Per-country regional packs (split NA into US-SOX, Canada-OSFI; APAC into India-RBI, Singapore-MAS, etc.) | 3 hr | Matches how banking regulators are actually structured. Speaks the auditor's language. |
| **20.4** | Skillset + effort breakdown on EVP + Nishi session wrap-up summary | 3 hr | Closes the "where does the $3.95M actually go?" CFO question. |
| **20.5** | Banking taxonomy alignment (Consumer / Corporate / Retail / Cards / Capital Markets / Treasury / Securities) on Discovery | 3 hr | Speaks the buyer's vocabulary instead of generic "Banking Core". |

---

## Batch B · New value-add pages (~15 hrs)

Genuinely new pages that fill gaps in the demo.

| Phase | What it ships | Estimate | Why it matters |
|---|---|---|---|
| **21.1** | Role-tagged AI Requirements page (Tech / Biz / Prod / Regulatory views with role owners) | 4 hr | Banking buyers ask "show me the requirements grouped by who owns them" all the time. |
| **21.2** | Role-Based Action page (EY-style table: filters → KPIs → role-prioritized actions → drill-down) | 4 hr | The page the original EY screenshots showed. Banking buyers recognize the format. |
| **21.3** | Blockchain + RWA discovery + requirements page (currently only a feature-explainer Beta) | 4 hr | Differentiator — only a few platforms cover bank-grade RWA tokenization. |
| **21.4** | Auto-generated per-cloud architecture SVG diagrams (AWS / Azure / GCP / OCI / IBM) | 3 hr | Beyond pricing — visual proof that the platform "knows" each cloud's native stack. |

---

## Batch C · Reporting + operations depth (~10 hrs)

Closes gaps around exports and operational maturity.

| Phase | What it ships | Estimate | Why it matters |
|---|---|---|---|
| **22.1** | Real Excel (.xlsx) export + canonical JSON schema across every artifact | 4 hr | Banking buyers live in Excel. Today we have CSV only. |
| **22.2** | 9-layer infra spec mapping on Architecture Studio (compute · network · DB · security · containers · AI/ML · web · desktop · legacy) | 3 hr | Architects expect this level of specificity. |
| **22.3** | Operations: DORA metrics + error budget + cost-per-txn + L1-L4 ticket workflow | 3 hr | Brings Operations dashboard up to SRE-recognized maturity. |

---

## Batch D · Knowledge + IaC (~7 hrs)

Cross-cutting trust + deployment polish.

| Phase | What it ships | Estimate | Why it matters |
|---|---|---|---|
| **23.1** | Knowledge Artifacts Repository (search + version on top of existing audit log; role/region/module tags) | 4 hr | "Institutional memory" pitch for buyers worried about staff turnover. |
| **23.2** | Terraform modules per cloud + GitHub Actions + Helm chart + ops/runbook.md | 3 hr | "We have IaC for every cloud" closes procurement questions. |

---

## Phase 24 · Backend program (multi-week, deferred)

Bundles every prompt that requires real server infrastructure. **Do NOT incrementally squeeze these into the static frontend program — they're a separate project.**

- Loosely coupled container backend (FastAPI/Go microservices)
- OpenTelemetry observability
- Multi-agent architecture: Discovery Agent · Requirements Agent · Architecture Agent · Governance Agent · Ops Agent + orchestrator
- MCP server registering each agent as an MCP tool, connected to Nishi as user-facing entry
- Free vector DB (Qdrant self-hosted or pgvector on Postgres)
- RAG pipeline: chunk + embed every captured input + knowledge artifact, retrieve at query time
- Mock-data generation (UI form + Nishi conversational flow)
- Continuous learning loop with groundedness scoring

**Effort estimate:** 8-12 weeks for one engineer. Bundle as a "Phase 2 of the product" pitch separate from the current demo.

---

## Explicitly skipped (with reasoning)

| Skipped capability | Why |
|---|---|
| Separate Governance chatbot | Single-Nishi-with-context is the right pattern. Two chatbots confuse users. |
| MP4 / WebM video generator with voice-over | Browser FFmpeg.wasm is heavy; SVG animated explainers cover the demo case. |
| Off-hours auto-remediation | Real auto-fix requires backend + write-access to live systems. Theater without it. |
| Web3 / wallet auth / on-chain audit / IPFS storage | Banking buyers don't ask for it. Audit log gives the tamper-evidence story without crypto regulatory risk. |
| Active Nishi co-pilot inside Discovery wizard | Existing floating dock + per-step hint already cover 90% of the value. |
| Custom SVG illustrations on every empty state | Polish, not value. Existing empty states are clear with CTAs. |
| xterm.js full terminal emulator for Nishi CLI | Existing slash-command-aware chat does the same job with less weight. |

---

## How to use this file

1. Talk to 2-3 buyers using `DEMO-GUIDE.md`.
2. Note which capabilities they ask about that aren't there yet.
3. Pick the matching backlog items above and prioritize them.
4. Resume the build with those items in order, ≤ 4 hrs per phase, depth-first.

That's the feedback loop. Don't build speculative features.

---

Last updated: 2026-05-21 · Built with focus.
