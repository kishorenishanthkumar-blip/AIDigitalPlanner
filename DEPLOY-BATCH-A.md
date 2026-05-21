# Batch A · Buyer-validation polish (5 phases · ~15 hrs)

**Date:** 2026-05-21
**Shippable end-state:** ✓ Discovery, RFP, EVP, and Nishi all noticeably better for banking buyer demos.

## What ships

### Phase 20.1 · Current vs Future side-by-side view on Discovery 7R result

A second view toggle on the 7R result page:

- 🎯 **7R Cards** (existing view)
- 📊 **Current vs Future** (new)

Current vs Future renders a 9-column transformation table with:

- # · Capability · Current system · → · Future system · 7R · Risk · Effort · 3-yr savings
- Critical capabilities highlighted with a red dot + cream background
- Total 3-year savings rolled up in the gold footer
- A dark "Key Transformation Patterns Detected" callout below showing:
  - Mainframe / COBOL workloads modernized
  - SaaS replacements (vendor-managed)
  - API-first / event-driven refactors
  - Quick-win rehosts

This is the EY-style executive view buyers ask for. Persisted in `STATE.resultView` so it survives reload.

### Phase 20.2 · Auto-fill questionnaire → Discovery

When the user completes the RFP questionnaire and clicks "Continue to Discovery", `questionnaire.html`:

1. Builds a Discovery-shaped handoff with:
   - Profile (role, region, domain)
   - Hints (legacyPlatforms, locInScope, currentLatency, drPosture, complexityScale, riskAppetite, budget, horizon, outcomes, residency)
   - Derived requirements, compliance items, RAID items
2. Saves to `localStorage.di_handoff_from_questionnaire`.
3. Redirects to `discovery-studio.html?from=questionnaire` with a confirmation toast.

Discovery Studio's bootstrap then:

1. Reads the handoff.
2. Picks pre-selected capabilities based on the legacy-platform answers (`mainframe`/`COBOL` → Payments + Deposits + Trade Finance; `AS/400` → Deposits + Cards; etc.).
3. Sets per-capability complexity rating from the questionnaire's 1-5 scale.
4. Jumps straight to the scope step with a toast: "RFP answers imported · N capabilities pre-selected".
5. Clears the handoff so re-running Discovery doesn't double-import.

### Phase 20.3 · Per-country regional packs

`assets/questionnaire-packs.json` now has a `perCountryRegulators` map with 20 countries grouped by region:

| Region | Countries with full regulator + framework + residency entries |
|---|---|
| North America | United States · Canada |
| Europe | United Kingdom · Germany · France |
| Asia Pacific | India · Singapore · Australia · Japan · Hong Kong |
| South East Asia | Malaysia · Indonesia · Philippines · Thailand · Vietnam |
| South Western Asia | Saudi Arabia · UAE · Bahrain · Kuwait · Qatar |

Each country entry has:
- `region` — back-reference
- `regulators` — list of bodies (e.g. RBI, SEBI, CERT-In)
- `frameworks` — specific notices/circulars/laws (e.g. RBI Master Direction on Outsourcing, RBI Cybersecurity Framework 2016, DPDP Act 2023)
- `dataResidency` — verbatim residency requirement

The existing 5-region pack is kept; the per-country layer enriches it. Future questionnaire questions can scope to a single country via `countryScope`.

### Phase 20.4 · EVP skillset + effort breakdown + Nishi session wrap-up

**EVP enhancement:**

A new section below the KPI table titled *"Skillset & effort breakdown · dev / test / production rollout"*:

- 3-segment horizontal bar showing Dev / Test / Prod FTE-month split (e.g. Dev 70% · Test 18% · Prod 12%).
- A heuristic ("REHOST: 4 FTE-mo · REPLAT: 8.5 · REFACT: 15 · REARCH: 23 · REPLACE: 12.5") computes the totals from the 7R verdict mix.
- Skills table dynamically rolled up from the capability mix: Cloud architects · COBOL engineers · DevOps + SRE · Java / Spring engineers · Event-streaming engineers · Risk & compliance analysts · Payments specialists · QA automation · Product owners · Program manager.
- Each row shows peak FTE and the role responsibility.
- Footer row: total peak headcount with a note about typical 45/55 internal/partner blend.

**Nishi wrap-up:**

- Type *"wrap"* / *"summarize"* / *"session summary"* / *"what did I do"* in chat OR `/wrap` in CLI mode.
- Nishi pulls from every storage source: profile, questionnaire output, Discovery state, Architecture state, EVP input, SOW version, Governance RAID, audit log count.
- Renders a markdown wrap-up with section by section status + suggested next step.
- Closes with: "Thank you for using the platform. Everything is saved locally in your browser — your data never leaves this device."

### Phase 20.5 · Banking industry taxonomy

`discovery-studio.html` capability catalogue expanded with a new 5th group **Capital Markets & Securities** containing 6 capabilities:

- Equities trading (Solaris · C++ · FIX gateway → Java 21 · Kafka · low-latency edge)
- FX & money markets (vendor v4 → API hub + ISO 20022)
- Derivatives & structured products (Excel + C# → risk-aware microservices)
- Securities custody (legacy mainframe → hybrid · core retained + cloud APIs) — **critical**
- Settlement & clearing (COBOL batch T+3 → event-driven T+1 ready)
- Investment advisory (spreadsheet-driven → AI-assisted advisor portal)

Existing groups renamed to match banking industry vocabulary:

- "Banking Core" → "Consumer & Corporate Banking" 🏦
- "Cards & Loyalty" → "Cards & Payments" 💳
- "Customer Lifecycle" → "Customer Lifecycle" 👥
- "Risk · Compliance · Ops" → "Risk · Compliance · Operations" ⚠
- (NEW) "Capital Markets & Securities" 📈

Total capabilities: **26** (up from 20). Pricing multipliers added to `assets/pricing.js` for all 6 new capabilities.

## Files changed

```
discovery-studio.html                     Current vs Future view · 6 new capabilities · taxonomy rename · questionnaire handoff consumer
assets/pricing.js                         CAP_MULT entries for 6 new Capital Markets capabilities
assets/questionnaire-packs.json           perCountryRegulators with 20 countries
questionnaire.html                        Build di_handoff_from_questionnaire + toast + redirect on goToDiscovery
evp-summary.html                          renderSkillsBreakdown(): effort split + skills table
nishi-chatbot.html                        Wrap-up intent in offline responder + /wrap CLI + help text update
DEPLOY-BATCH-A.md                         this file
```

61 / 61 questionnaire tests still pass.

## QA after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Open RFP Questionnaire, complete a few questions, click Submit → Continue to Discovery | Toast "Carrying RFP answers to Discovery" · lands on `/discovery-studio?from=questionnaire` |
| 2 | Discovery shows "RFP answers imported · N capabilities pre-selected" toast | ✓ · jumps to scope step automatically |
| 3 | Generate 7R map on Discovery | Cards view renders with cost; click "📊 Current vs Future" toggle |
| 4 | Current vs Future view | 9-column transformation table + dark "Key Transformation Patterns" callout |
| 5 | New "Capital Markets & Securities" group shown on scope step | 6 new capabilities visible |
| 6 | Inspect `assets/questionnaire-packs.json` | `perCountryRegulators` has 20 country entries |
| 7 | Open EVP Summary (Load sample if needed) | Scroll past KPI table → "Skillset & Effort Breakdown" section visible |
| 8 | EVP skills table | 9-10 rows with role responsibilities + peak FTE numbers |
| 9 | Open Nishi chat, type "wrap" or `/wrap` | Multi-section wrap-up showing every captured input + suggested next step |

## Redeploy

```powershell
cd "C:\Users\nisha\OneDrive\Desktop\Desktop - Nishanth\DI-Platform Planner"
git add .
git commit -m "Batch A · 5 demo-polish phases (Current vs Future, RFP→Discovery, per-country packs, EVP skills, Nishi wrap)"
git push
```

Auto-deploys in ~60 sec via Cloudflare Pages.

## What's still in the backlog

Batch B (4 phases · ~15 hrs) — new value-add pages: Role-tagged Requirements, Role-Based Action page, Blockchain + RWA, per-cloud SVG diagrams. See `BACKLOG.md` for the full menu.
