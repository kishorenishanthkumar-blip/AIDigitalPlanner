# Batch C · Production-grade extensions (3 phases · ~10 hrs)

**Date:** 2026-05-21
**Shippable end-state:** ✓ Canonical Excel export across every artifact · 9-layer infra specs per cloud · Operations DORA + SLO error budgets + L1-L4 ticket workflow.

## What ships

### Phase 22.1 · Excel/XLSX export + canonical JSON schema

A single shared exporter — `assets/export.js` — exposed as `window.DI.export`. Loaded on every page. Lazy-loads SheetJS from CDN (`https://cdn.sheetjs.com/xlsx-0.20.3/...`) only when the first xlsx download is requested.

Public API:

```js
window.DI.export.workbook(fileName, sheets);    // build & download .xlsx (multi-sheet)
window.DI.export.canonical();                   // canonical snapshot of all artifacts (JSON)
window.DI.export.canonicalToWorkbook(fileName); // canonical snapshot as multi-sheet .xlsx
window.DI.export.json(fileName, data);          // download JSON
window.DI.export.csv(fileName, headers, rows);  // download CSV
```

**Canonical schema** — `window.DI.export.canonical()` returns a stable JSON envelope:

```
{
  schemaVersion: '1.0',
  generatedAt:   ISO timestamp,
  generatedBy:   email or 'guest',
  platform:      'DI Platform',
  profile, questionnaire, discovery, architecture, evpInput, sow,
  governance, requirements, actions, blockchain, auditLog, handoffs
}
```

**Pages with new ⬇ Excel buttons:**

- `home.html` — Platform snapshot (all sheets) on the Resume card
- `requirements.html` — Requirements sheet (4 lenses · roles · clauses)
- `actions.html` — Actions sheet (with leadership recommendations + outcomes)
- `discovery-studio.html` — 7R result page · 1 sheet
- `architecture-studio.html` — Per-cloud pricing matrix (Picked + 6 clouds)
- `evp-summary.html` — Summary + Capabilities sheets
- `program-governance.html` — RAID + Gantt + Cost sheets
- `operations.html` — KPIs · DORA · SLOs · Tickets · Incidents · Batches

**Command palette additions** (`⌘K`):
- `⬇ Excel · Platform snapshot (all sheets)`
- `⬇ JSON · Platform snapshot`

Both run as `action` kind (no navigation — invokes the export inline).

### Phase 22.2 · 9-layer infrastructure spec mapping

Each pricing cell in Architecture Studio now has a **🔧 specs** link beside **🗺 blueprint** and **⋯ source**. Clicking opens a modal with 9 infra layers tailored to (cloud × verdict):

| # | Layer | Purpose |
|---|---|---|
| 1 | 🖥 Compute | VMs / instance sizing per cloud |
| 2 | 🔌 Networking | LB · CDN · DNS · Transit Gateway |
| 3 | 🗄 Database | Managed primary + replicas |
| 4 | 🔐 Security | IAM · KMS · WAF · SIEM |
| 5 | 📦 Containers | Kubernetes flavour + GitOps |
| 6 | 🧠 AI / ML | Bedrock · Vertex · watsonx etc. |
| 7 | 🌐 Web apps | CDN · static hosting · serverless edge |
| 8 | 🖱 Desktop apps | DaaS · VDI · Cloud PC |
| 9 | 🏛 Legacy apps | Homogeneous + heterogeneous + mainframe (COBOL/AS-400) |

Each row shows: layer · primary services (cloud-native names) · sizing assumption · notes. Picks come from a per-cloud `PICKS` lookup so AWS shows EKS while Azure shows AKS, etc.

### Phase 22.3 · Operations depth — DORA + error budgets + L1-L4 tickets

`operations.html` extended with four new sections rendered above the existing incidents / FinOps / batches sections.

**DORA · 4 key metrics** — Lead Time for Changes (1.2 days · -18%), Deployment Frequency (14/wk · +22%), Change Fail Rate (5.8% · -0.4pp), MTTR Sev1/Sev2 (42/96 m · -6m).

**SLO error budgets** — three SLO gauges (Auth API 99.95%, Payments 99.9%, EOD batch 99.5%) with a coloured fill bar that turns gold > 50% and red > 80% budget consumed.

**Cost per transaction** — actual $0.024 vs target $0.018 over 142 M monthly txns ($3.4 M/mo spend).

**L1 → L4 ticket workflow** — 4-column band coloured per tier (blue / green / gold / red) showing open count · MTTR · SLA · today's closures · 2 sample recent tickets each.

All four sections are included in the Operations Excel export — new sheets: `DORA`, `SLOs`, `Tickets` alongside `KPIs`, `Incidents`, `Batches`.

## Cross-cutting wiring

- `assets/export.js` script tag added to all 13 pages (home, discovery, architecture, evp, sow, governance, operations, nishi, questionnaire, requirements, actions, blockchain-rwa, feature-explainer).
- `assets/cmdk.js` — new `ACTIONS` group with two run-style entries (xlsx + json snapshot). Activation handler now supports `kind:'action'` items that invoke `r.run()` instead of navigating.
- `architecture-studio.html` — `🔧 specs` link added to every cell; `showSpecs(capId, cloud)` generates the 9-layer modal.
- `operations.html` — `DORA`, `SLOS`, `COST_PER_TX`, `TICKETS` constants + 4 render functions wired into `render()`.

## Files changed

```
assets/export.js                 NEW · canonical exporter + xlsx/json/csv API
assets/cmdk.js                   ⌘K palette → ACTIONS group with run-style entries
home.html                        Platform snapshot button on Resume card
requirements.html                ⬇ Excel button + xlsx case in exportRequirements()
actions.html                     ⬇ Excel button + xlsx case in exportActions()
discovery-studio.html            ⬇ Excel button on 7R result page + exportXLSX()
architecture-studio.html         ⬇ Excel button on CTA + 🔧 specs links + showSpecs()
evp-summary.html                 ⬇ Excel button + exportEVPXlsx()
program-governance.html          ⬇ Excel buttons on RAID/Gantt/Cost toolbars
operations.html                  ⬇ Excel button + DORA / SLO / cost-per-tx / L1-L4 sections
DEPLOY-BATCH-C.md                this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open `⌘K`, type "platform snapshot" | Two Action entries appear (Excel + JSON) |
| 2 | Pick "Excel · Platform snapshot" | SheetJS loads from CDN · .xlsx downloads · audit log captures `export · xlsx` |
| 3 | Open the .xlsx | Sheets: Profile · Discovery·7R · Architecture · Requirements · Actions · Governance·RAID · SOW · SOW·Milestones · Audit log |
| 4 | Discovery Studio → generate 7R → ⬇ Excel | Single `Discovery·7R` sheet · 10 columns including Cloud $ / mo + Why |
| 5 | Architecture Studio → click 🔧 specs on any cell | Modal opens · 9 layers · cloud-specific service names visible |
| 6 | Switch capability or cloud | Service names + sizing update per cloud and verdict |
| 7 | Operations page | DORA strip + 3 SLO gauges + cost-per-tx + L1-L4 columns render above incidents |
| 8 | Operations → ⬇ Excel | 6 sheets — KPIs · DORA · SLOs · Tickets · Incidents · Batches |
| 9 | Run questionnaire tests | 61 / 61 pass |

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Batch C · 3 phases (canonical xlsx export · 9-layer specs · Operations DORA + L1-L4)"
git push
```

Auto-deploys in ~60 sec via Cloudflare Pages.

## Status

```
✓ Batch A (5 phases) — demo polish on existing features
✓ Batch B (4 phases) — new value-add pages
✓ Batch C (3 phases) — Excel export · 9-layer infra · Operations depth
Remaining:
  Batch D (2 phases) — Knowledge artifacts repo · Terraform / Helm / GitHub Actions
```
