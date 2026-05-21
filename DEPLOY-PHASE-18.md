# Phase 18.1 + 18.2 · Audit log · Session pill · Data residency · ⌘K command palette

**Date:** 2026-05-21
**Shippable end-state:** ✓ Trust signals + power-user shortcut working across every page.

## What ships

### `assets/audit.js` (Phase 18.1)

A tamper-evident append-only log of every meaningful user action, scoped to the local browser. **Never transmitted.**

- `DI.audit.log(source, action, meta)` — append an entry. Every entry stores timestamp, source, action, meta object, user email, and a session fingerprint (browser + locale + timezone hash).
- `DI.audit.show()` — opens a viewer modal with a table of recent events, export-to-JSON, clear, and a footer pinning the residency claim ("Stored locally · this browser only · never transmitted").
- Auto-logs every page view; can be expanded by pages that want to track specific actions.

### Top-bar upgrades (Phase 18.1)

Three new behaviours wired into `assets/top-bar.js`:

1. **Session pill** — user pill now shows `Signed in 2 h ago · Chrome` instead of just the role. Browser and OS detection comes from `navigator.userAgent`.
2. **User pill is now clickable** — opens a Session info modal with: name, email, role, region, signed-in timestamp + relative time, browser + OS, timezone, data-residency pill (`🔒 LOCAL · this browser only`), audit event count, View audit log button, and Sign out.
3. **Bell icon (🔔)** now opens the audit log viewer (was a placeholder toast in Phase 14a).
4. **⌘K search button** now opens the command palette.
5. **Global `Ctrl+K` / `Cmd+K`** keyboard shortcut opens the command palette from anywhere.

### `assets/cmdk.js` (Phase 18.2)

A polished command palette modal that fuzzy-searches across:

- **Pages** — Home, Nishi, Discovery, Architecture, EVP, SOW, Governance, RFP, Operations (with `g d` / `g a` / etc. shortcut hints).
- **Feature walkthroughs** — Each feature-explainer entry.
- **Recent artifacts** — Pulls from `localStorage` the Discovery draft, Architecture state, SOW version, Governance RAID count.
- **RAID items** — Searches every saved RAID id + description.
- **"Ask Nishi"** fallback — if the query has > 1 character, the palette always offers `Ask Nishi: "<your query>"` which deep-links to the chat with the query pre-filled (uses the Phase 19 intent parser).

UX:
- Open with `Ctrl + K` / `Cmd + K` or click the search button in the top bar.
- Type to filter (small custom fuzzy matcher: exact > prefix > contains > word-set > letter-sequence).
- `↑ ↓` to navigate, `Enter` to activate, `Esc` to close.
- Mouse hover and click work too.
- Results grouped by kind with coloured icon chips.
- Footer shows result count and keyboard hint strip.
- Every open + activate logs an audit event.

### Cross-page wiring

`audit.js` + `cmdk.js` script tags added to all 11 pages (home, nishi-chatbot, discovery-studio, architecture-studio, evp-summary, sow, program-governance, operations, questionnaire, rfp-questionnaire, feature-explainer).

## Files changed

```
assets/audit.js                NEW
assets/cmdk.js                 NEW
assets/top-bar.js              session pill + bell → audit + ⌘K wiring + global shortcut + session modal
home.html / nishi-chatbot.html / discovery-studio.html / architecture-studio.html
  evp-summary.html / sow.html / program-governance.html / operations.html
  questionnaire.html / rfp-questionnaire.html / feature-explainer.html
                               + <script src="assets/audit.js"> + <script src="assets/cmdk.js">
DEPLOY-PHASE-18.md             this file
```

61 / 61 questionnaire engine tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open any page · top bar shows user pill | Shows `Name` + `Signed in N min ago · Chrome` |
| 2 | Click the user pill | Session info modal opens with email, role, region, signed-in time, browser + OS, timezone, data-residency `🔒 LOCAL` badge |
| 3 | Click the 🔔 bell | Audit log modal opens with recent events (page views, RAID changes, etc.) |
| 4 | Click "Sign out" inside session modal | Confirm dialog → clears session → redirect to sign-in |
| 5 | Press `Ctrl + K` (or `Cmd + K` on Mac) | Command palette opens |
| 6 | Type "discovery" | Discovery Studio surfaces with `g d` shortcut hint |
| 7 | Press `↓` then `Enter` | Navigates to next page |
| 8 | Open palette · type a question (e.g. "why did RDS spike") | "Ask Nishi: ..." appears at the bottom — Enter sends to Nishi with `?q=` |
| 9 | Open palette · type a RAID id (e.g. "P-001") | RAID item surfaces under "RAID items" group with sev + status hint |
| 10 | Click ⌘K Search in the top bar | Same palette opens |

## Known follow-ups

- **Phase 18.3** — Skeleton loaders + keyboard shortcuts cheat sheet (`?` opens overlay).
- **Phase 18.4** — Pinned tiles on home (★ icon), Recent items strip, accessibility audit (font-size, high-contrast, prefers-reduced-motion).
- **Phase 18.5** — Audit log entries from Discovery / Architecture / SOW / Governance (add `DI.audit.log(...)` calls at write points).

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 18.1+18.2 · audit log + session pill + data-residency + cmdk palette"
git push
```

Auto-deploys in ~60 sec.
