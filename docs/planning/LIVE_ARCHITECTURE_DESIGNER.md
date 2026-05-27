# Live Architecture Designer · TradFi · DeFi · Hybrid

**Trigger:** click any 7R verdict pill (REHOST · REPLAT · REFACT · REARCH · REBUILD · REPLACE · RETAIN) on the Discovery Studio result page.

**Result:** an interactive designer modal opens that lets the user pick a cloud target and a finance-stack mode (TradFi / DeFi / Hybrid), then generates a **live architecture design** — SVG topology, component list, sizing, security notes, sample transaction flow, and a cost band — all tailored to the capability, the verdict, the cloud, and the mode.

This document defines the feature, the design templates, the UX, the static-now implementation, and the agentic-later upgrade.

---

## 1 · UX flow

```
Discovery Studio result page
   │
   │  user clicks the REARCHITECT pill on "Core Banking · Payments"
   ▼
┌──────────────────────────────────────────────────────────────────┐
│ LIVE ARCHITECTURE DESIGNER · Core Banking · Payments · REARCHITECT│
│                                                                  │
│ ┌─ Cloud / Substrate ─────────┐  ┌─ Finance stack ────────────┐  │
│ │ ⊙ AWS    ○ Azure   ○ GCP    │  │  ⊙ TradFi (cloud-native)   │  │
│ │ ○ OCI    ○ IBM     ○ Private│  │  ○ DeFi  (blockchain)      │  │
│ │                              │  │  ○ Hybrid (both)           │  │
│ └──────────────────────────────┘  └────────────────────────────┘  │
│                                                                  │
│ [ ⚙ Generate live design ]   [ 💬 Ask Nishi to tune ]            │
│                                                                  │
│ ─────────────────────────────────────────────────────────────── │
│  ┌─ Topology (SVG) ─────────────┐  ┌─ Components ───────────────┐│
│  │                              │  │ #  Layer        Service     ││
│  │  [generated diagram here]    │  │ 1  Ingress      CloudFront  ││
│  │                              │  │ 2  API GW       APIGW + WAF ││
│  │                              │  │ 3  Compute      EKS+Karpent ││
│  │                              │  │ ... 12 rows                  ││
│  └──────────────────────────────┘  └────────────────────────────┘│
│                                                                  │
│  ┌─ Why this design ──────────────────────────────────────────┐  │
│  │ Pulls from your Discovery answers: COBOL mainframe origin, │  │
│  │ regulated · 3 AZ active-active · 99.95% SLO. The REARCH    │  │
│  │ verdict mandates microservices + event backbone …           │  │
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─ Sample flow ─────────┐  ┌─ Cost band ─┐  ┌─ Regulatory ───┐  │
│  │ 1. Client → CloudFront│  │ $4-6 K /mo   │  │ PCI-DSS, SOX,  │  │
│  │ 2. APIGW JWT auth     │  │ p99 250 ms   │  │ BCBS 239, GDPR │  │
│  │ 3. ALB → EKS pod      │  │ 99.95 % SLO  │  │ on-prem-DR-OK  │  │
│  │ …                     │  │              │  │                │  │
│  └───────────────────────┘  └──────────────┘  └────────────────┘  │
│                                                                  │
│ [ ⬇ Export SVG ] [ ⬇ Export PNG ] [ ⬇ Excel ] [ 📌 Save artifact]│
└──────────────────────────────────────────────────────────────────┘
```

The same designer is reachable three ways:
- Click a verdict pill on Discovery (new)
- Click 🗺 blueprint on an Architecture pricing cell (existing — extend to add TradFi/DeFi toggle)
- Press `g x` shortcut → opens with empty state and pickers

---

## 2 · Design templates

Each design template is selected by the tuple `(verdict, cloud, mode)`. For 7 verdicts × 6 clouds × 3 modes = 126 distinct templates, but most share components. We define **layer libraries** and assemble templates compositionally.

### 2.a · TradFi layer library (cloud-native)

Already covered by the existing 9-layer infrastructure spec (Phase 22.2 · `showSpecs()` in `architecture-studio.html`). Reuse it, with one addition per verdict:

| Verdict | Key components added on top of the 9 layers |
|---|---|
| REHOST | VM-to-VM lift · same DB engine · IaaS only · no PaaS |
| REPLAT | Managed compute + managed DB · keep app code · containerize where cheap |
| REFACT | Microservices · API gateway · event backbone · CI/CD-driven |
| REARCH | Domain-driven microservices · CQRS read models · event sourcing · saga orchestration |
| REBUILD | Greenfield cloud-native · serverless first · ESB removed · BFF per channel |
| REPLACE | SaaS pattern (Mambu / Temenos Transact / Thought Machine Vault) · integration spine |
| RETAIN | Keep in-place · add observability + DR · plan future window |

Per-cloud service mapping is exactly what's in the existing `showSpecs()` modal — no change needed beyond exposing it via this designer.

### 2.b · DeFi layer library (blockchain-native)

A new layer library that maps the same conceptual stack to on-chain primitives:

| Layer | Component | Tech choice |
|---|---|---|
| 1 · UI | Web2 PWA + wallet | React/Vue + WalletConnect + Safe Account Abstraction (ERC-4337) |
| 2 · Identity | Decentralized ID + KYC bridge | EAS (Ethereum Attestation Service) + on-chain identity registry · off-chain KYC via Trulioo/Onfido |
| 3 · Settlement (payments) | Payment ledger | **XRP Ledger** native — sub-second, ~$0.00001/tx, multi-currency IOUs, on-ledger DEX |
| 4 · Smart contracts | Business logic + compliance | **EVM** — Hyperledger Besu (private QBFT) for permissioned, Polygon zkEVM / Arbitrum for public |
| 5 · Token standard | Asset representation | ERC-3643 (T-REX) for permissioned securities · ERC-4626 for vaults · ERC-20 for stablecoins |
| 6 · Custody | Key management | MPC (Safeheron / Fireblocks) · Cloud HSM · cold-storage signing for treasury |
| 7 · Oracle / data | Off-chain inputs | Chainlink CCIP + Functions · Pyth (low-latency price) · Band Protocol |
| 8 · Storage | Document / metadata | IPFS via Pinata (decentralized) · Arweave (permanent) · encrypted blobs |
| 9 · Indexer / query | Off-chain reads | The Graph subgraphs · Goldsky · custom indexer container |
| 10 · Bridge | Cross-chain | Axelar ITS · Chainlink CCIP · XRPL EVM Sidechain bridge |
| 11 · Off-chain orchestration | Workflow | Cloud container that watches events + triggers actions |
| 12 · Audit anchor | Immutable log | Daily Merkle root → XRPL mainnet via OpenTimestamps |

Verdict-specific overlays for DeFi:

| Verdict | DeFi pattern |
|---|---|
| REHOST | Wrap existing API with on-chain attestations (read-only attest of state) · no real chain logic |
| REPLAT | Move ledger to XRPL · keep app code · use XRPL multi-currency IOU |
| REFACT | Split monolith into off-chain services + on-chain settlement contract |
| REARCH | Full DDD on-chain — separate contracts per bounded context · CQRS via The Graph reads |
| REBUILD | Greenfield DeFi-native — Account Abstraction (ERC-4337) · gasless UX · on-chain identity |
| REPLACE | Adopt established DeFi primitive (Aave for lending, Maker for stables, Uniswap v4 hooks for FX) |
| RETAIN | Pin existing capability + add on-chain anchor for audit only |

### 2.c · Hybrid layer library (the realistic banking pattern)

Hybrid is what every real bank actually deploys. The capability lives mostly off-chain (for throughput, privacy, reversibility) but uses blockchain selectively for what it does best:

| Slot | Off-chain (cloud) | On-chain |
|---|---|---|
| User-facing UI | PWA on cloud CDN | Wallet integration optional |
| Authentication | OIDC via Entra / Okta | Optional on-chain attestation |
| Authorization | Policy engine in cloud | Smart contract whitelist for high-value txs |
| Transaction processing | Kubernetes microservices | XRPL for payments, EVM for tokenized assets |
| Ledger / books of record | Aurora / Cosmos (off-chain) | XRPL / EVM (settlement asset) |
| Settlement | Bank's nostro account | XRPL DEX or EVM atomic swap |
| Custody | HSM in cloud / on-prem | Smart-contract escrow with MPC keys |
| Compliance | Off-chain KYC vendor | On-chain identity attestation surface |
| Audit | OpenSearch + WORM S3 | Daily Merkle anchor to XRPL |
| Analytics | Cloud warehouse | The Graph for on-chain reads |
| Integration to existing core banking | API + ESB | Oracle bridge between core and chain |

For each verdict in Hybrid mode, the design specifies **what stays off-chain and why** vs **what moves on-chain and why**, with the rationale visible in the "Why this design" panel.

### 2.d · Sample transaction flow per mode

Concrete numbered steps the designer renders to make the design tangible.

**TradFi REARCH on AWS · "Core Banking · Payments":**
```
1. Client → CloudFront (TLS 1.3)
2. → AWS WAF → API Gateway (JWT verified by Cognito)
3. → ALB → EKS pod (payments-service)
4. payments-service calls Aurora ledger (write-ahead-log)
5. Emits PaymentInitiated event → MSK (Kafka)
6. fraud-service consumes, scores, publishes FraudCleared
7. settlement-service settles via SWIFT / FedNow ISO 20022 outbound
8. ledger-service updates Aurora with settled state
9. notify-service emits SMS / push to customer
10. CloudTrail + Audit log all 9 steps
```

**DeFi REARCH on XRPL + Polygon zkEVM · same capability:**
```
1. Client → Cloudflare Pages PWA
2. Wallet connect (Safe AA, ERC-4337)
3. UserOperation signed → bundler → EntryPoint contract on zkEVM
4. PaymentInitiator contract checks KYC via on-chain ERC-3643 identity
5. If KYC pass, contract emits Payment event
6. Off-chain relayer picks event → builds XRPL payment tx
7. XRPL Hook (or relayer) submits Payment with cross-currency path
8. XRPL consensus: 3-second finality, multi-currency atomic swap on DEX
9. Relayer writes settled proof back to zkEVM
10. The Graph indexes both sides; client UI updates
```

**Hybrid REARCH on AWS + XRPL + Besu · same capability:**
```
1. Client → CloudFront → APIGW
2. Cognito JWT verified
3. EKS pod (orchestrator-service) decides routing:
   · Domestic batch < $25K → FedNow rail (off-chain)
   · Domestic real-time → XRPL Issued USD
   · Cross-border → XRPL with auto-bridging via on-ledger DEX
   · Tokenized asset transfer → ERC-3643 contract on Besu
4. orchestrator-service signs via CloudHSM
5. XRPL/Besu tx submitted; events watched by orchestrator
6. On settled-event: Aurora ledger updated (off-chain book of record)
7. Daily Merkle root of Aurora WAL → anchored to XRPL mainnet via OpenTimestamps
8. Audit log to WORM S3 + OpenSearch
9. Customer notify (push/SMS)
```

These flows are rendered as numbered steps next to the SVG.

---

## 3 · Static-now implementation (ships in current site, no agents needed)

The feature can ship into the existing static `discovery-studio.html` immediately with deterministic templates. Later it gets backed by agents.

### 3.a · Files & wiring

| File | Change |
|---|---|
| `discovery-studio.html` | Make the verdict pill in 7R cards clickable → call `openDesigner(capId, verdict)` |
| `architecture-studio.html` | Update `showBlueprint()` modal to add TradFi/DeFi/Hybrid toggle |
| `assets/designer.js` (new) | Library: `openDesigner(capId, verdict, opts)` · `renderDesign(cap, verdict, cloud, mode)` · `generateSVG(spec)` |
| `assets/designer-templates.js` (new) | Layer libraries + verdict overlays + sample-flow strings for all (verdict × cloud × mode) tuples |
| `assets/cmdk.js` | `g x` shortcut → opens designer with empty state |

### 3.b · Static implementation prompts

> **Prompt LAD-1:** In `discovery-studio.html`, render the verdict pill in each 7R card as a clickable element. On click, call `window.DI.designer.open(capId, verdict)`. Keep the existing hover state; add a `cursor:pointer` and a 🔍 magnifier icon on hover so users discover the feature.

> **Prompt LAD-2:** Create `assets/designer.js` with public API `window.DI.designer.open(capId, verdict, opts?)`. Builds the modal described in §1 — title bar (Cap · Verdict), cloud radio (AWS/Azure/GCP/OCI/IBM/Private), mode toggle (TradFi/DeFi/Hybrid), Generate button, output area (SVG + Components + Why + Sample Flow + Cost band + Regulatory). Modal sized at max-width 1100 px, max-height 92 vh, scrollable. Reuses the existing `--gold`, `--canvas`, `--ink` design tokens.

> **Prompt LAD-3:** Create `assets/designer-templates.js` containing three layer libraries: `TRADFI_LAYERS`, `DEFI_LAYERS`, `HYBRID_LAYERS`. Each is `{ cloud → { verdict → { layers: [...], sampleFlow: [...], costBand: {...}, regulatory: [...] } } }`. Hard-code the 7 highest-value combos first: REARCH+AWS+TradFi, REARCH+AWS+DeFi, REARCH+AWS+Hybrid, REPLAT+Azure+TradFi, REFACT+GCP+TradFi, REBUILD+Polygon+DeFi, REPLACE+Mambu+TradFi. Fall back to a generic template for missing tuples with a "preview" badge.

> **Prompt LAD-4:** In `assets/designer.js`, write `generateSVG(spec)` that produces a 900×500 SVG with: cloud/chain backbone bar, 4-tier component lanes, arrow-connected boxes for each layer, color-coded by tier (Ingress/Compute/Data/Edge/Security/Blockchain). Match palette to the cloud (AWS orange, Azure blue, GCP green-blue, Polygon purple, XRPL teal, Besu navy). Embed the cloud logo as an inline SVG icon.

> **Prompt LAD-5:** Wire 4 export buttons in the modal: ⬇ Export SVG (raw SVG download), ⬇ Export PNG (rasterize via `canvg` lazy-loaded from CDN), ⬇ Export Excel (one-sheet workbook via `window.DI.export.workbook()` with Layer · Service · Sizing · Notes columns), 📌 Save as artifact (calls into the Knowledge agent — for static-now, writes to `di_knowledge_v1` localStorage).

> **Prompt LAD-6:** Extend `architecture-studio.html`'s existing `showBlueprint()` to add a TradFi/DeFi/Hybrid segmented control above the SVG. On change, re-render the diagram using the same `assets/designer.js` library so blueprint and designer share the SVG generator.

> **Prompt LAD-7:** Add command palette entry: `{ id:'designer', name:'Live Architecture Designer', kind:'action', hint:'Click 7R verdict pill or press g x', run: () => window.DI.designer.open() }`. Add shortcut `g x` to `assets/shortcuts.js` map → opens empty designer.

> **Prompt LAD-8:** Build deterministic templates for the remaining (verdict × cloud × mode) tuples. Priorities: every verdict at AWS+TradFi (7 tuples), every verdict at AWS+Hybrid (7 tuples), REARCH at every cloud+TradFi (6 tuples), REARCH at every cloud+Hybrid (6 tuples). That's 26 high-priority templates. The remaining 100 fall back to a "generic" template with a "Preview · static" badge until the agentic version of Phase E-15+ fills them.

After these 8 prompts, the static feature is shippable.

### 3.c · Estimated effort (static)

| Prompt | Effort |
|---|---|
| LAD-1 verdict pill click | 1 h |
| LAD-2 designer.js modal | 4 h |
| LAD-3 templates skeleton | 2 h |
| LAD-4 SVG generator | 5 h |
| LAD-5 exports | 2 h |
| LAD-6 blueprint extension | 2 h |
| LAD-7 ⌘K + shortcut | 1 h |
| LAD-8 26 priority templates | 8 h |
| Tests + DEPLOY-BATCH-F.md | 3 h |
| **Total** | **28 h** |

This is shippable as **Batch F** (or interleaved into Batch E) at zero cost on the current static deployment.

---

## 4 · Agentic-later upgrade (folds into Batch E)

When Batch E lands, the designer stops being template-only and becomes **truly live**: an LLM-orchestrated multi-agent flow generates novel designs tuned to the user's exact Discovery + RFP context.

### 4.a · Agent flow

```
User clicks REARCHITECT pill on "Core Banking · Payments"
   │
   ▼
Designer UI → master agent /chat
   │
   ▼
Master agent intent = "design.generate"
   │
   ├─► retrieves capability state          (Discovery sub-agent · existing E-3)
   ├─► retrieves RFP answers               (Requirements sub-agent · existing E-3)
   ├─► retrieves regional + regulatory     (Knowledge sub-agent · existing E-3, RAG)
   ├─► retrieves cost benchmarks           (Pricing lib · existing)
   │
   ├─► IF mode = TradFi:
   │       → Architecture sub-agent (existing E-3)
   │           → generate_tradfi_design(cap, verdict, cloud)
   │
   ├─► IF mode = DeFi:
   │       → EVM Contracts sub-agent (E-15)
   │       → XRPL Payments sub-agent (E-14)
   │       → Knowledge sub-agent (regulatory stance per jurisdiction)
   │
   ├─► IF mode = Hybrid:
   │       → Architecture + EVM + XRPL + Bridge all in parallel
   │
   ▼
Designer Agent (NEW · E-18) assembles outputs:
   · Picks layer stack
   · Generates SVG via templated renderer
   · Composes "Why this design" via LLM with citations
   · Computes cost band from pricing lib + on-chain estimates
   · Lists regulatory clauses from Knowledge RAG
   · Generates 8-12 step sample flow
   │
   ▼
Returns to UI streaming · UI shows progress per panel as it arrives
```

### 4.b · New Phase E-18 in the master plan

```
E-18  Designer Agent (NEW)                                    (10 h)
      · MCP server `apps/agents/designer/`
      · Tools: generate_design, compare_designs, refine_design, export_design
      · Orchestrates: Architecture + EVM + XRPL + Knowledge + Pricing
      · Streams partial results to the browser
      · Caches by (cap, verdict, cloud, mode, profile-hash) in D1
```

### 4.c · New agentic prompts

> **Prompt LAD-9 (Batch E-18):** Scaffold `apps/agents/designer/` as a containerized MCP server. Implement `generate_design(capId, verdict, cloud, mode)`. Internally fan-out to Architecture (TradFi mode), EVM + XRPL + Bridge (DeFi mode), or all of them (Hybrid). Aggregate via deterministic templates plus an LLM "rationale generator" that explains the choices in 80-120 words with citations to Knowledge chunks.

> **Prompt LAD-10:** Implement `compare_designs([{cloud, mode}, {cloud, mode}, ...])`. Renders a side-by-side matrix with shared rows. Lets the user A/B AWS-TradFi vs Polygon-DeFi vs AWS+XRPL-Hybrid in one screen. Output as both visual table and Excel sheet via `window.DI.export.workbook()`.

> **Prompt LAD-11:** Implement `refine_design(designId, freeText)`. Accepts natural-language tweaks — "swap Aurora for DynamoDB", "use Arbitrum instead of Polygon", "harden for SOC 2" — and produces a revised design. Tracks the chain of refinements as a tree the user can navigate.

> **Prompt LAD-12:** Implement `export_design(designId, format)` — outputs SVG, PNG, DOCX (full architecture doc), PPTX (board deck), and an IaC stub. The IaC stub calls into the existing IaC bundle generator (E-3 IaC agent) pre-populated with the design's choices so the user can go from "live design" → "downloadable Terraform" in one click.

> **Prompt LAD-13:** Wire the Designer Agent into Nishi's chat. User can say "Show me a hybrid design for payments rearchitect on Azure" and the master agent routes to designer.generate_design with the right args. Designer streams the result panel-by-panel into the chat.

### 4.d · Estimated effort (agentic)

| Prompt | Effort |
|---|---|
| LAD-9 designer agent core | 4 h |
| LAD-10 compare | 2 h |
| LAD-11 refine | 2 h |
| LAD-12 export | 2 h |
| LAD-13 Nishi wiring | 1 h |
| Tests + DEPLOY notes | 2 h |
| **Total** | **13 h** |

Combined static + agentic: **41 hours**.

---

## 5 · Mode-selection logic Nishi uses to recommend a mode

When the user opens the designer without explicitly choosing a mode, the master agent (or, in static mode, a heuristic in `designer.js`) suggests a default:

| Capability signal | Suggested mode |
|---|---|
| Capability is a payment, FX, or settlement workflow | **Hybrid** (XRPL for settlement + cloud for orchestration) |
| Capability is risk, fraud, KYC | **TradFi** (regulated, latency-sensitive, off-chain) |
| Capability is tokenized asset issuance, bond, MMF | **DeFi** (ERC-3643 + ERC-4626 on EVM) |
| Capability is core ledger or books-of-record | **TradFi** (banks won't on-chain books for years) |
| Capability is wholesale CBDC pilot, trade finance LC | **DeFi** or **Hybrid** |
| Capability is regulatory reporting (BCBS 239, CCAR) | **TradFi** with daily on-chain audit anchor |
| Capability is cards rewards / loyalty | **DeFi** (sub-cent fees, NFT-ish badges, transparent) |
| Default fallback | **Hybrid** (always defensible) |

The mode picker shows this suggestion as a `RECOMMENDED` badge on the relevant radio button with a one-line rationale tooltip. User can always override.

---

## 6 · Where this slots in the master phase list

Updated phase list (E-0 → E-18):

```
E-0   Platform abstractions + multi-tenancy                   (6 h)
E-0.5 Containerization scaffold                               (8 h)
E-1   Foundation infra (K8s-native)                           (10 h)
E-2   Master Agent (HITL + citation)                          (12 h)
E-3   10 feature sub-agents + MRM hooks                       (24 h)
E-3.5 Service mesh + SPIFFE                                   (4 h)
E-4   RAG over pgvector + tokenization                        (8 h)
E-5   TestData agent                                           (4 h)
E-6   Test framework + security/compliance                    (16 h)
E-7   Defect loop + audit anchoring                           (8 h)
E-8   Scenario libraries + 30-region regulatory               (12 h)
E-9   Insights agent + MRM Pack Generator                     (6 h)
E-10  Observability + chaos schedule                          (8 h)
E-11  Adversarial red-team agent                              (5 h)
E-12  Reference banking workflows                             (12 h)
E-13  Marketplace scaffold                                    (7 h)
E-14  XRPL Payments Agent                                     (10 h)
E-15  EVM Contracts Agent                                     (12 h)
E-16  Cross-chain bridge agent                                (5 h)
E-17  Key custody + HSM                                       (6 h)
E-18  Designer Agent (NEW · this doc)                         (13 h)
─────────────────────────────────────────────────────────────────
F-1   Live Architecture Designer · static UI (NEW · this doc) (28 h)
─────────────────────────────────────────────────────────────────
Master total                                                  208 h
```

**Batch F-1 is the static implementation** — it can ship into the current static site without any backend, using deterministic templates. Users get a real interactive designer today.

**Phase E-18 upgrades F-1 to truly live** once Batch E has shipped the agents the designer orchestrates. The UI is identical; the backing flips from templates to LLM-driven generation.

---

## 7 · Recommended order

1. **Now (still in static mode):** Ship Batch F-1 (LAD-1 to LAD-8 · 28 h). Verdict pills clickable, designer modal works, 26 priority templates cover 80% of demos. Generic template covers the remainder. **Zero cost, no agents needed.** Users see a major UX upgrade.
2. **After Batch E-3 lands:** Wire the static templates to call live MCP tools where available (e.g. Architecture agent for TradFi designs is live).
3. **After Batch E-14, E-15 land:** Wire the DeFi/Hybrid modes to live blockchain agents.
4. **Finally, Phase E-18:** Designer Agent orchestrates the lot, adds compare/refine/export-IaC.

This staging means every user-visible improvement ships within days, and the agentic backbone arrives without breaking anything that works.

---

## 8 · Summary additions to the master plan

Across the four roadmap documents, this feature adds:

- **2 new phases:** Batch F-1 (static · 28 h) and Phase E-18 (agentic · 13 h)
- **+41 hours total** on top of the existing 165-hour Batch E plan
- **Grand total: 206 hours** to reach the full target state

All still **$0/month at demo scale** (Oracle Always Free k3s + open-source everything + public testnets).

When you're ready to start, the recommended first prompt is **Prompt LAD-1** — make the verdict pills clickable on `discovery-studio.html`. That's a 1-hour change that immediately unlocks the rest of Batch F-1.

