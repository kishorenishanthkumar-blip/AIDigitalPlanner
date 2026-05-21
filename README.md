# DI-Platform Planner

Unified platform for legacy banking code discovery and AI-powered requirements engineering.
Inventor: **Nishanth Kumar Kishore** · Digital Infotech
IDD Reference: `DI-2026-NKK-0511-001`

---

## Project layout

```
DI-Platform Planner/
├── index.html                Main platform (Discovery + AI Requirements + IDD)
├── architecture-studio.html  Pick a deployment target (6 options)
├── program-governance.html   End-to-end program plan (requirements,
│                             RAID, 7R timeline, cost, MS Project export,
│                             DR runlog)
├── .env / .env.example       Environment variables (secrets live in .env)
├── Dockerfile                Container build
├── docker-compose.yml        Local multi-service stack (app + db + redis)
├── requirements*.txt         Python dependencies
├── pyproject.toml            Project metadata + tool config
├── bin/                      Operational scripts (run, migrate, seed)
├── src/di_platform/          Application source
│   ├── api/                  HTTP routes
│   ├── agents/               6-agent AI pipeline
│   ├── models/               Data models / schemas
│   ├── services/             Business logic
│   └── utils/                Helpers
├── config/                   Non-secret YAML config per environment
├── tests/                    Unit + integration tests
│   └── fixtures/             Mocked test data
├── data/                     Sample / seed data
├── docker/                   Docker support files
├── docs/                     Architecture & design notes
│   ├── architecture.md           Source-of-truth notes
│   ├── architecture-explainer.html  Animated walkthrough
│   └── DI-Platform-Architecture.pptx Deck for executive review
├── scripts/                  One-off utilities
└── .vscode/                  VSCode workspace settings
```

## Three landing pages

The platform is delivered as three linked single-file HTML apps so they
work locally with no build step and deploy to Netlify as a static site.

1. **`index.html`** — sign-in + the original two studios (Time Capsule
   Discovery and AI Requirements) plus the Invention Disclosure document.
2. **`architecture-studio.html`** — choose a deployment target. Six
   pre-built reference architectures: Banking Private DC, AWS, Azure, GCP,
   OCI, IBM Cloud. Each shows a layered blueprint with native services and
   a migration cost / duration estimate.
3. **`program-governance.html`** — pick a banking module + a deployment
   target, then get the full program plan: finalized requirements
   (Tech / Business / Product / Regulatory), program governance KPIs,
   data governance, 7R-aligned timeline, RAID log, cost breakdown,
   PAT margins, ops KPIs, plus downloads for **MS Project (.xml)**,
   **DR/Rollback runlog (.txt)** and **program JSON**.

Selections flow between pages via `sessionStorage` (key: `diSelectedArch`),
so picking an architecture on page 2 pre-selects it on page 3.

## Getting started (local Python)

```bash
# 1. Clone & enter
cd "DI-Platform Planner"

# 2. Create a virtualenv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

# 3. Install dependencies
pip install -r requirements-dev.txt

# 4. Configure environment
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux
# then edit .env and fill in ANTHROPIC_API_KEY, etc.

# 5. Run the app
python -m di_platform
```

## Getting started (Docker)

```bash
docker-compose up --build
```

The app will be available at <http://localhost:8000>.

## Running tests

```bash
pytest                          # all tests
pytest tests/unit               # unit tests only
pytest --cov=src/di_platform    # with coverage
```

## License

© 2026 Nishanth Kumar Kishore / Digital Infotech. All rights reserved.
