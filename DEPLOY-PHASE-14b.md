# Phase 14b · Discovery Studio rebuild (mode picker + capability picker + per-capability detail + 7R map)

**Date:** 2026-05-21
**Estimate:** Phase 14b.1 + 14b.2 + 14b.4 combined (Phase 14b.3 active Nishi co-pilot deferred to next phase)
**Shippable end-state:** ✓ End-to-end Discovery flow, with auto-save and 7R rules engine

## What ships

A complete rebuild of `discovery-studio.html` as a 4-step wizard:

### Step 1 · Mode picker
- Four entry lanes:
  - **Quick assessment** (recommended) — ~3 min, executive-friendly.
  - **Detailed inventory** — ~30 min, architect-friendly.
  - **Import from spreadsheet** — coming soon (Phase 14b.5).
  - **Connect to CMDB** — Phase 14, dimmed for now.
- Auto-resume banner when a draft exists in localStorage.

### Step 2 · Capability picker
- 20 capabilities grouped into 4 lenses:
  - **Banking Core** (7) — Payments, Deposits, Loans, Trade Finance, Treasury, Wealth, Private.
  - **Cards & Loyalty** (5) — Card fulfillment, management, transaction mgmt, loyalty debit & credit.
  - **Customer Lifecycle** (4) — Consumer / corporate acquisition, account mgmt, service.
  - **Risk · Compliance · Ops** (4) — Risk & Compliance, AML, Audit, Branch ops.
- 13 capabilities pre-checked for a typical Tier-1 retail bank.
- Critical capabilities flagged with red `CRIT` badge.
- "Select all" toggle per group.

### Step 3 · Per-capability detail
- Sticky sidebar listing all selected capabilities with progress (✓ done · ▸ active · pending).
- Five tabs per capability: **Infrastructure · Applications · Data & databases · Integrations & batches · Operations**.
- Every field is a range dropdown (e.g. `4-8`, `50-200`, `200-1k`).
- Confidence toggle per field: `Confident / Estimate / Don't know`.
- Complexity radio: `Simple / Moderate / Complex / Highly complex`.
- "Show advanced" toggle exposes exact-count number input + free-text notes (for DBAs).
- Tools: ↺ Reset to peer defaults · 📋 Copy from previous capability.
- "Mark done" per capability flips the sidebar to ✓.

### Step 4 · 7R modernization map
- Header stats: total duration, est. 3-year savings, high-risk capability count.
- **7R mix bar** with proportional segments (Rehost / Replatform / Refactor / Rearchitect / Rebuild / Replace / Retain).
- Per-capability card grid: name, current → future stack, target cloud, risk, effort, rationale ("Why X").
- Three CTAs: **Send to Architecture**, **Send to Governance**, **Export JSON**.
- Edit-back buttons to return to detail or scope.

### Cross-cutting

- **Auto-save** debounced 800ms to `localStorage` (key `di_discovery_v1`). "Auto-saved · 2 min ago" badge in the stepper.
- **Resume on next visit** — if a draft exists, the mode picker shows a banner.
- **Stepper navigation** — click any step to jump (forward jumps gated by prereqs).
- **Handoff via localStorage** — Send to Architecture sets `di_handoff_architecture` payload, Send to Governance sets `di_handoff_governance`. The receiver page can read and consume.

## 7R rules engine

`compute7R()` runs over the selected capabilities and returns a verdict per capability with:

- `verdict` — REHOST / REPLAT / REFACT / REARCH / REBUILD / REPLACE / RETAIN
- `verdictName`, `color`, `risk`, `eff` (effort range), `stack` (target cloud), `why` (rationale)
- Rollup `mix` — count per verdict
- Rollup `mixTotal` — for percentage bar

The current logic uses per-capability default verdicts (defined in the `CAPS` array) — the inventory detail influences the rationale text but doesn't yet swing the verdict. Phase 14b.5 will add full rule-based adjustments (e.g. "if complexity = Highly complex AND skills declining, push from Refactor to Rearchitect").

## Files changed

```
discovery-studio.html               full rewrite (mode picker + wizard + 7R engine)
DEPLOY-PHASE-14b.md                 this file
```

61 / 61 questionnaire engine tests still pass — no regression to the existing engine.

## QA checklist after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Sign in → click Discovery Studio tile from Home | Lands on `/discovery-studio` |
| 2 | Mode picker shows 4 lanes; click Quick assessment | Pre-checks 13 capabilities, jumps to scope step |
| 3 | Scope step: uncheck a few, tick "Wealth Management" | Counter updates live |
| 4 | Click "Skip detail → Generate 7R map" (Quick mode) | Lands on 7R result with per-capability cards |
| 5 | Edit-back → switch to Detailed mode | Detail step opens with the first capability selected |
| 6 | Click each of the 5 tabs (Infra · Apps · Data · Integ · Ops) | Tab content swaps; ranges + confidence toggles visible |
| 7 | Click "Show advanced" inside any tab | Exact-count number input + notes appear |
| 8 | Change a field; refresh the page | Field value persists (localStorage auto-save) |
| 9 | Mark a capability done | Sidebar row turns green with ✓; progress bar advances |
| 10 | Send to Architecture from the result page | Toast appears; redirected to architecture-studio.html?from=discovery |

## Known follow-ups

| Phase | What it adds |
|---|---|
| 14b.3 | **Active Nishi co-pilot** — chat panel that walks user through each tab, parses chat replies into field values, answers contextual questions. |
| 14b.5 | **Inventory-driven 7R adjustments** — complexity, age, skills decay swing the verdict (not just rationale). |
| 14b.6 | **Spreadsheet import mode** — CSV / XLSX drop, column mapping, inconsistency detection. |
| 15b.1 | Architecture Studio receives `di_handoff_architecture` payload and uses it to pre-fill its cloud pricing grid. |
| 16.1  | Program Governance receives `di_handoff_governance` payload, seeds RAID register Epics. |

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 14b · Discovery Studio rebuild (wizard + 7R engine)"
git push
```

Cloudflare auto-deploys within ~60 seconds. Hard-refresh the Discovery Studio page.
