# Batch B · New value-add pages (4 phases · ~15 hrs)

**Date:** 2026-05-21
**Shippable end-state:** ✓ Requirements, Actions, Blockchain/RWA pages live · Architecture has per-cloud SVG blueprints.

## What ships

### Phase 21.1 · `requirements.html` — Role-tagged AI Requirements

New page that auto-derives requirements from Discovery 7R + RFP questionnaire data.

- **4 lenses**: ⚙ Technical · 💼 Business · 📦 Product · ⚖ Regulatory.
- Each requirement card shows: ID · capability ref · title · description · lens pill · priority pill · **role-owner pills** (CTO, CIO, CRO, CFO, Head of Architecture, Head of Compliance, Product Owner, SRE Lead, Data Officer, Business Owner) · **regulatory clause pills** sourced from the user's region (e.g. SOX 404, GDPR, MAS TRM 644, RBI Cybersecurity Framework 2016).
- **Filters**: lens · priority (high/med/low) · role · counts per chip.
- **KPI strip**: total · lens breakdown · high-priority count.
- **Auto-generation**: pulls Discovery `results.capabilities` + Questionnaire `derivedArtifacts.requirements`. Produces 4-5 requirements per capability (1-2 tech, 1 biz, 1 product, 1-2 regulatory).
- **Actions**: ↻ Regenerate from current state · ⬇ JSON · ⬇ CSV · "Generate actions →" jumps to actions.html.
- **Load sample** button on the empty state for instant demos.

### Phase 21.2 · `actions.html` — Role-Based Action page

Matches the EY-style screenshots: filters → KPIs → role-prioritized actions table → drill-down with leadership recommendation + outcome band.

- **Filters bar**: Role (11 options) · Priority (P1-P4) · Status (Open/In Progress/Blocked/Done) · Timeline (Overdue / 7d / 30d / 90d) · Search.
- **Executive KPI strip**: Total actions · P1 critical · Overdue · Total $ at risk.
- **Actions table**: ID · title + owner · role pill · priority pill (P1 red, P2 orange, P3 blue, P4 grey) · status pill · due date (with overdue red dot) · source link.
- **Click any row to expand** — shows: full description · **leadership recommendation** in a dark Nishi-styled callout · outcome band (3 cards: $ impact · owner · expected outcome) · "Mark In Progress" / "Mark Done" buttons.
- **Aggregates from 5 sources**: Governance RAID register · Requirements (high priority only) · Architecture (high-cost cloud decisions) · Operations incidents (sample) · per-Region regulatory deadlines (DORA EU, MAS APAC, etc.).
- **Exports**: CSV · JSON.

### Phase 21.3 · `blockchain-rwa.html` — Blockchain + RWA wizard

Beyond the existing Beta feature-explainer — a dedicated discovery wizard for blockchain banking adoption and Real World Asset tokenization.

- **Use case picker**: Cards loyalty · Cards receivables · Treasury bonds · Trade finance · Securities custody · Stablecoin issuance.
- **Technical fit**: Network (Hyperledger Fabric · R3 Corda · Quorum / Besu · Canton · Ethereum L2 · Ethereum L1) · Token standard (ERC-20 · ERC-3643 T-REX · ERC-721 · ERC-1400 · Fabric Token SDK) · Custodianship (Self · Qualified · MPC hybrid · Investor self-custody).
- **On/off ramps**: bank rails · stablecoin bridge · CEX onramp · DeFi (flagged not-recommended).
- **Target jurisdictions**: US · EU · UK · Singapore · UAE · Hong Kong — each with regulator stance (SEC/GENIUS, MiCA, FCA DSS, MAS Project Guardian, VARA/DFSA, HKMA Stablecoin Ordinance).
- **Live output panel** (sticky on right): risk score with coloured meter · timeline-to-pilot estimate · investment band · per-jurisdiction regulator stance · 5-phase roadmap.
- **Platform verdict**: GO · CONDITIONAL GO · CAUTION · HOLD based on risk + timeline + jurisdiction count.
- **Send to Discovery →**: adds a "Blockchain pilot" capability to the Discovery wizard for downstream sizing.

### Phase 21.4 · Per-cloud architecture SVG blueprints

Each cell in Architecture Studio's pricing grid now has a **🗺 blueprint** link beside the **⋯ source** link. Clicking opens a modal with an auto-generated SVG architecture diagram tailored to:

- The selected cloud (AWS / Azure / GCP / OCI / IBM / Private DC).
- The capability's 7R verdict (e.g. REARCH shows microservices + event backbone).
- The cloud's native services (e.g. AWS shows ALB + EKS + Aurora + Kinesis + IAM; Azure shows Front Door + AKS + Postgres + Event Hubs + Entra ID).

The diagram has 9 components:
- Ingress (LB + WAF + CDN)
- Compute tier (Kubernetes)
- Cache
- CDN / Edge
- Event backbone (stream + queue)
- Database tier
- Observability
- Identity + KMS
- Integration (ISO 20022, SWIFT)
- Private network (PrivateLink / Private Endpoint / VPC Peering)

Each cloud uses its own brand palette and verbal labels.

## Cross-cutting wiring

- **Top-bar Features mega-menu**: added Role-based Actions card and made the existing Blockchain & RWA card LIVE (was BETA).
- **⌘K palette**: 3 new entries (Requirements, Actions, Blockchain) with keyboard shortcuts `g r`, `g k`, `g b`.
- **g X shortcut keys**: `g r` → requirements, `g k` → actions, `g b` → blockchain.
- **Audit log**: every regenerate, drill-down, status-change, export logged.

## Files changed

```
requirements.html               NEW · role-tagged AI requirements (4 lenses)
actions.html                    NEW · role-based actions table with drill-down
blockchain-rwa.html             NEW · blockchain + RWA wizard
architecture-studio.html        added 🗺 blueprint link + per-cloud SVG generator
assets/top-bar.js               Features menu entries for Requirements / Actions / Blockchain
assets/cmdk.js                  3 new entries with shortcut hints
assets/shortcuts.js             g r / g k / g b navigation shortcuts
DEPLOY-BATCH-B.md               this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Press `⌘K`, type "requirements" | Requirements entry appears with `g r` hint |
| 2 | Navigate to `/requirements` | KPI strip + filter chips + (empty or generated) cards |
| 3 | Click "Load sample" | 7 capabilities + ~28 requirements rendered, lens-coloured cards |
| 4 | Filter by Regulatory lens | Only regulatory cards remain; clause pills visible |
| 5 | Click "Generate actions →" or navigate to `/actions` | Role-based table renders |
| 6 | Click any action row | Drill-down expands with description + leadership recommendation + outcome band |
| 7 | Click "Mark Done" inside a drilled row | Status updates · toast confirms · audit log captures it |
| 8 | Navigate to `/blockchain-rwa` | Use-case picker + technical fit + jurisdictions on left; sticky output panel on right |
| 9 | Pick "Cards rewards" + "Singapore" + Fabric + Qualified custodian | Risk drops to low · GO verdict shows · MAS stance card appears |
| 10 | Switch to "Stablecoin" + "United States" | Risk jumps · HOLD or CAUTION verdict · SEC stance card appears |
| 11 | Open Architecture Studio · click any cloud cell's 🗺 blueprint link | Modal opens with cloud-branded SVG diagram showing 9 tiers |
| 12 | Try `g r`, `g k`, `g b` from anywhere (outside text inputs) | Jumps to Requirements / Actions / Blockchain pages |

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Batch B · 4 new pages (Requirements / Actions / Blockchain-RWA / per-cloud SVG blueprints)"
git push
```

Auto-deploys in ~60 sec via Cloudflare Pages.

## Status

```
✓ Batch A (5 phases) — demo polish on existing features
✓ Batch B (4 phases) — new value-add pages
Remaining:
  Batch C (3 phases) — Excel export · 9-layer infra · Operations depth
  Batch D (2 phases) — Knowledge artifacts repo · Terraform / Helm / GitHub Actions
```
