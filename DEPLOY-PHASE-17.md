# Phase 17 · Operations dashboard rebuild

**Date:** 2026-05-21
**Shippable end-state:** ✓ Live KPI tiles, sparklines, incidents, batches, FinOps signals, Nishi-initiated entry points.

## What ships

Full rewrite of `operations.html` with the post-go-live runtime view:

### KPI tiles (top row)

Four live KPI tiles with inline SVG sparklines. Each tile colour-codes itself by status (green / orange / red) and shows:

- **MTTR** — Mean time to recovery · target < 25 min · trending downward.
- **SLO burn rate** — Payments SLO · target < 5% / month.
- **Batch SLA** — End-of-day batch success rate · target > 99.5%.
- **Transaction success** — Authorisation success rate · target > 99.95%.

Each tile has a 168-point sparkline (default 7-day window). Click any tile → drilldown stub toast.

### Period selector

`24 hr / 7d / 30d / 90d` buttons regenerate sample data at the appropriate resolution (24 → 2160 samples).

### Recent incidents (left column, 2-up grid)

5 sample P1/P2/P3 incidents with module · status · timestamp. P1 in red, P2 orange, P3 blue.

### FinOps signals (right column, 2-up grid)

3 cost-anomaly cards driven by the shared `assets/pricing.js` library:

- 🟠 **+$14,200/mo** — Cards · AWS RDS class upsized last week.
- 🔴 **+$8,400/mo** — Core Payments · cross-region egress spiked from 0.8 TB to 4.2 TB.
- 🟢 **-$22,800/mo** — 3-year Savings Plan kicking in.

Each has an "investigate / open report" CTA.

### Overnight batches

Sortable table of last night's batches with start time, duration, SLA target, and status pill (OK / WARN / FAIL).

### Nishi-initiated entry (Phase 19 prelude)

A dark navy panel at the bottom with 6 quick prompts:

- *"Show last week's batch failures"*
- *"Why did AWS RDS spike 14%?"*
- *"Forecast tonight's EOD batches"*
- *"Are SLOs trending in or out?"*
- *"Top 3 modules by incident count this month"*
- *"Forecast Q3 cloud bill"*

Clicking any chip:
1. Stashes the prompt in `sessionStorage.di_nishi_prompt`
2. Shows a "Opening Nishi…" toast
3. Redirects to `/nishi-chatbot?from=operations&q=<prompt>`

In Phase 19, Nishi will read `q` and auto-respond. For now, the chip arrives at the chat with the prompt pre-filled.

## Sample fixtures

Operations uses `genSeries(n, base, jitter, trend)` to generate realistic-looking time series client-side. This means:

- No backend dependency — works offline.
- Re-renders fresh every page load (small random variation).
- Replace `KPIS`, `INCIDENTS`, `BATCHES` arrays with real data fetched from a Worker in Phase 17.3+.

## Files changed

```
operations.html        full rewrite (KPI tiles · sparklines · incidents · FinOps · batches · Nishi chips)
DEPLOY-PHASE-17.md     this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open `/operations` from the top bar or Home tile | Light theme, 4 KPI tiles with sparklines |
| 2 | Period buttons (24 hr / 7d / 30d / 90d) | Sparklines regenerate at different densities |
| 3 | Click a KPI tile | Drilldown toast |
| 4 | Recent incidents list shows 5 items with sev pills | ✓ |
| 5 | FinOps card has 3 alerts (one red, one orange, one green) | ✓ |
| 6 | Overnight batch table renders with status pills | ✓ |
| 7 | Click any Nishi chip | Toast + redirect to `/nishi-chatbot?from=operations&q=...` |

## Known follow-ups

- **Phase 17.3** — Real metrics ingestion via Cloudflare Worker + Datadog / Grafana / CloudWatch.
- **Phase 17.4** — Per-incident detail page with timeline + RCA notes.
- **Phase 19** — Nishi reads `q` URL param + `di_nishi_prompt` session value and auto-responds with the operations chip context.

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 17 · Operations rebuild (KPI tiles + FinOps + Nishi chips)"
git push
```

Auto-deploys in ~60 sec.
