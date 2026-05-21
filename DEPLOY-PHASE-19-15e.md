# Phase 19 + 15e.1 · Nishi intent parser + cost-aware Discovery 7R

**Date:** 2026-05-21
**Shippable end-state:** ✓ Operations chips trigger Nishi auto-response · Discovery rationale mentions $ savings.

## What ships

### Phase 19 · Nishi intent parser + auto-response

`nishi-chatbot.html` now reads two signals on every page load and auto-processes them:

1. **`?q=` URL parameter** — used by Operations chips and any deep-link.
2. **`sessionStorage.di_nishi_prompt`** — same idea but for cases where URL params would be ugly.

Bootstrap flow:

```
Page loads → DOMContentLoaded
  → check ?q= and sessionStorage
  → render the greeting (tailored by ?from= source)
  → if incoming prompt exists, fill the textarea and auto-send after 700ms
  → response comes from the offline responder OR Claude (if API key)
```

**Tailored greetings by `?from=` source:**

- `from=operations` — "You arrived from the Operations dashboard. I've picked up your question and will answer it in a moment."
- `from=discovery` — "Let me know what you'd like to drill into."
- `from=architecture` — "I can explain any verdict, cloud choice, or cost number on that page."
- `from=governance` — "Want a RAID summary or a wave-by-wave timeline view?"
- (no `from=`) — the original three-question welcome.

**Six new intents in the offline responder** for Operations chips:

1. *"Show last week's batch failures"* → table of 3 failures with module, recovery, recommended RAID entry.
2. *"Why did AWS RDS spike 14%?"* → root cause (May 18 upsize, 41% utilisation), recommendation, link to Architecture for re-pricing.
3. *"Forecast tonight's EOD batches"* → predicted finish times per batch with confidence bands and risk callout.
4. *"Are SLOs trending in or out?"* → 4-row table with burn rate trend and verdict; flags Card auth p95 as OUT.
5. *"Top 3 modules by incident count this month"* → ranked list with pattern analysis and Discovery 7R callback.
6. *"Forecast Q3 cloud bill"* → per-area projection table with risk callout for Snowflake spend.

Each response is grounded in the same sample data the Operations dashboard shows, so the numbers line up.

### Phase 15e.1 · Cost-aware Discovery 7R rationale

Discovery Studio's `compute7R()` now calls `window.DI.pricing.estimate()` per capability and `window.DI.pricing.legacyTco()` to compute future vs current monthly cost. The rationale strings now end with savings figures:

```
"Critical workload, declining skills, regulatory pressure. Rehost would not
unlock the new capability. Saves $657K over 3 years vs current."
```

The 7R result cards gained a fourth stats pill: **Cloud cost: $18K/mo** (in gold).

The hero "Est. Savings" stat is now computed from real pricing (sum of `savings3yr` per capability) instead of the old `n * 340` rough estimate.

`assets/pricing.js` is now imported by Discovery Studio.

## Files changed

```
nishi-chatbot.html             added 6 operations intents · added ?q= + sessionStorage bootstrap · tailored greeting by ?from=
discovery-studio.html          imports pricing.js · compute7R adds cost · 7R card shows $K/mo · hero savings uses real numbers
DEPLOY-PHASE-19-15e.md         this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open `/operations` | KPI tiles + Nishi chip panel at bottom |
| 2 | Click "Show last week's batch failures" chip | Toast + redirect to Nishi · greeting tailored to `from=operations` · question auto-sent · response is the 3-failure table |
| 3 | Try the other 5 chips one at a time | Each gets a grounded multi-paragraph response from the matching intent |
| 4 | Open Discovery Studio · Quick mode · skip to 7R map | Each card now shows a 4th stats pill `Cloud cost: $XK/mo` in gold |
| 5 | Read any card's "Why X" rationale | Sentence ends with "Saves $YK over 3 years vs current." |
| 6 | Hero "Est. Savings · 3 yr" | Number is realistic (e.g. $4.4M) instead of the old $4.5K-per-cap rough estimate |
| 7 | Open Nishi directly (no `?q=`) | Original three-bullet welcome — Operations chips not auto-triggered |

## Known follow-ups

- **Phase 14b.3** — Active Nishi co-pilot panel inside Discovery wizard (deferred from the original Phase 14b batch).
- **Phase 19.2** — Nishi remembers the chip context across the chat (e.g. once you ask about Card Auth latency, follow-up questions know you mean Card Auth).
- **Phase 19.3** — Nishi can call back to the originating page ("open Architecture for me").

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 19 + 15e.1 · Nishi intent parser + cost-aware Discovery 7R"
git push
```

Auto-deploys in ~60 sec.
