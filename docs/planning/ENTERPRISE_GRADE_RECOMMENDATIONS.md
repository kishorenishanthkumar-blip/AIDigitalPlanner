# Enterprise-Grade Agentic AI for Banks · Recommended Upgrades to the Batch E Roadmap

**Purpose:** Strategic upgrades that turn the Batch E plan from a "great working demo" into a deployable enterprise-grade agentic banking platform that any bank — tier-1 global to community — can adopt.

**Honest tension to resolve up front:** "Zero cost forever" and "enterprise banking grade" cannot both be true for production. The right framing is: **build once, deploy across three tiers** — Cowork / public demo (free tier, current Batch E plan), pilot / regulated sandbox (per-bank, $200–2000/mo), and enterprise (per-bank, $20K-200K/mo). Same codebase, different deployment substrate. The Batch E architecture supports this if these recommendations are baked in early.

---

## 1 · Reframe the substrate: build once, deploy three ways

**Today's Batch E plan** assumes Cloudflare + Groq + GitHub. That's perfect for a public demo, but tier-1 banks won't run regulated workloads on Cloudflare or send prompts to Groq.

**Recommendation:** Abstract every infrastructure dependency behind a swappable interface. The same agent code runs on three deployment profiles:

| Tier | Compute | DB / Vectors | LLM | Hosting | Target |
|---|---|---|---|---|---|
| **Demo** (Cowork) | Cloudflare Workers | D1 + Vectorize | Groq Llama | Cloudflare Pages | Public showcase, free |
| **Pilot** (per bank) | AWS Lambda / Azure Functions | RDS + OpenSearch / pgvector | Claude on Bedrock / Azure OpenAI | Private subdomain | Regulated sandbox, ≤6 months |
| **Enterprise** (per bank) | EKS / AKS / OpenShift on-prem | Aurora / Cosmos / Oracle + Pinecone | Bedrock + customer-supplied keys (BYOK) | Customer VPC, optional air-gap | Production, multi-year |

**What to add to Batch E:** Phase E-0 (new) — define `packages/platform/` with `Compute`, `Storage`, `Vectors`, `LLM`, `Queue`, `Logger`, `Secrets` interfaces. Every agent only depends on these interfaces. The Cloudflare implementations in E-1 are just one of three providers. **This single change protects every line of code from substrate rewrites later.**

---

## 2 · Banking-grade trust & safety layer

Banks don't deploy any AI without these four things. They are the difference between "we evaluated it" and "we bought it."

### 2.a · Model risk management (SR 11-7 / FFIEC / EBA)

Every model decision needs documentation that satisfies the bank's MRM team. Add **MRM Pack Generator** — an agent that produces:

- Model card (intended use, limitations, training data lineage if known)
- Champion/challenger evaluation log
- Backtest results against golden datasets
- Bias / fairness metrics across protected attributes
- Lineage trace (which prompts → which retrievals → which model → which output)

**Phase E-9 addition:** an automated MRM pack regenerates on every model swap. Banks can hand it to their MRM committee unchanged.

### 2.b · Human-in-the-loop gates

No agent ever executes a banking-significant action without explicit human approval. Add a **HITL gate matrix** in the master agent:

| Action class | Gate |
|---|---|
| Read-only retrieval, summarization | No gate |
| Generate document, recommendation, score | No gate, but mark as "advisory only" |
| Modify in-app state (Discovery, SOW) | Single-click confirmation |
| Push to external system (Jira, GitHub) | Confirmation + signed JWT |
| Anything touching money, balances, customer data | 4-eyes approval + reason code + immutable audit |

### 2.c · Explainability & citation enforcement

**Every agent answer cites sources.** If the master agent can't produce at least one citation (KB chunk, agent call, or computed value) it refuses to answer with the message "I don't have a confident source for this." Banks tolerate "I don't know" — they don't tolerate hallucinations.

Add a **citation validator** between the LLM and the user: parses out claims, requires each claim to map to a source. If any claim lacks a source, the answer is rewritten or rejected.

### 2.d · Prompt injection & jailbreak defense

Bank documents and customer messages routinely contain hostile content (deliberate or accidental). Add a **guardrail agent** that:

- Scans every incoming user message and retrieved RAG chunk for prompt-injection patterns (Lakera, NeMo Guardrails, or DIY classifier on Workers AI)
- Strips/escapes detected injections before they reach the main LLM
- Logs the attempt for SOC review
- Quarantines repeat offenders

---

## 3 · Identity, access, and tenancy (the unsexy stuff that gates every sale)

Banks won't issue a procurement contract without these.

**Add to Phase E-1:**

- **Enterprise SSO** — SAML 2.0 + OIDC + SCIM provisioning. Default IdPs to support: Okta, Azure AD / Entra, Ping, ForgeRock. The current localStorage-only auth is fine for Cowork demo; the pilot / enterprise tiers need SSO out of the box.
- **MFA + passkeys** — FIDO2 / WebAuthn. Cheap to add via WebAuthn JS — no third-party cost.
- **PAM integration** — for admin / break-glass roles, integrate with CyberArk / BeyondTrust via JIT credential brokering.
- **Multi-tenant data isolation** — per-tenant D1 / DB schema · per-tenant Vectorize namespace · per-tenant R2 prefix · per-tenant encryption key. Cross-tenant access impossible at the storage layer, not just the app layer.
- **Workload identity for agents** — every agent has its own service identity (signed JWT from an internal issuer) so an attacker who pops one agent can't impersonate another.

---

## 4 · Data residency, sovereignty, BYOK

The 2024 Schrems II rulings + DORA + India's DPDP + China's PIPL + Saudi PDPL mean tier-1 banks can't store EU customer data in the US, can't have US engineers access raw EU data, etc.

**Add:**

- **Sovereign deployment topology** — every tenant declares their data-residency region(s); the platform refuses to write or read across declared boundaries. The current "region picker" needs to become a hard enforcement layer, not a UI hint.
- **BYOK (bring your own key)** — customer-managed encryption keys via AWS KMS / Azure Key Vault / GCP KMS. Every D1 / DB write encrypted with the customer's CMK. Crypto-shredding for right-to-be-forgotten requests just deletes the key.
- **HYOK (hold your own key) option** — for tier-1 banks, an on-prem HSM holds the master key. Platform can decrypt only when the HSM is reachable.
- **Data lineage tracking** — every artifact records the chain: which raw input → which prompt → which RAG chunk → which agent → which output. Required by GDPR Art. 22, BCBS 239, RBI DLT framework.
- **Tokenization at ingress** — PII (account numbers, SSNs, names) gets tokenized before reaching the LLM. The LLM sees `[CUST_TOKEN_4f7a2b]` not `John Smith · 4111-1111-1111-1111`. Re-hydration only at render time, only client-side.

---

## 5 · Immutable, regulator-friendly audit

Right now the audit log lives in localStorage and "never transmits." That's fine for the demo. Banks need:

- **Append-only WORM storage** — every agent action, every prompt, every response, every tool call, every CR — written to an append-only log (AWS S3 Object Lock / Azure immutable blob / on-prem WORM filer).
- **Cryptographic anchoring** — daily Merkle root posted to a public chain (Bitcoin via OpenTimestamps is free) so regulators can verify the log wasn't altered.
- **Searchable audit** — backed by OpenSearch / Elasticsearch (not just D1), retention policies, legal-hold mode, 7-year retention default.
- **Regulator export** — one-click export of a date-range slice as a digitally-signed PDF + JSONL bundle.

**Phase E-7 addition:** every CR / patch / deploy goes through audit. Banks need to prove no one can roll an unauthorized code change into prod.

---

## 6 · Production resilience

Banks measure platforms by uptime, not features.

- **Multi-region active-active** — across at least 2 regions per tenant, with cross-region data replication respecting residency constraints.
- **RTO ≤ 15 min, RPO ≤ 1 min** — explicit DR runbook tested quarterly.
- **Chaos engineering** — Phase E-10 already has a single chaos test; expand to a continuous chaos schedule (Gremlin / Litmus / custom). At minimum: weekly random worker kill, monthly region failover.
- **Saga pattern for distributed transactions** — when an agent flow spans multiple sub-agents and any step fails, compensating actions undo earlier writes. The current Batch E plan assumes happy-path orchestration; this needs to be hardened.
- **Idempotency keys** — every mutating MCP tool call includes a client-provided idempotency key. Replays are safe.
- **Circuit breakers** — master agent stops calling a sub-agent that's been failing > N times in M seconds, returns a graceful fallback.

---

## 7 · Core banking & payment-rail integration depth

The platform is only as useful as what it can talk to. Banks expect MCP servers (or adapters) for:

| Domain | Systems |
|---|---|
| **Core banking** | Temenos T24, Infosys Finacle, FIS Profile / Modern Banking Platform, TCS BaNCS, Mambu, Thought Machine Vault |
| **Payments** | SWIFT, ISO 20022, FedNow / RTP / SEPA Inst, UPI, PIX, Faster Payments, SWIFT GPI |
| **Cards** | Visa VPP, Mastercard MDES, Amex Acquirer, in-house auth platforms |
| **KYC / AML** | LexisNexis Bridger, Refinitiv World-Check, Trulioo, ComplyAdvantage, Quantexa |
| **Risk** | SAS, Moody's, Fenergo, Murex |
| **Market data** | Bloomberg, Refinitiv, ICE, internal MDS |
| **Document mgmt** | OpenText, SharePoint, FileNet |
| **Ticketing** | ServiceNow, Jira Service Mgmt, BMC Remedy |
| **Identity** | Active Directory, Entra ID, Okta, Ping |
| **Observability** | Splunk, Datadog, Dynatrace, AppDynamics, Elastic |
| **GRC** | Archer, MetricStream, ServiceNow IRM |

**Add:** **Phase E-11 (new) — Integration MCP server library.** Build 10 highest-value integrations as MCP servers (each is a partner contract opportunity). Make every integration optional / pluggable so a bank can deploy only the ones they have.

---

## 8 · First-class banking workflows (not just generic modernization)

The current platform's 10 features (Discovery, Architecture, etc.) are about **delivering a modernization program**. To be enterprise-grade for *banks*, add workflows banks live in every day:

| Workflow | What the agent does |
|---|---|
| **Onboarding (CIP / CDD / EDD)** | Drives KYC → risk score → manual review queue → final decision · agents coordinate KYC vendor, sanctions screening, document classification |
| **Loan origination** | Application → credit decisioning → fraud check → underwriter assist → docs generation → funding |
| **Dispute / chargeback** | Customer complaint → policy lookup → resolution drafting → financial impact calc → 4-eyes approval → submit to network |
| **Trade settlement** | T+1 / T+0 reconciliation · break investigation · saga compensation |
| **Treasury / liquidity** | Cash forecasting · intraday limit monitoring · funding decisions |
| **Wealth advisor copilot** | Portfolio review · rebalancing proposals · compliance disclosure generation |
| **Branch teller assist** | Customer authentication via voice · transaction anomaly detection · regulatory disclosure surface |
| **Fraud investigation** | Alert triage · graph linking · case package assembly · SAR drafting |
| **Regulatory reporting** | BCBS 239 · CCAR · ICAAP · FATCA / CRS · CRR · COREP / FINREP |
| **AI/risk governance** | Model inventory · approval workflows · ongoing validation triggers |

Each becomes a workflow that orchestrates the 10 feature sub-agents plus integration sub-agents. **Phase E-12 (new)** — 5 reference workflows (Onboarding, Loan origination, Dispute, Fraud, Regulatory reporting) shipped as templates.

---

## 9 · AgentOps & continuous evaluation

Models drift, prompts decay, vendors deprecate. Banks won't trust an agent platform without explicit ops controls.

**Add:**

- **Agent versioning** — every agent / prompt / tool schema is versioned. Roll forward / back at runtime per tenant.
- **A/B testing & canary** — route X% of traffic to a candidate prompt/model, compare quality / latency / cost metrics, auto-promote or roll back.
- **Eval-as-code** — every agent has a `evals.yaml` with golden inputs + expected behavior. Runs on every commit (extend Phase E-6 T4 backend tests).
- **Drift detection** — compare today's response distribution to last-30-days baseline. Alert on KL-divergence threshold breach.
- **Cost per conversation** — surface in real time per tenant; alert when conversation cost exceeds tenant SLA.
- **Latency budget per agent hop** — explicit budget (e.g. 50ms KB retrieve + 200ms LLM + 50ms tool = 300ms total); break-glass alarm when budget exceeded.
- **Red-team agent** — an adversarial agent runs nightly trying to break guardrails. Failures fed into Phase E-7 CR loop with `severity-redteam` tag.

---

## 10 · Localization & regional packs (already partially there — extend it)

The platform has per-country regulator data. Push it further:

- **30+ languages** for UI + Nishi responses (browser-side i18n + LLM-side instructed translation).
- **Multi-currency, real-time FX** — every dollar figure adapts.
- **Regional regulatory MCP servers** — separate sub-agents per region so an EU-deployed instance never loads US-only logic. Reduces attack surface and simplifies compliance.
- **Local payment rail knowledge** — UPI / PIX / Faster Payments / SEPA / FedNow / RTP variants each as a reference template.
- **Localized scenarios in Phase E-8** — instead of one regulatory YAML, ship one per region (US · EU · UK · Singapore · India · Australia · Brazil · Saudi · UAE · Hong Kong · Japan · Canada · Mexico · South Africa).

---

## 11 · Observability that meets bank ops standards

Phase E-10 introduces Better Stack — good for the free demo. Enterprise tiers need:

- **OpenTelemetry-native** — emit OTLP traces from every agent. Banks plug their existing Splunk / Datadog / Elastic.
- **Distributed tracing across agent hops** — one trace ID follows a user message through every agent / tool / DB / LLM call.
- **PII-aware logging** — automatic redaction in logs (Presidio or in-house regex packs).
- **SOC integration** — agent decisions / failures can fire as SOC alerts (Splunk ES / Sentinel / QRadar).
- **Continuous compliance dashboard** — DORA + SOC 2 control posture in real time, per tenant.

---

## 12 · Marketplace & ecosystem (the moat)

Banks each have unique integrations. You can't ship them all. **Open the MCP server interface** to partners.

- **MCP server marketplace** — registry of certified sub-agents banks can install (Anti-Fraud Agent, KYC Agent, Trade Surveillance Agent, ESG Reporting Agent).
- **Partner certification program** — security review + functional validation + MRM pack template = the "DI Platform Certified" badge.
- **Developer portal** — TS / Python / Java SDKs for writing MCP servers, sample agents, sandbox tenant.
- **Co-sell with cloud vendors** — list on AWS Marketplace, Azure Marketplace, GCP Marketplace. Free customer acquisition + simplified procurement for the bank.

---

## 13 · Compliance attestations (the buying-criteria checklist)

To clear bank procurement, the SaaS form of the platform needs:

- **SOC 2 Type II** (year 1 priority)
- **ISO 27001 + 27017 + 27018** (year 1-2)
- **PCI DSS Level 1** (if handling card data in pilots)
- **HIPAA** (US insurance / health banks)
- **FedRAMP Moderate / High** (US public sector banks)
- **C5** (German banks), **IRAP** (Australian), **MTCS Level 3** (Singapore), **K-ISMS** (Korea)
- **DORA register** as a critical ICT provider once banks pass €5M/yr threshold
- **Pen test reports** — annual + on major release
- **DPA + standard contractual clauses** — pre-negotiated GDPR Art. 28 + EU SCCs

Budget $500K-1.5M for first 24 months of these. They are non-negotiable for enterprise sales.

---

## 14 · Commercial model & packaging

The product needs a way to make money. Suggested tiering:

| Tier | Price | Constraints | Target |
|---|---|---|---|
| **Cowork demo** | Free | 5 users · 100 messages/day · public docs only | Show & tell, lead gen |
| **Sandbox** | $200/user/mo | 50 users · synthetic data only · isolated tenant | Pilot/POC, ≤90 days |
| **Pilot** | $500/user/mo + $50K/yr | 200 users · 1 region · 3 integrations | Bank's regulated sandbox |
| **Enterprise SaaS** | $1000/user/mo + $250K/yr | unlimited · multi-region · BYOK · all integrations | Production deployment |
| **Enterprise on-prem** | $1M-5M/yr | air-gapped · customer-managed · dedicated success | Tier-1 globals |
| **Marketplace agents** | rev share | 70/30 to partner | Ecosystem |

The Batch E free-tier architecture is the engine of the Cowork demo and the sandbox tier. The same code under different config + substrate runs the higher tiers.

---

## 15 · What to absolutely bake into Batch E even at zero cost

Most of the above costs real money or partner contracts to implement fully. But the **architectural decisions** that enable them must land in Batch E *now*, even if the implementation stays at "demo-tier free" today. Otherwise you'll have to rewrite later.

**Mandatory upgrades to the existing Batch E plan:**

1. **New Phase E-0 · Platform abstractions** (4 h) — `packages/platform/` with swappable interfaces (Compute, Storage, Vectors, LLM, Queue, Logger, Secrets). Demo deploys to Cloudflare; the same code can target AWS / Azure / GCP / on-prem when paying customers arrive. Without this, every later substrate change is a rewrite.

2. **Modify Phase E-1 · Multi-tenant from day one** — every D1 / Vectorize / R2 key prefixed with `tenant_id`. Even if the demo only has tenant `cowork-public`, the schema is multi-tenant on day one. Adding tenancy later is a migration nightmare.

3. **Modify Phase E-2 · HITL gate matrix** — even on the free tier, every mutating tool call shows a confirmation in the Nishi chat bubble. This trains user expectations and is a regulator selling point.

4. **Modify Phase E-2 · Citation enforcement** — every Nishi answer either includes a citation or marks itself "no confident source." Trivial to add now, embarrassing to add later.

5. **Modify Phase E-3 · MRM logging hook** — every agent call emits a `mrm_log` event (prompt, model, retrieval IDs, output, latency). Demo writes to D1; enterprise writes to WORM storage. Same code.

6. **Modify Phase E-4 · Tokenization layer** — even with synthetic demo data, run a tokenizer over prompts. Demo: stub that passes through. Enterprise: real Presidio / regex packs. Same interface.

7. **Modify Phase E-6 · Add Security & Compliance test categories** — beyond the 5 categories already in Phase E-8, add `security.yaml` (prompt injection, jailbreak, exfiltration) and `compliance.yaml` (GDPR Art. 22, SR 11-7, DORA controls).

8. **New Phase E-11 · Adversarial / red-team agent** — runs nightly against the platform, files CRs. 4-6 hours of work; massive trust uplift.

9. **New Phase E-12 · Reference banking workflows** — even at the demo tier, ship 2-3 reference workflows (Onboarding, Dispute) so prospects see the platform isn't generic modernization theater. 8-12 hours of work.

10. **New Phase E-13 · Marketplace scaffolding** — published MCP SDK + a sample partner agent + a developer portal page (`developers.aidigitalplanner.com`). Doesn't need to be feature-rich; it just needs to exist so partners can start building. 6-8 hours.

**Total uplift to Batch E:** ~40 hours of additional work spread across the 10 existing phases. Result: a platform that demos free but is architecturally ready for a tier-1 bank procurement conversation.

---

## 16 · Roadmap revision proposal

Updated phase order with the recommendations baked in:

```
E-0  Platform abstractions + multi-tenancy schema             (4 h)  NEW
E-1  Cloudflare foundation (now multi-tenant from day 1)      (8 h)  +2h
E-2  Master Agent + HITL gates + citation enforcement         (12 h) +4h
E-3  10 sub-agents + MRM logging hooks                        (24 h) +4h
E-4  RAG + tokenization layer                                 (8 h)  +2h
E-5  TestData agent                                           (4 h)  no change
E-6  Test framework + security/compliance categories          (16 h) +2h
E-7  Defect loop + audit trail anchoring                      (8 h)  +2h
E-8  Scenario libraries + 30-region regulatory packs          (12 h) +4h
E-9  Insights agent + MRM Pack Generator                      (6 h)  +2h
E-10 Observability (OTel-native) + chaos schedule             (6 h)  +2h
E-11 Adversarial red-team agent                               (5 h)  NEW
E-12 Reference banking workflows (5 to start)                 (12 h) NEW
E-13 Marketplace scaffold (SDK + dev portal)                  (7 h)  NEW
─────────────────────────────────────────────────────────────────────
Total                                                         132 h  (+52 h from baseline 80 h)
```

Still all within free tiers at demo scale; ready to step up the moment a paying customer is in the room.

---

## 17 · Honest closing thought

The Batch E plan is excellent for what it is — a polished agentic demo that proves the architecture. The 17 items above are about making the same architecture **survive contact with a regulated bank's procurement, security, MRM, and operations teams**. Implementing all of them is years of work; implementing the **architectural** items in §15 (Phase E-0, multi-tenancy, HITL, citation, MRM hooks, tokenization, security testing, red team, reference workflows, marketplace scaffold) is achievable in the extra 52 hours and unlocks every later step.

The single highest-leverage change: **Phase E-0 platform abstractions.** It's 4 hours of work that makes every subsequent line of code portable across $0 demo · per-bank pilot · enterprise on-prem. Without it, your demo and your enterprise codebase will fork by month 6.

Recommendation: incorporate items 1, 2, 3, 4, 5, 6, 11, 12 from §15 directly into Batch E. The rest are post-Batch-E roadmap (Batches F, G, H) to be staged as paying customers come on board.

