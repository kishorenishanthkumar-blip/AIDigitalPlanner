# Phase 12 — Login UX Overhaul · Deploy Notes

**Build:** Phase 12 — single-card auth flow, toast notifications, real OTP (hidden), professional polish
**Date:** 2026-05-20
**Author:** Nishanth Kumar Kishore (Digital Infotech)

---

## Phase 12.1 patch — multi-country mobile (IN · US · CA)

The fixed `+91` ISD prefix is replaced with a flag-aware dropdown:

| Flag | ISD | Country | Format hint            |
|------|-----|---------|------------------------|
| 🇮🇳   | +91 | India   | `98765 43210`          |
| 🇺🇸   | +1  | USA     | `(415) 555-0123`       |
| 🇨🇦   | +1  | Canada  | `(416) 555-0123`       |

### What changed
- `acc-cc` is now a `<select>` instead of a fixed text input. Each option carries `data-country` (IN / US / CA) and `data-placeholder` so the mobile field's placeholder updates the moment a country is picked.
- New helpers `getMobileCountry()`, `validateMobile(country, raw)`, `formatMobile(country, digits)` and `updateMobilePlaceholder()` live alongside the toast helpers.
- `doCreateAccount()` now validates per country:
  - **India** — 10 digits, must start with 6 / 7 / 8 / 9.
  - **USA / Canada** (NANP) — 10 digits, area code 2-9, exchange 2-9. A leading `1` (E.164) is tolerated and stripped.
- The OTP banner target line is built from the *selected* country code + a country-appropriate format (e.g. `+1 (415) 555-0123` instead of `+91 415 5550 123`).
- `mobileE164`, `mobileCountry` and `mobileCountryCode` are now stored on the saved profile, alongside an `region` field that auto-flips to `North America` for US / CA and `APAC — South Asia` for IN.
- Switching country wipes any half-typed previous-country digits so a US-formatted number never gets sent with a `+91` prefix.

### Verification
- 14/14 phone-validation unit cases pass (IN good / bad, US good / bad, leading-1 tolerated, CA good / bad).
- 61/61 questionnaire engine tests still pass.

### Toast example
> ✉ Account created — A 6-digit verification code was sent to `+1 (415) 555-0123`. It expires in 45 seconds.

---

## Phase 12.2 patch — Wider Create Account form · split name · 18+ check

User feedback: the Create Account card was a tall narrow column, the Full Name field scrolled out of view, and there was no age confirmation.

### Layout
- The **Create Account** card now expands to **780 px** with a 2-column responsive grid (`form-grid`). The other steps (Sign In, Verify) stay at the narrow 440 px width.
- Section headers (`Personal Information`, `Create Password`, `Company Information`) now stretch the full grid width with a hairline divider.
- On narrow viewports (< 680 px) the grid collapses back to a single column automatically.

### Form fields
- `Full Name` was split into **First Name** and **Last Name** (`acc-fname`, `acc-lname`) — required, autocomplete-friendly (`given-name` / `family-name`).
- Email + Mobile share a row.
- Password + Confirm Password share a row, each with strength meter / match indicator.
- Role select + chips remain full-width.
- Company Name + Company Type share a row.

### Age confirmation (NEW)
- A new checkbox `acc-age` sits at the top of the consent block:
  > ☐ I confirm I am **18 years or older** and legally able to use this platform.
- `doCreateAccount()` blocks submission with a warn toast if it is unchecked.
- The saved profile now carries `ageConfirmed: true`, `termsAccepted: true`, `privacyAccepted: true`.

### Scroll fix
- The earlier `scrollIntoView({block:'start'})` landed mid-card on some viewports, hiding the top form field. Replaced with an explicit `loginScreen.scrollTo({top:0})` so the title + stepper + first field are always visible at the top.
- After the slide-in animation completes, the first input of the new step is auto-focused (`{preventScroll:true}` so it doesn't undo the scroll).

### Navigation
- Step 2 now has a **← Back** button alongside the primary CTA.
- Primary CTA renamed to **"Create Account & Send OTP"** so the next step is obvious.
- Terms-of-Use and Privacy-Policy links now open a toast (`terms` / `privacy` keys) instead of dead `#` anchors.

### Verification
- 61/61 questionnaire engine tests still pass.
- Manual checks: form renders 2-col at ≥ 720 px, 1-col below 680 px, Name fields visible at top, age check blocks submit when unticked.

---

## Phase 12.3 patch — Real email OTP via EmailJS (Mobile stays in demo mode)

The user was no longer able to find the OTP after Phase 12 hid the demo banner. We now ship a $0 hybrid:

| Channel | Delivery | Code visibility |
|---------|----------|-----------------|
| **Email** (default) | Real — sent to the user's inbox via **EmailJS** (Gmail-backed) | Hidden from screen; user reads it from their inbox |
| **Mobile** (demo)   | None — no live SMS gateway yet                              | Shown on-screen in a yellow "🧪 Demo Mode · SMS" banner |

### Config (`EMAILJS_CFG`)
```js
publicKey:  '-6Sg-7zDl7hqsjjqd'
serviceId:  'service_rfm1yug'
templateId: 'template_19bnwhf'
toVar:      'to_email'
```
The public key is browser-safe; EmailJS restricts it to the allowed origins set on your EmailJS dashboard. Add `https://heroic-twilight-686b78.netlify.app` (and your custom domain) to **Account → Security → Allowed Origins** so production calls don't get blocked.

### What changed
- EmailJS browser SDK loaded from `cdn.jsdelivr.net/npm/@emailjs/browser@4`. Initialised once on `DOMContentLoaded`.
- New `sendEmailOtp(toEmail, code, opts)` returns a Promise resolving on success. It sends a kitchen-sink param object so any reasonable template variable name resolves (`to_email`, `email`, `user_email`, `otp_code`, `code`, `passcode`, `user_name`, `to_name`, `expires_in`, `app_name`, `from_name`, `year`).
- New `deliverOtp(scope, kind, target, profile)` dispatcher:
  - `kind === 'email'` → calls EmailJS, shows "Sending email…" toast → success toast → on failure, **falls back to demo mode** and tells the user.
  - `kind === 'mobile'` → shows on-screen banner with the code + a "Demo SMS mode" toast.
- `otpTab()` / `mfaTab()` toggle the demo banner visibility and call `deliverOtp()` each time the channel is switched.
- `doCreateAccount()` now defaults to Email channel and sends a real email via EmailJS as soon as the user lands on Step 3. If the EmailJS call throws (e.g. quota exceeded, origin blocked), it auto-flips back to Mobile demo mode so the flow never breaks.
- `resendOtp()` honours the currently-active channel.

### Template tips
Inside your EmailJS template (`template_19bnwhf`), the body can use any of:

```
Hi {{user_name}},

Your {{app_name}} verification code is:

    {{otp_code}}

It expires in {{expires_in}}. If you didn't request this, ignore this email.

— Digital Infotech
```

And in the template settings:
- **To email:** `{{to_email}}`
- **From name:** `Digital Infotech Platform`
- **Reply-to:** your support address

### Manual QA (post-redeploy)
1. Hard-refresh the live URL.
2. Sign up with **your own real Gmail address** and a valid number.
3. On Step 3 you should see:
   - "Sending email…" toast → ~2 seconds later "Check your inbox" toast.
   - The OTP demo banner is **hidden** (no code on screen).
4. Check your Gmail inbox for the OTP (also check Spam the first time — EmailJS sometimes lands there). Enter it → Verify → app loads.
5. Switch to **Mobile OTP** tab — the yellow banner now appears showing a fresh demo code; verify with that.
6. If EmailJS is rate-limited (200/month on free tier), the flow auto-falls back to demo mode with a warn toast.

### Cost
$0 up to 200 emails/month. After that EmailJS bills $0.0005-0.001/email depending on plan — far cheaper than SMS.

---

## Phase 12.4 patch — Persistent user accounts (sign-up survives reload)

User feedback: after creating a new account and signing back in later, the system said *Invalid credentials*. Root cause: account profile was only written to `sessionStorage` (which dies with the tab), and `doLogin` only checked the hardcoded demo `USERS` list.

### What changed
A simple client-side user store now persists every signed-up account in `localStorage` under the key `di_users_v1`.

- **Password is never stored in plaintext.** It's hashed with SHA-256 + a salt prefix (`di-platform-v1::`) via Web Crypto API before being written. On older browsers without Web Crypto, a deterministic fallback hash is used.
- **`persistAccount(profile, plainPwd)`** is called inside `doCreateAccount()` right after profile validation succeeds. It stores: `username` (email local-part), `email`, `mobile`, `mobileE164`, `name`, `firstName`, `lastName`, `role`, `roles`, `region`, `company`, `companyType`, `initials`, `passwordHash`, `createdAt`, `lastSignInAt`.
- **`findSavedUser(identifier)`** matches by username **or** email (case-insensitive) **or** mobile number, so sign-in works regardless of which one the user types.
- **`doLogin()`** is now async and runs two checks in order:
  1. Hardcoded demo `USERS` (`nishanth.kishore` / `admin`).
  2. `findSavedUser()` against `localStorage`, verifying via `verifyPassword()` (SHA-256 comparison).
- **`doMfaSignIn()`** also consults the saved user store before falling back to the session profile.

### Storage layout
```json
{
  "di_users_v1": [
    {
      "username": "kishorenishanthkumar",
      "email": "kishorenishanthkumar@gmail.com",
      "mobile": "+91 98765 43210",
      "mobileE164": "+919876543210",
      "name": "Nishanth Kumar Kishore",
      "role": "CTO",
      "passwordHash": "<sha256(di-platform-v1::password)>",
      "createdAt": "2026-05-20T...",
      "lastSignInAt": "2026-05-20T..."
    }
  ]
}
```

### Security note
This is still a **client-side demo store**. The hash is local to the browser. In production:
- accounts would be created via a backend POST,
- the password would be hashed with bcrypt/argon2 server-side over TLS,
- the localStorage layer would be replaced with a session cookie / JWT.

The current scheme is *good enough* to enable repeat sign-ins for demo and pilot purposes without ever writing the plaintext password to disk.

### Manual QA
1. Sign up with a fresh email — complete the OTP step → land in the app.
2. Sign out (top right).
3. Sign in with the *same* email + password → should succeed and toast `Welcome back, …`.
4. Close the tab, reopen the deployed URL → sign in again → still works.
5. Open DevTools → Application → Local Storage → confirm `di_users_v1` exists; confirm the `passwordHash` is a 64-char hex string (not the plaintext).

---

## What changed in this release

### Layout
- The four step cards are no longer rendered side-by-side. Only the **active** step is visible; the other steps fade in from the bottom when navigated to.
- The `.step-grid` is now a centered single column (max-width 440 px) so the auth card behaves like a real product login (Stripe / Linear / Notion class).
- The header row was replaced with a single rounded brand pill (`DI` logo + "Digital Infotech Platform" + tagline).
- The stepper now shows **three** steps — Sign In · Create Account · Verify. The legacy "Multi-Auth Sign In" step is retired (the verification step now signs new accounts in directly).
- Font sizes were reduced one more notch across labels, inputs, OTP boxes, tabs, footer items.

### Notifications
- Added a top-right **toast notification system** (`.toast-host` + `showToast()`):
  - Variants: `info`, `ok`, `warn`, `err`.
  - Auto-dismiss (default 4.5 s) and manual close (×).
  - Used by Sign-in success/failure, validation errors, OTP delivery, SSO placeholders, password-reset link, account-creation success.

### OTP — production-grade behaviour
- The yellow "Demo OTP" banner is **hidden** (`display:none !important`). The code is no longer printed on screen.
- The code is generated client-side as a random 6-digit string and held in `otpState.v.code` / `otpState.m.code` only.
- When the user lands on Step 3 (or switches Mobile/Email tabs in Step 3/4), a toast pops up:
  `OTP sent — A 6-digit code was sent to +91 98765 43210. It expires in 45 seconds.`
- Resend re-generates the code, restarts the 45 s countdown, and fires a new toast.
- An invalid OTP clears the boxes and shows an error toast instead of an `alert()` revealing the expected code.
- Mobile / Email channel selector is functional — the chosen channel updates the target shown in the OTP info card and re-issues the OTP.

### Sign-in
- Failed sign-in now (a) shows the inline red error, (b) **resets the password field back to masked** (`type=password`), (c) resets the eye icon, and (d) fires an error toast. This fixes the QA-reported inconsistency.
- Successful sign-in fires an "ok" toast: `Welcome back — Signed in as Nishanth Kumar Kishore.`

### SSO / Social
- `🛡 SSO / Enterprise Login`, `Google`, and `Microsoft` buttons no longer trigger `alert()`s.
- They open a clean toast: `Enterprise SSO (SAML / OAuth / LDAP) connects in Phase 9. Use email + password for now.` — and analogous toasts for Google / Microsoft Entra ID.
- `Forgot Password?` (Step 1 link) opens a toast describing the reset link.

### Password visibility
- The Sign-in password field now has the same 👁/🙈 eye toggle that Create Account uses.
- `gotoStep()` resets all four password fields (`ip`, `acc-pwd`, `acc-pwd2`, `m-ip`) back to `type=password` whenever the user moves between steps, so the unmasked state never leaks.

### Account creation
- All inline `alert()` validations were replaced with field-aware toasts (`warn` / `err`).
- Added email regex validation up-front so the wrong field can be focused.
- On success, fires an "ok" toast: `Account created — A 6-digit verification code was sent to +91 98765 43210. It expires in 45 seconds.`

### New-account → app flow
- After Step 3 OTP verifies, the legacy Step 4 (Multi-Auth Sign In) card is **skipped**. `doVerify()` now constructs a user object from the saved profile and calls `finalizeLogin()` directly, which is how a real product would behave.

---

## Files changed

```
index.html      # Login flow CSS + HTML + JS (Steps 1–3, toasts, SSO handlers, OTP toasts)
DEPLOY-PHASE-12.md   # this file
```

No backend / engine / questionnaire pack changes. All 61 questionnaire tests still pass:

```
══════════════════════════════════════════
  61 passed · 0 failed
══════════════════════════════════════════
```

---

## Manual QA checklist (run after deploy)

1. **Open the deployed URL.** Only the Sign In card should be visible; the other steps hidden until clicked.
2. **Type wrong credentials → click Sign In.** Inline red error appears, password field auto-masks, eye icon resets to 👁, top-right red toast appears.
3. **Type wrong credentials, click 👁, click Sign In again.** Password should re-mask automatically.
4. **Click "Create an account".** Step 2 slides in (Step 1 hidden). Header pill remains.
5. **Submit Step 2 without name / email / password.** Each missing field surfaces a yellow toast in turn.
6. **Submit valid Step 2 details.** Toast: `Account created — A 6-digit verification code was sent to …`. Step 3 slides in. The yellow "Demo OTP" banner is **not** rendered.
7. **Switch Mobile / Email tabs in Step 3.** A new toast appears each time; the OTP target line updates.
8. **Click Resend.** Countdown restarts at 00:45, new toast appears.
9. **Type wrong 6-digit OTP, click Verify.** Red toast: `Incorrect OTP …`. Boxes clear, focus returns to box 1.
10. **Type the *correct* OTP** (see browser console: `otpState.v.code`) **→ Verify.** Green toast: `Identity verified — Signing you in now…`. App shell loads. Step 4 card is never shown.
11. **Click Sign In tab in Step 1 → click "SSO / Enterprise Login".** Toast: `Enterprise SSO …`. No browser alert dialog.
12. **Click "Google" / "Microsoft".** Each opens its own toast.
13. **Click "Forgot Password?"** Toast: `Reset password — A password reset link will be sent …`.

---

## Deploy steps (Netlify)

The repo is already wired to Netlify via Git. Just commit + push:

```
git add index.html DEPLOY-PHASE-12.md
git commit -m "Phase 12 — single-card auth flow, toast notifications, hidden OTP, professional polish"
git push
```

Netlify auto-builds on push. No environment variables, no `requirements.txt` changes, no backend touched.

If you prefer drag-and-drop:
1. Zip the project root (excluding `backend/`, `.git/`, `.venv/`, `__pycache__/`).
2. Drop the zip onto Netlify → Deploys.

---

## Known follow-ups (Phase 13 candidates)

- Wire `Forgot Password` to a real reset endpoint.
- Replace the random client-side OTP with a server-issued OTP (Twilio Verify or AWS SNS).
- Wire the SSO buttons to actual identity providers (SAML / OAuth IdP).
- Add rate-limiting + CAPTCHA on `doLogin` (after N failures).
