# Cloudflare Pages · auto-deploy from GitHub — complete runbook

**Goal:** every `git push` to your `main` branch triggers a Cloudflare Pages deploy automatically.
**Time:** ~20 minutes end-to-end (one-time setup).
**Cost:** $0 — GitHub and Cloudflare Pages free tiers both cover this.

---

## Phase 0 · Pre-flight (3 min)

Before you start, confirm:

- [ ] You have a Cloudflare account (the one with your existing `dreamy-chebakia-4586b6.pages.dev` deploy or whichever URL you're on).
- [ ] You have or are willing to create a GitHub account (free at https://github.com/signup).
- [ ] Git is installed on your machine. Test by opening PowerShell and running:
  ```powershell
  git --version
  ```
  If you see something like `git version 2.43.0`, you're set. If not, install from https://git-scm.com/download/win (default options are fine).
- [ ] Your project lives at `C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner`.

---

## Phase 1 · Create a GitHub repository (5 min)

### 1.1 Sign in to GitHub

Open https://github.com and sign in. If you don't have an account yet, create one — the username you pick becomes part of every repo URL, so pick something professional.

### 1.2 Create the repo

1. Top-right corner → click the `+` icon → **New repository**.
2. **Repository name:** `di-platform-planner` (or anything you prefer — lowercase, hyphens not spaces).
3. **Description:** `Digital Infotech Platform — banking modernization workspace.` (optional)
4. **Visibility:** **Private** (recommended — your code stays only on GitHub and Cloudflare, not searchable on the web).
5. **Initialize this repository with:** leave ALL THREE checkboxes UNTICKED:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license

   You already have files locally, so creating any of these now causes a conflict.
6. Click **Create repository**.

### 1.3 Copy the repo URL

GitHub now shows a "Quick setup" page with a URL like:

```
https://github.com/<your-username>/di-platform-planner.git
```

Copy that URL. You'll paste it in Phase 2.

---

## Phase 2 · Push your project to GitHub (5 min)

Open PowerShell. Paste each block one at a time.

### 2.1 Navigate to the project

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
```

### 2.2 Check if git is already initialized

```powershell
git status
```

You'll see one of two outcomes:

- **"fatal: not a git repository"** → Run section 2.3 (initialize).
- **"On branch …"** or **"On branch main"** → Skip to section 2.4 (already initialized; just push).

### 2.3 Initialize git (only if 2.2 said "not a git repository")

```powershell
git init
git branch -M main
```

Configure your name and email if you haven't already (these show up on every commit):

```powershell
git config --global user.name  "Nishanth Kumar Kishore"
git config --global user.email "kishorenishanthkumar@gmail.com"
```

### 2.4 Add a `.gitignore` so you don't push the wrong files

Some files should NEVER be committed (API keys, virtual environments, build artefacts). Create or update the `.gitignore`:

```powershell
@"
# Python / backend
backend/.venv/
backend/__pycache__/
backend/**/__pycache__/
backend/.env
*.pyc

# Editor / OS
.vscode/
.idea/
.DS_Store
Thumbs.db

# Local secrets — NEVER commit these
.env
.env.local
*.key
*API*Key*

# Node (in case it sneaks in)
node_modules/

# Build artefacts
dist/
build/

# Skip user-uploaded scratch
uploads/
outputs/
"@ | Out-File -FilePath .gitignore -Encoding utf8
```

### 2.5 Stage and commit your existing project

```powershell
git add .
git status   # confirms what will be committed; review to be safe
git commit -m "Phase 14a · shared shell + Features mega-menu"
```

If `git status` shows ANY file with `key`, `secret`, `.env`, or `password` in the name, **stop** and ensure your `.gitignore` excludes it before committing.

### 2.6 Connect the local repo to GitHub

Replace `<your-username>` with your actual GitHub username:

```powershell
git remote add origin https://github.com/<your-username>/di-platform-planner.git
```

If you get "remote origin already exists", update it instead:

```powershell
git remote set-url origin https://github.com/<your-username>/di-platform-planner.git
```

### 2.7 Push to GitHub

```powershell
git push -u origin main
```

This will prompt for authentication. Two options:

- **Browser-based (easiest):** Git for Windows opens a GitHub login window. Sign in.
- **Personal Access Token (alternative):** If the browser flow doesn't open, GitHub will ask for a username + password. The "password" must be a Personal Access Token, not your account password:
  1. GitHub → top-right avatar → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
  2. Name: `cloudflare-pages-deploy`. Expiration: `90 days`. Scopes: tick `repo` (Full control of private repositories).
  3. Generate, copy the token (starts with `ghp_...`), paste it as the "password" when git asks.

After `git push` succeeds, reload your GitHub repo page in the browser — you should see all your files there.

---

## Phase 3 · Connect Cloudflare Pages to GitHub (5 min)

### 3.1 Open Cloudflare Pages

1. Open https://dash.cloudflare.com.
2. Left sidebar → **Compute (Workers & Pages)**.
3. Click the **Pages** tab.

### 3.2 Two paths from here

You'll see your existing `dreamy-chebakia-4586b6` (or similar) project listed. You have two options:

**Option A — Connect Git to the EXISTING project (recommended)**

This keeps the same URL your team is using.

1. Click your existing project (`dreamy-chebakia-4586b6`).
2. **Settings** tab → **Builds & deployments** → **Source** → click **Connect to Git**.
3. Authorise Cloudflare to access GitHub:
   - A popup opens; click **Continue with GitHub**.
   - On GitHub's page, click **Authorize Cloudflare Pages**.
   - Pick **All repositories** (easier) or **Only select repositories** → choose `di-platform-planner`.
4. Back in Cloudflare, pick the repo `<your-username>/di-platform-planner`.
5. **Production branch:** `main`.
6. Continue to Phase 4.

**Option B — Create a NEW Cloudflare Pages project (if you want a new URL)**

1. From the Pages tab, click **Create application** → **Pages** tab → **Connect to Git**.
2. Authorise GitHub (same flow as above).
3. Pick `<your-username>/di-platform-planner`.
4. **Project name:** `di-platform-planner` → URL becomes `https://di-platform-planner.pages.dev`.
5. **Production branch:** `main`.
6. Continue to Phase 4.

---

## Phase 4 · Configure build settings (2 min)

Cloudflare asks for build configuration. **Use these exact values** for your static site:

| Setting | Value |
|---------|-------|
| **Framework preset** | `None` |
| **Build command** | (leave blank) |
| **Build output directory** | (leave blank — Cloudflare serves from repo root) |
| **Root directory (advanced)** | `/` |
| **Environment variables** | (none needed) |
| **Node version** | (leave default) |

> ⚠ **Do not** set a build command. Your project has no build step — it's pure HTML / CSS / JS. Adding a build command will fail.

Click **Save and Deploy**.

---

## Phase 5 · Verify the first auto-deploy (2 min)

1. Cloudflare immediately starts the first deploy. You'll see:
   - **Initializing** → **Cloning** → **Building** → **Deploying** → **Success**.
2. This should take ~30-60 seconds.
3. Once green, click the live URL.
4. Hard-refresh (`Ctrl + Shift + R`) to bypass cache.
5. Confirm:
   - The sign-in page loads.
   - You can sign in with `nishanth.kishore / DI@2026!`.
   - Top bar with Features ▾ mega-menu appears.

If the deploy fails, see **Troubleshooting** at the bottom.

---

## Phase 6 · Update EmailJS allowed origins (3 min)

If the Cloudflare Pages URL is new (Option B above), EmailJS will refuse to send from that origin until you whitelist it.

1. https://dashboard.emailjs.com → sign in.
2. **Account** → **Security** → **Allowed Origins** → **Add origin**.
3. Add:
   ```
   https://di-platform-planner.pages.dev
   https://*.di-platform-planner.pages.dev
   ```
   (Replace `di-platform-planner` with your actual project name.)
4. Save.

> Keep your old origins (Netlify, previous Cloudflare URL) until you're sure you've fully migrated. You can clean them up later.

---

## Phase 7 · Test the auto-deploy loop (3 min)

The whole point of this setup is that `git push` = production deploy. Let's verify.

1. Open `index.html` (or any file) and make a tiny harmless change — e.g., add a comment at the top:
   ```html
   <!-- auto-deploy test: 2026-05-21 -->
   ```
2. Save.
3. PowerShell:
   ```powershell
   cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
   git add .
   git commit -m "test: auto-deploy via Cloudflare Pages"
   git push
   ```
4. Within 5-15 seconds, the Cloudflare Pages dashboard shows a new deploy starting.
5. Wait ~45 seconds for it to flip to **Success**.
6. Hard-refresh the live URL.

If the new comment appears in the page source — congrats, auto-deploy is live.

---

## Daily workflow from now on

Once Phase 7 succeeds, every change you want live is just three commands:

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase X · what changed"
git push
```

Cloudflare deploys automatically. No more zip dragging.

---

## Useful Cloudflare Pages dashboard features

After setup, the dashboard gives you:

- **Deployments tab** — every push creates a deploy with its own preview URL like `https://abc123.di-platform-planner.pages.dev`. You can roll back to any prior deploy with one click.
- **Branch deploys** — push to a branch other than `main` (e.g. `git checkout -b feature-x && git push origin feature-x`) and Cloudflare creates a preview deploy at a unique URL. Lets you test before merging.
- **Build logs** — click any deploy to see exactly what happened.
- **Real-time analytics** — page views, requests, geography. Free.

---

## Optional · Add a custom domain (5 min)

If you own a domain (e.g. `diplatform.co`) and want it pointed at this project:

1. Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain**.
2. Enter your domain. Cloudflare detects if it's already on Cloudflare DNS:
   - **If yes:** Cloudflare adds the DNS record automatically. Done in 30 seconds.
   - **If no:** Cloudflare shows you a CNAME record to add at your current DNS provider (GoDaddy, Namecheap, Squarespace). Paste it in.
3. SSL certificate is provisioned automatically (~30 seconds).
4. Add the new domain to EmailJS allowed origins too.

---

## Troubleshooting

### "Permission denied (publickey)" when running git push

You're using SSH instead of HTTPS. Either switch to HTTPS:

```powershell
git remote set-url origin https://github.com/<your-username>/di-platform-planner.git
```

…or set up SSH keys (more steps; HTTPS is simpler for first-timers).

### "Authentication failed" when pushing

You're using your GitHub account password — that doesn't work anymore. Use a Personal Access Token (see Phase 2.7).

### "Updates were rejected because the remote contains work…"

The remote repo has something your local doesn't (often because you ticked "Initialize with README" in Phase 1). Force-overwrite (use carefully):

```powershell
git push -u origin main --force
```

Only do this on your first push to an empty remote.

### Cloudflare build fails with "No build output found"

Build output directory should be **blank** or `/`, not `dist` or `build`. Go to Settings → Builds & deployments → edit and set Build output to blank → save → click **Retry deployment**.

### Cloudflare deploys but the live site shows an old version

Browser cache. Hard-refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac). If still stale, DevTools → Application → Clear storage → Clear site data.

### Cloudflare deploys, but a specific file (e.g. `.env`) is now public

You committed something you shouldn't have. **Stop using the leaked credentials immediately**, then:

```powershell
# Remove the file from history (DESTRUCTIVE — coordinate with anyone else who has cloned the repo)
git rm --cached .env
git commit -m "remove leaked env file"
git push --force
```

Then rotate the leaked secret (API key, password, token) at the source. GitHub's secret scanning will email you if it detects a common secret pattern.

### EmailJS now says "The origin is not allowed"

Phase 6. Add the new Cloudflare Pages URL to EmailJS allowed origins.

### I accidentally pushed `backend/.venv/` or `node_modules/` and the repo is huge

```powershell
git rm -rf --cached backend/.venv node_modules
git add .gitignore
git commit -m "remove venv and node_modules from tracking"
git push
```

Then Cloudflare will redeploy and ignore those folders on subsequent pushes.

### How do I know which deploy is currently live?

Cloudflare Pages → your project → **Deployments** tab. The one labelled **Current production** is live.

### How do I roll back to a previous deploy?

Same dashboard → **Deployments** → find the prior deploy → click `…` menu → **Rollback to this deployment**. Live in ~10 seconds.

---

## Summary checklist

After completing this runbook, you should have:

- [ ] A private GitHub repo with your project files.
- [ ] A `.gitignore` that excludes `.env`, secrets, virtual envs, node_modules, build outputs.
- [ ] A Cloudflare Pages project connected to that GitHub repo.
- [ ] Production branch set to `main`.
- [ ] Empty build command + empty build output (static site).
- [ ] Verified a `git push` auto-deploys within 60 seconds.
- [ ] EmailJS allowed origins updated to include the new Cloudflare URL.
- [ ] (Optional) Custom domain added.

From this point on, the daily workflow is just `git add . && git commit && git push`. Cloudflare handles the rest, for free, forever.

— Runbook v1.0 · last updated 2026-05-21
