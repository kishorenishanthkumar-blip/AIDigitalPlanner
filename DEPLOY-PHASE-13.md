# Phase 13 — Light theme + Nishi-first landing + Home dashboard

**Build:** Phase 13 — UI rebuild
**Date:** 2026-05-21

## What ships in this phase

1. **EmailJS error diagnostics** — `sendEmailOtp()` now logs to console with `[EmailJS]` tags, sends a maximalist parameter set (covers `to_email`, `email`, `user_email`, `recipient`, `otp_code`, `code`, `passcode`, `verification_code`, `otp`, etc.) so any reasonable template variable name resolves, and the catch blocks surface the **actual EmailJS error text** in the toast instead of a generic message.
2. **Create Account overflow fix** — `min-width: 0` on grid children + narrower country select (118 px) + ellipsis on the mobile input.
3. **Discovery → Discovery Studio** rename in user-facing tabs.
4. **Light-theme conversion** — `:root` palette flipped to light values in `index.html` and `nishi-chatbot.html`. Gold accent retained.
5. **`home.html`** — new tile dashboard with hero greeting, Continue card, 6 feature tiles (Discovery Studio, Architecture Studio, Program Governance, RFP Questionnaire, Operations, Nishi), spotlight strip, persistent top bar, persistent Nishi dock with contextual tip.
6. **Nishi-first landing** — `finalizeLogin()` now redirects to `nishi-chatbot.html?from=login` instead of staying in the legacy post-login app shell.
7. **Nishi chat top bar updated** — primary 🏠 Home button + reordered links (Discovery Studio, Architecture, Governance, RFP, Operations).
8. **Persistent Nishi dock** — new `assets/nishi-dock.js` mounts a floating 🤖 button (with one-time tip toast) on `discovery-studio.html`, `architecture-studio.html`, `program-governance.html`, and `questionnaire.html`.

61/61 questionnaire engine tests still pass.

## ⚠ Why OTP didn't arrive at `kishorenishanthkumar@gmail.com` — checklist to verify

After redeploy, open DevTools (`F12`) → **Console** tab → try the sign-up flow with your Gmail. You will now see one of these log lines:

| Console log | What it means | Fix |
|-------------|---------------|-----|
| `[EmailJS] sending {...}` followed by `[EmailJS] ✓ delivered {status:200, text:'OK'}` | Email was sent. Check your **Spam folder** (first-time senders often land there). | Mark "Not Spam" → future deliveries hit Inbox. |
| `[EmailJS] ✗ send failed ... HTTP 400 — The recipient address is empty` | Template `To Email` field is wrong. | EmailJS dashboard → Email Templates → `template_19bnwhf` → **Settings** → **To Email** must be `{{to_email}}` (not a hardcoded address, not blank). |
| `[EmailJS] ✗ send failed ... HTTP 403 — The origin is not allowed` | Allowed Origins doesn't include the deployed URL. | EmailJS dashboard → Account → Security → Allowed Origins → add `https://<your-netlify-or-pages-url>` and the wildcard subdomain. |
| `[EmailJS] ✗ send failed ... HTTP 412 — Gmail_API: Request had insufficient authentication scopes` | The Gmail OAuth token expired. | EmailJS dashboard → Email Services → your Gmail service → **Reconnect**. |
| `[EmailJS] ✗ send failed ... HTTP 426 — Account quota exceeded` | You've sent 200+ emails this month on the free tier. | Wait for monthly reset, or upgrade. |
| `[EmailJS] ✗ send failed ... HTTP 503` | EmailJS service is degraded. | Wait a few minutes. |
| No `[EmailJS]` log at all | SDK didn't load — adblocker or browser blocked `cdn.jsdelivr.net`. | Try a different browser or disable adblock. |

**The most common cause** for Gmail users not getting EmailJS emails on first try is **the Spam folder**. The very first email from a new EmailJS sender domain almost always lands in Spam. Once you mark "Not Spam" once, subsequent emails go to Inbox. Please check there first.

### Quick EmailJS template sanity check

Log in to https://dashboard.emailjs.com → Email Templates → open `template_19bnwhf`. Confirm:

- **Settings tab:**
  - **To Email:** `{{to_email}}` (exactly — including the double braces)
  - **From Name:** anything (e.g. "Digital Infotech")
  - **Subject:** something like `Your Digital Infotech verification code is {{otp_code}}`
- **Content tab:** template body should reference `{{otp_code}}` at minimum. Example:

      Hi {{user_name}},

      Your Digital Infotech Platform verification code is:

          {{otp_code}}

      It expires in {{expires_in}}.

After fixing the template, click **Save** and **Test** from the EmailJS dashboard itself first (Test tab) — if that test email lands in your inbox, the platform's call will too.

## New file layout

```
DI-Platform Planner/
├─ index.html              # sign-in / sign-up only (now redirects to Nishi after login)
├─ home.html               # NEW — light-theme tile dashboard
├─ nishi-chatbot.html      # NEW first landing after login (light theme)
├─ discovery-studio.html   # + persistent Nishi dock
├─ architecture-studio.html# + persistent Nishi dock
├─ program-governance.html # + persistent Nishi dock
├─ questionnaire.html      # + persistent Nishi dock
├─ rfp-questionnaire.html
├─ operations.html
├─ assets/
│   ├─ nishi.js
│   ├─ nishi-sample-data.json
│   ├─ nishi-dock.js       # NEW shared floating dock
│   ├─ questionnaire-engine.js
│   └─ questionnaire-packs.json
└─ ...
```

## Sign-in flow (post-Phase 13)

```
1. User opens / → index.html (sign-in card, light theme)
2. Signs in / signs up → finalizeLogin() saves profile to sessionStorage
3. Redirect → nishi-chatbot.html?from=login (first landing — light theme)
4. Nishi greets the user with feature chips
5. User picks a chip → Nishi explains the feature → "Open <feature> →" CTA
6. OR user clicks 🏠 Home in the top bar → home.html
7. Home page shows 6 feature tiles + Continue card + persistent Nishi dock
8. On any feature page, the floating 🤖 Nishi button (bottom-right) is always visible
```

## Manual QA after redeploy

1. Hard-refresh deployed URL.
2. Sign in with the demo account `nishanth.kishore` / `DI@2026!`.
3. You should land on **Nishi chat page** (not the old dark app shell).
4. Top bar has 🏠 Home button (gold).
5. Click 🏠 Home → see the new **light-theme tile dashboard**.
6. Hero greeting shows "Good <morning/afternoon/evening>, Nishanth".
7. Click any tile → opens the feature page in light theme (Discovery Studio etc.).
8. On any feature page, the floating 🤖 Nishi button is visible at bottom-right with a one-time tip.
9. Click 🤖 → returns to Nishi chat.
10. Try sign-up with `kishorenishanthkumar@gmail.com` — open DevTools Console first to watch the `[EmailJS]` logs and diagnose any delivery error.

## Known follow-ups (Phase 14)

- Light-theme conversion of `architecture-studio.html`, `program-governance.html`, `questionnaire.html`, `operations.html` (their `:root` variables are still dark — they will look themselves until converted).
- ⌘K command palette overlay (currently the button is a stub).
- Skeleton loaders.
- Pinned tiles (★) with localStorage.
- Notification feed for the 🔔 bell.

## Redeploy

Same PowerShell zip command:

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
Write-Host "[OK] $out"
```

Drop the zip on Netlify (or Cloudflare Pages — see `CLOUDFLARE-PAGES-MIGRATION.md`).
