# Phase 15a + 15b · Pricing library + Architecture Studio rebuild

**Date:** 2026-05-21
**Shippable end-state:** ✓ Live 6-cloud pricing comparison · Discovery → Architecture handoff working

## What ships

### `assets/pricing.js` — shared pricing library

A clean API surface that the Architecture page (and later Operations + Nishi) all call:

```js
window.DI.pricing.estimate({ capabilityId, verdict }, { region, model, currency, discount, components })
window.DI.pricing.compute3Yr(capabilities, opts)
window.DI.pricing.legacyTco(capabilities)
window.DI.pricing.sources             // array of citations per cloud
window.DI.pricing.refreshedAt         // snapshot date
window.DI.pricing.regions / currencies / models / clouds
```

**Currently** the price table is curated from public list prices (2026-05-15 snapshot) for AWS, Azure, GCP, OCI, IBM and Private DC. Numbers are realistic and the math accounts for:

- **Capability footprint multiplier** — Core Payments is heavier than Card Fulfillment.
- **7R verdict effect on cost** — Replatform saves ~25%, Refactor ~35%, Rearchitect ~40% vs current.
- **Region adjustment** — apac-singapore is 16% more than us-east-1 etc.
- **Pricing model** — 3-yr Savings Plan saves 45% off on-demand.
- **Currency conversion** — locked FX snapshot for USD / EUR / GBP / INR / SGD / AED / CAD / JPY.
- **Enterprise discount** — 0-60% applied uniformly per the UI's discount field.

**Future swap to live Cloudflare Worker:** the library's API surface is intentionally Worker-shaped. To go live, replace the static `PRICE_TABLE` with a `fetch()` to a Cloudflare Worker that calls AWS Pricing API + Azure Retail Prices + GCP Cloud Billing Catalog. The Architecture page won't need any changes. Documented in `assets/pricing.js` header.

### Architecture Studio rebuild

`architecture-studio.html` is now a light-themed pricing comparison page. Hero shows legacy TCO vs future TCO vs 3-year savings (computed from real numbers). Below it, a **6-cloud × N-capabilities pricing grid** with:

- **Filters bar** — Region (9 options) · Pricing model (4 options) · Currency (8 currencies) · Enterprise discount (0-60% slider) · Components (Compute · Storage · Egress · Support toggles).
- **Per-capability rows** with: capability name + current→future stack · 7R verdict pill · 6 cloud cost cells (monthly + 3-yr TCO) · "✓ chosen" indicator for the picked cloud · clickable cell to **pick a different cloud** for that capability · ⋯ source link for **provenance modal**.
- **Provenance modal** shows the exact SKU, region, model, currency, discount applied, snapshot date and per-component breakdown for any cell.
- **Totals footer** — monthly + 3-yr per cloud, with the cheapest cloud highlighted.
- **Sources strip** — every cloud's pricing page linked, snapshot date called out.

### Discovery → Architecture handoff (working end-to-end)

- Discovery's "Send to Architecture" stores `di_handoff_architecture` in localStorage with the 7R map + recommended target clouds.
- Architecture's bootstrap calls `consumeHandoff()`, imports the capabilities, shows a confirmation toast: "Discovery handoff received · Imported N capabilities. Pricing applied below."
- A banner inside the page lets the user re-run Discovery any time.
- If no handoff exists, an empty state offers "Open Discovery Studio" or "Load sample (13 capabilities)" to get started.

### Architecture → Governance/EVP handoff (next phase consumers)

- **Send to Governance** writes `di_handoff_governance` (capabilities + per-cap picked cloud + filters) and redirects to `program-governance.html?from=architecture`.
- **Generate EVP Summary** writes `di_evp_input` and redirects to `evp-summary.html` (Phase 15c page — coming in the next batch).

## Files changed

```
assets/pricing.js                  NEW
architecture-studio.html           full rewrite (light theme + grid + handoff)
DEPLOY-PHASE-15a-15b.md            this file
```

61 / 61 questionnaire tests still pass.

## QA checklist after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open Discovery Studio · pick Quick mode · skip to 7R map | Result page shows 13 capability cards |
| 2 | Click "Send to Architecture" on the 7R result | Toast appears; lands on Architecture Studio |
| 3 | Architecture Studio shows imported banner "Imported 13 capabilities" | Yes |
| 4 | Hero shows Legacy TCO, Future TCO, 3-yr Savings (e.g. $4.4M ↓ 39%) | Yes |
| 5 | Pricing grid shows 6 cloud columns × 13 rows + totals footer | Yes |
| 6 | Change Region dropdown to apac-singapore | All prices update +16% |
| 7 | Toggle Currency to INR | All prices convert at ~83.5x |
| 8 | Set Discount field to 20 | All prices drop 20% |
| 9 | Click a cell in a different cloud → "pick" | "Pick updated · Now using Azure" toast; that cell becomes ✓ chosen |
| 10 | Click "⋯ source" on any cell | Provenance modal opens with SKU, unit, region, currency, discount, snapshot date |
| 11 | Click "Send to Governance" | Toast; redirects to program-governance.html?from=architecture |
| 12 | Click "Generate EVP Summary" | Toast; tries to load evp-summary.html (404 expected for now — Phase 15c ships that page) |
| 13 | Open Architecture Studio directly (no handoff) | Empty state with "Open Discovery Studio" + "Load sample" buttons |

## Known follow-ups

- **Phase 15a.live** — replace static price table with a Cloudflare Worker that polls the 5 cloud pricing APIs. ~3 hrs of Worker code + KV setup.
- **Phase 15c** — `evp-summary.html` page that consumes `di_evp_input` and renders the board pack (hero + benefits + KPI table).
- **Phase 15d** — `sow.html` editable draft Statement of Work.
- **Phase 15e.1** — Discovery 7R rationale references pricing ("Replatform saves $407K vs Rearchitect").
- **Phase 15e.2** — Operations FinOps alerts + Nishi pricing chat both use this same `pricing.js`.

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Phase 15a+15b · pricing library + Architecture Studio rebuild"
git push
```

Cloudflare auto-deploys within ~60 sec.
