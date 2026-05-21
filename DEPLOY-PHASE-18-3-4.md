# Phase 18.3 + 18.4 · Final polish

**Date:** 2026-05-21
**Shippable end-state:** ✓ Demo-ready platform with shortcuts, a11y, pinned tiles, recent items, skeleton CSS, visible focus rings.

## What ships

### `assets/shortcuts.js` (Phase 18.3)

- **`?` opens a shortcuts cheat sheet** — grouped by Navigation / Inside pages / Accessibility, with `<kbd>` styled keys and a font-size + high-contrast settings panel embedded inside.
- **`g X` navigation shortcuts** — typing `g` then any of `h n d a e s g q o` within 900 ms jumps to the matching page. Works only outside text inputs.
- Wired on every page via shared script include.

### `window.DI.a11y` (Phase 18.4)

- `setFontScale(n)` — 0.875 / 1 / 1.125 / 1.25. Persisted in localStorage, applied to `<html>` root font-size on load.
- `toggleHighContrast()` — flips a `.di-hc` class on `<html>` that overrides the palette with hard black + white + thick borders + 3 px outlines on focus.
- Both controls accessible from the shortcuts overlay.

### Skeleton loaders (Phase 18.3)

Added to `assets/theme.css`:

```css
.di-skel        /* shimmer background */
.di-skel-line   /* text-line placeholder */
.di-skel-card   /* tile placeholder */
.di-skel-circle /* avatar placeholder */
```

Plus `@keyframes di-skel-shimmer` and a **visible focus ring** rule on every interactive element.

### Pinned tiles on Home (Phase 18.4)

Every tile on Home now has a ★ pin button in the top-right corner.

- Click ★ → toggle pin. Pinned tiles float to the top of the grid on next page load.
- Pinned state stored in `localStorage.di_pinned_tiles_v1`.
- Pinned tiles get a dashed gold outline.
- Audit log captures every pin/unpin event.

### Recent items strip on Home (Phase 18.4)

A new strip appears above the Feature Workspaces section when any artifact exists in localStorage:

- **Discovery draft** — `N caps · mode`.
- **Architecture state** — `N caps · region`.
- **SOW** — `vX · DRAFT/IN REVIEW`.
- **Governance** — `N RAID · M open`.
- **Audit events** — `N events logged`.

5 most-recent items shown as compact cards. Hidden if none exist. "Clear" hides the strip for this session.

## Files changed

```
assets/shortcuts.js           NEW (? overlay + g X navigation + a11y controls)
assets/theme.css              skeleton CSS + focus rings
home.html                     pin buttons on tiles + recent strip + pin/recent JS
all 11 pages                  + <script src="assets/shortcuts.js" defer>
DEPLOY-PHASE-18-3-4.md        this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Press `?` from anywhere | Shortcuts cheat sheet opens with all groups + a11y controls |
| 2 | Inside overlay, click `A+` twice | Whole UI font scales up; persists across reloads |
| 3 | Inside overlay, click High contrast On | UI flips to hard black/white; outlines on focus |
| 4 | Press Esc | Overlay closes |
| 5 | Type `g d` (not in an input) | Jumps to Discovery Studio |
| 6 | Type `g a` then `g h` | Architecture → Home |
| 7 | On Home, click ★ on the Operations tile | "Pinned" toast; page reloads; Operations is now first |
| 8 | Click ★ on Operations again | "Unpinned"; reverts to original order |
| 9 | Create some Discovery state, refresh Home | "Recently opened" strip shows the draft |
| 10 | Tab around the page | Visible gold focus rings on every interactive element |

## Known follow-ups

- **Phase 18.5** — Empty states polish (each feature page gets "Load sample" + illustration).
- **Phase 18.6** — Skeleton loaders applied to actual fetch points (currently CSS is there; usage TBD).
- **Phase 19.2** — Nishi follow-up context (e.g. "open architecture for that capability").

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 18.3+18.4 · shortcuts + a11y + skeleton + pinned tiles + recent items"
git push
```

Auto-deploys in ~60 sec.
