# RENTipid Unified Autonomous AI Customer Service & Digital Human Module

## Complete Technical, Operational, Security, and AI Knowledge Center Manual

Document ID: RENTIPID-UNIFIED-AI-MANUAL-001  
Edition: 1.0  
Repository baseline: 894e77e6b9b3aab4a2cf9ace64ff4d8c03c273f2  
Branch: feature/soc-phase4-threat-response  
Prepared: 14 August 2026  
Classification: Approved internal technical and operational documentation  
Formal owner acceptance: Separate OAT decision; not granted by this document  

This manual consolidates the implemented Unified Autonomous AI Customer Service and Digital Human module, the canonical AI Knowledge Center / Knowledge Bootstrap and Synchronization Engine, its database model, runtime retrieval path, security boundaries, operational commands, OAT fixtures, testing evidence, and known limitations. It is repository-backed and does not replace deterministic domain policy, authorization, or owner acceptance.

[[TOC]]

# 1. Document Control

## 1.1 Purpose

This document provides one numbered reference for engineers, operators, reviewers, security administrators, compliance personnel, and owners responsible for RENTipid Unified AI. It explains what is implemented, how it is controlled, how approved knowledge becomes searchable, how live data remains protected, and how the module is validated and promoted.

## 1.2 Scope

The scope includes:

- conversational customer service through the Help and AI chat path;
- Mock AI response behavior used in controlled Preview testing;
- the Digital Human provider abstraction and present readiness boundary;
- session, conversation, support-case, evidence, resolution, and follow-up models;
- deterministic policy and tool-gateway boundaries;
- the canonical Knowledge Center registry, adapters, normalization, hashing, validation, chunking, synchronization, versioning, coverage, and retrieval;
- role-based visibility, secret exclusion, effective dates, and safe uncertainty;
- local/test and explicitly authorized Preview operations;
- Unified AI OAT registration, fixtures, actors, commands, and acceptance boundary.

It does not authorize Production mutation, expose secrets, redefine RENTipid RBAC, or convert live transactional records into static knowledge.

## 1.3 Authoritative Evidence Order

When facts conflict, use this order:

1. current tracked source at the stated repository baseline;
2. Prisma schema and additive migrations;
3. frozen Knowledge Implementation Registry and its SHA-256 freeze record;
4. automated tests and generated coverage evidence;
5. Preview deployment evidence for the exact commit;
6. owner-executed OAT evidence;
7. narrative summaries.

## 1.4 Status Vocabulary

- IMPLEMENTED: present in current tracked source.
- VERIFIED LOCAL: supported by local/test evidence.
- PREVIEW READY: source prerequisite is ready for controlled Preview validation.
- PENDING DEPLOYMENT: a tested commit exists but exact Preview deployment is not established by this document.
- OWNER ACCEPTANCE PENDING: technical readiness does not equal formal acceptance.
- NOT PRODUCTION AUTHORIZED: no Production mutation or rollout is approved.

# 2. Executive Summary

## 2.1 Module Mission

Unified AI provides a single controlled assistance layer across RENTipid. Its purpose is to explain approved platform knowledge, guide users through supported workflows, preserve role boundaries, hand live facts to authorized tools and domain services, and maintain auditable support interactions.

## 2.2 Two Authoritative Answer Paths

Unified AI has two deliberately separate authority paths:

1. Approved durable knowledge: AiKnowledgeSource and AiKnowledgeChunk records synchronized from a frozen allowlisted registry.
2. Authorized live data: existing domain services and the AI tool gateway, resolved under server-side identity, RBAC, policy, confirmation, and audit controls.

Static knowledge must never fabricate a current booking, payment, KYC request, claim, dispute, user, listing, runtime count, or security event. Knowledge explains rules and workflows; domain services own current state.

## 2.3 Knowledge Center Snapshot

Registry ID: KB1-INITIAL-146  
Frozen candidates: 146  
Accounted candidates: 146  
Synchronizable approved canonical sources: 107  
Unclassified: 0  
Unaccounted: 0  
Local accepted active chunks: 705  
Accepted Preview evidence before the latest OAT actor reconciliation: 107 sources, 704 chunks, 100% coverage  

Chunk totals may differ by one between environment evidence snapshots because synchronized versions and source formatting are environment-specific. Coverage, hash parity, active-version uniqueness, and zero missing/invalid/duplicate/stale sources are the controlling gates.

## 2.4 Current Provider Posture

The deterministic Mock provider is the approved Preview fallback. It returns retrieved approved knowledge when context exists and safe uncertainty when no relevant approved match exists. The DigitalHumanProviderAdapter remains pending provider credentials and must not be represented as a live production integration.

# 3. Architectural Principles

## 3.1 Governing Principles

1. Approved knowledge before generated claims.
2. Visibility filtering before relevance ranking.
3. Deterministic domain authority before language-model suggestion.
4. Safe uncertainty before unsupported policy invention.
5. Stable source identity and immutable supersession before in-place historical rewriting.
6. Explicit registry allowlisting before ingestion.
7. Secret and PII rejection before persistence.
8. Server-resolved actor identity before tool execution.
9. Idempotency and auditability for mutations.
10. Technical readiness before owner acceptance.

## 3.2 High-Level Component Map

```text
User / UI
   |
   v
/api/ai/chat and Help experience
   |
   v
processAICommand
   |-- settings and feature controls
   |-- bot access / RBAC
   |-- prompt-injection and guardrail checks
   |-- safe context construction
   |-- approved Knowledge Center retrieval
   |-- Mock or provider adapter
   |-- output protection and audit logging
   v
Grounded response or safe uncertainty

Live-data/action request
   |
   v
AI Tool Gateway -> server actor resolution -> RBAC -> policy -> confirmation
                -> domain service/database -> audit/verification

Knowledge lifecycle
   |
   v
Frozen registry -> adapter -> normalize -> validate -> chunk -> hash -> diff
                -> guarded sync -> version/supersede -> coverage -> retrieval
```

## 3.3 No Second AI or Knowledge Framework

The canonical runtime retrieval path is src/lib/ai/context/knowledge-retrieval.ts. The canonical Knowledge Center implementation is src/lib/ai/knowledge/. New modules register knowledge through the shared contract; they do not create parallel registries, retrieval engines, role systems, or vector stores.

# 4. Runtime Conversational Request Flow

## 4.1 API Entry

The POST handler at src/app/api/ai/chat/route.ts reads the authenticated NextAuth session, extracts the server session user ID and role, validates botId, prompt, and module, and sends an AIRequest to processAICommand. Missing required fields produce a client error; blocked requests return a user-facing blocked response.

## 4.2 Command-Layer Sequence

The command layer performs the following ordered controls:

1. load current AI settings;
2. enforce global, provider, module, and bot enablement;
3. enforce bot access for the current role;
4. inspect prompt injection through the security detection guard;
5. deny unauthorized tool-dispatch attempts;
6. apply the AI guardrail check;
7. build minimum safe context;
8. retrieve approved role-visible knowledge;
9. append an Approved Knowledge Context block only when retrieval returns a match;
10. execute the configured Mock/fallback provider;
11. apply output protection;
12. record a bounded response summary when logging is enabled.

## 4.3 Grounded Mock Behavior

The Mock provider is deterministic. When Approved Knowledge Context is present, it returns that approved content with source and heading provenance. When no approved knowledge qualifies, it returns safe uncertainty. It must not echo the prompt as the substantive answer, silently substitute a generic RENTipid overview, or invent policy.

## 4.4 Safe Uncertainty

The standard no-match outcome communicates that approved information is unavailable to confirm the claim. Exact wording may change, but it must preserve these properties:

- no fabricated fact;
- no unrelated overview fallback;
- no implied approval or guarantee;
- no business mutation;
- no secret disclosure.

# 5. Bot and Role Access

## 5.1 Bot Catalog

The bot vocabulary includes Concierge, Onboarding, KYC, Listing, Pricing, Category Compliance, Booking, Payment, Finance, Agreement, Inspection, Damage Claim, Dispute Review, Admin Copilot, Compliance, Security, Support, Analytics, and marketing-oriented assistants.

## 5.2 Authoritative Application Roles

The current application role vocabulary includes:

- Guest
- Renter
- Individual Provider
- Business Provider
- Admin
- Finance Admin
- Compliance Admin
- SOC_ANALYST
- SOC_SUPERVISOR
- Super Admin

Legacy aliases are normalized only for compatibility. Persisted OAT actors use the real application role strings.

## 5.3 Concierge Access

Guest, Renter, Individual Provider, Business Provider, and other explicitly authorized roles can access bots defined for them. A Renter may use normal Concierge help but cannot use knowledge or prompts to access another user's booking, payment, private case, RBAC changes, secrets, admin functions, or emergency controls.

## 5.4 Super Admin Knowledge Breadth

Super Admin may retrieve all approved knowledge legitimately classified for Public, Authenticated, lower-role, admin-role, SOC-role, and SUPER_ADMIN_ONLY visibility. This is an effective visibility rule grounded in RENTipid authorization. It does not grant access to SYSTEM_ONLY content, credentials, raw secrets, or unauthorized live-data bypasses.

# 6. Knowledge Center Overview

## 6.1 Purpose

The Knowledge Center transforms approved, controlled RENTipid material into structured, versioned, searchable records. It is broader than OAT fixtures and covers cross-platform manuals, customer guidance, policies, role procedures, module status, configuration-backed facts, published routes, and approved structured providers.

## 6.2 What the Knowledge Center Stores

- durable approved explanations;
- policies and marketplace rules;
- renter and provider guidance;
- listing, booking, cancellation, payment, deposit, KYC, insurance, claims, dispute, privacy, safety, Social, address, profile, role, and workflow guidance;
- approved module and release status documentation;
- allowlisted configuration-backed descriptive facts;
- provenance, authority, visibility, approval, version, effective dates, hashes, and synchronization metadata.

## 6.3 What It Must Not Store

- credentials, keys, tokens, passwords, password hashes, cookies, or database URLs;
- raw user PII or private transactional records;
- private KYC documents or evidence;
- raw session data;
- arbitrary source code treated as customer policy;
- unapproved drafts;
- OAT fixtures represented as canonical production knowledge;
- live booking, payment, claim, KYC, dispute, or account state.

# 7. Frozen Source Registry

## 7.1 Registry Identity

The implementation registry is final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY.md. Its freeze record declares registry ID KB1-INITIAL-146 and SHA-256 97A3E7ADC75FBB35DC5D4947A51D517C8E8BF11FB49566E97FBB75B65E8A293D.

## 7.2 Required Entry Fields

Every entry records:

- sequence number;
- stable sourceKey;
- module and topic;
- source type;
- explicit locator or structured provider;
- authority and approval evidence;
- visibility and allowed roles;
- version;
- disposition;
- ingestion adapter;
- reason for restriction, exclusion, supersession, or conditional status where applicable.

## 7.3 Dispositions

- ACTIVE_CANONICAL: approved, generally accessible subject to visibility.
- ROLE_RESTRICTED: approved and limited to listed roles/effective access.
- SUPER_ADMIN_ONLY: approved internal application knowledge available only to Super Admin.
- SYSTEM_ONLY: accounted knowledge never disclosed through ordinary conversation.
- EXCLUDED: discovered but deliberately outside canonical ingestion.
- SUPERSEDED: preserved registry history replaced by another authority.
- CONDITIONAL_APPROVED: accounted but not synchronizable until its stated condition is met.

## 7.4 Current Disposition Counts

ACTIVE_CANONICAL: 9  
ROLE_RESTRICTED: 30  
SUPER_ADMIN_ONLY: 68  
SYSTEM_ONLY: 34  
SUPERSEDED: 3  
CONDITIONAL_APPROVED: 2  

The synchronizable set is ACTIVE_CANONICAL + ROLE_RESTRICTED + SUPER_ADMIN_ONLY = 107 sources.

## 7.5 Registry Freeze Governance

Normal synchronization never guesses whether random files are authoritative. A new source requires an explicit registry amendment with authority, approval evidence, role visibility, adapter, version, and justification. Repository-wide rediscovery is not part of routine sync.

# 8. Source Adapters

## 8.1 Document Adapter

The document adapter reads only explicitly registered controlled documents. It prefers canonical Markdown/text over rendered duplicates, preserves headings and source provenance, and passes semantic content to normalization and chunking.

## 8.2 Published Route Adapter

The published-route adapter supports explicit allowlisted guidance routes such as terms, safety, prohibited-items, privacy, cookie privacy, and beta guidance. It does not scrape arbitrary TSX. Each route source remains traceable to its registered authority.

## 8.3 Structured Provider Adapter

Structured providers expose allowlisted descriptive fields from configuration-backed authorities. Registered families include prohibited-items policy, privacy retention, RBAC roles and permissions, AI policy/action metadata, payment status/currency, insurance catalog/configuration, Social capability/status, marketplace taxonomy, and workflow/status definitions.

Structured providers must exclude credentials, private identifiers, security bypass details, raw evidence, and secret configuration.

# 9. Normalization, Hashing, and Chunking

## 9.1 Normalization

Normalization is deterministic across Unicode representation, line endings, whitespace, headings, keyword representation, and stable JSON ordering. Harmless formatting differences must not create a new logical source version.

## 9.2 Content Hashing

Normalized content is hashed with SHA-256. Timestamps, generated IDs, database record IDs, and other unstable values do not influence the content hash. Identical normalized content yields the same hash; authoritative content changes yield a different hash.

## 9.3 Semantic Chunking

Large sources are divided primarily by heading/section and then by bounded size. The chunker preserves headingPath, stable chunkKey, ordinal, normalized content, content hash, and keywords. A section that fits remains intact; large manuals are not exposed as a single enormous answer.

## 9.4 Chunk Visibility

A chunk may inherit or narrow its parent source visibility. It must never broaden the parent. Visibility validation rejects any attempted broadening before persistence.

# 10. Data Model

## 10.1 AiKnowledgeSource

AiKnowledgeSource is the versioned source-level record. Important fields include:

- id and legacy-compatible slug;
- sourceKey and version unique pair;
- title, module, topic, category, sourceType;
- sourceLocator and transitional sourceReference;
- authority, approvalStatus, approvalEvidence;
- visibility, roles, and legacy applicableRoles;
- status, effectiveFrom, effectiveUntil;
- contentHash and lastSyncedAt;
- supersedesId and metadata;
- createdAt and updatedAt.

## 10.2 AiKnowledgeChunk

AiKnowledgeChunk stores independently retrievable semantic sections:

- knowledgeSourceId;
- chunkKey unique within its source;
- headingPath;
- content and normalizedContent;
- contentHash;
- keywords and ordinal;
- optional narrowing visibility and roles;
- optional effective dates;
- created and updated timestamps.

## 10.3 Other Unified AI Models

- AiServiceSession: channel and provider-aware service session lifecycle.
- AiConversation and AiMessage: conversational continuity and bounded payloads.
- AiSupportCase: case state, severity, risk, SLA, and resolution lifecycle.
- AiCaseEntityLink: controlled association to domain entities.
- AiCaseEvidence: evidence references and verification state.
- AiToolExecution: risk, authorization, confirmation, idempotency, execution, and verification record.
- AiPolicyDecision: versioned deterministic decision with input hash and reason code.
- AiResolution: proposed/verified resolution record.
- AiFollowUp: scheduled recheck/reminder lifecycle.
- AiProviderSession: short-lived external/mock provider session reference.

## 10.4 Additive Migration

Migration 20260814010000_add_knowledge_engine extends AiKnowledgeSource, backfills legacy OAT rows, creates AiKnowledgeChunk, adds lifecycle/search indexes, adds source-version uniqueness, and establishes supersession and chunk foreign keys. It is additive and does not hard-delete historical knowledge.

# 11. Synchronization and Versioning

## 11.1 Pipeline

```text
registered source
  -> adapter
  -> normalization
  -> classification
  -> visibility validation
  -> secret/PII validation
  -> semantic chunking
  -> SHA-256 hashing
  -> diff
  -> guarded transaction
  -> active-version verification
  -> coverage
```

## 11.2 Sync Outcomes

- CREATE: no active source exists; create the registered version and chunks.
- NO_OP: active content hash and metadata match; make no database change.
- CREATE_NEW_VERSION: content or controlled metadata changed; create an immutable new version and supersede the prior active record.
- INVALID: validation failed; do not persist.
- MISSING: registered source cannot be resolved; report an error, never infer retirement.

## 11.3 Version Semantics

The registered version is used when available. If the same version label already exists with different approved content or metadata, the engine derives a deterministic hash suffix. A new active version references the previous record through supersedesId; the previous record becomes SUPERSEDED with effectiveUntil set.

## 11.4 Transactional Guarantees

Source creation, chunks, and prior-version supersession occur inside a database transaction. The engine verifies created chunk parity before committing. Historical versions are retained.

## 11.5 Idempotency

Ten repeated local bootstrap iterations produced one final state: the initial creation followed by NO_OP results, without duplicate sources, versions, or chunks.

# 12. Coverage and Health

## 12.1 Coverage Denominator

Coverage includes approved registered sources that are synchronizable and not excluded or retired. Accounted SYSTEM_ONLY, SUPERSEDED, and conditional/excluded entries remain visible in registry accounting but are not active conversational sources.

## 12.2 Covered Source Conditions

A source is covered only when:

1. exactly one eligible active version exists;
2. expected hash and controlled metadata match;
3. expected chunks and chunk hashes match;
4. approval and effective lifecycle are valid;
5. visibility and role metadata validate;
6. secret/PII validation passes;
7. the source is not missing, invalid, duplicate, or stale.

## 12.3 Closure Metrics

Required closure values:

- unclassified = 0;
- unaccounted = 0;
- missing = 0;
- invalid = 0;
- duplicates = 0;
- stale = 0;
- coverage = 100%.

# 13. Retrieval and Relevance

## 13.1 Retrieval Order

1. classify the request as eligible static knowledge, secret request, or live-data request;
2. resolve the actor's effective application role;
3. query APPROVED and ACTIVE sources within effective dates;
4. exclude canonical-incompatible OAT fixtures when canonical sources exist;
5. filter source visibility and roles;
6. filter chunk visibility and roles;
7. normalize query tokens and remove stop words;
8. score source fields, keywords, headings, and content;
9. require minimum query-token coverage;
10. require material claim tokens such as guarantee/always/never to match;
11. rank deterministically;
12. return a bounded maximum result set.

## 13.2 Current Lexical Scoring

Current deterministic weights are:

- source title/module/topic/category/metadata keyword match: highest source-field weight;
- explicit chunk keyword match: strong weight;
- heading match: medium weight;
- normalized content match: base weight;
- canonical/non-legacy source: small tie-breaking preference;
- overview topic with an explicit RENTipid token: bounded overview preference.

The minimum query-token coverage is 0.60 and the result set is bounded to four matches. Sorting is deterministic by coverage, score, sourceKey, and chunkKey.

## 13.3 Relevance Protection

A single weak token does not automatically qualify a source. A prohibited-items question must retrieve prohibited-items knowledge or return safe uncertainty; it must not collapse into the general marketplace overview. An unsupported refund guarantee must not be inferred from generic cancellation content.

## 13.4 Live and Secret Query Exclusion

Secret-shaped prompts and prompts asking for current personal/application state are excluded from static retrieval. This prevents static chunks from appearing to answer live questions and prevents knowledge lookup from becoming a secret-discovery mechanism.

# 14. Visibility and Security Model

## 14.1 Visibility Levels

- PUBLIC: available without authentication.
- AUTHENTICATED: available to any authenticated recognized role.
- ROLE_SCOPED: available to the listed roles and authorized Super Admin effective access.
- SUPER_ADMIN_ONLY: approved internal conversational knowledge for Super Admin only.
- SYSTEM_ONLY: never conversationally disclosed, including to Super Admin.

## 14.2 Visibility Before Relevance

Unauthorized sources and chunks are removed before scoring. Relevance can never elevate an otherwise inaccessible source.

## 14.3 Secret and Unsafe Content Validation

Pre-persistence validation detects private-key blocks, database credentials, password hashes, JWT-like tokens, secret assignments, cookie values, forbidden environment files, private-key file extensions, and designated test artifacts. Diagnostics identify only sourceKey, safe category, and locator; they must not print the matched value.

## 14.4 Prompt Injection

Prompt injection checks execute before knowledge is added to the provider context. Requests to ignore instructions, reveal system prompts, bypass controls, or expose protected data are blocked or safely constrained. Prompt text cannot change source visibility or authorize a tool.

## 14.5 Output Protection

Provider output passes through output-protection checks. Logging stores bounded summaries when enabled and must not expose secrets. The provider never receives direct credential material from the Knowledge Center.

# 15. Static Knowledge and Live Data Boundary

## 15.1 Static Knowledge Examples

- What is RENTipid?
- What items are prohibited?
- How do provider listings work?
- Why is KYC required?
- How does privacy consent work?
- What does the Address module do?

## 15.2 Live Data Examples

- What is my booking status?
- Has payment X settled?
- Which KYC requests are pending now?
- How many open disputes exist?
- Show another user's claim.

Live questions must be routed to an authorized tool/domain service or declined. Static chunks do not answer them.

## 15.3 Binding Decision Boundary

General knowledge cannot approve or execute refunds, deposits, payouts, KYC decisions, claim settlement, insurance approval, booking mutation, emergency freezes, RBAC changes, or secret access. These remain under deterministic domain policy, confirmation, step-up, tool, and authorization controls.

# 16. Tool Gateway

## 16.1 Risk Classes

The gateway vocabulary includes READ_ONLY, DRAFT_ONLY, CASE_ACTION, CONFIRMED_ACTION, POLICY_REQUIRED, and PROHIBITED.

## 16.2 Execution Controls

The gateway:

1. resolves the registered tool;
2. rejects PROHIBITED tools;
3. loads the actor from the database;
4. checks the authoritative persisted role;
5. enforces idempotency/replay protection;
6. requires user confirmation when declared;
7. applies policy requirements;
8. executes the handler;
9. records execution status;
10. serializes the bounded result.

## 16.3 No Knowledge-to-Action Shortcut

Retrieved text is explanatory context. It cannot register a tool, change allowedRoles, satisfy confirmation, forge a request fingerprint, or replace a policy result.

# 17. Deterministic Policy Layer

## 17.1 Role

AiPolicyEngine represents versioned deterministic policy decisions and persists input hashes, outcomes, reason codes, and result data. Safe-hold outcomes are used when state is unknown, evidence conflicts, or a threshold requires escalation.

## 17.2 Important Authority Warning

Some current policy-engine methods contain local/example thresholds and comments used during implementation. They are not automatically approved customer policy and must not be surfaced through general Knowledge Center retrieval. Binding production decisions require the authoritative domain policy/configuration and its approved version.

# 18. Session Broker and Provider Layer

## 18.1 Session Broker

AiSessionBroker binds sessions to persisted users, rejects suspended/blacklisted actors, applies replay protection, checks provider health and fallback mode, applies daily/concurrency/idle controls, creates AiServiceSession records, and closes provider sessions.

## 18.2 Mock Provider

MockProviderAdapter creates deterministic in-memory provider session references for controlled testing. The separate processMockAIRequest function is responsible for grounded text behavior.

## 18.3 Digital Human Adapter

DigitalHumanProviderAdapter implements the provider contract but currently reports pending credentials during initialization. No external live Digital Human capability should be claimed until credentials, security review, health validation, privacy controls, failure handling, Preview acceptance, and owner acceptance are complete.

## 18.4 Fallback

Provider failure or fallback mode returns the experience to text support. Provider keys are not returned to the client.

# 19. Support Cases and Cross-Channel Continuity

## 19.1 Case Lifecycle

Supported case states include OPEN, UNDERSTANDING, DIAGNOSING, AWAITING_EVIDENCE, AWAITING_USER_CONFIRMATION, POLICY_EVALUATION, EXECUTING, VERIFYING, SAFE_HOLD, RESOLVED, CLOSED, and SYSTEM_BLOCKED.

## 19.2 Ownership

Case reads and writes enforce case ownership. Entity links and evidence references are subordinate to the authorized case. Cross-user case access is denied.

## 19.3 Continuity

The case platform can resume an open case by user/category/entity, suppress duplicate cases, record evidence references, propose resolutions, request confirmation, reconsider, schedule follow-ups, resolve, close, and export an owned case.

# 20. Settings, Feature Controls, and Health

## 20.1 Settings

Runtime behavior is controlled through AI settings including global enablement, provider mode, Mock mode, module enablement, bot enablement, logging, and maximum permission level.

## 20.2 Health and Circuit Breaking

Provider health and resilience components support degraded operation and fallback. Digital Human failure must not remove text-based support.

## 20.3 Permission Ceiling

The current command layer uses a bounded permission ceiling and preserves the rule that general AI assistance cannot independently execute high-risk administrative or financial action.

# 21. Knowledge CLI

## 21.1 Read-Only Commands

```text
npm run knowledge:inventory
npm run knowledge:validate
npm run knowledge:diff
npm run knowledge:check
npm run knowledge:report
```

- inventory reports registry accounting and dispositions;
- validate checks registry and prepared source content;
- diff reports CREATE, NO_OP, CREATE_NEW_VERSION, INVALID, or MISSING;
- check enforces 100% coverage and zero health defects;
- report emits human-readable coverage, or JSON through the runner option.

## 21.2 Mutation Commands

```text
npm run knowledge:bootstrap
npm run knowledge:sync
```

Both commands invoke the mutation environment guard before persistence.

## 21.3 Bootstrap Versus Sync

Bootstrap invokes synchronization for the requested repeat count and is used for controlled initial population/idempotency proof. Sync performs one deterministic reconciliation against the frozen registry.

# 22. Environment Safety

## 22.1 Local/Test Authorization

Local/test mutation requires:

- ALLOW_KNOWLEDGE_MUTATION=true;
- a localhost/loopback host;
- a database name matching the approved rentipid_test_soc pattern;
- no Production environment signal.

## 22.2 Preview Authorization

Preview mutation requires all of:

- ALLOW_KNOWLEDGE_MUTATION=true;
- ALLOW_PREVIEW_KNOWLEDGE_MUTATION=true;
- VERCEL_ENV=preview;
- positively classified non-local database name rentipid_preview;
- optional exact match to PREVIEW_DATABASE_URL when supplied;
- no Production environment/database conflict.

## 22.3 Production and Unknown Denial

NODE_ENV=production, VERCEL_ENV=production, known Production database names/hosts, the configured Production database identity, unknown local databases, and unknown remote databases are rejected. Override flags do not bypass Production denial.

## 22.4 Diagnostic Safety

Operational output may name only environment/database classifications and safe error codes. Connection strings and credential values must not be printed.

# 23. Unified AI OAT

## 23.1 Registration

Module ID: AI  
OAT ID: OAT-AI-MASTER-001  
Name: Unified Autonomous AI Customer Service & Digital Human  
Criticality: Tier 1 - Business-Critical  
Enabled OAT modules at this baseline: SOCIAL and AI  

## 23.2 Commands

```text
npm run oat:ai:setup
npm run oat:ai:check
npm run oat:ai:reset
```

## 23.3 Canonical OAT Actors

- Renter: oat.renter@rentipid.test, role Renter
- Provider: oat.provider@rentipid.test, role Individual Provider
- Super Admin: oat.superadmin@rentipid.test, role Super Admin

All are provisioned with status Verified, is_test_data=true, and a bcrypt password hash derived from PREVIEW_OAT_PASSWORD. The password is never hard-coded or logged. Setup uses idempotent email upserts and creates exactly one user per identity.

## 23.4 Actor Environment Guard

Actor provisioning invokes the OAT environment guard and additionally restricts non-local actor mutation to Vercel Preview. Production is rejected even when a credential is supplied.

## 23.5 OAT Knowledge Fixtures

The OAT module maintains oat-ai-test-policy and oat-ai-rentipid-overview as test fixtures. They are marked OAT_TEST_FIXTURE, are idempotent, and do not count toward canonical Knowledge Center coverage. When canonical sources are present, retrieval excludes OAT fixtures from canonical matching.

## 23.6 Readiness

The readiness check verifies that all three actors exist with exact role, Verified status, and a password hash. Missing or invalid actors produce blockers and NOT READY. Setup errors return a non-zero process status.

## 23.7 Reset

Reset removes transient AI conversations, sessions, cases, evidence links, tool/policy/resolution/follow-up records owned by the OAT renter. It preserves permanent OAT knowledge fixtures, canonical Knowledge Center data, and unrelated application records.

## 23.8 Owner Boundary

Automated tests and readiness checks establish technical prerequisites only. OAT-AI-MASTER-001 is not formally PASS until the owner manually tests the exact deployed Preview URL and records acceptance.

# 24. Test and Acceptance Evidence

## 24.1 Knowledge Engine Local Evidence

- focused Knowledge Engine tests: 65/65 PASS at KB-1 local acceptance;
- direct Unified AI knowledge/dependency tests: 32/32 PASS at KB-1 local acceptance;
- registry candidates: 146/146 accounted;
- synchronizable sources: 107;
- local accepted chunks: 705;
- local coverage: 100%;
- bootstrap repeated ten times without duplication;
- missing/invalid/duplicate/stale: 0/0/0/0;
- production build: PASS.

## 24.2 Latest Grounding and Actor Reconciliation Evidence

Commit 894e77e6b9b3aab4a2cf9ace64ff4d8c03c273f2:

- grounding/RBAC/visibility targeted set: 38/38 PASS;
- complete OAT suite: 42/42 PASS;
- production build: PASS;
- ten repeated actor setups: one Renter, one Provider, one Super Admin;
- Production actor mutation: rejected;
- no Preview or Production data changed by the targeted Codex fix.

## 24.3 Required Knowledge Behaviors

- What is RENTipid? returns a meaningful approved overview.
- How does RENTipid work? returns a meaningful approved overview.
- What items are prohibited? selects prohibited-items knowledge, not a generic overview.
- Unsupported guarantees return safe uncertainty.
- Weakly related/unrelated prompts do not receive a generic fallback.
- Renter/Provider cannot retrieve SUPER_ADMIN_ONLY content.
- SYSTEM_ONLY is unavailable even to Super Admin conversation.

# 25. Operational Runbook

## 25.1 Read-Only Assessment

1. record git status and exact HEAD;
2. run knowledge:inventory;
3. run knowledge:validate against the safe environment convention;
4. run knowledge:diff;
5. run knowledge:check and report;
6. do not mutate if environment identity is unknown.

## 25.2 Controlled Local/Test Sync

1. verify the exact test database identity;
2. apply additive migrations using the repository migration workflow;
3. set only the required mutation flag;
4. run knowledge:bootstrap or knowledge:sync;
5. run knowledge:check;
6. verify 100% coverage and zero defects;
7. run focused retrieval/security tests;
8. record exact commit and evidence.

## 25.3 Controlled Preview Sync

1. obtain explicit Preview authorization;
2. verify VERCEL_ENV=preview and positive rentipid_preview database identity;
3. supply both required mutation flags;
4. never display connection strings;
5. run migration only if required by the exact commit;
6. run sync/bootstrap once as authorized;
7. run check/report and confirm 100%;
8. deploy the exact tested commit through the approved owner process;
9. run OAT setup/check with PREVIEW_OAT_PASSWORD;
10. perform the targeted functional/RBAC matrix;
11. hand off to owner acceptance.

## 25.4 Production

Knowledge and OAT mutation are prohibited by the current guard in Production. Production readiness requires a separate approved release process; this manual does not grant it.

# 26. Troubleshooting

## 26.1 Generic Overview for an Unrelated Question

Check query tokenization, stop words, coverage threshold, selected sourceKey/chunkKey, and whether an obsolete deployment artifact is running. Current source must return safe uncertainty on no match and must not use the overview as a generic fallback.

## 26.2 Prompt Echo in Mock Mode

Search the exact deployed artifact for the obsolete phrase. Confirm the deployed commit and build output, then verify the route imports the current command layer and Mock provider. The tracked source at this baseline does not contain the obsolete echo fallback.

## 26.3 Knowledge Check Below 100%

Inspect missing, invalid, duplicate, and stale items. Do not bypass validation. Confirm source locator, registry hash, content hash, metadata, active-version count, expected chunks, visibility, roles, and effective dates.

## 26.4 Preview Mutation Rejected

Confirm both flags, VERCEL_ENV=preview, database name rentipid_preview, optional PREVIEW_DATABASE_URL identity match, and absence of Production conflicts. Never broaden authorization to arbitrary remote databases.

## 26.5 OAT Setup Appears Successful but Actors Are Missing

Use the current runner, which returns a non-zero exit status on setup failure. Confirm PREVIEW_OAT_PASSWORD is supplied, environment guard passes, and readiness reports all three actor records with exact roles and Verified status.

## 26.6 Digital Human Initialization Fails

This is expected while provider credentials are pending. Use text/Mock fallback; do not add credentials to source, knowledge records, logs, or client payloads.

# 27. Monitoring and Audit Expectations

## 27.1 Minimum Observability

Monitor settings enablement, provider health, blocked prompts, output-protection events, retrieval no-match rates, selected source/chunk provenance, tool denials, policy safe holds, session failures, case escalation, synchronization actions, coverage defects, and OAT readiness blockers.

## 27.2 Privacy

Logs should use identifiers and bounded summaries necessary for operations, not raw secrets or unnecessary PII. Knowledge validation reports categories and safe locators only.

## 27.3 Audit Evidence

Retain exact commit, migration status, registry hash, diff, coverage report, test results, build result, deployment identity, OAT setup/check result, and owner acceptance record.

# 28. Future Module Knowledge Contract

## 28.1 Registration Requirement

Every future RENTipid module must register approved durable AI knowledge before closure. A registration supplies stable sourceKey, ownership, topic, type, authority, approval evidence, visibility, roles, version, adapter, disposition, and controlled locator/provider.

## 28.2 Promotion Gates

1. code complete;
2. local functional pass;
3. local database migrated;
4. local required data seeded/synced;
5. local knowledge registered;
6. local knowledge synced;
7. local acceptance pass;
8. Preview migrated;
9. Preview required data seeded/synced;
10. Preview knowledge synced;
11. Preview acceptance pass;
12. owner acceptance pass;
13. production-ready;
14. closed/frozen.

## 28.3 Frozen Module Protection

A previously frozen module need not be reopened when its approved knowledge can be registered externally through the canonical engine. New modules must not create duplicate Knowledge Center infrastructure.

# 29. Known Limitations and Non-Claims

1. Digital Human external initialization is pending credentials.
2. Mock responses are deterministic and intended for controlled Preview validation.
3. Retrieval is deterministic lexical matching; no vector/embedding infrastructure is used.
4. Some session counters and replay state are process memory and need durable/distributed design before multi-instance production reliance.
5. Some policy-engine values are implementation examples, not automatically approved customer policy.
6. Technical test PASS does not equal owner OAT acceptance.
7. This document does not authorize Preview or Production mutation.
8. Current source reconciliation awaits exact deployment and Preview functional/RBAC verification by the assigned deployment agent.

# 30. File and Component Index

## 30.1 Runtime

- src/app/api/ai/chat/route.ts - authenticated chat entry.
- src/lib/ai/ai-command-layer.ts - central conversational command flow.
- src/lib/ai/context/knowledge-retrieval.ts - canonical retrieval and relevance.
- src/lib/ai/mock-ai.ts - deterministic grounded Mock response.
- src/lib/ai/ai-permissions.ts - bot/role access.
- src/lib/ai/ai-settings-service.ts - feature/provider settings.
- src/lib/ai/ai-context-builder.ts - minimum safe context.
- src/lib/ai/ai-logger.ts - interaction logging.

## 30.2 Knowledge Center

- src/lib/ai/knowledge/source-registry.ts - frozen registry loader and validation.
- src/lib/ai/knowledge/adapters/ - document, route, and structured providers.
- src/lib/ai/knowledge/normalizer.ts - deterministic normalization.
- src/lib/ai/knowledge/hashing.ts - SHA-256 and stable object hashing.
- src/lib/ai/knowledge/chunker.ts - heading-first bounded chunking.
- src/lib/ai/knowledge/validator.ts - secret/PII/locator/visibility validation.
- src/lib/ai/knowledge/synchronizer.ts - diff, versioning, transaction, supersession.
- src/lib/ai/knowledge/coverage.ts - machine-readable coverage.
- src/lib/ai/knowledge/report.ts - human-readable coverage.
- src/lib/ai/knowledge/environment-guard.ts - mutation authorization.
- src/lib/ai/knowledge/module-contract.ts - future-module contract.
- scripts/knowledge/knowledge-runner.ts - CLI.

## 30.3 AI Platform Services

- src/lib/ai/broker/AiSessionBroker.ts
- src/lib/ai/cases/AiCasePlatform.ts
- src/lib/ai/policy/AiPolicyEngine.ts
- src/lib/ai/tools/AiToolGateway.ts
- src/lib/ai/security/AiGuardrails.ts
- src/lib/ai/adapters/MockProviderAdapter.ts
- src/lib/ai/adapters/DigitalHumanProviderAdapter.ts

## 30.4 Schema, Registry, OAT, and Evidence

- prisma/migrations/20260812120000_add_unified_ai_foundation/migration.sql
- prisma/migrations/20260814010000_add_knowledge_engine/migration.sql
- final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY.md
- final-documentation/ai-knowledge/KNOWLEDGE-IMPLEMENTATION-REGISTRY-FREEZE.md
- final-documentation/ai-knowledge/KB1-LOCAL-ACCEPTANCE-EVIDENCE.md
- final-documentation/ai-knowledge/MODULE-KNOWLEDGE-CONTRACT.md
- src/lib/oat/modules/ai-oat.ts
- src/lib/oat/oat-shared-users.ts
- final-documentation/oat/ai/OWNER-ACCEPTANCE-TEST.md

## 30.5 Manual Artifacts and Regeneration

- final-documentation/unified-ai/RENTipid_UNIFIED_AUTONOMOUS_AI_CUSTOMER_SERVICE_AND_DIGITAL_HUMAN_MODULE.md - maintainable source.
- final-documentation/unified-ai/RENTipid_UNIFIED_AUTONOMOUS_AI_CUSTOMER_SERVICE_AND_DIGITAL_HUMAN_MODULE.pdf - indexed distribution artifact.
- scripts/documentation/generate-unified-ai-manual.cjs - two-pass PDF renderer and frozen-registry appendix expander.

Regenerate from the repository root with:

```text
node scripts/documentation/generate-unified-ai-manual.cjs
```

# 31. Glossary

AI Knowledge Center: canonical durable approved knowledge store and synchronization system.  
Approved knowledge: content with authority and approval evidence that passes validation.  
Canonical source: synchronizable registered authority used for conversation.  
Chunk: independently retrievable semantic section of a source.  
Coverage: proof that every synchronizable registered source exactly matches expected active state.  
Effective role: normalized authoritative application role used for visibility.  
Grounding: supplying approved retrieved context to the response provider.  
Live data: current user/application state owned by domain services.  
OAT: Owner Acceptance Test.  
Safe hold: deterministic policy outcome requiring escalation or more evidence.  
Safe uncertainty: response that declines to confirm an unsupported claim.  
SourceKey: stable identity shared across source versions.  
SYSTEM_ONLY: accounted content never available through ordinary conversation.  
Supersession: immutable replacement of one active source version by another.  

# Appendix A. Complete Frozen Knowledge Source Index

The PDF generator expands the authoritative 146-row registry below. Each index record includes sequence, sourceKey, module, topic, type, authority, approval evidence, visibility, roles, version, disposition, adapter, locator, and restriction/exclusion reason.

[[REGISTRY_APPENDIX]]

# Appendix B. Security Verification Checklist

1. Visibility is evaluated before relevance.
2. SYSTEM_ONLY is denied to every conversational role.
3. Super Admin breadth does not include secrets.
4. Secret-shaped prompts do not enter static retrieval.
5. Live-data prompts do not enter static retrieval.
6. Prompt injection cannot change visibility.
7. Tool identity is resolved server-side.
8. Mutating tools preserve confirmation, policy, idempotency, and audit.
9. Knowledge validation runs before persistence.
10. Production and unknown databases reject mutation.
11. Preview mutation requires both explicit flags and positive identity.
12. OAT actors use environment-supplied credentials and verified roles/status.

# Appendix C. Subject Index

Adapters - Sections 8, 30  
AiKnowledgeChunk - Sections 9, 10  
AiKnowledgeSource - Sections 6, 10  
Approval evidence - Sections 7, Appendix A  
Bootstrap - Sections 11, 21, 25  
Cases - Sections 10, 19  
Chunking - Sections 9, 11  
Coverage - Sections 2, 12, 21, 24  
Digital Human - Sections 2, 18, 26, 29  
Effective dates - Sections 10, 12, 13  
Environment guard - Sections 22, 25  
Grounding - Sections 4, 13, 24, 26  
Hashing - Sections 7, 9, 11  
Idempotency - Sections 11, 16, 23  
Knowledge registry - Sections 7, Appendix A  
Live data - Sections 2, 15  
Mock AI - Sections 2, 4, 18  
Normalization - Sections 9, 11  
OAT actors - Section 23  
Owner acceptance - Sections 1, 23, 24, 29  
Policy authority - Sections 15, 17  
Preview authorization - Sections 22, 25  
Prompt injection - Sections 4, 14  
Prohibited items - Sections 8, 13, 24  
RBAC - Sections 5, 14, 16  
Relevance - Section 13  
Safe uncertainty - Sections 4, 13, 24  
Secret protection - Sections 6, 14, 22  
Sessions - Sections 10, 18  
Static knowledge - Section 15  
Super Admin - Sections 5, 14, 23  
Synchronization - Sections 11, 21, 25  
SYSTEM_ONLY - Sections 5, 7, 14  
Tool gateway - Sections 15, 16  
Versioning - Sections 10, 11  

# Appendix D. Document Acceptance Boundary

This manual documents the implementation baseline and its technical evidence. It does not mark OAT-AI-MASTER-001 PASS, does not grant owner acceptance, does not authorize Production, and does not replace the exact deployed Preview verification required after each relevant source change.
