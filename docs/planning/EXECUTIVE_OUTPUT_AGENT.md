# Executive Output Agent · PDF + ≤5-minute Narrated Video

**Trigger:** any point in the platform — Discovery 7R card, Architecture cell, Live Designer, SOW, EVP Summary — has a "📽 Generate Executive Brief" button that hands the current use case to the **Output Agent**. The agent compiles, lets the user edit, then renders both a **branded executive PDF** and a **sub-5-minute narrated video** covering Requirements · Features · Design · Architecture · Executive Summary (cost · time · optimizations · risks · mitigations · contingency · regulatory).

The audience is C-suite. The goal is **qualitative output that increases customer confidence**, including from a regulatory / compliance perspective.

---

## 1 · What the Output Agent ingests

When the user clicks "📽 Generate Executive Brief" on any page, the agent pulls together the canonical bundle (the same one Phase 22.1's `canonical()` produces) plus optional user-provided context:

| Source | What it contributes |
|---|---|
| Discovery state | Capability scope, 7R verdicts, current vs future stack, savings band |
| Architecture state | Picked clouds per capability, 3-yr TCO, blueprint SVGs |
| Live Architecture Designer | Per-capability TradFi/DeFi/Hybrid design, sample flows, cost band |
| Requirements | 4-lens requirements, role pills, regulatory clauses |
| Actions | Role-based action plan, priorities, owners, dollar impact |
| SOW | Fixed price, milestones, payment terms |
| Governance · RAID | Risks, assumptions, issues, dependencies with severity + owner |
| Operations | DORA metrics, SLO posture, cost-per-tx |
| Knowledge | Snapshots, regulatory playbooks |
| Profile + Region | Bank name, region, audience persona (CTO/CRO/CFO/Board) |
| User edits | Free-text overrides per section in the editable preview |

---

## 2 · The 9 sections every brief contains

| # | Section | Length in PDF | Length in video |
|---|---|---|---|
| 1 | **Title page + audience** | 1 page | 5 s |
| 2 | **Executive summary** (the one-pager) | 1 page | 30 s |
| 3 | **Requirements** (4 lenses condensed) | 2-3 pages | 45 s |
| 4 | **Features** (10 platform features tied to the use case) | 1-2 pages | 40 s |
| 5 | **Design** (TradFi/DeFi/Hybrid choice + why) | 2 pages | 45 s |
| 6 | **Architecture** (target state SVG, 9-layer or 12-layer overlay) | 2 pages | 50 s |
| 7 | **Profits** (cost, time, optimizations, payback) | 2 pages | 45 s |
| 8 | **Risks · Mitigations · Contingency** (from RAID + new ones) | 2-3 pages | 60 s |
| 9 | **Regulatory & compliance posture** | 1-2 pages | 30 s |
| 10 | **Next 90 days · ask & sign-off** | 1 page | 10 s |
| **Total** | | **15-19 pages** | **≈ 4 min 40 s** |

The "Executive summary" (§2) is a one-page distillation an EVP can read in 90 seconds and leave informed. Everything that follows is the supporting detail.

---

## 3 · Editable preview (the wizard)

After the agent compiles the draft, the user sees a **wizard-style preview** before render. Every section is editable:

```
┌──────────────────────────────────────────────────────────────────┐
│  📽  Executive Brief · Cards & Payments Modernization · CTO view  │
│                                                                  │
│  [ Title ] [ Exec Summary ] [ Requirements ] [ Features ]        │
│  [ Design ] [ Architecture ] [ Profits ] [ Risks ] [ Reg ]       │
│  [ Next 90d ]                                                    │
│                                                                  │
│ ──────────────────────────────────────────────────────────────── │
│  Section: Executive summary                                       │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ The Cards & Payments rearchitect program will replace the    ││
│  │ legacy COBOL/IBM z/OS settlement engine with an event-driven ││
│  │ microservices stack on AWS, settling cross-border via        ││
│  │ XRP Ledger. Three-year TCO drops 38% ($14.2M → $8.8M).       ││
│  │ ...                                                          ││
│  │                                                              ││
│  │ [ ✏ Edit · auto-saves ]                                       ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Tone:  ⊙ Executive  ○ Architect  ○ Auditor                      │
│  Length: ⊙ Standard 4-5 min  ○ Short 2-3 min  ○ Detailed 7-9 min │
│  Voice:  ⊙ Aria (Edge female, en-US)  ○ Guy (Edge male, en-US)   │
│          ○ Sonia (Edge female, en-GB)  ○ Neerja (Edge en-IN)     │
│  Brand:  [ Upload PNG logo ]  Colors: [ #C8921A ] [ #1A2238 ]    │
│                                                                  │
│  [ ↻ Regenerate this section ]  [ 💬 Ask Nishi to refine ]       │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  [ ⬇ Render PDF only ]  [ 🎬 Render video only ]  [ Both ]        │
│  [ 📌 Save as Knowledge artifact ]                                │
└──────────────────────────────────────────────────────────────────┘
```

Tabs across the top jump between sections. Each section has its own editor (rich-text or markdown). The "Regenerate" button asks the LLM to redraft that section only. "Ask Nishi to refine" opens a side chat where the user can say "make the cost numbers more conservative" or "add a quote from the McKinsey banking 2024 report" and Nishi edits inline.

---

## 4 · Executive content templates

### 4.a · The Profits section (§7) — the C-suite money slide

Three sub-blocks, always present:

```
┌─ COST ──────────────────────────────────┐
│  Current run-rate         $14.2M / yr   │
│  Future run-rate (yr-3)   $8.8M  / yr   │
│  Savings (3-yr cumulative)  $16.2M       │
│  One-time program cost     $4.8M         │
│  Net 3-yr benefit          $11.4M        │
│  Payback                   1.7 yrs       │
│  NPV (12% discount, 5 yrs) $18.6M        │
└─────────────────────────────────────────┘

┌─ TIME ──────────────────────────────────┐
│  Time to first capability live   4 months│
│  Full program duration           18 mo   │
│  Critical-path capabilities      3       │
└─────────────────────────────────────────┘

┌─ OPTIMIZATIONS ─────────────────────────┐
│  Throughput               +320% (4.2K → 17K TPS) │
│  p99 latency              -68%  (820 → 260 ms)   │
│  Deploy frequency         +600% (1/wk → 6/day)   │
│  Change failure rate      -55%  (12% → 5.4%)     │
│  MTTR (Sev1)              -64%  (118 → 42 min)   │
│  Cloud cost / transaction -42%  ($0.024 → $0.014)│
└─────────────────────────────────────────┘
```

All numbers pulled from Architecture cost + Operations DORA + Discovery 7R rationale. User can override any value before render.

### 4.b · Risks · Mitigations · Contingency (§8) — confidence-builder

For every risk, three columns. Pulled from RAID register + synthesized from the design + regulatory gap analysis:

| Risk | Mitigation | Contingency |
|---|---|---|
| Mainframe COBOL skill scarcity drags timeline | Engage 2 specialist vendors with retention bonuses · pair with internal staff for transfer | If still slow at month 6, descope 2 non-critical capabilities, extend timeline 3 months. Pre-negotiated extension clause in SOW. |
| Cross-border XRPL settlement subject to regulatory uncertainty in 3 of 14 jurisdictions | Phase rollout — start with 4 confirmed-safe corridors (US, UK, Singapore, UAE) · file pre-clearance with each regulator | Fallback to SWIFT GPI for the 3 contested corridors · revert plan tested in pre-prod |
| ERC-3643 token contract audit not yet complete | OpenZeppelin + Trail of Bits dual audit before mainnet · permissioned chain (Besu) until audits clear | If critical vuln found, rollback contracts in a single multisig tx · all funds held in escrow with 7-day timelock |
| AWS region outage during settlement window | Active-active across us-east-1 + us-west-2 with cross-region replication (RPO 5s) · monthly chaos test | Switch DNS within 90 s via Route53 health checks · degraded mode falls back to manual settlement |
| BCBS 239 data lineage gaps in legacy systems | Lineage capture from day 1 via OpenLineage + Marquez · daily lineage completeness report | If a regulatory exam finds gaps, supply complete forensic trail from the immutable audit anchor (OpenTimestamps Merkle root) within 24 h |
| Single LLM vendor lock-in (Groq) | Abstract via `packages/llm/` · Groq + Anthropic + Bedrock + Azure OpenAI all swappable | If Groq has outage, automatic fallback to Llama on Cloudflare Workers AI · degraded-mode banner shown |

Banks visibly relax when they see this kind of triple-column treatment because it answers the only three questions that matter to a risk committee: *what could go wrong · what are you doing about it · what's the parachute*.

### 4.c · Regulatory & compliance section (§9)

Auto-generated from the user's region pack + capability scope:

```
┌─ Applicable frameworks ─────────────────────────────────────────┐
│  Global / cross-region:                                          │
│    · BCBS 239 — risk data aggregation (in scope, controls mapped)│
│    · DORA EU — operational resilience (live 2025-01-17)          │
│  US (NA region):                                                 │
│    · SOX 404 ITGC                                                │
│    · OCC Bulletin 2013-29 third-party risk                       │
│    · FFIEC IT Examination Handbook                               │
│  India:                                                          │
│    · RBI Cybersecurity Framework 2016 — Adaptive tier            │
│    · RBI Cloud Outsourcing Master Direction 2023                 │
│    · DPDP Act 2023 — data localization for SPDI                  │
│  Singapore:                                                      │
│    · MAS TRM Notice 644                                          │
│    · MAS Project Guardian (DeFi pilot inclusion)                 │
│  …                                                               │
└─────────────────────────────────────────────────────────────────┘

┌─ Compliance posture ─────────────────────────────────────────────┐
│  SOC 2 Type II certified · expires 2026-Q3                       │
│  ISO 27001:2022 certified                                        │
│  PCI DSS Level 1 (if cards data in scope)                        │
│  Audit anchor: daily Merkle root → public XRPL mainnet           │
│  Data residency: hard-enforced per region                         │
│  Encryption: BYOK (customer KMS) · HYOK option available         │
│  MRM coverage: full pack auto-generated on every model swap      │
└─────────────────────────────────────────────────────────────────┘
```

This is the single most-photographed page when you hand the PDF to a Chief Compliance Officer.

---

## 5 · Output formats

### 5.a · The PDF

| Property | Decision |
|---|---|
| **Renderer (static path)** | jsPDF + html2canvas in the browser · 15-19 pages · 4-5 MB |
| **Renderer (agentic path)** | Puppeteer / Playwright Chromium in a container · prints HTML/CSS to PDF · pixel-perfect, embedded fonts |
| **Branding** | Customer logo upload · two brand colors picker (primary + accent) · default = DI gold + ink |
| **Cover** | Full-bleed cover · capability name · 7R verdict · audience persona · date |
| **TOC** | Auto-generated · hyperlinked |
| **Charts** | Cost/savings bar chart · DORA radar chart · risk heatmap (5×5 likelihood × impact) |
| **Diagrams** | SVG from Live Designer embedded at full resolution |
| **Citations** | Every claim with a "[K-12]" superscript → footnote linking to Knowledge artifact |
| **Watermark** | "DRAFT · DI Platform · Confidential" toggle (matches existing EVP behavior) |
| **Signatures** | Optional last page with sign-off lines for sponsor + CTO + CRO + CCO |
| **Accessibility** | Tagged PDF · WCAG AA · alt text on every image |

### 5.b · The video (≤ 5 minutes)

| Property | Decision |
|---|---|
| **Length** | ≤ 5:00, default 4:40 (variable by detail toggle) |
| **Frame rate / resolution** | 1920 × 1080, 30 fps, MP4 H.264 baseline |
| **Slides** | One per section (10 slides) · subtle pan/zoom (Ken Burns) for liveness |
| **Narration** | Edge-TTS via Microsoft's free Cognitive Services voices · 6 voice options (en-US Aria · Guy, en-GB Sonia · Ryan, en-IN Neerja · Prabhat). Backup: Coqui TTS open source, self-hosted. |
| **Captions** | Burned-in SRT optional · separate `.vtt` always shipped |
| **Background music** | Optional · royalty-free track from Cloudflare or free library (default off) |
| **Avatar (optional, premium tier)** | D-ID / HeyGen integration · adds talking-head presenter to first + last slide · free tier has 5 min/mo |
| **Branding** | Logo lower-third throughout · brand colors on slide backgrounds |
| **Sample-flow animation** | The 8-12 step transaction flow animates step-by-step on the Architecture slide |
| **Hosting** | Generated MP4 lands in R2 / MinIO · signed URL valid 7 days · downloadable + streamable |

### 5.c · The narration script structure

The LLM produces the narration in this structure per slide. Every line ≤ 22 words for natural pace:

```
[Slide 2 · Executive summary · 30 s]
"The Cards and Payments modernization replaces a legacy mainframe settlement engine
with a cloud-native, event-driven microservices platform on AWS.

Three-year cost drops thirty-eight percent, from fourteen point two million to eight
point eight million dollars annually.

Cross-border settlement moves to the XRP Ledger, cutting settlement time from two
days to three seconds.

The program runs eighteen months, with first capability live in four months."
```

The LLM is constrained to maintain a 145-160 words-per-minute target so the total length lands in the 4:30-5:00 band.

---

## 6 · Static-now implementation (Batch F-2 · 36 hours)

Ships into the current static site without any backend agents. Uses browser-side rendering for both PDF and video.

### 6.a · Files & wiring

| File | Change |
|---|---|
| `output-brief.html` (new) | The editable wizard described in §3 |
| `assets/output-agent.js` (new) | `window.DI.output.openBrief(useCaseId)` · compiles state, manages wizard, calls renderers |
| `assets/output-templates.js` (new) | Section templates (Executive Summary · Requirements · Features · Design · Architecture · Profits · Risks · Regulatory · Next-90d) with placeholders |
| `assets/output-pdf.js` (new) | jsPDF-based PDF renderer |
| `assets/output-video.js` (new) | Browser-side video renderer using `MediaRecorder` API over a `<canvas>` slideshow with `<audio>` narration |
| `assets/tts-edge.js` (new) | Edge-TTS client (free, uses MS Edge's TTS endpoint via WebSocket) |
| Various pages | Add 📽 Generate Executive Brief button on Discovery result, Architecture CTA, EVP, SOW, Live Designer, Knowledge cards |

### 6.b · Browser-side video pipeline (free)

```
1.  LLM (Groq Llama 3.3) writes narration script per slide
2.  Edge-TTS (free MS endpoint, en-US-AriaNeural) converts each slide's text to MP3
3.  10 HTML slides rendered to PNG via html2canvas (3.2 MP each)
4.  Canvas plays slides in sequence with Ken Burns transition
5.  Audio plays in sync via <audio> elements
6.  MediaRecorder API records the canvas + audio mix to WebM
7.  WebM → MP4 conversion via ffmpeg.wasm (runs in browser, free)
8.  Final MP4 saved via download link · also re-uploadable to R2 for sharing
```

**Limitations of browser-side path:**
- Tab must stay open during render (~3-5 minutes for a 5-min video)
- Quality capped by browser canvas perf
- No avatar / talking head
- File size ~80-120 MB

These limits are fine for a demo. The agentic path (§7) fixes them.

### 6.c · Static implementation prompts

> **Prompt OUT-1:** Create `output-brief.html` — the wizard described in §3. 10 sectional tabs, rich-text editor per section, persona toggle, length toggle, voice toggle, brand color picker, logo upload. Auto-saves to `localStorage` `di_brief_v1`.

> **Prompt OUT-2:** Create `assets/output-agent.js` with public API `window.DI.output.openBrief(opts?)`. `opts` can specify which capability or use case to seed from; default seeds from full canonical state. The agent compiles draft text for all 9 sections using deterministic templates from `assets/output-templates.js` filled with current state.

> **Prompt OUT-3:** Create `assets/output-templates.js` with one template object per section. Each template has a `compile(state, persona, length)` function returning markdown. Templates know how to read Discovery / Architecture / Requirements / Actions / SOW / Governance / Operations / Knowledge state and weave it into the section text.

> **Prompt OUT-4:** Implement `regenerateSection(sectionId)` in `output-agent.js`. Calls a free LLM endpoint (Anthropic if API key present, else falls back to a hosted Groq endpoint via a 1-line Cloudflare Worker proxy) to redraft that section. Streams the result back into the editor.

> **Prompt OUT-5:** Create `assets/output-pdf.js` using jsPDF + html2canvas. Renders the 10 sections to a 15-19 page PDF with cover · TOC · branded headers/footers · embedded charts and SVGs from the Live Designer. Use the existing Phase 22.1 `window.DI.export` pattern for consistency.

> **Prompt OUT-6:** Create `assets/tts-edge.js`. Connects to `wss://speech.platform.bing.com/...` (the public Edge-TTS endpoint) and streams TTS audio for a given text + voice. No API key needed. Returns a Blob of MP3 audio. Supports 6 voices listed in §5.b.

> **Prompt OUT-7:** Create `assets/output-video.js`. Builds the in-browser video pipeline described in §6.b. Renders 10 slides to PNG, fetches narration MP3 per slide, plays them on a canvas + audio context, records via MediaRecorder, optionally remuxes to MP4 via ffmpeg.wasm (lazy-load from CDN). Shows a progress bar; total render time 3-5 min in-browser.

> **Prompt OUT-8:** Wire the 📽 button on Discovery result page, Architecture CTA, EVP Summary, SOW, Live Designer, Knowledge cards. All open the wizard pre-seeded from the page's current state.

> **Prompt OUT-9:** Add 3 export buttons in the wizard: ⬇ PDF only · 🎬 Video only · 📦 Both (zips PDF + MP4 + captions VTT + JSON state). Saving a brief as a Knowledge artifact stores the editable text plus a thumbnail of slide 1.

> **Prompt OUT-10:** Add scenarios to `tests/scenarios/functional.yaml` covering: PDF renders 15-19 pages with TOC, video file is ≤ 300 MB, narration audio is ≤ 5 min, all 6 voice options work, branding colors apply correctly, citations resolve to Knowledge chunks, ⌘K palette entry exists.

### 6.d · Estimated effort (static)

| Prompt | Effort |
|---|---|
| OUT-1 wizard UI | 5 h |
| OUT-2 output-agent.js | 3 h |
| OUT-3 templates per section | 6 h |
| OUT-4 LLM redraft | 2 h |
| OUT-5 PDF render | 4 h |
| OUT-6 Edge-TTS client | 3 h |
| OUT-7 video render | 8 h |
| OUT-8 page integrations | 2 h |
| OUT-9 exports + Knowledge save | 1 h |
| OUT-10 tests + DEPLOY-BATCH-F2.md | 2 h |
| **Total** | **36 h** |

---

## 7 · Agentic-later upgrade (Phase E-19 · 14 hours)

Once Batch E has shipped containers + agents, the Output Agent becomes server-side, faster, higher quality, and avatar-enabled.

### 7.a · Phase E-19 capabilities

| Feature | Static (Batch F-2) | Agentic (Phase E-19) |
|---|---|---|
| Compilation | Browser, ≤ 1 s | Server, ≤ 1 s (cached for 1 h) |
| Section drafting | Browser → Groq, ~10 s | Container → Claude Sonnet, 5 s, with RAG citations |
| PDF rendering | jsPDF, ~5 s, 4-5 MB | Puppeteer/Chromium in container, ~3 s, 3-4 MB, pixel-perfect |
| Video rendering | MediaRecorder + ffmpeg.wasm, 3-5 min, tab must stay open | ffmpeg-in-container, 60-90 s, runs async, user can leave |
| Voice options | 6 Edge-TTS voices | Edge-TTS + ElevenLabs (paid premium) + Coqui (offline) — 30+ voices |
| Avatar | None | Optional D-ID talking head on slides 1 + 10 (5 min/mo free tier) |
| Captions | Generated VTT | VTT + SRT + 30-language auto-translate |
| Hosting | localStorage + download | R2 / MinIO with signed URL · streamable · shareable link |
| Comparison briefs | One brief at a time | A/B briefs side-by-side (e.g. TradFi vs Hybrid scenario) |
| Refinement | Browser regenerate | Nishi conversational refinement — "make the cost section more conservative, add a slide on DORA implications" |
| Auto-translate | No | Yes, 30 languages, dubbed audio with matching voices |

### 7.b · Phase E-19 agentic prompts

> **Prompt OUT-A-1 (Batch E-19):** Scaffold `apps/agents/output/` as a containerized MCP server. Tools: `compile_brief(useCaseId, persona, length)`, `regenerate_section(briefId, sectionId, hint)`, `render_pdf(briefId)`, `render_video(briefId, voice)`, `translate_brief(briefId, locale)`, `compare_briefs([briefIdA, briefIdB])`.

> **Prompt OUT-A-2:** Implement `render_pdf` via Puppeteer in the container — boots headless Chromium, loads an HTML template fed by the brief state, prints to PDF with embedded fonts and tagged accessibility. Outputs to R2 under `briefs/<id>.pdf` with 7-day signed URL.

> **Prompt OUT-A-3:** Implement `render_video` via the production pipeline: Edge-TTS for narration, Puppeteer to render each slide PNG at 1920×1080, ffmpeg to assemble with Ken Burns + transitions + sync audio + burned-in captions if requested. Optional D-ID call for talking-head overlay (HITL gate — costs money). Output MP4 + VTT to R2.

> **Prompt OUT-A-4:** Implement `translate_brief` — translates all section text via LLM (Claude Sonnet, preserve tone and structure), then re-runs `render_pdf` and `render_video` with localized Edge-TTS voice matching the locale. 30 locales supported on day one.

> **Prompt OUT-A-5:** Wire the Output Agent into Nishi's chat. User says "render me a 3-minute exec brief on the Cards rearchitect for our CRO" and the master agent calls `compile_brief` then `render_video` with the right params. Streams progress chat-side.

> **Prompt OUT-A-6:** Add a "📽 Briefs" tile on `home.html` with the 5 most recent briefs · thumbnails · play button · last-modified · audience. Click → opens the brief preview · share button generates a 7-day signed link.

### 7.c · Estimated effort (agentic)

| Prompt | Effort |
|---|---|
| OUT-A-1 output agent core | 3 h |
| OUT-A-2 Puppeteer PDF | 2 h |
| OUT-A-3 ffmpeg video pipeline | 5 h |
| OUT-A-4 translate | 2 h |
| OUT-A-5 Nishi wiring | 1 h |
| OUT-A-6 home tile + share links | 1 h |
| **Total** | **14 h** |

Combined static + agentic: **50 hours.**

---

## 8 · Zero-cost confirmation

Every component of the Output Agent stays inside free tiers:

| Component | Free option |
|---|---|
| LLM script writing | Groq Llama 3.3 70B (30 RPM free forever) |
| TTS narration | Edge-TTS via Microsoft's public endpoint (no API key, unlimited within reason) · or Coqui TTS self-hosted in a container |
| Slide rendering | Puppeteer/Chromium in container (free) · or browser html2canvas (free) |
| Video assembly | ffmpeg (free, open source) in container · or ffmpeg.wasm in browser |
| PDF rendering | jsPDF in browser · or Puppeteer in container |
| Avatar (optional) | D-ID free tier (5 min/mo) · or skip avatar entirely |
| Output hosting | R2 (10 GB free) · MinIO self-hosted (200 GB on Oracle Always Free) |
| LLM-based translate | Groq (free) or Claude Haiku (cheap fallback if Groq RPM exhausted) |

**Total monthly cost ceiling for the Output Agent: $0** at demo scale.

---

## 9 · How this raises customer confidence (the why)

| Concern | What the Output Agent does |
|---|---|
| "The plan looks reasonable but where's the risk view?" | §8 Risks · Mitigations · Contingency — three-column treatment makes risk management visible |
| "Is this regulatorily safe?" | §9 Regulatory & compliance section lists every applicable framework with current posture |
| "I need numbers I can take to my board" | §7 Profits — cost, time, optimizations, payback, NPV, with assumptions stated |
| "Can my CCO sign off in time for the next exam?" | Tagged PDF + audit anchor reference + signed URL + sign-off lines on the last page |
| "I need to send something internally without explaining for an hour" | ≤ 5-minute video does the explaining |
| "We have non-English-speaking stakeholders" | Auto-translate to 30 locales with native-voice narration |
| "How is this different from a slide deck?" | Live-state-driven · regenerable on every update · cites Knowledge chunks · architectures auto-update if the bank revises a cloud pick |

These are the seven objections that block enterprise deals. The Output Agent answers each in one click.

---

## 10 · Updated master phase list

```
E-0     Platform abstractions + multi-tenancy                  (6 h)
E-0.5   Containerization scaffold                              (8 h)
E-1     Foundation infra (K8s-native)                          (10 h)
E-2     Master Agent (HITL + citation)                         (12 h)
E-3     10 feature sub-agents + MRM hooks                      (24 h)
E-3.5   Service mesh + SPIFFE                                  (4 h)
E-4     RAG over pgvector + tokenization                       (8 h)
E-5     TestData agent                                          (4 h)
E-6     Test framework (8 containerized test agents)           (16 h)
E-7     Defect → CR → patch loop + audit anchoring             (8 h)
E-8     Scenario libraries · 30-region regulatory              (12 h)
E-9     Insights agent + MRM Pack Generator                    (6 h)
E-10    Observability + chaos schedule                          (8 h)
E-11    Adversarial red-team agent                              (5 h)
E-12    Reference banking workflows                             (12 h)
E-13    Marketplace scaffold                                    (7 h)
E-14    XRPL Payments Agent                                     (10 h)
E-15    EVM Contracts Agent                                     (12 h)
E-16    Cross-chain bridge agent                                (5 h)
E-17    Key custody + HSM                                       (6 h)
E-18    Designer Agent (LiveArch backing)                       (13 h)
E-19    Output Agent · server-side (NEW · this doc)             (14 h)
──────────────────────────────────────────────────────────────────
F-1     Live Architecture Designer · static UI                  (28 h)
F-2     Executive Output Agent · browser-only (NEW · this doc)  (36 h)
──────────────────────────────────────────────────────────────────
Master total                                                    274 h
```

Still **$0/month at demo scale** for all 274 hours of build.

---

## 11 · Recommended sequencing with everything else

Now that the plan has 22 phases, the right order is:

1. **First wave (static, ship in current site):**
   - Batch F-1 — Live Architecture Designer (28 h)
   - Batch F-2 — Executive Output Agent (36 h)
   - Result: dramatically improved demo, no backend required.

2. **Second wave (agentic foundation):**
   - Phase E-0 → E-3.5 — platform, containers, master agent, 10 sub-agents, mesh (≈64 h)
   - Phase E-4, E-5 — RAG + TestData (≈12 h)
   - Result: the platform is now truly agentic. Static features in F-1/F-2 flip to agent-backed.

3. **Third wave (testing, defects, observability):**
   - Phase E-6 → E-11 (≈55 h)
   - Result: the testing framework you originally asked for is live · defects auto-resolve · platform observably healthy.

4. **Fourth wave (banking depth + blockchain + marketplace):**
   - Phase E-12 → E-17 + E-18, E-19 (≈83 h)
   - Result: reference banking workflows · XRPL + EVM agents · marketplace · live designer + output agent both server-side and faster.

Each wave is demoable by itself.

When you're ready to start, the most leveraged first prompt across the whole 274-hour plan is **Prompt LAD-1** (1 hour, makes verdict pills clickable) for the static path · or **Prompt E-0.5-c** (provisions Oracle k3s + Argo CD) for the agentic path. They can also run in parallel since they touch different files.

