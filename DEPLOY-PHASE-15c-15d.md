# Phase 15c + 15d · EVP summary + Draft SOW

**Date:** 2026-05-21
**Shippable end-state:** ✓ Discovery → Architecture → EVP → SOW chain works end-to-end

## What ships

### `evp-summary.html` (Phase 15c)

A board-ready executive summary that reads `di_evp_input` from localStorage (set by Architecture's "Generate EVP Summary" button) and renders:

- **Hero (dark navy):** 30 px headline like *"Modernize 13 banking capabilities in 14 months, save $4.4M over 3 years."* Four big stats below — Duration · 3-Yr Savings · Peak FTE · Payback (with NPV @ 8%).
- **Benefits grid:** 4 colour-coded cards — Time, Cost, Resources, Risk. Each card has the delta in plain English (e.g. *"3 parallel waves"*, *"Mainframe retired, 39 servers decommissioned"*).
- **KPI table:** 7 business KPIs with baseline → target → how DI Platform moves it → delta %. Bound by the binding-KPI clause in the SOW Annex C.
- **Audience switcher:** VP / Board · Architect · Auditor. Auditor mode replaces the business cards with per-capability provenance panels (capability ID, chosen cloud, monthly cost, 3-year TCO).
- **Actions:** ⬇ PDF (uses browser print dialog with a `DRAFT` watermark CSS class) · ⬇ PPT (stub toast for now — Phase 15c.2) · 📧 Email CIO+CFO (stub) · 📤 Draft SOW for Legal → opens `sow.html`.

### `sow.html` (Phase 15d.1 + 15d.2)

A two-column inline-editable Statement of Work that reads `di_sow_input` from localStorage:

**Left column · The document**
- Clean Word-document styling (Calibri-equivalent, 13.5 px, 1.7 line-height, 36/44 px page padding).
- Faint diagonal `DRAFT v0.1` watermark.
- 8 numbered sections: Parties · Scope · Deliverables & Milestones · Commercials · Acceptance Criteria · Annex C KPIs · Confidentiality/IP/Data residency · Signatures.
- Every paragraph (and milestone row) is `contenteditable`. Hover highlights softly; focus shows a gold-tinted outline. Changes auto-save to `localStorage` on blur.
- **Milestone table** with 6 milestones (M1-M6), editable Title and Deliverable cells, fixed payment % totalling 100%. Final milestone row highlighted in gold.
- **Annex C** pulls the KPIs from the EVP and pins them as **contractually binding** (5% holdback per missed KPI, capped at 15% of fixed price).

**Right column · Workflow panel (sticky)**
- Summary card: capabilities · duration · fixed price · cloud TCO · 3-yr savings.
- Workflow buttons: 📤 Send for review · ⬇ Export DOCX · ⬇ Export PDF · 💬 Add comment · ↗ Save as new version.
- Provenance card: generated timestamp · source (Architecture v1.0) · author · status.
- Legal warning chip: "auto-generated, legal review required, regenerate if Architecture changes".

### Cross-cutting

- **Auto-save** debounced 800 ms after each `blur` event.
- **Versioning** — "↗ Save as new version" bumps `0.1 → 0.2`, resets status to DRAFT.
- **Status pill** in toolbar: `v0.1 · DRAFT` → flips to `IN REVIEW` after Send for review.
- **Real DOCX export** — generates a Word-compatible HTML blob with print styles, downloads as `sow-v0.1-2026-05-21.doc`. Opens in Microsoft Word with formatting preserved.
- **Print to PDF** uses the browser's native print dialog.
- **Comments** — selecting text + clicking "💬 Add comment" stores the comment in localStorage (full threaded comments ship in Phase 18.x).

### Discovery → Architecture → EVP → SOW chain (full demo)

```
Discovery Studio
   pick capabilities → fill detail → 7R map → [Send to Architecture]
      ↓ (handoff via localStorage.di_handoff_architecture)
Architecture Studio
   imports caps → 6-cloud pricing grid → user picks clouds → [Generate EVP Summary]
      ↓ (handoff via localStorage.di_evp_input)
EVP Summary
   hero + benefits + KPIs + audience switcher → [Draft SOW for Legal]
      ↓ (handoff via localStorage.di_sow_input)
Draft SOW
   inline-editable 8-section template → [DOCX export] → off to Legal counsel
```

## Files changed

```
evp-summary.html         NEW · board-ready summary page
sow.html                 NEW · inline-editable SOW
DEPLOY-PHASE-15c-15d.md  this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Discovery → 7R result → Send to Architecture → Architecture renders | ✓ |
| 2 | Architecture → Generate EVP Summary | Toast + redirect to `/evp-summary` |
| 3 | EVP hero shows duration, savings, peak FTE, payback | ✓ |
| 4 | Switch audience to Auditor | Per-capability provenance panels appear |
| 5 | EVP → Draft SOW for Legal | Toast + redirect to `/sow` |
| 6 | SOW renders with 8 numbered sections, watermark visible | ✓ |
| 7 | Click any paragraph → contenteditable focus highlights → type | Auto-saves on blur |
| 8 | Edit a milestone title or deliverable | Persisted on reload |
| 9 | Click ⬇ Export DOCX | `.doc` file downloads; opens cleanly in Microsoft Word |
| 10 | Click 📤 Send for review | Status pill flips to `IN REVIEW`, toast fires |
| 11 | Click ↗ Save as new version | Version bumps `0.1 → 0.2`, status resets to DRAFT |
| 12 | Reload SOW page | All inline edits + version persist |

## Known follow-ups

- **Phase 15c.2** — Real PPT generator (currently a stub toast; use browser Print → Save as PDF for now).
- **Phase 15d.3** — Threaded comments + e-signature ceremony. The localStorage comment storage exists; UI ships later.
- **Phase 18.x** — Email integration so "Send for review" actually emails Legal + CTO.

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 15c+15d · EVP summary + Draft SOW"
git push
```

Cloudflare auto-deploys in ~60 sec.
