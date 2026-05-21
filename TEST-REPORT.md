# DI-Platform · Phase 2 Test Report

**Run date:** 2026-05-20
**Test harness:** `tests/questionnaire.test.js`
**Engine version:** `assets/questionnaire-engine.js` v1.1 (validation-enabled)
**Pack version:** `assets/questionnaire-packs.json` (88 questions · 6 sections · 10 roles · 5 regions · 11 banking domains)

---

## Summary

| Category | Tests | Passed | Failed |
|----------|------:|-------:|-------:|
| Pack integrity | 3 | 3 | 0 |
| Positive (5 personas) | 15 | 15 | 0 |
| Negative (validation) | 17 | 17 | 0 |
| Edge cases | 26 | 26 | 0 |
| **Total** | **61** | **61** | **0** |

## Coverage

### Pack integrity (3 tests)
- All question IDs unique
- Every question maps to a known section
- All question types belong to the known set: `text · longtext · single · multi · scale · boolean · date · ranked`

### Positive — five personas walk through (15 tests)
Each persona answers every visible question with plausible data; we then call `validateAll()` (expect zero errors) and `consolidate()` (expect a full canonical output).

| Persona | Role | Region | Domain | Result |
|---|---|---|---|---|
| 1 | CTO | North America | Core Banking — Payments | ✓ |
| 2 | Business Owner | Europe | Cards | ✓ |
| 3 | CRO | South East Asia | AML | ✓ |
| 4 | Head of Compliance | Asia Pacific | Trade Finance | ✓ |
| 5 | CTO | South Western Asia | Cards | ✓ |

### Negative — invalid inputs caught (17 tests)

| Validator | Reject case | Accept case |
|---|---|---|
| Email regex | `not-an-email` ✓ | `good@example.com` ✓ |
| ISO date regex | `12/15/2026` ✓ | `2026-12-15` ✓ |
| Longtext minLength | `short` (5 chars) ✓ | sufficient text ✓ |
| Longtext maxLength | 600-char overflow ✓ | (covered above) |
| Single — unknown option | `BadValue` ✓ | known option ✓ |
| Multi — unknown in array | `[good, bad]` ✓ | `[good, also-good]` ✓ |
| Boolean — invalid token | `maybe` ✓ | `Yes` ✓ |
| Scale — below min | `-1` ✓ | (in range ✓) |
| Scale — above max | `100` (limit 60) ✓ | `30` ✓ |
| Required + empty | `''` ✓ | n/a |

### Edge cases (26 tests)

- **Security**: XSS payload `<script>alert("x")</script>` stored verbatim but escaped on render by `_esc()`.
- **Encoding**: Unicode + emoji + RTL Arabic round-trips through `sessionStorage`.
- **Empty / whitespace**: empty arrays, whitespace-only text, triple-space input — all correctly flagged as not-answered.
- **Branching**: `Q-RWA` correctly hides/shows as parent `Q-BCK` toggles between Yes / No / unset.
- **Scope filtering**:
  - Region: NA-only hidden in EU; EU-only hidden in NA.
  - Domain: Cards-only hidden in Trade Finance; visible in Cards.
  - Role: CTO-only and CRO-only hidden for Business Owner; CTO-only visible for CTO.
- **Persistence**: answers persist across `mount()` calls (sessionStorage resume).
- **Reset**: `reset()` clears both answers and meta.
- **Empty pack**: gracefully reports `0/0` progress, `0` validation errors.
- **Output**: consolidated payload contains `profile`, `responses`, and four `derivedArtifacts` arrays/objects; entire payload is `JSON.stringify`-safe.

## Notes

- One earlier failure cluster ("Q-LONG: Maximum length is 50") was a **test-harness bug**, not engine — the harness was filling every longtext question with a 60-char default, ignoring per-question `maxLength`. The validator caught it correctly. Fix: respect `q.validate.maxLength` when generating sample values. After the fix, all 61 tests pass.
- The validator is intentionally permissive on optional unanswered questions (returns `ok: true`) and strict on required ones (returns `ok: false`).
- HTML rendering is exercised via DOM stubs — the engine is decoupled enough that the same code runs in Node and in the browser.

## Sign-off

✅ Phase 2 questionnaire is **green for deploy**.
