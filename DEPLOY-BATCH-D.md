# Batch D · Knowledge + IaC (2 phases · ~7 hrs)

**Date:** 2026-05-21
**Shippable end-state:** ✓ Searchable artifact repository with templates / playbooks / patterns / regulatory checklists · ✓ One-click Terraform · Helm · GitHub Actions bundle generator wired to Discovery + Architecture state.

## What ships

### Phase 23.1 · `knowledge.html` — Knowledge Artifacts Repository

A standalone "library" page that aggregates every artifact the platform has built plus a curated set of banking modernization reference content.

- **Live artifacts** auto-hydrate from `localStorage`: Discovery, Architecture, Requirements, Actions, SOW, Governance. Each shows as a `live` pill with size, owner, last-modified.
- **Snapshots** — the "📥 Save current as artifact" button freezes the full canonical bundle (from `window.DI.export.canonical()`) as an immutable snapshot you can later restore over your working state.
- **Seed library** of 16 reference cards:
  - 4 templates (Cards modernization, AML re-platform, Core banking strangler, Trade finance).
  - 4 playbooks (Target architecture, 7R decision, FinOps runbook, Blockchain pilot).
  - 5 regulatory checklists (DORA EU, BCBS 239, MAS TRM, RBI Cyber, SOX 404).
  - 3 patterns (Event-driven banking, CQRS ledger, Zero-trust).
- **Filters**: 11 type chips with live counts · free-text search across title / description / tags.
- **Per-card actions**: open / view modal · ⬇ JSON export · delete (snapshots and seeds only — live artifacts protected) · restore (snapshots only).
- **Bulk action**: ⬇ Excel · all (one sheet listing every artifact's metadata).

Storage: `di_knowledge_v1` (localStorage).

### Phase 23.2 · `iac.html` — IaC Bundle Generator

Generates a downloadable `.zip` with Terraform modules, Helm charts, and GitHub Actions workflows scoped to your picked cloud, region, environment, and capabilities.

- **18 modules** grouped into 4 sections, each a checkbox:
  - Terraform · Foundations · VPC · IAM · KMS · Logging.
  - Terraform · Compute · Kubernetes · Database · Events · Cache.
  - Terraform · Edge · WAF/CDN/DNS · Secrets.
  - Helm · Deployment · Ingress · HPA · Istio mesh.
  - GitHub Actions · CI · CD staging · canary promote · rollback.
- **Per-cloud Terraform variants** — picks the right provider (AWS / Azure / GCP / OCI / IBM / Private), backend (S3 / azurerm / gcs / local), and module bodies (Aurora vs Azure SQL vs Cloud SQL · EKS vs AKS vs GKE).
- **Helm charts per capability** — one chart per picked capability (up to 6) with sane defaults (RollingUpdate · cert-manager Ingress · CPU 60% HPA target · PDB · readiness/liveness probes).
- **GitHub Actions** workflows include OIDC auth (no static creds), canary 10/50/100% promote, metrics gate before each step, rollback with PagerDuty notification.
- **Live preview** on the right shows the file tree before download. Updates as you toggle modules.
- **README.md** and **Makefile** included — `make plan / apply / helm-upgrade` shortcuts.

JSZip loads lazily from CDN (`https://cdn.jsdelivr.net/npm/jszip@3.10.1/...`).

## Cross-cutting wiring

- **Top-bar Features mega-menu** — promoted "Knowledge artifacts" from BETA to LIVE with `href:'knowledge.html'`. Added new "IaC bundle generator" entry with `href:'iac.html'`.
- **⌘K command palette** — added 2 entries: `Knowledge Artifacts` (shortcut `g w`) and `IaC Bundle Generator` (shortcut `g i`).
- **Shortcuts** — `g w` → knowledge, `g i` → iac.
- **Audit log** — every snapshot, restore, delete, export, and IaC download is logged.

## Files changed

```
knowledge.html              NEW · Knowledge Artifacts repository
iac.html                    NEW · IaC bundle generator (Terraform · Helm · GH Actions)
assets/top-bar.js           Features menu entries for Knowledge (LIVE) + IaC
assets/cmdk.js              ⌘K palette entries for Knowledge + IaC
assets/shortcuts.js         g w → knowledge · g i → iac
DEPLOY-BATCH-D.md           this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Press `⌘K`, type "knowledge" | Knowledge Artifacts entry appears with `g w` shortcut |
| 2 | Navigate to `/knowledge` | Hero + KPI strip + 11 type chips + search + (empty or hydrated) cards |
| 3 | Click "+ Load sample library" | 16 cards render (4 templates · 4 playbooks · 5 regulatory · 3 patterns) |
| 4 | Filter by "Regulatory" chip | Only 5 regulatory cards remain · counts update |
| 5 | Click any reference card | Modal opens with metadata + payload preview + ⬇ JSON button |
| 6 | Build something in Discovery, return to `/knowledge` | Discovery card appears with `live` pill |
| 7 | Click "📥 Save current as artifact" | New `snapshot` card appears with canonical payload embedded |
| 8 | Click ⬇ Excel · all | xlsx downloads with 1 sheet listing every artifact |
| 9 | Press `⌘K`, type "iac" | IaC Bundle Generator entry appears with `g i` shortcut |
| 10 | Navigate to `/iac` | Cloud / region / env / project picker · 18-module checklist · live preview tree |
| 11 | Toggle a few modules off | File tree updates immediately |
| 12 | Click "⬇ Download .zip" | JSZip loads · zip downloads · contains terraform/ + helm/ + .github/workflows/ + README.md + Makefile |
| 13 | Switch cloud from AWS → Azure | Terraform module bodies change (Azure SQL, AKS, Front Door instead of Aurora, EKS, CloudFront) |

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
node tests/questionnaire.test.js
git add .
git commit -m "Batch D · Knowledge artifacts repo + IaC bundle generator (Terraform/Helm/GH Actions)"
git push origin main
```

Auto-deploys in ~60 sec via Cloudflare Pages.

## Status

```
✓ Batch A (5 phases) — demo polish on existing features
✓ Batch B (4 phases) — new value-add pages
✓ Batch C (3 phases) — Excel export · 9-layer infra · Operations depth
✓ Batch D (2 phases) — Knowledge Artifacts Repository · IaC bundle generator
─────────────────────────────────────────────────────────────────────
Platform is feature-complete for buyer demos.
```
