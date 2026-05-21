# DI-Platform — Architecture Notes

**IDD:** DI-2026-NKK-0511-001
**Inventor:** Nishanth Kumar Kishore · Digital Infotech

## System overview

The platform exposes two integrated studios on a shared FastAPI backend:

1. **Time Capsule Discovery Studio** — analyzes legacy banking servers and
   classifies code components (Optimize / No Action / Decommission).
2. **AI Requirements Studio** — transforms unstructured discovery input
   into Agile backlogs via a six-agent pipeline.

```
┌──────────────────────────────────────────────────────────────┐
│                      FastAPI Application                     │
│                                                              │
│   ┌─────────────┐        ┌─────────────────────────────┐     │
│   │ Discovery   │        │  Six-Agent Pipeline         │     │
│   │ Studio API  │        │                             │     │
│   │             │        │  1. Discovery Parser        │     │
│   │ Server      │        │  2. Epic Generator          │     │
│   │ analysis    │        │  3. Story Writer            │     │
│   │ Code class. │        │  4. Acceptance Criteria     │     │
│   │             │        │  5. Estimation Agent        │     │
│   │             │        │  6. Platform Mapper         │     │
│   └──────┬──────┘        └────────────┬────────────────┘     │
│          │                            │                      │
│          ▼                            ▼                      │
│   ┌──────────────────────────────────────────────┐           │
│   │   Services Layer (orchestration, validation) │           │
│   └──────────────────┬───────────────────────────┘           │
│                      ▼                                       │
│   ┌──────────┐   ┌──────────┐   ┌──────────────┐             │
│   │ Postgres │   │  Redis   │   │  Anthropic   │             │
│   └──────────┘   └──────────┘   └──────────────┘             │
└──────────────────────────────────────────────────────────────┘
                     │              │
                     ▼              ▼
                ┌─────────┐    ┌─────────┐
                │  Jira   │    │  Rally  │
                │ Export  │    │ Export  │
                └─────────┘    └─────────┘
```

## Layering

| Layer | Folder | Responsibility |
| --- | --- | --- |
| API | `src/di_platform/api/` | HTTP routes, request/response shapes |
| Services | `src/di_platform/services/` | Orchestrate agents, persist results |
| Agents | `src/di_platform/agents/` | One module per AI agent |
| Models | `src/di_platform/models/` | Pydantic schemas + SQLAlchemy models |
| Utils | `src/di_platform/utils/` | Logging, IDs, time helpers |

## Configuration sources (precedence: top wins)

1. Environment variables / `.env`
2. `config/<environment>.yaml`
3. Defaults in `src/di_platform/config.py`

## Local dev loop

```
edit src/  →  pytest  →  uvicorn (auto-reload)  →  iterate
```

## Container topology (`docker-compose`)

- `app` — FastAPI + uvicorn on :8000
- `db` — Postgres 16 on :5432
- `redis` — Redis 7 on :6379

## Testing strategy

- **Unit** (`tests/unit/`) — pure-function tests; no DB, no network.
- **Integration** (`tests/integration/`) — TestClient + spun-up Postgres/Redis.
- **Fixtures** (`tests/fixtures/`) — JSON snapshots used as inputs and as
  mocked Anthropic responses (so tests don't hit a real API key).
