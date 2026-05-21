# DI-Platform — Web3 · MCP · RAG · Vector DB Roadmap

**Inventor:** Nishanth Kumar Kishore · Digital Infotech
**IDD:** DI-2026-NKK-0511-001
**Last updated:** May 2026

This document captures the multi-phase vision for evolving the
DI-Platform from a static UI surface into a fully decentralized,
agentic, knowledge-augmented system. The deliverables already
shipped (HTML pages, deployment config) are the starting surface;
this roadmap describes how to fill in the intelligence beneath.

---

## Phase 0 — what's already live

Single-file HTML application with these pages, deployable to Netlify or
any static host:

| Route | Page | Purpose |
| --- | --- | --- |
| `/` | `index.html` | Sign-in + original studios |
| `/discovery` | `discovery-studio.html` | Executive briefing — current vs future |
| `/rfp` | `rfp-questionnaire.html` | Role + region aware RFP brainstorm |
| `/architecture` | `architecture-studio.html` | 6 deployment-target blueprints |
| `/governance` | `program-governance.html` | Plan, RAID, cost, MS Project, runlog |
| `/operations` | `operations.html` | Super-intelligent run-ops model |
| `/nishi` | `nishi-chatbot.html` | Chat + CLI assistant (live Anthropic API or offline playbook) |

The Nishi chatbot already does live Claude API calls when the user
supplies an Anthropic key (held in-memory only).

---

## Phase 1 — backend agent layer (FastAPI · 4–6 weeks)

Replace the in-browser Anthropic calls with a thin backend that
adds auth, rate-limits, and one place to log conversations.

* `src/di_platform/api/` — FastAPI routes
* `src/di_platform/agents/` — one Python module per agent (already
  scaffolded in the project skeleton)
* `src/di_platform/services/llm.py` — single anthropic client, shared
* Move the Nishi system prompt server-side
* Add `/api/nishi/chat` endpoint, plain JSON in / streaming SSE out
* Add `/api/discovery/summary`, `/api/rfp/sections`, `/api/program/plan`
* Hosting target: Docker container on **any** cloud (Dockerfile and
  docker-compose.yml already present in repo root)

**Why first:** centralises secrets, removes the "paste your API key"
flow, and unlocks the rest of the roadmap.

---

## Phase 2 — vector DB + RAG (cost-free options · 3–4 weeks)

Two free-tier-friendly choices, both production-ready:

### Option A — pgvector (recommended)
* PostgreSQL extension; you already run Postgres in `docker-compose.yml`
* `pip install pgvector psycopg2-binary` (already in `requirements.txt`)
* Schema:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE TABLE knowledge (
    id          BIGSERIAL PRIMARY KEY,
    source      TEXT,
    role        TEXT,         -- which persona contributed
    region      TEXT,
    domain      TEXT,
    text        TEXT,
    embedding   vector(1536),
    metadata    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX ON knowledge USING ivfflat (embedding vector_cosine_ops);
  ```
* Embeddings via Anthropic-compatible service, or `voyage-3` ($1/1M tokens),
  or OpenAI `text-embedding-3-small` — all sub-cent per document.

### Option B — Qdrant (also free for hosted small tier)
* Open-source, single Docker image, gRPC + HTTP API
* `pip install qdrant-client`
* Slightly faster than pgvector at >1M vectors; lighter ops at <1M

### Retrieval flow
1. User asks Nishi a question
2. Embed the question
3. Top-k similarity search in vector DB (filter by role / region / domain)
4. Compose system prompt with retrieved context
5. Stream Claude response
6. **Persist the new exchange** (Q+A+citations) back into the vector
   store as fresh knowledge — this is the "evolution" loop

---

## Phase 3 — multi-agent · MCP server (4 weeks)

The seven options the user described map cleanly to agents.
Build them as Anthropic-Agent-SDK / FastMCP server tools so any
MCP-aware client (including Claude Desktop, Cursor, Cowork) can call them.

```
mcp-server/
├── server.py                    # FastMCP entrypoint
├── tools/
│   ├── summary.py               # Option 1 — single-page summary
│   ├── portfolio_discovery.py   # Option 2 — portfolio drill-down
│   ├── requirements.py          # Option 3 — requirements + blockchain
│   ├── architecture.py          # Option 4 — module × cloud → 7R design
│   ├── governance.py            # Option 5 — dynamic reports per role
│   ├── operations.py            # Option 6 — observability + remediation
│   └── role_actions.py          # Option 7 — role-based actions
```

Each tool:
* Receives validated Pydantic input
* Queries the vector store for relevant context
* Calls Claude with a small, focused system prompt
* Returns structured JSON (so the UI can render it)

The **parent "Nishi" agent** runs an orchestration loop that decides
which child tool to call based on the user's intent, then composes
the final answer.

---

## Phase 4 — Web3 / decentralized layer (8–12 weeks)

This is the most ambitious chunk and warrants careful scoping
before committing engineering capacity.

### Smart-contract surface
* **`KnowledgeRegistry.sol`** — hash-anchors each knowledge artifact on-chain
  (the bulk content stays off-chain in IPFS). Allows tamper-evident
  audit trails for board-level decisions.
* **`AgentRegistry.sol`** — registers each agent's identity + version
  + capability hashes. Solves "which agent answered what, when, with
  what version of the prompt?" — important for regulated industries.
* **`TokenizedRWA.sol`** — minimal ERC-3643 (permissioned) skeleton
  for Real-World-Asset tokenization pilots (rewards, fractional
  treasury exposure, etc.). Always behind KYC contracts.

### Storage & infra
* IPFS / Filecoin for the bulk content (free tier via Web3.Storage)
* Polygon zkEVM or Base for low-cost L2 settlement
* The platform UI stays the same — Nishi simply adds an
  "anchor on-chain" step after major outputs (RFP brief,
  governance plan, runlog).

### Why "decentralized" here
* The smart-contract layer = auditability and provenance.
* The vector store + agents stay off-chain (Web3 is poor at AI work).
* The UI is platform-independent already: a static bundle that runs
  on Netlify, S3, IPFS, or self-hosted nginx with zero changes.

---

## Phase 5 — knowledge-driven autofill (concurrent with Phase 2)

Implementing the user's request — *"appears as text first time, dropdown
the second time"* — is straightforward once the vector store is in
place:

```js
async function autofill(fieldName, context) {
  const seen = await fetchPriorValues(fieldName, context);
  if (seen.length === 0) {
    return { type: 'text', placeholder: 'enter a value' };
  }
  return { type: 'datalist', options: seen.map(v => v.value) };
}
```

Each time the user types something new, write it back into the vector
store keyed by `field_name`, `role`, `region`. Next session, the field
is rendered as `<datalist>` (free-text combo box) instead of `<input>`.

---

## Phase 6 — animated video output (1 week per generation engine)

Two viable paths, both already free or cheap:

* **Remotion (React-based)** — programmatic MP4 generation. Drop the
  Discovery/Architecture/Governance JSON into a template; render
  `output.mp4` server-side via Lambda or a tiny worker.
* **HTML → MP4 via Playwright trace** — record the existing HTML
  explainer pages in a headless browser and stitch frames into video.

Both produce a 30–90 second board-ready overview the user can share
with their VP/EVP audience.

---

## Phase 7 — output formats (already partly done)

| Format | Status | Where |
| --- | --- | --- |
| HTML | ✓ Live | Each studio is itself an HTML deliverable |
| Markdown | ✓ Live | RFP export, Nishi conversation export |
| JSON | ✓ Live | Program JSON, RFP JSON |
| MS Project XML | ✓ Live | Program Governance → ⬇ MS Project |
| Runlog TXT | ✓ Live | Program Governance → ⬇ Runlog |
| Word (.docx) | ⏳ Backend | Use python-docx via `/api/export/docx` |
| Excel (.xlsx) | ⏳ Backend | Use openpyxl via `/api/export/xlsx` |
| PDF | ⏳ Backend | wkhtmltopdf or Playwright render of any HTML page |
| Animated video | ⏳ Phase 6 | Remotion |

---

## Phase 8 — operations + DR (continuous)

* All maintenance / fix tasks queued into a job table; a worker picks
  them up during low-usage windows (cron `*/30 02-04 * * *`).
* The runlog template already shipped in `program-governance.html`
  becomes the actual execution script.
* Tie alerts to the Operations page's "Auto-resolve" flow — 60% of
  detected anomalies should land in the autonomous bucket.

---

## Deployment paths (already supported)

| Target | How |
| --- | --- |
| Netlify | Drag the folder onto Netlify dashboard, or push the repo + connect it. `netlify.toml`, `_redirects`, `_headers` are present. |
| AWS S3 + CloudFront | Sync the folder to S3 (`aws s3 sync . s3://...`), front with CloudFront |
| Azure Static Web Apps | Push to GitHub, connect via portal — no build step |
| GCP Cloud Storage + Load Balancer | `gsutil rsync` |
| OCI Object Storage + CDN | Bucket + Edge |
| IBM Cloud Object Storage + CDN | Similar |
| Self-hosted | Any nginx / Caddy / Apache pointing at the folder works |
| Docker | `Dockerfile` and `docker-compose.yml` already in the root |
| Kubernetes | Phase-1 backend adds `k8s/` manifests |

---

## Risk register for this roadmap

| Risk | Mitigation |
| --- | --- |
| Vector store costs grow unbounded | Tier the embeddings: use small-dim (768) for cheap, large (3072) only for top-tier knowledge. |
| Regulator unhappy with cloud LLMs | Use Anthropic via AWS Bedrock or a private deployment behind a VPC; on-chain anchoring gives audit trail. |
| Agent hallucinations | RAG with strict retrieval threshold; if no docs above threshold, agent refuses to answer. Log refusals. |
| Multi-agent coordination bugs | Start with strict orchestrator (no agent-to-agent calls); add agent-to-agent only when stable. |
| Smart-contract security | Audit any contract before mainnet (Trail of Bits, OpenZeppelin). Pilot on testnets for 3+ months. |
| Cost over-runs on cloud | FinOps tagging from day 1; budget alerts at 50% / 75% / 90%. |

---

*Build slowly. Anchor everything. Keep the UI working at every
intermediate stage — it's the deliverable that pays for the rest.*
