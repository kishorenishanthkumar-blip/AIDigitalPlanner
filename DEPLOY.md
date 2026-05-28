# Deploying DI-Platform to Netlify

The platform is a **pure static site** (HTML / CSS / JS / JSON).
There is **no build step**. Drag-and-drop or git-connect deploy works in ~30 s.

## Why the earlier deploy failed

Netlify auto-detects Python projects when it sees `requirements.txt`,
`pyproject.toml`, or `Pipfile` in the publish root, and tries to `pip install`
the dependencies — including `psycopg2-binary`, which fails to compile from
source on the build image because `pg_config` (Postgres dev headers) isn't
available there.

The Python files in this project belong to a **future Phase 9 backend** (RAG,
vector DB, multi-agent server). They aren't needed at deploy time.

## What changed

All backend / dev files were moved into `backend/`:

```
backend/
├── requirements.txt   requirements-dev.txt   pyproject.toml
├── Dockerfile         docker-compose.yml     .dockerignore
├── src/               bin/                   data/   config/   lib/   scripts/   docker/
├── tests/             (Python pytest suite)
├── .venv/             .mypy_cache/           .pytest_cache/
├── .env               .env.example
└── DI-Platform API Key.txt    (never committed)
```

The publish root now contains only:

```
.
├── *.html                     # All studio pages
├── assets/                    # JS, JSON, sample data
├── tests/questionnaire.test.js  # Node-based JS tests
├── docs/                      # Architecture notes + PPT
├── netlify.toml               # Static-only build config
├── _redirects · _headers      # Friendly URLs + security headers
├── robots.txt · sitemap.xml   # SEO
├── DEPLOY.md · TEST-REPORT.md · README.md
├── .netlifyignore             # Belt-and-braces deploy exclusions
└── backend/                   # Future Phase 9 backend — ignored by Netlify
```

The `.netlifyignore` plus the empty `command` in `netlify.toml` ensure Netlify
never sees the Python files and never tries to install anything.

## Deploy now (drag-and-drop, 30 s)

1. Open <https://app.netlify.com/drop>
2. Drag the `DI-Platform Planner` folder onto the page.
3. Wait for "Site deploy in progress" → "Published".

Your friendly URLs are live:

- `/` or `/home` — main platform
- `/discovery` — Discovery Studio
- `/architecture` — Architecture Studio
- `/governance` — Program Governance
- `/questionnaire` — RFP Questionnaire
- `/operations` — Continuous improvement
- `/q` `/d` `/a` `/g` — single-letter shortcuts

## Deploy via git-connect (CI on every push)

```bash
cd "DI-Platform Planner"
git add -A
git commit -m "Restructure: backend → /backend, static root for Netlify"
git push
```

In Netlify:
1. New site → Import from Git → pick the repo
2. Build command: leave blank (or `echo 'static'`)
3. Publish directory: `.`

The repo's `netlify.toml` will be picked up automatically. Subsequent pushes
deploy in seconds.

## Working with the Python backend locally

The backend is still there — just relocated:

```bash
cd "DI-Platform Planner/backend"
python -m venv .venv
source .venv/bin/activate          # or .venv\Scripts\activate on Windows
pip install -r requirements-dev.txt
pytest tests/
```

Phase 9 (RAG + LLM) will pick this up; until then, the frontend works
standalone and the backend is intentionally idle.

## Running the questionnaire tests

```bash
cd "DI-Platform Planner"
node tests/questionnaire.test.js
# 61 passed · 0 failed
```

## Post-deploy smoke checklist

- [ ] `/` — does the 4-step login render?
- [ ] Sign in with a test user — does Nishi pop up?
- [ ] Type `start questionnaire` to Nishi — does it route to `/questionnaire`?
- [ ] `/discovery` — current-vs-future view loads?
- [ ] `/governance` — MS Project XML downloads?
- [ ] API-key drawer accepts and persists an Anthropic key?

If all six are green, the deploy is healthy.

---

## OneDrive sync gotchas · DEFECT-1

The DI-Platform repo lives under `OneDrive\Desktop` which means OneDrive's
file sync sits between every editor write and the actual on-disk bytes.
Two failure modes seen during development:

1. **Phantom-truncation typecheck errors.** A WSL bash mount can show a
   freshly-edited file as truncated mid-word while the Windows-native view
   shows it correctly. `tsc` / `npm test` invoked from WSL trips on the
   stale snapshot. Fix: wait 10-30 seconds and retry, OR run the same
   command from a native Windows terminal (Git Bash, PowerShell, cmd).

2. **Stale Read after Edit.** Occasionally an Edit-then-Read sequence
   reads the pre-edit content. Fix: explicit `git diff` to confirm the
   intended bytes hit disk before re-running tooling that depends on them.

These are tooling-level quirks, not platform bugs. They don't affect
deployed Cloudflare Workers or Pages — only local development.

If you need to bypass OneDrive entirely (e.g., for a heavy CI-style
local test pass), clone the repo to a path NOT under OneDrive:

    git clone <repo> ~/dev/aidp-platform
    cd ~/dev/aidp-platform
    npm ci && npx playwright test

The OneDrive-hosted copy stays in sync via `git pull` from this clean
working clone.
