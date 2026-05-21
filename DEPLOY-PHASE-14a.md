# Phase 14a · Shared shell + Features mega-menu

**Date:** 2026-05-21
**Estimate:** ~3 hrs (actual: complete)
**Shippable end-state:** ✓ Polished shell on every page

## What ships

1. **`assets/theme.css`** — single source of truth for colour, shadow, font, radius tokens. Legacy aliases (`--void`, `--t1`, `--amber`) kept so old per-page styles keep working. Respects `prefers-reduced-motion` automatically.
2. **`assets/toasts.js`** — `window.DI.toast({ kind, title, message, duration, actions })`. Variants: `info` · `ok` · `warn` · `err`. Optional action buttons inside the toast.
3. **`assets/top-bar.js`** — self-mounting top bar with a 3-column **Features ▾ mega-menu** (click-only). Drop `<div data-di-topbar></div>` anywhere on the page and it inflates. Reads `di_account_profile` from sessionStorage for the user pill.
4. **`_redirects`** — clean URLs (`/home`, `/nishi`, `/discovery`, `/architecture`, `/governance`, `/rfp`, `/operations`, `/feature/:id`) — works on Cloudflare Pages and Netlify.
5. **Platform Home button fixed** — every feature page now routes Home links to `home.html` (not `index.html`, which is the sign-in screen).
6. **Nishi right panel reclaimed** — the "What Nishi can do" cards moved to the top-bar Features mega-menu. The panel now shows "Recent conversations" + a pointer to the new Features menu.

## Files added/changed

```
assets/theme.css                       NEW
assets/toasts.js                       NEW
assets/top-bar.js                      NEW
_redirects                             updated (Cloudflare-friendly rewrites)
home.html                              uses shared top bar + theme + toasts
nishi-chatbot.html                     theme + toasts + Recent panel + Home link fix
feature-explainer.html                 theme + toasts
discovery-studio.html                  Home link fix
architecture-studio.html               Home link fix
program-governance.html                Home link fix
rfp-questionnaire.html                 Home link fix
questionnaire.html                     Home link fix
operations.html                        Home link fix
DEPLOY-PHASE-14a.md                    this file
```

## Validation

- ✓ 61 / 61 questionnaire engine tests pass.
- ✓ home.html renders with the new shared top bar + Features mega-menu.
- ✓ Mega-menu opens on click, closes on outside-click and `Escape`.
- ✓ User pill on home.html reads firstName + lastName from sessionStorage.
- ✓ All "Home" links across the platform now go to `home.html`.
- ✓ Nishi page's right column shows Recent conversations, not the old capability cards.
- ✓ Toast tested — `window.DI.toast({title:'Hello'})` from the console.

## Cloudflare Pages Git integration — one-time setup

You picked **automated deploy via Git** in the phase plan. Here's the one-time setup to wire it. After this, every `git push` to `main` triggers a Cloudflare Pages deploy automatically.

### Step A — Push your project to GitHub

If you don't already have a GitHub repo for this project:

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"

# Initialize git (skip if already initialized)
git init
git add .
git commit -m "Phase 14a · shared shell + Features mega-menu"

# Create a private repo on github.com first (any name), then:
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

If git is already initialized (it is — there's a `.git` folder in the project), just:

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 14a · shared shell + Features mega-menu"
git push
```

### Step B — Connect Cloudflare Pages to GitHub

1. Open https://dash.cloudflare.com.
2. Left sidebar → **Compute (Workers & Pages)** → **Pages** tab.
3. Either:
   - **New project**: click **Create application** → **Pages** → **Connect to Git** → authorise GitHub → pick the repo.
   - **Existing project**: click your project → **Settings** → **Builds & deployments** → **Production branch** → **Connect to Git**.

### Step C — Build settings

Cloudflare will ask for build settings. Use these exact values:

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | (leave blank) |
| **Build output directory** | (leave blank or `/`) |
| **Root directory** | `/` |
| **Environment variables** | (none needed) |

Click **Save and Deploy**. First deploy runs in ~30 seconds.

### Step D — Verify the auto-deploy works

1. Wait for the first deploy to finish (you'll see a green ✓ in the Deployments tab).
2. Open the live URL (`https://<your-project>.pages.dev`).
3. Hard-refresh (`Ctrl + Shift + R`) to bypass cache.
4. Make a tiny test change locally (e.g. update a heading), commit, and push:
   ```powershell
   git commit -am "test auto-deploy"
   git push
   ```
5. Within ~45 seconds, the new deploy should appear in the Cloudflare Pages dashboard.

### Step E — EmailJS allowed origins (if changed)

If your Cloudflare Pages URL is different from before, add it to **EmailJS dashboard → Account → Security → Allowed Origins**:

```
https://<your-cf-pages-project>.pages.dev
https://*.<your-cf-pages-project>.pages.dev
```

## QA checklist after this deploy

Run these on the live URL after auto-deploy completes.

| # | Test | Expected |
|---|------|----------|
| 1 | Open `/home` | Shared top bar visible with logo + Home (active) + Features ▾ + Library + Operations |
| 2 | Click **Features ▾** | Mega-menu drops down with 8 feature cards in two columns, intro on left, spotlight on right |
| 3 | Press `Escape` | Mega-menu closes |
| 4 | Click outside the mega-menu | Closes |
| 5 | Click any feature card | Opens `/feature/<id>` (e.g. `/feature/rfp`) |
| 6 | Click `/nishi` from the URL bar | Nishi chat opens; right panel shows "Recent conversations" not the old capability cards |
| 7 | From Discovery, click **← Platform Home** | Lands on `/home`, NOT the sign-in screen |
| 8 | From any page, click `🤖 Nishi` in the top bar | Opens Nishi chat |
| 9 | Sign out → sign in again | Lands on Nishi (first landing); top bar user pill shows your name |
| 10 | Test toast: open DevTools console, type `DI.toast({title:'Test', message:'Hi'})` | Toast appears top right |

## Next: Phase 14b.1 (Discovery mode picker + capability picker + auto-save)

~3.5 hrs. Builds on this shared shell. The new Discovery Studio entry page (mode picker), capability checkbox grid step, and localStorage auto-save framework.
