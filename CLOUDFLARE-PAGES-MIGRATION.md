# DI Platform — Cloudflare Pages Migration Runbook

**Goal:** move the DI Platform from `*.netlify.app` to `*.pages.dev` with zero downtime, zero code changes, and zero cost.
**Estimated time:** 25 minutes end-to-end.
**Author:** Nishanth Kumar Kishore — Digital Infotech.

---

## 0 · Pre-flight checklist (3 min)

Confirm these are true before you start:

- [ ] You have a Google account or email + password ready for Cloudflare signup.
- [ ] `C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner\` is up-to-date (the Phase 12.4 code with EmailJS + persistent accounts).
- [ ] You can sign in to your EmailJS dashboard.
- [ ] You know your current Netlify URL (e.g. `https://heroic-twilight-686b78.netlify.app`).

---

## 1 · Build the deploy zip (2 min)

Open PowerShell (`Win + X → Terminal`) and paste:

```powershell
$src  = "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
$out  = "$env:USERPROFILE\Downloads\di-platform-planner.zip"
$stg  = "$env:TEMP\di-platform-stage"
if (Test-Path $stg) { Remove-Item $stg -Recurse -Force }
if (Test-Path $out) { Remove-Item $out -Force }
$exclude = @('backend','.git','.venv','__pycache__','node_modules','.vscode','.pytest_cache','.idea','dist','build')
Get-ChildItem -Path $src -Force | Where-Object { $exclude -notcontains $_.Name } |
  ForEach-Object { Copy-Item $_.FullName -Destination $stg -Recurse -Force }
Get-ChildItem $stg -Recurse -Force -Directory -Filter '__pycache__' -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Compress-Archive -Path "$stg\*" -DestinationPath $out -Force
Remove-Item $stg -Recurse -Force
Write-Host "[OK] Zip ready at: $out"
```

Expected output:

```
[OK] Zip ready at: C:\Users\nisha\Downloads\di-platform-planner.zip
```

---

## 2 · Create a Cloudflare account (3 min)

1. Open https://dash.cloudflare.com/sign-up in your browser.
2. Sign up with your Google account or email + password.
3. Verify your email if Cloudflare sends a confirmation link.
4. When you land on the dashboard, **skip** any "add a website" / domain prompts — for now you don't need a custom domain.

---

## 3 · Create the Pages project (3 min)

1. In the left sidebar click **Compute (Workers & Pages)** → **Pages** tab.

   *(Older layout: "Workers & Pages" at the top of the sidebar → "Pages" tab.)*

2. Click **Create application** → **Pages** tab → **Upload assets**.
3. **Project name:** `di-platform-planner`

   Cloudflare validates the name — only lowercase letters, numbers, and hyphens.
   This becomes your URL: `https://di-platform-planner.pages.dev`.

4. Click **Create project**.

---

## 4 · Upload your zip (1 min)

1. On the next screen you'll see a big dashed drop zone labelled *"Drag and drop the files you want to deploy."*
2. Open File Explorer to `C:\Users\nisha\Downloads`.
3. Drag `di-platform-planner.zip` onto the drop zone.

   *(You can also click **select from computer** and pick the zip.)*

4. Cloudflare uploads (~5 seconds for ~1 MB) and shows a "Deploying" spinner.
5. ~30 seconds later you'll see **Success! Your project is deployed.**
6. Click **Continue to project** → click the live URL `https://di-platform-planner.pages.dev`.

---

## 5 · Update EmailJS allowed origins (5 min)

EmailJS only allows the public key to be used from origins you whitelist. Without this, OTP emails will silently fail when the site is opened from the new URL.

1. Open https://dashboard.emailjs.com and sign in.
2. Go to **Account → Security**.
3. Under **Allowed Origins**, click **Add origin** and add each of these:

   ```
   https://di-platform-planner.pages.dev
   https://*.di-platform-planner.pages.dev
   ```

   (The wildcard catches preview deploys like `https://abc123.di-platform-planner.pages.dev`.)

4. **Keep** the existing Netlify origin (`https://heroic-twilight-686b78.netlify.app`) for now — you can remove it later once Netlify is decommissioned.
5. Click **Save**.

---

## 6 · Smoke test (8 min)

Run through this checklist on the new `https://di-platform-planner.pages.dev`:

| # | Test | Expected |
|---|------|----------|
| 1 | Hard-refresh (`Ctrl + Shift + R`). Sign-in screen loads. | Light theme, brand pill, 3 visible steps. |
| 2 | Try wrong credentials. | Red inline error + red toast. Password re-masks. |
| 3 | Sign in with the demo account `nishanth.kishore` / `DI@2026!`. | Lands in the app. |
| 4 | Sign out (top-right). | Returns to sign-in. |
| 5 | Click **Create Account**. | Step 2 card slides in. |
| 6 | Fill in First Name + Last Name + your real Gmail + Indian mobile + a strong password + role + tick all 3 checkboxes. | All fields visible at all viewport widths down to 720 px. |
| 7 | Submit. | "Sending email…" toast → ~2 s later "Check your inbox" toast. |
| 8 | Check Gmail (and Spam first time). | OTP email arrives within 30 seconds. |
| 9 | Enter the OTP → Verify. | Green toast, app loads. |
| 10 | Sign out. Sign in again with the new email + password. | Welcome-back toast. Account persists across sign-outs. |
| 11 | Open DevTools → Application → Local Storage. | `di_users_v1` shows your account; `passwordHash` is a 64-char hex string (no plaintext). |
| 12 | Open the questionnaire page from the post-login app. | All 88 questions render correctly. |

If any test fails, see the **Troubleshooting** section at the bottom.

---

## 7 · (Optional) Custom domain (5 min)

Only do this if you own a domain (e.g. `diplatform.com`) and want it pointed at the new site.

1. Cloudflare Dashboard → **Compute (Workers & Pages)** → your project → **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter your domain (e.g. `diplatform.com` or `www.diplatform.com`).
4. Cloudflare auto-detects whether your domain is already on Cloudflare DNS:
   - **If yes:** Cloudflare adds the DNS record for you. One click.
   - **If no:** Cloudflare shows you a CNAME record to add at your current DNS provider (GoDaddy, Namecheap, Squarespace, etc.). Copy/paste it into your provider's DNS panel.
5. SSL certificate is provisioned automatically (~ 30 seconds).
6. Add the custom domain to EmailJS allowed origins too.

---

## 8 · (Optional) Auto-deploy from Git (10 min)

Instead of drag-and-drop, you can connect Cloudflare Pages to a GitHub repo and let it auto-deploy on every commit. Skip this if you prefer manual zip uploads.

1. Push your project to a private GitHub repo:
   ```powershell
   cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
   git init
   git remote add origin https://github.com/<your-username>/di-platform-planner.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
   (Skip if you've already done this.)
2. Cloudflare Dashboard → **Workers & Pages** → your project → **Settings** → **Builds & deployments** → **Connect to Git**.
3. Authorise Cloudflare to read your GitHub.
4. Pick the repo.
5. **Build command:** leave blank (static site, no build).
6. **Build output directory:** `/` (root) or leave blank.
7. **Environment variables:** none needed.
8. Save. Cloudflare deploys on every `git push` to `main` automatically.

---

## 9 · Decision — what to do with Netlify

You have three options:

**Option A (recommended): keep Netlify as staging**

- Use Cloudflare Pages as production (the URL you share with users).
- Drag-deploy work-in-progress builds to Netlify first for QA.
- Once validated, drag the same zip to Cloudflare Pages.
- Net effect: you triple your free quota and never hit limits.

**Option B: full decommission**

- Cloudflare Dashboard → your project → confirm everything works on `https://di-platform-planner.pages.dev`.
- Netlify Dashboard → site → **Site configuration** → **General** → **Delete this site**.
- Remove the old Netlify origin from EmailJS allowed origins.
- Any bookmark on `*.netlify.app` will 404 from then on — share the new URL with anyone who needs it.

**Option C: keep both, use a custom domain as canonical**

- Point a custom domain at Cloudflare Pages.
- Anyone on the old Netlify URL still gets the site (until you delete it), but the canonical link is your domain.
- Best for production sites; worth the $10/year domain registration.

---

## 10 · Bookmark the new URL

Share this with your team / stakeholders:

```
https://di-platform-planner.pages.dev
```

---

## Troubleshooting

**OTP email never arrives**

- Open browser DevTools → Console. Look for `EmailJS` errors.
- The most common cause is missing Cloudflare URL in EmailJS allowed origins. Re-check **Account → Security → Allowed Origins**.
- Check Gmail Spam folder the first time — mark "Not spam" and future deliveries land in Inbox.

**Sign-in says "Invalid credentials" for an account that worked on Netlify**

- The persistent user store (`di_users_v1` in localStorage) is **per-domain**. Accounts you created on `*.netlify.app` do NOT carry over to `*.pages.dev`.
- Either (a) re-create the account on the new URL, or (b) export/import the localStorage value (DevTools → Application → Local Storage → copy from Netlify tab, paste into Pages tab).
- The hardcoded demo accounts (`nishanth.kishore` / `admin`) still work everywhere.

**Site shows "Page not found" on a sub-route like `/discovery-studio.html`**

- Confirm the file is at the root of the zip (not nested inside a folder named `di-platform-planner`).
- Cloudflare Pages serves whatever is at the zip's root as the root of the site.

**Cloudflare says "Upload failed: file too large"**

- Cloudflare limit is 25 MB per file and 20,000 files per deploy. Your project is ~1 MB and ~30 files, so this should never trigger.
- If it does, check `__pycache__` or `backend/` didn't sneak into the zip.

**Browser still shows the old version after deploy**

- Service-worker / cache. Hard-refresh: `Ctrl + Shift + R`.
- If still stuck, open DevTools → Application → Service Workers → Unregister, then Clear Storage.

---

## What didn't change

The codebase, the EmailJS account, the localStorage user store, the OTP flow, and the questionnaire engine are all the same. You're swapping the **CDN that serves the static files**, nothing else.

— Runbook v1.0 · last updated 2026-05-21
