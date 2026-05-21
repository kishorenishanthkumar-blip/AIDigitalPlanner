# Phase 16 · Program Governance rebuild

**Date:** 2026-05-21
**Shippable end-state:** ✓ RAID + Gantt + Cost + Runlog + MS Project export

## What ships

A full rewrite of `program-governance.html` with a 4-tab layout:

### Tab 1 · 📋 RAID Register
- Editable table with R / A / I / D filter chips + "All / Open / High severity" filters.
- Each row: ID (P-001 etc.) · Type pill · Severity dropdown · Description (contenteditable) · Owner (contenteditable) · Status dropdown · Delete button.
- 13 seed items pre-loaded for a typical Tier-1 retail bank modernization: 5 risks (2 high), 3 assumptions, 2 issues (1 high), 3 dependencies.
- "+ Risk / + Assumption / + Issue / + Dependency" buttons add new rows.
- Inline edit auto-saves to `localStorage.di_governance_v1`.
- Export to CSV.

### Tab 2 · 📅 7-R Timeline (Gantt)
- 18-month timeline grid.
- One row per capability with the 7R verdict bar coloured + positioned per wave:
  - Wave 1 (Months 2-5): Rehost, Replace.
  - Wave 2 (Months 5-12): Replatform, Refactor.
  - Wave 3 (Months 8-18): Rearchitect, Rebuild.
- Milestones (M1-M6) shown as a legend strip below.
- **MS Project XML export** — generates a valid `.xml` file that imports cleanly into Microsoft Project / Project Online with proper Task hierarchy, dates, durations and notes.
- CSV export also available.

### Tab 3 · 💰 Cost Model
- Three big cards: Program cost (one-time fixed price) · 3-yr cloud infra cost · 3-yr savings.
- Per-capability cost table: name · verdict · cloud · monthly · 3-yr TCO · % of total.
- All numbers come from the shared `assets/pricing.js` library — same source of truth as Architecture and EVP.
- CSV export of the cost breakdown.

### Tab 4 · 📜 Runlog
- Append-only event log.
- Auto-seeded on first load: "Received architecture handoff", "Seeded RAID register", "7-R timeline drafted".
- New events appended automatically on RAID add/delete, MS Project export, etc.
- Each entry shows timestamp · icon · message with rich text.
- Export to plain text.

### Cross-cutting

- **Receives architecture handoff** via `localStorage.di_handoff_governance` — when Architecture sends to Governance, capabilities + filters + per-capability picked cloud arrive automatically.
- **Hero stats** update live: high-severity open RAID count, total RAID, duration, monthly cloud cost.
- **"Load sample"** button on the empty state seeds the page with 10 sample capabilities for demos.
- **Light theme** matching Home / Nishi / Discovery / Architecture / EVP / SOW.

## Files changed

```
program-governance.html      full rewrite (4 tabs · RAID/Gantt/Cost/Runlog)
DEPLOY-PHASE-16.md           this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Architecture → Send to Governance | Toast + redirect to `/program-governance?from=architecture` |
| 2 | Banner shows "Imported from Architecture Studio · N capabilities" | ✓ |
| 3 | Hero: high-severity open RAID, total RAID, duration, cloud cost | ✓ |
| 4 | RAID tab: 13 seed items in 4 categories with filter chips | ✓ |
| 5 | Click any cell (description or owner), type, blur | Persists on reload |
| 6 | Change severity or status dropdown | Updates state + hero |
| 7 | Add a new risk via "+ Risk" button | New row appears with placeholder text |
| 8 | Gantt tab: 18-month grid with coloured 7R bars + milestones legend | ✓ |
| 9 | Click "⬇ MS Project XML" | `.xml` file downloads; opens in MS Project / online viewers |
| 10 | Cost tab: 3 hero cards + per-capability breakdown | All numbers match Architecture |
| 11 | Runlog tab: 3+ events with timestamps | ✓ |
| 12 | Delete a RAID row | Runlog gets a new entry, RAID count updates |

## Known follow-ups

- **Phase 16.3** — Real-time collaboration on RAID (multiplayer edit).
- **Phase 16.4** — Burndown chart per wave.
- **Phase 18.1** — Audit log entry per RAID change (who/when).

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 16 · Program Governance rebuild (RAID + Gantt + Cost + MS Project)"
git push
```

Auto-deploys in ~60 sec.
