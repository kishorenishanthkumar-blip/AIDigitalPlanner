# Phase 13.1 — Nishi chat input fixes + animated feature explainers

**Date:** 2026-05-21
**Theme:** Make the Nishi chat usable + replace passive "What Nishi can do" cards with interactive walkthroughs.

## What ships in this phase

### 1 · Fixed Nishi chat input visibility
- Restructured `nishi-chatbot.html` shell to use `height: calc(100vh - 54px)` so the chat input bar can never fall below the fold.
- `.chat` got `min-height: 0; overflow: hidden;` so the inner `.messages` panel scrolls cleanly instead of pushing the input off-screen.
- Side panel layout breakpoints: 3-col ≥ 1200 px, 2-col 900-1200 px, 1-col < 900 px.
- API-key panel is now hidden by default (only shown when the user explicitly tries to use a live-Claude feature) — frees up vertical space.

### 2 · Mic button (hold-to-talk)
- A 44 × 44 round red mic to the left of the textarea.
- Mouse down or touch start → starts `SpeechRecognition` (Web Speech API).
- Mouse up / leave / touch end → stops recognition, auto-sends the recognized text after a 350 ms settle.
- Visual: the button pulses while recording.
- Falls back gracefully if the browser doesn't support Web Speech (alert: "Try Chrome or Edge on desktop").

### 3 · Suggested prompts moved into a dropdown above the chat input
- The old left-panel column of suggested prompts is hidden (`display: none`).
- A single "💡 Suggested prompts ▾" button now sits above the textarea.
- Clicking opens a 240 px-tall scrollable menu of 7 curated prompts (each tagged with an emoji and category).
- Picking a prompt fills the textarea and auto-sends.

### 4 · "What Nishi can do" cards are now live links
- Each capability card is wrapped in an `<a href="feature-explainer.html?feature=...">`.
- Cards still styled the same, just clickable.
- Cursor changes to pointer on hover.

### 5 · New `feature-explainer.html` — shared animated walkthrough
- Single template page that loads different content per `?feature=<id>` URL parameter.
- Eight features supported today: `rfp`, `requirements`, `discovery`, `architecture`, `blockchain`, `knowledge`, `export`.
- Layout per feature:
  - **Stage panel** (left, 1.4 fr): animated inline SVG specific to the feature. Step numbers 1 → N with `Prev / Next / Restart / Play` controls.
  - **Info panel** (right, 1 fr): "What it does" prose · "Benefits" checklist · "How to use it" numbered steps · CTA buttons ("Try it now →" and "Ask Nishi").
- Top bar has 🏠 Home and 🤖 Back to Nishi buttons so the user always has a way back.
- Each animation uses pure CSS keyframes (`fadeUp`, `pulse`) so no JS animation library is needed — works offline, light bundle, perfectly accessible.

## File changes
```
nishi-chatbot.html        ← mic, dropdown, sticky input, links to explainer
feature-explainer.html    ← NEW shared explainer with 7 feature animations
DEPLOY-PHASE-13.1.md      ← this file
```

61/61 questionnaire tests still pass.

## QA checklist after redeploy

| # | Test | Expected |
|---|------|----------|
| 1 | Sign in, land on Nishi chat | Chat header, scrolling thread, **input bar always visible at the bottom** |
| 2 | Click "💡 Suggested prompts ▾" | Dropdown opens above the input with 7 categorised prompts |
| 3 | Pick a prompt | Textarea fills, dropdown closes, message auto-sends |
| 4 | Press and hold the red 🎤 mic | Button pulses red, status text shows "🎤 Listening…", browser asks for mic permission first time |
| 5 | Speak a sentence, release the mic | Transcript appears in textarea and auto-sends ~350 ms later |
| 6 | Click any card in the right "What Nishi can do" column | Opens `feature-explainer.html?feature=<id>` |
| 7 | On the explainer page, click Next | Step counter advances, can step Prev / Restart / Play (auto-advance) |
| 8 | Click 🏠 Home or 🤖 Back to Nishi in the explainer top bar | Returns to Home or Nishi chat |
| 9 | Resize browser to 800 px wide | Right context panel collapses, single-column chat |
| 10 | Resize to 600 px wide | Both side panels collapse, full-width chat with input still pinned |

## Known follow-ups (Phase 13.2 candidates)

- Read-aloud button on each Nishi reply (uses `speechSynthesis.speak()`).
- Persist mic/text input history.
- Make the explainer auto-play full sequence on first land.
- Add a feature-explainer card linking back from each feature page (Discovery Studio, Architecture, etc.) — "Want a refresher? Watch the walkthrough →".

## Redeploy
Same PowerShell zip command as Phase 13. No new third-party scripts. Same EmailJS config. Just drag the new zip to Netlify or Cloudflare Pages.
