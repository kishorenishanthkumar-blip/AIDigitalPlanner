# AIDigitalPlanner · Containerized + Blockchain-Native Architecture

**Why this document:** Folds three architectural changes into the Batch E + Enterprise-Grade roadmaps:

1. **Containerize everything** — every agent is an OCI container, deployable on any Kubernetes (cloud or on-prem). Browser-, OS-, language-, and database-independent.
2. **XRP Ledger (XRPL) for payment & settlement workflows** — open-source, ~3-second finality, ~$0.00001/tx, native multi-currency, built-in DEX.
3. **Ethereum-family EVM for contracts and tokenized assets** — Hyperledger Besu for private, Polygon zkEVM / Arbitrum for public L2. Solana evaluated and not recommended for banking-grade contracts (rationale below).

Together these make the platform genuinely portable: same containers run on a developer's laptop, Cloudflare's K8s, AWS EKS, Azure AKS, GCP GKE, Oracle OKE, IBM Cloud, Red Hat OpenShift on-prem, or an air-gapped tier-1 bank's private cluster.

---

## 1 · Containerization-first principles

### 1.a · Every agent is an OCI container

| Property | Decision |
|---|---|
| **Image format** | OCI (Open Container Initiative) — Docker is one runtime, but images run on containerd, CRI-O, Podman, gVisor, Firecracker |
| **Base image** | `distroless` (gcr.io/distroless/nodejs22 or python3-slim) · no shell, minimal attack surface, ≤80 MB |
| **Architecture** | Multi-arch builds — `linux/amd64` + `linux/arm64` (banks on Ampere / Graviton get free 20-40% cost savings) |
| **Build** | `docker buildx` from a `Dockerfile` per agent · or `nixpacks` / `Cloud Native Buildpacks` for zero-config |
| **Registry** | GitHub Container Registry (free for public, free 500 MB for private) or self-hosted Harbor |
| **Image signing** | Sigstore Cosign (free) · admission controller rejects unsigned images in prod |
| **SBOM** | Generated per build via Syft, attached to image · banks require this for supply-chain attestation |
| **Vulnerability scanning** | Trivy in CI · blocks deploy on HIGH/CRITICAL CVEs |

### 1.b · Kubernetes everywhere (one cluster API to rule them all)

| Property | Decision |
|---|---|
| **Spec compliance** | Pure upstream Kubernetes APIs only · no proprietary CRDs except via optional adapters |
| **Local dev** | `kind` or `minikube` (free) · same manifests as prod |
| **Demo / Cowork tier** | k3s on Oracle Cloud Free Tier (4 always-free Ampere VMs · 24 GB RAM) OR Fly.io machines OR Cloud Run for stateless agents |
| **Pilot tier** | Per-bank EKS / AKS / GKE / OKE / OpenShift |
| **Enterprise on-prem** | OpenShift, Rancher / RKE2, Tanzu, vanilla kubeadm |
| **Air-gap option** | All images mirrored to bank's Harbor; Helm charts vendored; no external dependencies |
| **Manifests** | Helm charts (already started in IaC bundle) + Kustomize overlays per environment |
| **GitOps** | Argo CD or Flux — both free, both open source |

### 1.c · Service mesh & inter-agent communication

| Concern | Choice |
|---|---|
| **Service mesh** | Linkerd (free, lightest) or Istio (free, richer features). Default Linkerd for demo. |
| **mTLS** | Automatic via service mesh · zero-trust by default · all agent-to-agent traffic encrypted |
| **Protocol** | MCP over HTTP/2 + gRPC for high-throughput tool calls · server-sent events for streaming responses |
| **Discovery** | Kubernetes DNS · or HashiCorp Consul for cross-cluster |
| **Auth between agents** | SPIFFE / SPIRE workload identity (free, open source, CNCF graduated) |
| **Rate limiting** | Envoy filters or KEDA HPA |
| **Resilience** | Mesh handles retries, circuit breakers, deadlines — agent code stays simple |

### 1.d · Database independence

| Layer | Default (free) | Swap (enterprise) | Why portable |
|---|---|---|---|
| **OLTP** | PostgreSQL 16 (Supabase / Neon / self-hosted) | Oracle, SQL Server, DB2, Aurora | All speak SQL · use Drizzle or Prisma ORM |
| **Vector** | pgvector extension on Postgres | Pinecone, Weaviate, Qdrant, Milvus, OpenSearch k-NN | All speak similar vector-search semantics |
| **Object** | MinIO (free, S3-compatible) | AWS S3, Azure Blob, GCS, on-prem Ceph | S3 API is the lingua franca |
| **Queue** | NATS JetStream (free, lightweight) | Kafka / Redpanda / RabbitMQ / Azure Service Bus | Mesh adapter abstracts |
| **Cache** | KeyDB or DragonflyDB (free, Redis-compatible) | ElastiCache, Azure Cache | Redis protocol everywhere |
| **Document** | PostgreSQL JSONB | MongoDB Atlas | JSONB covers 90% of needs |

**Architectural rule:** every agent depends only on a `packages/storage/` interface. Implementations are pluggable. Demo tier uses Postgres + MinIO + NATS; enterprise can swap to Aurora + S3 + Kafka without touching agent code.

### 1.e · Browser independence

| Concern | Decision |
|---|---|
| **Frontend framework** | Stay framework-agnostic · server-rendered HTML with progressive enhancement (current approach is good) |
| **PWA** | Add `manifest.json` + service worker · works offline · installable on iOS/Android/desktop |
| **Browser API usage** | Detect-and-fallback for every modern API · Web Speech for mic → fallback to text · localStorage → fallback to in-memory + sync API |
| **No vendor lock-in** | No Chrome-only / Safari-only APIs in critical paths · feature-detect every time |
| **WebAssembly for crypto** | Use `@noble/curves` (TS) or compile Rust crates to WASM for ed25519, secp256k1 — runs identically in every browser |
| **Cross-OS** | Cowork desktop app works · web works · mobile responsive · tablet · TV (if anyone asks) |

### 1.f · Language / runtime independence

| Layer | Choice | Why |
|---|---|---|
| **Agent runtime** | Node.js (TypeScript) or Python · interchangeable via MCP protocol | Largest hireable pool, best LLM SDK support |
| **Polyglot allowed** | Yes — write any agent in Go, Rust, Java if the team has expertise | MCP is language-agnostic JSON-RPC |
| **No framework lock-in** | Hono (TS) or FastAPI (Py) for HTTP layer · both have lightweight, portable cores | Won't paint into a corner |

---

## 2 · Blockchain layer

### 2.a · XRP Ledger (XRPL) for payments and settlement

**Why XRPL for the payments tier:**

| Property | XRPL |
|---|---|
| **Finality** | 3–5 seconds, deterministic |
| **Transaction fee** | ~0.00001 XRP (≈ $0.000005 at current prices) — effectively free for banking volumes |
| **Throughput** | 1,500 TPS sustained on mainnet, 65,000 on XRPL EVM Sidechain |
| **Consensus** | Federated Byzantine Agreement (no mining, no staking lock-up, carbon-neutral) |
| **Native multi-currency** | Issue any fiat / stablecoin as an IOU on the ledger natively |
| **Built-in DEX** | On-ledger order book — atomic cross-currency swaps with autobridging |
| **Hooks** | Lightweight smart contracts on XRPL Mainnet (production rollout 2024-2025) |
| **EVM Sidechain** | Full Solidity contracts with XRPL bridge (mainnet 2025) |
| **Existing bank adoption** | SBI Holdings, Santander (via RippleNet), Bank of America, AMEX cross-border, JPM partnership for ODL |
| **Regulator stance** | SEC settled in 2023 — XRP itself ruled not a security in programmatic sales; banking use cases are clean |
| **Open source** | rippled is BSD-licensed, fully open source, multiple validator operators (not a single-company chain) |

**Agent maps to XRPL via the `apps/agents/xrpl-payments/` MCP server.** Tools include:

- `create_payment` — A→B with optional cross-currency path
- `path_find` — discover cheapest payment path between two currencies
- `issue_token` — bank issues a stablecoin / loyalty token / receivable
- `setup_trustline` — counterparty acknowledgment for an issued asset
- `escrow_create` / `escrow_finish` — conditional payments (time, hash, or smart-contract escape)
- `payment_channel_*` — high-volume off-ledger micropayments with on-ledger settlement
- `dex_offer_*` — post / fill / cancel orders in the on-ledger DEX
- `mpt_*` — Multi-Purpose Tokens (XLS-33d, fungible asset framework launching 2025)

**Networks supported:**
- **Devnet** — for local development, free XRP from faucet
- **Testnet** — for pre-prod validation, free
- **Mainnet** — for production · agent supports both real-money and dry-run modes

**Library:** `xrpl.js` (official, MIT-licensed) for Node/Browser agents · `xrpl-py` for Python agents · both are MCP-tool-ready.

### 2.b · EVM (Ethereum-family) for smart contracts and tokenized assets

**Why EVM over Solana for banking-grade contracts:**

| Criterion | Ethereum / EVM | Solana | Winner for banks |
|---|---|---|---|
| **Regulator familiarity** | High — JPM Onyx, BNY Mellon, Citi, BlackRock, HSBC all on EVM | Lower — fewer regulated deployments | **EVM** |
| **Audit ecosystem** | Massive — OpenZeppelin, Trail of Bits, ConsenSys Diligence, Halborn | Smaller, fewer Solana-specific auditors | **EVM** |
| **Permissioned chain options** | Hyperledger Besu, Quorum, Canton, Polygon Edge — all production-grade | Limited (Solana fork is non-trivial) | **EVM** |
| **Token standards for finance** | ERC-3643 (T-REX) for permissioned securities, ERC-20, ERC-721, ERC-1400, ERC-4626 | SPL token, fewer compliance-aware standards | **EVM** |
| **DeFi composability** | Highest — Aave, Compound, Maker, Curve | Solid but smaller institutional layer | **EVM** |
| **Network reliability** | Ethereum L1 has never had unscheduled downtime | Solana has had multi-hour outages (2022, 2023) | **EVM** |
| **Throughput / cost** | L1 expensive, L2s (Arbitrum, Optimism, Base, Polygon zkEVM, Linea) solve it | Native high throughput, sub-cent fees | Solana edges retail, EVM L2 is competitive |
| **Developer tooling** | Hardhat, Foundry, ethers, viem, wagmi, OpenZeppelin · most mature | Anchor, web3.js · improving but newer | **EVM** |
| **Language** | Solidity (Java-like, well-understood by enterprise) | Rust + Anchor (steeper curve for traditional banks) | **EVM** |
| **Existing bank reference architectures** | Project Guardian (MAS), Onyx (JPM), Partior (DBS/JPM/SC), Canton Network (DRW, Goldman) | Almost none | **EVM** |

**Recommendation: Use EVM as primary, with two deployment modes:**

1. **Permissioned (private / consortium):** Hyperledger Besu — full Ethereum compatibility, BFT consensus (QBFT or IBFT 2.0), open source, runs in our containers. Used by Onyx (JPM), Komgo (trade finance), Eureka (CBDC pilots).

2. **Public L2 (regulated DeFi, tokenized RWA):** Polygon zkEVM, Arbitrum, Optimism, or Linea. Public chain inherits Ethereum security; banks use it for tokenized treasury bonds, MMFs, settlement (real examples: BlackRock BUIDL on Ethereum, Franklin BENJI on Ethereum/Polygon).

**Solana is not recommended for the contracts tier**, but a `apps/agents/solana/` MCP server can be added later for specific retail use cases (micropayments, NFT-based loyalty) where its throughput edge matters.

**Agent maps to EVM via `apps/agents/evm-contracts/` MCP server.** Tools include:

- `deploy_contract` — compile + deploy Solidity from a template
- `call_view` / `call_write` — invoke any deployed contract
- `mint_token_3643` — issue compliance-aware tokenized asset (ERC-3643)
- `transfer_with_compliance` — moves token, runs on-chain identity check
- `governance_propose` / `governance_vote` — DAO-style approvals
- `subscribe_event` — webhook on contract events
- `bridge_to_xrpl` — burn-and-mint between XRPL Sidechain and EVM L2
- `simulate_tx` — Tenderly-style dry run before signing

**Templates shipped on day one (Solidity, audited):**
- ERC-3643 permissioned token
- ERC-4626 tokenized vault (e.g. MMF shares)
- Multi-sig wallet (Safe-compatible)
- Bond contract (T+0 settlement)
- Letter of Credit (trade finance)
- Escrow / dispute contract
- DAO governance (OpenZeppelin Governor)

### 2.c · Optional Solana for retail / high-throughput

Add `apps/agents/solana/` only when a customer explicitly needs:
- Sub-cent fees on a public chain
- Sub-second settlement on a public chain
- NFT-style loyalty programs (cards rewards, etc.)

Tools: `transfer_spl`, `mint_nft`, `swap_orca`, `query_account`. Library: `@solana/web3.js`. This is optional and not blocking.

### 2.d · Cross-chain bridge architecture

Banks rarely sit on one chain. The platform must bridge cleanly:

| Bridge | Purpose | Tech |
|---|---|---|
| **XRPL ↔ EVM** | Native XRPL EVM Sidechain bridge (Axelar / Squid) | Burn-and-mint, audited |
| **EVM ↔ EVM L2** | Chainlink CCIP or LayerZero | Both used by tier-1 banks |
| **Internal vs external** | Permissioned-chain ↔ public via a Bridge Agent with HITL approval | Every cross-boundary tx requires explicit human sign-off |

### 2.e · Custody, keys, signing

Banks don't use hot wallets. The platform supports:

| Mode | Use |
|---|---|
| **Demo / Cowork** | Browser keys via `@noble/curves` · seed phrase in memory only · WARNING banner |
| **Pilot** | Cloud HSM (AWS CloudHSM, Azure Managed HSM, GCP Cloud HSM) · per-tenant CMK |
| **Enterprise** | On-prem HSM (Thales Luna, Utimaco, Entrust nShield) · physical key custody · multi-party computation (MPC via Fireblocks SDK / Coinbase WaaS / DIY with `@safeheron/sdk`) |
| **Air-gap signing** | Cold wallet workflow — agent produces unsigned tx, ops team signs offline, agent broadcasts signed payload |

**Critical rule:** the platform's container code **never** holds production private keys. Always delegates to HSM / MPC / hardware wallet.

---

## 3 · Revised zero-cost stack (container-friendly free tiers)

The Cloudflare-only stack from the prior plan still works, but it locks you to Cloudflare's runtime. The new container-first stack uses Cloudflare optionally and runs anywhere:

| Layer | Demo tier (free) | Notes |
|---|---|---|
| **Container runtime** | Oracle Cloud Free Tier (4 always-free ARM VMs, 24 GB RAM, 200 GB block storage) running k3s | Best free K8s option — generous, persistent |
| **Backup compute** | Fly.io free tier (3 shared VMs) · Google Cloud Run (2 M req/mo) · Northflank free · Koyeb free | Failover / multi-region demo |
| **Edge / static** | Cloudflare Pages (unchanged) | Still serves static assets and acts as cache |
| **CDN + WAF** | Cloudflare free tier | DDoS protection included |
| **Image registry** | GitHub Container Registry · ghcr.io (free for public) | Sign with Cosign |
| **Postgres** | Supabase free (500 MB) · Neon free (3 GB) · Aiven free trial · self-host on Oracle VM | pgvector included |
| **Object** | Cloudflare R2 (10 GB) · self-host MinIO on Oracle VM (200 GB) | S3 API |
| **Queue** | NATS JetStream self-hosted on Oracle VM | Free, lightweight |
| **Cache** | KeyDB self-hosted on Oracle VM | Redis-compatible, free |
| **LLM** | Groq free tier (Llama 3.3 70B, 30 RPM) · Cloudflare Workers AI free · Together.ai free tier | Multiple providers, rotate |
| **Embeddings** | pgvector + nomic-embed-text running locally in containers · or Workers AI BGE | All free |
| **GitOps** | Argo CD self-hosted on Oracle k3s | Free |
| **Observability** | Grafana Cloud free (10 K metrics, 50 GB logs) + OpenTelemetry collector | Free, OTel-native |
| **CI** | GitHub Actions (unlimited public repos) | Free |
| **Container security** | Trivy + Cosign + Falco — all open source, free | Free |
| **Service mesh** | Linkerd OSS or Istio OSS | Free |
| **Blockchain — XRPL** | Devnet + Testnet free · Mainnet ~$0 fees | Free for demo, near-free for prod |
| **Blockchain — EVM private** | Hyperledger Besu self-hosted on Oracle VM | Free open source |
| **Blockchain — EVM public testnets** | Sepolia, Polygon Amoy, Arbitrum Sepolia | Free for dev |
| **Blockchain — EVM public mainnet** | Polygon zkEVM (~$0.001/tx), Arbitrum (~$0.05/tx) | Cheap for demo; paid for prod transactions |
| **Wallet / key mgmt** | `@noble/curves` in browser + WalletConnect for external wallets | Free libs |
| **HSM (demo)** | Software HSM (SoftHSM2) running in container | Free, OK for non-prod |

**Total ceiling at demo scale:** still $0/month for the platform itself (Oracle's Always Free is the big unlock here — generous enough to host the whole agent fleet, the databases, and a private Besu chain). Mainnet blockchain TX costs apply only when you actually transact on public chains; even Polygon zkEVM at $0.001/tx is rounding error for demos.

**Oracle Cloud Free Tier is the recommended primary host** for the containerized demo — it gives you persistent VMs, not just compute time, and it's truly "always free" (not a trial).

---

## 4 · Revised architecture diagram

```
                                    ┌────────────────────────────┐
                                    │  Browser (any · PWA-ready) │
                                    │  Cowork desktop · Mobile   │
                                    └─────────────┬──────────────┘
                                                  │ HTTPS
                                                  ▼
                              ┌────────────────────────────────────┐
                              │   API Gateway (Envoy or Cloudflare)│
                              └─────────────┬──────────────────────┘
                                            │ mTLS (Linkerd / Istio)
                                            ▼
                  ┌─────────────────────────────────────────────────────────┐
                  │              KUBERNETES CLUSTER (any K8s)               │
                  │                                                         │
                  │  ┌─────────────────────────────────────────────────┐    │
                  │  │     MASTER AGENT (Node/TS container)            │    │
                  │  │       · intent · MCP client · tool registry     │    │
                  │  │       · LLM via Groq / Bedrock / Azure OpenAI   │    │
                  │  └─────────────┬────────────────────┬──────────────┘    │
                  │                │                    │                   │
                  │  ┌──────────┐  │   ┌──────────┐    │   ┌────────────┐  │
                  │  │Discovery │◄─┼──►│Knowledge │◄───┼──►│ IaC        │  │
                  │  │ container│  │   │+ RAG     │    │   │ container  │  │
                  │  └──────────┘  │   └──────────┘    │   └────────────┘  │
                  │  ┌──────────┐  │   ┌──────────┐    │   ┌────────────┐  │
                  │  │Architect │◄─┼──►│Requirements◄──┼──►│ Operations │  │
                  │  └──────────┘  │   └──────────┘    │   └────────────┘  │
                  │  ┌──────────┐  │   ┌──────────┐    │   ┌────────────┐  │
                  │  │Actions   │◄─┼──►│ SOW       │◄──┼──►│ Governance │  │
                  │  └──────────┘  │   └──────────┘    │   └────────────┘  │
                  │                │                    │                   │
                  │  ┌─────────────▼─────┐   ┌─────────▼────────┐           │
                  │  │ XRPL Payments     │   │ EVM Contracts     │           │
                  │  │   agent            │   │   agent (Besu +   │           │
                  │  │ + xrpl.js          │   │   Polygon)        │           │
                  │  └─────────────┬─────┘   └─────────┬────────┘           │
                  │                │                    │                   │
                  │                ▼                    ▼                   │
                  │  ┌─────────────────────────────────────────────────┐    │
                  │  │       BLOCKCHAIN NODES (containerized)           │    │
                  │  │  · XRPL rippled (testnet/mainnet)                │    │
                  │  │  · Besu (private QBFT consortium)                │    │
                  │  │  · Polygon zkEVM client (light)                  │    │
                  │  └─────────────────────────────────────────────────┘    │
                  │                                                         │
                  │  ┌────────────────┐ ┌──────────────┐ ┌─────────────┐    │
                  │  │ Postgres + pgv │ │ MinIO (S3)   │ │ NATS queue  │    │
                  │  └────────────────┘ └──────────────┘ └─────────────┘    │
                  │                                                         │
                  │  ┌─────────────────────────────────────────────────┐    │
                  │  │  TEST MASTER + 8 test agents (containers)        │    │
                  │  │  · UI · API · SIT · Func · E2E · Perf · TestData │    │
                  │  │  · Evidence (xlsx · docx · pdf)                  │    │
                  │  └─────────────────────────────────────────────────┘    │
                  │                                                         │
                  └─────────────────────────────────────────────────────────┘
                                            │
                                            ▼
                      ┌─────────────────────────────────────────┐
                      │ OBSERVABILITY · GRAFANA · OTLP · LOKI   │
                      │ AUDIT · WORM (S3 Object Lock)           │
                      │ ANCHORING · OpenTimestamps              │
                      │ GitOps · Argo CD                        │
                      │ Image registry · ghcr.io + Cosign       │
                      └─────────────────────────────────────────┘
```

Same diagram runs on a developer laptop (kind/minikube), Oracle Cloud free tier (k3s), AWS EKS, Azure AKS, GCP GKE, Oracle OKE, IBM Cloud, or air-gapped OpenShift.

---

## 5 · Revised phase plan

Folding containerization + blockchain into the Batch E + Enterprise additions:

```
E-0   Platform abstractions + multi-tenancy schema             (6 h)   was 4h — adds DB + storage interfaces
E-0.5 Containerization scaffold (NEW)                          (8 h)   NEW · Dockerfiles · Helm chart base · k3s on Oracle free tier · Argo CD bootstrap
E-1   Foundation infra (now K8s-native, Cloudflare-optional)   (10 h)  was 8h — Postgres + MinIO + NATS containers
E-2   Master Agent (containerized · Groq + Bedrock pluggable)  (12 h)  unchanged uplift
E-3   10 feature sub-agents (each its own container)           (24 h)  unchanged uplift
E-3.5 Service mesh + SPIFFE workload identity (NEW)            (4 h)   NEW · Linkerd install · mTLS · cross-agent auth
E-4   RAG over pgvector (free open source) + tokenization      (8 h)   moved off Cloudflare Vectorize
E-5   TestData agent + faker + real-world API pulls            (4 h)   unchanged
E-6   Test framework (containerized runners)                   (16 h)  Playwright + k6 + Vitest in containers, GH Actions or self-hosted
E-7   Defect loop + audit trail anchoring (OpenTimestamps)     (8 h)   unchanged uplift
E-8   Scenario libraries · 30-region regulatory packs          (12 h)  unchanged
E-9   Insights agent + MRM Pack Generator                      (6 h)   unchanged
E-10  Observability (OTel · Grafana · Loki) + chaos schedule   (8 h)   moved off Better Stack to free Grafana Cloud
E-11  Adversarial red-team agent                               (5 h)   unchanged
E-12  Reference banking workflows (5 to start)                 (12 h)  unchanged
E-13  Marketplace scaffold (MCP SDK · dev portal)              (7 h)   unchanged
─────────────────────────────────────────────────────────────────────
E-14  XRPL Payments Agent (NEW)                                (10 h)  NEW · xrpl.js · 7 tools · testnet+mainnet · escrow + payment channels + DEX
E-15  EVM Contracts Agent (NEW)                                (12 h)  NEW · Besu private chain · Polygon zkEVM public · 7 audited templates · Cosign + Tenderly sim
E-16  Cross-chain bridge agent (NEW)                           (5 h)   NEW · XRPL ↔ EVM via Axelar · HITL approval per tx
E-17  Key custody + HSM integration (NEW)                      (6 h)   NEW · SoftHSM2 demo · CloudHSM / on-prem HSM adapter · MPC option
─────────────────────────────────────────────────────────────────────
Total                                                          165 h   (vs 132 h prior, vs 80 h original)
```

Still zero-cost at demo scale because the new pieces all use open-source software running on Oracle Cloud Always Free + GitHub Actions + public testnets.

---

## 6 · Updated paste-back prompts (key additions only)

The existing E-1 through E-13 prompts in `AGENTIC_ROADMAP.md` still apply — they just produce containers instead of Cloudflare Workers. The major new prompts:

### Phase E-0.5 — Containerization scaffold

> **Prompt E-0.5-a:** Create a top-level `containers/` directory with a `Dockerfile.base` (distroless node:22) and per-agent `Dockerfile`s under `apps/*/Dockerfile`. Multi-stage builds, multi-arch (`linux/amd64,linux/arm64`), final images ≤ 100 MB. Add a `docker-bake.hcl` for `docker buildx bake`. Sign all images with Cosign in CI.

> **Prompt E-0.5-b:** Author Helm chart skeletons at `charts/master-agent/`, `charts/<agent>/` per sub-agent, and a top-level umbrella chart `charts/aidp/` that installs all of them with one `helm install`. Include `values-demo.yaml`, `values-pilot.yaml`, `values-prod.yaml` overlays.

> **Prompt E-0.5-c:** Write `infra/k3s-oracle-free-tier.md` with the exact steps to provision 4 always-free Ampere VMs on Oracle Cloud, install k3s in HA mode, install Argo CD via its Helm chart, and point Argo CD at the `charts/aidp/` directory in the GitHub repo. End state: pushing to `main` deploys to the Oracle k3s cluster within 3 minutes.

> **Prompt E-0.5-d:** Add a `tools/local-dev.sh` script that spins up the entire platform locally via `kind` + Tilt. Developer runs one command, gets the master agent + 10 sub-agents + Postgres + MinIO + NATS + Besu + XRPL standalone all running on their laptop in under 5 minutes.

### Phase E-3.5 — Service mesh

> **Prompt E-3.5-a:** Install Linkerd on the cluster via `linkerd install | kubectl apply -f -`. Inject all platform namespaces. Verify mTLS is active on every pod-to-pod call. Add a Linkerd dashboard ingress route.

> **Prompt E-3.5-b:** Install SPIRE for workload identity. Issue a SPIFFE ID per sub-agent. Update the master agent's `mcp-client.ts` to authenticate to sub-agents via SPIFFE JWT (no shared secrets).

### Phase E-14 — XRPL Payments Agent

> **Prompt E-14-a:** Scaffold `apps/agents/xrpl-payments/` (TypeScript, Hono, containerized). Add `xrpl.js`. Implement 4 tools: `create_payment`, `path_find`, `setup_trustline`, `issue_token`. Devnet/Testnet/Mainnet selectable via env var. Every mutating tool requires the HITL confirmation pattern from Phase E-2 — no payment ever sends without an explicit user "confirm" message.

> **Prompt E-14-b:** Add 3 more tools: `escrow_create`, `escrow_finish`, `payment_channel_open`. Add `dex_offer_create` for cross-currency atomic swaps using XRPL's autobridging.

> **Prompt E-14-c:** Wire the existing `blockchain-rwa.html` "Send to Discovery" path to also surface a `create_xrpl_pilot` action that calls the XRPL agent to set up a testnet wallet, issue a sample token, and run a 10-transaction simulation. Record results as a Knowledge artifact (Phase E-3 knowledge agent).

> **Prompt E-14-d:** Add `apps/agents/xrpl-payments/run-node.md` and a Helm sub-chart for running a `rippled` validator container in the cluster (devnet config). For demo, the agent talks to the public testnet; for pilot+, talks to the in-cluster rippled.

### Phase E-15 — EVM Contracts Agent

> **Prompt E-15-a:** Scaffold `apps/agents/evm-contracts/` with `ethers v6` and `viem`. Two providers: in-cluster Besu (private) and Polygon zkEVM (public). Selectable per tool call. Tools: `deploy_contract`, `call_view`, `call_write`, `simulate_tx`, `subscribe_event`.

> **Prompt E-15-b:** Ship 7 audited Solidity templates in `contracts/`: ERC-3643 permissioned token · ERC-4626 vault · Safe-compatible multisig · Bond contract · Letter of Credit · Escrow · Governor. Each pre-compiled · ABI in the agent's tool schema · Hardhat + Foundry tests included.

> **Prompt E-15-c:** Add Helm sub-chart for Hyperledger Besu running QBFT consensus with 4 validator nodes inside the cluster. Genesis pre-funded for demo · ENS-style registry deployed for human-readable names.

> **Prompt E-15-d:** Add `mint_token_3643` and `transfer_with_compliance` tools that talk to the deployed ERC-3643 contract. On every transfer, the contract checks the on-chain identity registry · agent surfaces the compliance check result to the user.

### Phase E-16 — Cross-chain bridge

> **Prompt E-16-a:** Add `apps/agents/bridge/` with one tool `bridge_xrpl_evm`. Uses Axelar's ITS (Interchain Token Service) on testnet. Every bridge call requires HITL approval and writes the full burn-mint trace to the audit trail. No autonomous bridging.

### Phase E-17 — Key custody

> **Prompt E-17-a:** Add `packages/custody/` with three providers: `SoftHSMProvider` (demo), `CloudHSMProvider` (AWS/Azure/GCP), `MpcProvider` (Safeheron-style threshold signing). All agents that sign blockchain transactions go through `packages/custody/sign()` — no agent ever holds raw private keys.

> **Prompt E-17-b:** Add a key-rotation Cron job that rotates demo SoftHSM keys monthly. Pilot+ tiers use HSM-managed rotation.

---

## 7 · What this buys you (the pitch in three lines)

1. **Container-native** — runs on any K8s, on any cloud, on a laptop, on-prem, air-gapped. A bank picks the substrate; the platform doesn't care.
2. **Blockchain-native** — XRPL for payments and FX (sub-second, near-free, multi-currency native), EVM for tokenized assets and smart contracts (regulator-familiar, audited templates, permissioned + public modes).
3. **Database / browser / OS / language independent** — every dependency behind an interface. Demo runs free on Oracle. Production runs anywhere the bank wants.

This is the architecture you can put in front of any tier-1 bank's CTO and chief architect without flinching.

---

## 8 · Migration order from current state

If you want to ship this without abandoning the current static site:

1. **Keep the current static site running.** It stays the UI layer.
2. **Phase E-0 + E-0.5 first.** Stand up the Oracle k3s cluster + Argo CD + image registry. Cost: $0. Value: you have a real, reproducible cluster.
3. **Then Phase E-1 → E-3 sub-agents.** Each new agent shipped is a container that runs alongside (not replacing) the existing static feature page. The page can opt-in to call the agent.
4. **Then E-14 / E-15.** Blockchain agents become available as new MCP tools — the existing Blockchain-RWA page just gains real backing.
5. **Then E-6 onwards.** Testing, defects, observability.

At every step, the demo at `aidigitalplanner.com` (or wherever it's hosted today) keeps working. Nothing breaks.

---

## 9 · Final composite recommendation

Use **all three documents together**:

- `AGENTIC_ROADMAP.md` — the original 10-phase agent build (E-1 → E-10).
- `ENTERPRISE_GRADE_RECOMMENDATIONS.md` — the 17 enterprise upgrades, of which §15 items 1-10 fold into Batch E as 4 new phases (E-11 → E-13 + adjustments).
- `CONTAINERIZED_BLOCKCHAIN_ARCHITECTURE.md` — this document, adding E-0.5 + E-3.5 + E-14 → E-17.

**Master phase list (final form):** E-0 → E-17 totaling ~165 hours of work, deployable to Oracle Cloud Always Free + free testnets + free observability tools at $0/month. Same code redeployable to any tier-1 bank's enterprise substrate by swapping Helm value files.

When you're ready to start, the recommended first prompt is **Prompt E-0.5-c** (provision Oracle k3s + Argo CD). That gives you a real cluster the first day, and everything else follows.

