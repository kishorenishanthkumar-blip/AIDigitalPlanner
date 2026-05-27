# AIDigitalPlanner · Integrated Updates v2

**Purpose:** Folds three reinforcements into the master plan:

A. **Output Agent v2** — pulls the bank's strategic objectives and pain points (from RFP Questionnaire + Discovery) and **threads them through every section** of the executive PDF + animated video. The video becomes a properly animated explainer, not a slideshow.

B. **Testing Services** — new top-level feature that consolidates Test Data Management · Test Strategy · Test Plan Management · Testing Types · Defect Management · Upgrades into one workspace, with bank-audit-ready evidence flows.

C. **Zero-cost animated-video tech stack** — open-source Remotion + Lottie + Edge-TTS + ffmpeg + Hugging Face Spaces, with optional vendor free tiers (D-ID, ElevenLabs, Pictory). Plus the Cowork plugins/skills/MCPs to install so the agent ecosystem can drive it.

All still **$0/month at demo scale**. The full master plan is now 24 phases / ≈ 360 hours of build, every layer open-source or free-tier.

---

# A · Output Agent v2 — objectives-threaded brief

## A.1 · Where strategic objectives + pain points already live

The platform already captures these in the questionnaire / Discovery handoff. The Output Agent must read them and weave them through every section.

| Source key (localStorage) | What it contains |
|---|---|
| `di_handoff_from_questionnaire` → `profile` | Role, region, country, persona |
| `di_handoff_from_questionnaire` → `hints.outcomes` | Strategic objectives ("Reduce settlement time", "Cut TCO 30%", "Be DORA-ready by Jan 2025") |
| `di_handoff_from_questionnaire` → `hints.painPoints` (NEW — added in this update) | Specific pain points ("COBOL skill cliff", "Batch settlement window slipping", "Manual reconciliation costs $4M/yr") |
| `di_handoff_from_questionnaire` → `hints.legacyPlatforms` | Tech-stack inventory |
| `di_handoff_from_questionnaire` → `hints.currentLatency`, `complexityScale`, `riskAppetite`, `budget`, `horizon`, `residency` | Constraints |
| `di_questionnaire_output` → `derivedArtifacts.requirements` | RFP-derived business / functional / regulatory requirements |
| `di_discovery_v1` → capability rationale | Per-capability "why this verdict" tied back to outcomes |

## A.2 · The new "Strategic Context" thread

Every section in the brief gets a top callout that ties the section's content back to one or more stated objectives. Example for the Architecture section:

```
┌─ STRATEGIC CONTEXT ─────────────────────────────────────────────┐
│  Addresses objectives:                                          │
│   • Cut TCO by 30%      → 38% projected (page 7)                │
│   • DORA readiness 2025 → DORA controls mapped (page 9)         │
│   • Reduce settlement   → 2 days → 3 sec (page 6, slide 5)      │
│                                                                 │
│  Mitigates pain points:                                         │
│   • COBOL skill cliff   → REARCH off mainframe in 18 months     │
│   • Batch window slip   → Event-driven streaming · zero batch   │
│   • Manual recon $4M/yr → Auto-recon via on-chain settlement    │
└─────────────────────────────────────────────────────────────────┘
```

This single change transforms the brief from "here's a modernization plan" to "here's how we deliver on what you said matters." The shift in C-suite reception is significant.

## A.3 · Updated section list (10 sections, 3 newly objectives-aware)

| # | Section | Objectives-threading |
|---|---|---|
| 1 | Title page + audience | Audience pulled from `profile.role` |
| 2 | **Executive summary** | Opens with one-sentence-per-objective restatement · closes with measurable commitment per objective |
| 3 | **Your context** *(NEW · was implicit)* | Full restatement of all objectives + pain points + constraints + region pack · ≈ 1.5 pages |
| 4 | Requirements (4 lenses) | Each requirement labeled with the objective(s) it serves |
| 5 | Features used | Maps platform features to pain points solved |
| 6 | Design (TradFi/DeFi/Hybrid) | Top callout shows objectives addressed by the design choice |
| 7 | Architecture | Components annotated with pain points each one eliminates |
| 8 | **Profits** | Every metric tied to a stated objective ("You wanted 30% TCO cut → we project 38%") |
| 9 | **Risks · Mitigations · Contingency** | Each risk labels which objective it puts at risk |
| 10 | Regulatory & compliance | Per-region pack already objective-aware |
| 11 | Next 90 days · ask & sign-off | Sign-off lines reference objectives — accountability per objective |

### A.4 · Section 3 "Your context" — the new bridge

A standalone section that proves the brief read the bank's input back correctly. Three blocks:

```
┌─ STATED OBJECTIVES ─────────────────────────────────────────────┐
│  1. Reduce cross-border settlement time from T+2 to near-real-  │
│     time before Q2 2026.                                         │
│  2. Cut Cards & Payments TCO by 30% over three years.           │
│  3. Be DORA-compliant by January 17, 2025 across all EU corridors│
│  4. Eliminate dependency on contracted COBOL specialists by 2027 │
└─────────────────────────────────────────────────────────────────┘

┌─ PAIN POINTS ───────────────────────────────────────────────────┐
│  · Mainframe COBOL skills: 14 specialists remaining, avg age 58 │
│  · Settlement window slipping past 06:30 GMT 4x / week           │
│  · Manual reconciliation costs $4.2M/year, 18 FTEs               │
│  · 3 jurisdictional audits flagged BCBS 239 lineage gaps in 2024 │
│  · Regulator queries take avg 7 business days to satisfy         │
└─────────────────────────────────────────────────────────────────┘

┌─ CONSTRAINTS ──────────────────────────────────────────────────┐
│  Region: EU + UK + Singapore                                    │
│  Data residency: hard EU + UK boundary, MAS for SG              │
│  Budget envelope: $18M one-time + $12M/yr run                   │
│  Risk appetite: Conservative (Tier-1, public-listed)            │
│  Horizon: 18 months program duration                            │
│  Required regulatory: DORA, BCBS 239, MAS TRM, FCA, GDPR        │
└─────────────────────────────────────────────────────────────────┘
```

If the brief opens with this, the C-suite knows the rest is built on their reality, not boilerplate. That's the confidence lift.

## A.5 · Updated prompts (OUT-v2)

These supersede OUT-3 and OUT-5 from the previous plan; the rest of OUT-1, 2, 4, 6-10 stay as written.

> **Prompt OUT-V2-1:** Update `questionnaire.html` to capture an explicit `painPoints` list (multi-line free text or tag input) in the RFP flow. Persist into `di_handoff_from_questionnaire.hints.painPoints` as an array of `{ id, text, severity, owner }`. Also surface the existing `outcomes` capture as an editable list with the same shape.

> **Prompt OUT-V2-2:** Update `assets/output-templates.js`. Add a `context` template that produces Section 3 "Your context" from `outcomes` + `painPoints` + constraints (legacyPlatforms, complexityScale, riskAppetite, budget, horizon, residency, region pack frameworks). Every other section's template now accepts the same objectives/pain-points payload and emits a `<context-callout>` block at the top of each section.

> **Prompt OUT-V2-3:** In the wizard (`output-brief.html`), add a left rail sticky panel "📌 Objectives & Pain Points" that lists every stated item with a checkbox. Toggling one filters which sections highlight that item. Lets the executive auditor verify "is X addressed?" in one glance.

> **Prompt OUT-V2-4:** In `assets/output-agent.js`, when generating the brief, run a "coverage check" — every objective and every pain point must be referenced in at least one section. If any is uncovered, show a warning chip "⚠ 2 pain points not addressed" with a one-click "Ask Nishi to draft coverage" button.

> **Prompt OUT-V2-5:** Add a "Traceability matrix" appendix to the PDF — a table where rows are objectives + pain points, columns are sections, cells are ✓ / ✗ / page numbers. This is gold for bank audit committees.

---

# B · Testing Services — new top-level feature

## B.1 · Purpose

Today the testing framework is described in plan documents but invisible in the running platform UI. **Testing Services** makes it a first-class feature page that executives, auditors, and regulators can navigate. It's where evidence lives, where strategy is documented, where defects are managed, where the agentic test framework is operated.

**Why this matters for bank audits:** When a regulator or internal auditor asks "show me your test evidence for the last 12 months covering BCBS 239 lineage," the answer is one click — Testing Services → Testing Types → Regulatory → BCBS 239 → Last 12 months → signed evidence PDF.

## B.2 · Page structure — `testing-services.html`

```
┌──────────────────────────────────────────────────────────────────┐
│  🧪 TESTING SERVICES · audit-ready · continuous · agent-driven    │
│                                                                  │
│  ┌─ Coverage health ─┐ ┌─ Last run ─────┐ ┌─ Open defects ──┐    │
│  │ 94% scenarios     │ │ 5 min ago      │ │ P1: 0  P2: 2    │    │
│  │ 100% reg coverage │ │ ✓ 287 passed   │ │ P3: 14         │    │
│  │ 12 K evidence pcs │ │ ✗  3 failed    │ │ Triaged today: 5│    │
│  └───────────────────┘ └────────────────┘ └─────────────────┘    │
│                                                                  │
│  ┌─ 6 sub-services ─────────────────────────────────────────────┐│
│  │  📂 Test Data Management    🗺 Test Strategy & Docs           ││
│  │  📋 Test Plan Management    🎯 Testing Types (5 categories)   ││
│  │  🐞 Defect Management       🚀 Upgrades & Patch Mgmt          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [ ▶ Run full suite ]  [ ⬇ Audit evidence pack (last 12 mo) ]   │
│  [ 📅 Schedule recurring ]  [ 💬 Ask Nishi about a scenario ]    │
└──────────────────────────────────────────────────────────────────┘
```

Each of the 6 cards is a sub-page.

## B.3 · The 6 sub-services in detail

### B.3.a · Test Data Management (TDM) · `testing-services/tdm.html`

| Feature | Detail |
|---|---|
| Fixture catalog | Every test fixture: name, type (synthetic / real-world / production-derived), volume, age, refresh interval, retention, masking applied |
| Sources | TestData agent (E-5) outputs + World Bank / FRED / OpenBanking Sandbox / FFIEC public pulls |
| Masking & tokenization | PII / PCI / SPDI fields masked per region rules (DPDP, GDPR, PCI) · masking rule library editable |
| Synthetic data wizard | Faker schemas per banking domain (cards, payments, deposits, lending, trade, treasury) · seedable for deterministic runs |
| Volume packs | Pre-generated 10K / 100K / 1M / 10M-row corpora for perf testing |
| Lineage | Every fixture tagged with provenance — used by which test runs, retained because of which compliance rule |
| Refresh schedule | Cron-driven regen · weekly / monthly / quarterly · automatic stale detection |

**Audit value:** Regulators frequently ask "what data are you using for testing and is any of it real customer data?" — TDM page answers in one screen.

### B.3.b · Test Strategy & Documentation · `testing-services/strategy.html`

| Feature | Detail |
|---|---|
| Strategy doc per release | Editable rich-text · sections: scope, approach, environments, tools, schedule, entry/exit criteria, sign-off |
| Templates | ISTQB-aligned template · IEEE 829 template · agile test-strategy template |
| Versioning | Every published strategy versioned; previous versions immutable (audit trail) |
| Approval workflow | Drafts → reviewed → approved · approvers logged with timestamp |
| Linked to release | Strategy bound to a release tag · CI gate blocks release if no approved strategy |
| Export | DOCX · PDF · Confluence-ready Markdown |

### B.3.c · Test Plan Management · `testing-services/plans.html`

| Feature | Detail |
|---|---|
| Plans per release | Each plan: scope, in/out, schedule, owners, scenarios included, exit criteria |
| Scenarios linked | Picks from the 180+ scenarios across the 5 categories (E-8 catalog) |
| Owner assignment | Per-section owner with email + SLA |
| Live status board | Plan progress · % scenarios run · pass rate · blockers |
| Cross-plan dependencies | Highlight where Plan A's exit gate depends on Plan B |
| Burn-down | Daily burn-down chart against scheduled completion |

### B.3.d · Testing Types · `testing-services/types.html`

The 5 categories (Business · Functional · Product · Technical · Regulatory) get a navigable grid. Each cell links to:

| Per category, you see | |
|---|---|
| Scenario count | E.g. Functional · 60 scenarios |
| Last run pass rate | E.g. 96.7% |
| Coverage by feature | Heatmap |
| Run history | Last 30 runs · pass/fail timeline |
| Evidence packs | xlsx / docx / pdf per run · signed |
| Owner | Designated category lead |
| Regulatory mapping (regulatory category) | DORA Art. 24 · BCBS 239 P1 · SOX 404 · RBI Cyber Adaptive · MAS TRM 644 |

Special: **Regulatory** category has a sub-grid per region — when a regulator from a specific jurisdiction comes asking, one click filters to their corner.

### B.3.e · Defect Management · `testing-services/defects.html`

| Feature | Detail |
|---|---|
| Kanban board | Columns: Triaged · In Progress · Patch Proposed · In Review · Verified · Closed · Won't Fix |
| Cards | Defect ID · severity (P1-P4) · linked test scenario · failure cause · evidence URL · proposed patch PR · age |
| Filters | Severity · category · feature · region · assignee · age |
| Detail view | Stack trace · screenshots · reproduction steps · linked GitHub Issue/PR · linked CR document |
| Root-cause categorization | Code · config · data · environment · third-party · flaky · enhancement-request |
| Aging policy | P1 → 24 h SLA · P2 → 5 d · P3 → 30 d · P4 → backlog. Auto-escalation past SLA |
| Reporting | Mean time to resolution (MTTR) · defect leakage · regression rate · per-feature defect density |
| Auditor mode | Filter to "closed in the last 12 months" with all evidence in a single PDF export |

### B.3.f · Upgrades & Patch Management · `testing-services/upgrades.html`

| Feature | Detail |
|---|---|
| Patch release register | Every `DEPLOY-PATCH-N.md` listed with date, scope, defects fixed, risks introduced |
| Insights-proposed upgrades | New features proposed by Insights agent (E-9) with health-score uplift estimate |
| Approval workflow | Tech lead → Product owner → Change Advisory Board (CAB) → deploy gate |
| Rollback plan | Every upgrade requires a written rollback procedure before approval |
| Linked test runs | Each upgrade shows: pre-deploy test run, post-deploy test run, regression test run · all evidence linked |
| Production change calendar | Standard ITIL change calendar view · blackout windows respected · ITIL Change Request export |

## B.4 · How Testing Services lifts bank audit confidence

| Auditor question | Where it's answered in seconds |
|---|---|
| "Show me your test strategy for release 24.4" | Strategy page · select release · download signed PDF |
| "What data did you test with? Was any customer data used?" | TDM page · per-fixture lineage and masking |
| "Show me your evidence for BCBS 239 coverage in the last 12 months" | Types → Regulatory → BCBS 239 → 12-month filter → ⬇ Evidence pack |
| "What defects are still open from your last 3 releases?" | Defects → filter by release · live Kanban |
| "What's your MTTR for P1 defects this year?" | Defects → reporting page · YTD chart |
| "Are upgrades tested before going live?" | Upgrades → click any patch → linked pre/post test runs |
| "What's your patch approval process?" | Upgrades → workflow diagram → CAB log |
| "Are you doing performance / stress testing?" | Types → Technical → Perf scenarios → run history |
| "How are you protecting against prompt injection?" | Types → Technical → Security · run history of red-team agent (E-11) |

Each is a single click. **That's audit-grade.**

## B.5 · Testing Services prompts (Batch G · 32 hours)

> **Prompt TSV-1:** Build `testing-services.html` as the hub described in §B.2. KPI cards on top (coverage health, last run, open defects), 6 sub-service cards, 4 CTA buttons. Pull data from D1 / R2 (agentic) or `localStorage` (static).

> **Prompt TSV-2:** Build `testing-services/tdm.html` per §B.3.a. Includes a fixture catalog table with filters; a Synthetic Data Wizard launcher that calls the TestData agent (E-5) when available, falls back to local Faker scripts in static mode; masking rule editor.

> **Prompt TSV-3:** Build `testing-services/strategy.html` per §B.3.b. Rich-text editor with ISTQB / IEEE 829 / Agile templates. Versioning via localStorage list (static) or D1 `test_strategies` (agentic). DOCX export via docx skill; PDF via existing `output-pdf.js`.

> **Prompt TSV-4:** Build `testing-services/plans.html` per §B.3.c. Linked to scenario library. Live status board pulling latest run data. Burn-down chart with Chart.js (lazy-loaded from CDN).

> **Prompt TSV-5:** Build `testing-services/types.html` per §B.3.d. 5 category sections with sub-grid per region for Regulatory. Each cell click → run history + evidence list. Evidence pack downloader filters by date range.

> **Prompt TSV-6:** Build `testing-services/defects.html` per §B.3.e. Kanban board with drag-drop (DragDropMate or HTML5 native). Detail modal with stack trace + screenshots + linked Issue/PR. SLA aging colors. Auditor-mode filter + single-PDF export.

> **Prompt TSV-7:** Build `testing-services/upgrades.html` per §B.3.f. Patch register with rollback plan column. Linked test-run table per upgrade. CAB approval workflow with timestamped approver log.

> **Prompt TSV-8:** Add `assets/testing-evidence.js` — generates the "Audit evidence pack" PDF that bundles last-N-months scenarios + runs + defects + strategy + plans into one signed PDF. Calls EvidenceCapture agent (T9) in agentic mode or generates browser-side in static mode.

> **Prompt TSV-9:** Wire the existing scenarios YAML files (E-8) into the Types page. Show counts, pass rates, last-run timestamps. Make every scenario click-through to its definition + run history.

> **Prompt TSV-10:** Add Testing Services to the top-bar Features mega-menu and ⌘K palette (shortcut `g t`). Add a home.html tile showing coverage health + last run + open P1/P2 counts.

> **Prompt TSV-11:** Add `tests/scenarios/testing-services.yaml` with 24 scenarios covering: TDM fixture lifecycle, strategy versioning, plan dependency tracking, type sub-grid filters, defect SLA aging, upgrade rollback validation, audit-pack generation.

> **Prompt TSV-12:** Write `DEPLOY-BATCH-G.md` with QA checklist, screenshots, audit-pack sample, regulator persona walkthrough.

## B.6 · Effort & sequencing

| Prompt | Effort |
|---|---|
| TSV-1 hub | 3 h |
| TSV-2 TDM | 4 h |
| TSV-3 Strategy | 3 h |
| TSV-4 Plans | 3 h |
| TSV-5 Types | 4 h |
| TSV-6 Defects | 5 h |
| TSV-7 Upgrades | 3 h |
| TSV-8 Audit-pack PDF | 3 h |
| TSV-9 Scenario wiring | 1 h |
| TSV-10 Menu + ⌘K + tile | 1 h |
| TSV-11 Scenarios | 1 h |
| TSV-12 Deploy notes | 1 h |
| **Total Batch G** | **32 h** |

---

# C · Zero-cost animated-video tech stack

The current Output Agent v1 produces a slideshow with TTS narration. To make it **actually animated and beautiful**, we add real motion graphics. All components stay free.

## C.1 · The stack (all free or self-hostable)

| Layer | Choice | License / cost |
|---|---|---|
| **Motion graphics engine** | **Remotion** (React-based programmatic video) | MIT · free for self-hosted (paid only for cloud rendering, which we skip) |
| **Vector animation library** | **Lottie** (Bodymovin) + free animations from LottieFiles | MIT · free Lottie JSONs |
| **Voice narration** | **Edge-TTS** (Microsoft's public endpoint) | Free, no API key, near-unlimited |
| **Alternative voices (premium)** | **ElevenLabs free tier** (10K chars/mo) + **Coqui TTS** (self-hosted, open source) + **Bark** (Suno open source) | Free within quota, then $0 forever via self-host |
| **AI b-roll / scene cuts (optional)** | **Stable Video Diffusion** on Hugging Face Spaces (free GPU community tier) · or **Replicate** free credits | Free within quota |
| **Talking-head avatar (optional)** | **D-ID free tier** (5 min/mo) · or **HeyGen free trial** · or **Synthesia free preview** · or skip entirely | Free within quota |
| **Lip-sync (optional)** | **Wav2Lip** open source (self-host in container) | MIT · free |
| **Video assembly** | **FFmpeg** | LGPL · free |
| **Captions** | OpenAI Whisper open source (self-host) or Edge-TTS phoneme timestamps | Free |
| **Music** | **Pixabay free music** library · YouTube Audio Library · Free Music Archive | Free with attribution |
| **Stock footage (rare cases)** | Pexels Videos / Pixabay Videos (free CC0) | Free |
| **Stock imagery** | Unsplash / Pexels / Pixabay (free CC0) | Free |
| **Icon library** | Iconify / Tabler Icons (open source) | MIT |

## C.2 · Why Remotion is the right engine

Remotion lets you describe a video as React components. Every motion-graphic technique — Ken Burns, parallax, particle systems, animated charts, kinetic typography, exploding diagrams, isometric architecture builds — is a few lines of React + spring/timing curves.

A 10-slide explainer becomes ~200 lines of TSX. The output is a real MP4. Banks see something that looks like a creative-agency production, generated in 90 seconds from data.

Examples of motion patterns we'll ship:

| Section | Animation pattern (built on Remotion + Lottie) |
|---|---|
| §1 Title | Bank logo zooms in with particle burst (Lottie) · audience name slides in from below · subtle gold gradient sweep |
| §2 Exec summary | Headline word-by-word reveal (kinetic typography) · key numbers count up ($14.2M → $8.8M with rolling-digit animation) |
| §3 Your context | Pain points listed with each tile flipping in 200ms apart · severity bar fills · checkmark animation when objective is "covered later" |
| §4 Requirements | 4-lens wheel rotates · each lens highlights as its requirements scroll in |
| §5 Features | Platform feature icons (Lottie) bounce in, each one labeled with the pain point it addresses |
| §6 Design | Three-mode reveal — TradFi grid forms, then DeFi grid morphs in, then Hybrid grid combines them with crossover lines |
| §7 Architecture | Cloud regions fade in as base layer · K8s nodes pop on top · services connect with animated arrows showing data flow |
| §8 Sample tx flow | Animated payment object travels through the architecture, lighting up each component as it arrives · timer in corner shows latency |
| §9 Profits | Bar charts grow with elastic easing · before/after sliders animate · NPV waterfall builds left-to-right |
| §10 Risks | 5×5 risk heatmap fills cell by cell with severity colors · mitigation card slides in for each risk |
| §11 Regulatory | World map · regions highlight in sequence as their frameworks are named · checkmarks tick |
| §12 Outro | Logo + audience handoff line · "Generated by AIDigitalPlanner" subtle |

All driven by data from the canonical bundle. Same data → different visuals depending on persona and length.

## C.3 · The pipeline (every step free)

```
1. Output Agent compiles brief state (objectives, pain points, sections)
2. LLM (Groq Llama 3.3 70B free) writes per-section narration script
   · constrained 145-160 WPM target so total lands ≤ 5:00
3. Narration text → Edge-TTS (free) → MP3 per section
   (optional: ElevenLabs free tier for premium voice on opening/closing)
4. Remotion video composition (TSX) renders 30fps 1080p MP4 server-side
   · pulls in Lottie JSONs for vector animations
   · pulls in any SVGs from Live Designer
   · audio mixed from MP3s
5. Whisper or Edge-TTS timestamps → VTT captions file
6. FFmpeg packages MP4 + VTT + watermark + intro/outro music
7. Output lands in R2 / MinIO (free) with signed share URL
```

**Hosting the renderer:** Remotion's CLI runs in a container. Container deploys to:
- Oracle Cloud Always Free (already in plan)
- Hugging Face Spaces free GPU (when AI b-roll is wanted)
- GitHub Actions free runner (for one-off renders triggered by webhook)

**Render time:** 5-min 1080p video renders in 60-120 seconds on a single Ampere VM. On a Hugging Face Space GPU, 30-60s. Tab-independent · async · user gets a notification + share link when done.

## C.4 · The static fallback (browser-only)

If a user has no agentic backend (early-batch users, air-gapped environments), Remotion can render in the browser via **`@remotion/player`** for preview and **`@remotion/cli` + WebCodecs API** for browser-side render. Lower fidelity but still real animation, not a slideshow. Total render time in-browser ~3-5 min for a 5-min video.

## C.5 · Sample voices

Edge-TTS provides ~120 free voices. The platform exposes 8 curated defaults:

| ID | Locale | Tone |
|---|---|---|
| en-US-AriaNeural | US English Female | Warm, professional · default |
| en-US-GuyNeural | US English Male | Authoritative |
| en-GB-SoniaNeural | UK English Female | Formal, polished |
| en-GB-RyanNeural | UK English Male | Calm, City of London |
| en-IN-NeerjaNeural | Indian English Female | Friendly, articulate |
| en-IN-PrabhatNeural | Indian English Male | Clear, RBI-suited |
| en-SG-LunaNeural | Singapore English Female | Crisp, MAS-suited |
| en-AE-FatimaNeural | UAE English Female | Cross-MENA suitable |

Add any of the other 112 voices via dropdown.

## C.6 · Updated video prompts (replace OUT-7 from prior plan)

> **Prompt OUT-V2-VIDEO-1:** Add `apps/video-renderer/` as a containerized Remotion project. `src/compositions/ExecutiveBrief.tsx` is the root composition with 12 numbered scenes matching §C.2's animation patterns. Each scene is a React component that reads from a `briefData` prop and renders motion graphics with `@remotion/animation`, `@remotion/lottie`, `@remotion/transitions`.

> **Prompt OUT-V2-VIDEO-2:** Create `containers/video-renderer/Dockerfile` based on `node:22-bullseye-slim` with `ffmpeg` + Chrome dependencies. Multi-arch (amd64+arm64). Final image ≤ 800 MB. Exposes `POST /render` endpoint accepting `briefData` JSON, returns S3-style URL of the finished MP4.

> **Prompt OUT-V2-VIDEO-3:** Add 12 Lottie animation JSONs in `apps/video-renderer/lotties/`: logo-burst, kinetic-type-reveal, pain-point-tile, lens-wheel-4, feature-bounce, mode-morph, k8s-build, payment-flow, bar-grow-elastic, risk-heatmap-fill, world-map-highlight, brand-outro. Free downloads from LottieFiles community library.

> **Prompt OUT-V2-VIDEO-4:** Wire `assets/output-agent.js` so that on "🎬 Render video", it calls the agent or container with the brief data. Polls `/runs/<id>/status` until done. Shows progress (compose 30%, narrate 60%, render 90%, finalize 100%). On done, returns the MP4 URL plus VTT captions.

> **Prompt OUT-V2-VIDEO-5:** Add fallback browser-side renderer using `@remotion/player` for preview and offer "Render in browser" mode for users without the agentic backend. Uses WebCodecs API (Chromium-only) to write MP4 client-side. Show a "best viewed with backend" hint.

> **Prompt OUT-V2-VIDEO-6:** Add optional D-ID avatar overlay on slides 1 and 12 via D-ID free tier (5 min/mo budget). HITL gate confirms the spend before each call. Falls back to no avatar if quota exhausted.

> **Prompt OUT-V2-VIDEO-7:** Add `tests/scenarios/video.yaml` with 18 scenarios: video duration band 4:00-5:00, all 12 scenes present, narration ≤ 800 words, captions sync within 100ms, brand colors propagated, objectives-callout present, pain-points referenced, signed URL accessible 7 days, multi-arch image runs on ARM Oracle VM, render time < 180s p95.

---

# D · Cowork plugins · skills · MCPs to install

These extend the Cowork agent ecosystem to support animated video generation and bank-audit workflows. All free.

## D.1 · Plugins to install via Cowork plugin marketplace

Suggest installing (search via `mcp__plugins__search_plugins` then `mcp__plugins__suggest_plugin_install`):

| Plugin (search keywords) | Why |
|---|---|
| `video`, `remotion`, `animation` | Animated video generation helpers |
| `ffmpeg`, `media` | Video / audio assembly tooling |
| `lottie`, `motion` | Vector animation handlers |
| `tts`, `voice`, `narration` | Text-to-speech wrappers |
| `whisper`, `transcription` | Captioning / SRT generation |
| `pdf`, `report` | Already have via `anthropic-skills:pdf` |
| `audit`, `compliance`, `evidence` | If present in marketplace for audit-pack workflows |
| `chart`, `dataviz` | For risk heatmaps, financial charts |

## D.2 · Skills to create (via skill-creator)

The user can invoke `skill-creator` to author these as reusable skills the agents can call:

| Skill name | Purpose |
|---|---|
| `video-explainer` | Given a brief state JSON + voice ID, produces a 4-5 min animated MP4 via Remotion + Edge-TTS pipeline |
| `lottie-build` | Composes Lottie JSON dynamically from a set of layered animations (used by `video-explainer`) |
| `audit-evidence-pack` | Takes a date range and a category filter, builds a signed PDF bundle of all test artifacts (scenarios + runs + defects + strategy versions) |
| `bank-objectives-tracker` | Ingests questionnaire answers, builds objective + pain-point taxonomy, surfaces coverage state across the platform |
| `regulatory-coverage-mapper` | Maps platform features + capabilities to regulatory framework clauses (DORA, BCBS 239, SOX, RBI, MAS, etc.) — output is the matrix shown in audit packs |
| `defect-triage-banking` | Banking-specific defect classifier (regulatory / fraud-related / customer-impacting / operational) with auto-routing |
| `traceability-matrix` | Builds objective → requirement → design → test → evidence trace table (appendix in Output v2 PDF) |

Each skill is a single SKILL.md + supporting scripts in `/skills/<name>/`. Created with the `skill-creator` skill in this Cowork session.

## D.3 · MCPs to connect (via `mcp__mcp-registry__suggest_connectors`)

When you're ready, run a search-and-connect cycle for these:

| Connector (search terms) | Why |
|---|---|
| `d-id`, `avatar`, `talking-head` | Optional avatar overlay on video |
| `elevenlabs`, `voice` | Premium TTS as fallback |
| `huggingface`, `inference` | Self-hosted models, free GPU spaces |
| `groq`, `together-ai` | Free LLM inference for narration scripts |
| `github`, `pull-requests`, `issues` | For defect / CR / patch workflows |
| `confluence`, `jira` | Many banks use these for testing artifacts |
| `notion`, `linear` | Alternative project management |
| `figma` | Design embeds in animated videos |
| `iconify`, `noun-project` | Icon library |
| `s3`, `r2`, `minio` | Object storage for video outputs |
| `slack`, `teams`, `webex` | Notify on render complete |
| `pagerduty`, `opsgenie` | Defect P1 escalation |
| `splunk`, `datadog`, `elastic` | Observability ingest |
| `git`, `gitlab`, `bitbucket` | For multi-repo banks |
| `kubernetes`, `k8s`, `helm` | Direct cluster ops |
| `terraform`, `pulumi` | IaC generators beyond what we already build |
| `aws-bedrock`, `azure-openai`, `vertex` | Enterprise LLM providers (for paid tiers) |
| `wallet`, `web3`, `metamask` | Wallet integration for DeFi flows |
| `xrpl`, `ripple` | XRPL operations |
| `chainlink`, `oracle` | DeFi oracles |

The user controls install — every MCP add prompts for permission.

## D.4 · How agents use them

Each container agent declares its dependencies in its `package.json` / `requirements.txt`. The skills are invoked via Cowork's Skill tool from within agent prompts. The MCPs are invoked via the master agent's tool registry. All three layers (plugins, skills, MCPs) compose cleanly because they all follow standardized contracts (Cowork plugin spec · SKILL.md spec · MCP JSON-RPC).

---

# E · Updated master phase list

Folding A + B + C into the master plan:

```
E-0     Platform abstractions + multi-tenancy                  (6 h)
E-0.5   Containerization scaffold                              (8 h)
E-1     Foundation infra (K8s-native)                          (10 h)
E-2     Master Agent (HITL + citation)                         (12 h)
E-3     10 feature sub-agents + MRM hooks                      (24 h)
E-3.5   Service mesh + SPIFFE                                  (4 h)
E-4     RAG + tokenization                                     (8 h)
E-5     TestData agent                                         (4 h)
E-6     Test framework (8 containerized test agents)           (16 h)
E-7     Defect → CR → patch loop                               (8 h)
E-8     Scenario libraries · 30-region regulatory              (12 h)
E-9     Insights agent + MRM Pack Generator                    (6 h)
E-10    Observability + chaos schedule                         (8 h)
E-11    Adversarial red-team agent                             (5 h)
E-12    Reference banking workflows                            (12 h)
E-13    Marketplace scaffold                                   (7 h)
E-14    XRPL Payments Agent                                    (10 h)
E-15    EVM Contracts Agent                                    (12 h)
E-16    Cross-chain bridge agent                               (5 h)
E-17    Key custody + HSM                                      (6 h)
E-18    Designer Agent                                         (13 h)
E-19    Output Agent · server-side v2 (objectives + animated)  (18 h)  was 14h, +4h for objective threading + Remotion
─────────────────────────────────────────────────────────────────────
F-1     Live Architecture Designer · static UI                 (28 h)
F-2     Executive Output Agent · static v2                     (40 h)  was 36h, +4h for objectives + Remotion-in-browser fallback
G       Testing Services feature (NEW · this doc · §B)         (32 h)  NEW
H       Animated video infra (NEW · this doc · §C)             (14 h)  NEW · Remotion + Lottie + Edge-TTS containerized
─────────────────────────────────────────────────────────────────────
Master total                                                   328 h
```

**$0/month at demo scale across all 24 phases. ≈ 328 hours of focused build.**

Already-completed work (Batches A · B · C · D · this conversation): the static feature platform that's currently live. Everything from this plan extends the live system without breaking it.

## E.1 · Recommended sequencing

Three priority lanes that can run in parallel:

| Lane | Phases | Total | Owner |
|---|---|---|---|
| **A · Demo-grade UX upgrade** | F-1 · F-2 · G | 100 h | Front-end heavy, ships into current site |
| **B · Agent foundation** | E-0 → E-5 | 64 h | Backend / DevOps |
| **C · Banking depth** | E-12 · E-14 · E-15 · E-16 · E-17 | 50 h | Blockchain / domain |

Once any lane lands a phase, the user sees value. Lane A is the fastest visible-impact path; Lane B is the foundational backbone; Lane C is the differentiator vs other modernization tools.

## E.2 · Single highest-leverage first prompt

If you start tomorrow, **Prompt OUT-V2-1** is the right one:

> *Update `questionnaire.html` to capture an explicit `painPoints` list (multi-line free text or tag input) in the RFP flow. Persist into `di_handoff_from_questionnaire.hints.painPoints` as an array of `{ id, text, severity, owner }`. Also surface the existing `outcomes` capture as an editable list with the same shape.*

It's 90 minutes of work. It immediately unlocks the entire objectives-threading machinery for the rest of the Output Agent (Section 3 "Your context" and the traceability matrix in the audit pack). Every later phase becomes more powerful because every brief, every test plan, every regulatory check now starts from the bank's actual stated objectives instead of generic templates.

---

# F · Summary of what changed in this update

1. **Output Agent v2** — Section 3 "Your context" auto-built from questionnaire data · objectives + pain points + constraints front-loaded · every other section gets a strategic-context callout · coverage check warns on missed items · traceability matrix appendix · animated video properly animated via Remotion + Lottie.

2. **Testing Services (Batch G · 32 h)** — new top-level feature consolidating TDM · Strategy · Plans · Types · Defects · Upgrades into a single audit-ready workspace · 6 sub-pages · audit evidence pack one-click PDF · regulator-persona walkthrough · scenario / run / evidence / defect / patch all linked.

3. **Animated video stack (Batch H · 14 h)** — Remotion-based motion-graphics engine (free, MIT) · Lottie vector animations · Edge-TTS free narration · ffmpeg assembly · all containerized · runs on Oracle Always Free or HF Spaces · browser fallback via @remotion/player · 12 motion patterns documented.

4. **Plugin / skill / MCP recommendations** — exhaustive list of zero-cost Cowork extensions to install for the platform's agent ecosystem, including 7 new custom skills via skill-creator and 20+ MCP connectors to suggest.

5. **Updated master plan** — 24 phases · 328 hours · still $0/month at demo scale.

Ready when you are. Most-leveraged first prompt: **OUT-V2-1**.

