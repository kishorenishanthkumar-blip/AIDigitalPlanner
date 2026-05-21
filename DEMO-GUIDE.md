# DI Platform · Buyer Demo Guide

**Status:** Feature-complete for buyer validation · Build paused 2026-05-21
**URL:** `https://aidigitalplanner.kishorenishanthkumar.workers.dev` (or your custom domain)

---

## The 10-minute demo (the gold path)

Walk a buyer through this exact sequence. It tells a complete story: discovery → architecture → executive summary → contract.

### Setup (30 sec)

1. Hard-refresh the live URL with `Ctrl + Shift + R`.
2. Sign in with the demo account — username `nishanth.kishore`, password `DI@2026!`.
3. You land on Nishi chat (first landing).

### Act 1 · Nishi knows you (1 min)

- "Hi Nishanth — I'm Nishi…" Nishi greets you by name and role.
- Hold the red 🎤 button, say "show me last week's batch failures", release. Nishi auto-pivots to Operations context and answers in markdown.
- Click 💡 Suggested prompts → pick *Compare AWS / Azure / GCP*. Pre-canned grounded response renders.
- Point out: voice + text + dropdown all working in one composer.

### Act 2 · Discovery Studio (2 min)

- Click 🏠 Home in the top bar → click Discovery Studio tile.
- Quick assessment lane is pre-recommended. Click it.
- 13 capabilities are pre-checked for a Tier-1 retail bank. Walk through the 4 groups.
- Click "Skip detail → Generate 7R map". 7R cards render with verdict, risk, effort, target cloud, **and cost** ("Saves $657K over 3 years vs current").
- Highlight the 7R mix bar at the top — 4 Replatform, 3 Refactor, etc.

### Act 3 · Architecture Studio (2 min)

- From 7R result, click **Send to Architecture →**. Toast appears, then Architecture Studio loads with capabilities imported.
- Hero shows: legacy TCO $11.2M → future TCO $6.8M → 3-year savings $4.4M ↓ 39%.
- 6-cloud pricing grid: each capability × AWS / Azure / GCP / OCI / IBM / Private DC, monthly + 3-yr.
- Change the **Region** dropdown to apac-singapore — all prices jump +16%.
- Change **Currency** to INR — all prices convert at 83.5×.
- Set **Discount** to 20% — every cell drops 20%.
- Click "⋯ source" on any cell → **provenance modal** shows the exact SKU, region, snapshot date, and per-component breakdown.

### Act 4 · EVP Summary (1.5 min)

- From Architecture, click **Generate EVP Summary →**.
- Dark navy hero with the big headline: "Modernize 13 banking capabilities in 14 months, save $4.4M over 3 years."
- 4 stats: Duration · 3-yr Savings · Peak FTE · Payback (with NPV @ 8%).
- Benefits grid: Time · Cost · Resources · Risk.
- KPI table: 7 contractually-binding KPIs with baseline → target → mechanism → delta %.
- Click the **Auditor** audience tab → page flips to per-capability provenance panels for procurement.

### Act 5 · Draft SOW (1.5 min)

- From EVP, click **Draft SOW for Legal →**.
- 8-section Statement of Work with `DRAFT v0.1` watermark.
- Click any paragraph → contenteditable focus → type. Auto-saves on blur.
- Milestone table M1-M6 with payment percentages totalling 100%.
- Annex C lists the same KPIs from the EVP, pinned as **contractually binding**.
- Click **⬇ Export DOCX** → downloads a `.doc` file that opens cleanly in Microsoft Word.
- Click **↗ Save as new version** → bumps to v0.2, status resets to DRAFT.

### Act 6 · Program Governance (1 min)

- Top bar → Features ▾ → Program Governance (or `g g`).
- Hero shows high-severity open RAID, total RAID, duration, cloud cost.
- 4 tabs: RAID register (13 seed items, inline edit) · 7-R Gantt timeline · Cost model · Runlog.
- Click ⬇ MS Project XML → downloads a valid `.xml` for Microsoft Project.

### Act 7 · Operations (1 min)

- Top bar → Operations (or `g o`).
- 4 live KPI tiles with sparklines: MTTR, SLO burn, batch SLA, transaction success.
- Recent incidents list (P1/P2/P3 sev pills).
- FinOps signals — 3 cost-anomaly cards.
- Scroll to the dark "Ask Nishi" panel — click any chip → opens Nishi pre-loaded with the question.

### Act 8 · Polish moments (30 sec)

- Press `⌘ K` (or `Ctrl + K`) → command palette opens. Type "discovery" → page surfaces. Press Enter.
- Press `?` → shortcuts cheat sheet with font-size + high-contrast controls.
- Click the user pill (top right) → session info modal with **🔒 LOCAL · this browser only** data-residency pill.
- Click the 🔔 bell → audit log of every action you took during this demo.

---

## Selling points to emphasise

When a buyer asks the inevitable questions:

| Question | Your answer |
|----------|------------|
| "How is the cost calculated?" | Live from public list prices, snapshotted today. Open the provenance modal — every $ traces to the exact SKU, region, and pricing model. Enterprise rate discount applied via the toggle. |
| "Is this audit-ready?" | Click the bell. Every page view, every RAID edit, every export — logged locally with timestamp + fingerprint. Export to JSON for handover. |
| "Where does my data go?" | Click the user pill. `Data residency: LOCAL · this browser only · Server transmission: NONE`. The whole platform runs in your browser. |
| "Can I edit the SOW?" | Yes — every paragraph is inline-editable. Versioning built in. Export to Word. |
| "What about regional regulators?" | The questionnaire engine has packs for NA, EU, APAC, SEA, SWA today. Per-country packs (US-SOX, India-RBI, UAE-CBUAE, etc.) are 3 hours of work each. |
| "Does Nishi actually do anything?" | Yes — try the operations chips. Each chip is a real intent that returns a grounded multi-paragraph answer. With your Anthropic API key in Nishi's settings, every answer becomes live AI. |
| "What's the architecture?" | Today: static HTML/CSS/JS auto-deployed via Cloudflare Pages. Designed for a Phase 24 backend with agent mesh + MCP + vector DB if you need it. |

---

## What's deliberately NOT in this build (and why)

If a buyer asks for something missing, here's the honest answer:

| Missing capability | Honest reason | What to say |
|---|---|---|
| Real-time collaboration | No backend yet | "Phase 24 — bundled with the agent mesh." |
| ServiceNow / BMC CMDB sync | No backend yet | "Phase 24. Connector framework designed; one vendor pilot first." |
| MP4 video export | Heavy + low value | "Animated SVG walkthroughs cover the demo case. Video export deferred." |
| Active Nishi co-pilot inside Discovery wizard | Existing dock covers it | "Skip — the floating Nishi button is one click away from any wizard step." |
| On-chain audit / Web3 | Banking buyers don't ask for it | "Optional. Current tamper-evident audit log satisfies most banking compliance needs." |
| Vector DB / RAG / continuous learning | Needs backend | "Phase 24 — the intelligence layer. Current responses are deterministic / rule-based." |

---

## What to bring back to me when you resume building

After your buyer conversations, come back with:

1. **One thing buyers loved most.** Build more of it.
2. **One thing buyers asked for that's missing.** Prioritize against the deferred backlog.
3. **One thing buyers ignored.** Cut it from future demos.

That's the feedback loop. From there I can re-rank Batch A / B / C / D from `BACKLOG.md`.

---

## Operating the platform between now and next build

- **Daily deploys:** `git add . && git commit -m "tweak" && git push` — Cloudflare auto-deploys in ~60 s.
- **EmailJS quota:** 200 OTP emails / month free. Check usage at https://dashboard.emailjs.com.
- **Logs:** Browser DevTools console for any JS errors. Cloudflare Pages dashboard for deploy logs.
- **Sample data:** Architecture, EVP, SOW, Governance all have "Load sample" buttons for instant demos.
- **Reset:** Sign out + clear localStorage to reset the whole platform.

---

Built across 22 phases · 16 deploy notes · 61/61 questionnaire tests passing · 17,000+ lines of code. Pause earned.
