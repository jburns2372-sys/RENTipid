# RENTipid ISO Information Asset Register

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-IAR`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Version:** `v1.0`  
**Status:** `BASELINE COMPLETE`  
**Standard Alignment:** ISO/IEC 27001:2022 Annex A 5.9–5.14, ISO/IEC 27701:2019  

---

## 1. Purpose & Inventory Scope

This Information Asset Register establishes the authoritative baseline of information assets, infrastructure, services, repositories, and supporting systems comprising the RENTipid Information Security and Privacy Management System (ISMS/PIMS).

> **Asset Ownership Rule:** In accordance with ISO program rules, no human asset owner may be fabricated. Where a specific named organizational owner cannot be verified from repository appointment records, the asset owner is recorded as `REQUIRES HUMAN ASSIGNMENT`, with an accountable technical custodian identified.

---

## 2. Asset Valuation & Impact Classification

Asset classification follows standard security objectives:
* **Confidentiality (C):** High (Severe financial/legal damage if exposed), Medium (Internal business impact), Low (Public or non-sensitive).
* **Integrity (I):** High (Direct corruption of financial, lease, or security state), Medium (Operational friction), Low (Inconsequential).
* **Availability (A):** High (Downtime halts rental marketplace or payments), Medium (Degraded performance), Low (Internal tooling).
* **Business Criticality:** Critical, High, Medium, Low.

---

## 3. Comprehensive Information Asset Inventory (25 Canonical Assets)

| Asset ID | Asset Name | Description & Form | Asset Type | Owner | Custodian | Environment | C | I | A | PII? | Criticality | Dependencies | Existing Evidence | Conformity Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **AST-01** | Next.js Source Code | Complete application source code, API routes, components | Software / Code | `REQUIRES HUMAN ASSIGNMENT` | Engineering Lead | Git / Local / CI | H | H | M | No | High | Git repository, Node.js | tsconfig.json; src/app/; src/lib/ | `PROVEN — IMPLEMENTED` |
| **AST-02** | Git Repositories & Worktrees | Source control tracking, history, tags, and commits | Repository | `REQUIRES HUMAN ASSIGNMENT` | Engineering Lead | GitHub / Local | H | H | H | No | Critical | GitHub, local worktrees | Git history at accepted C0 2e9b0b8 | `PROVEN — IMPLEMENTED` |
| **AST-03** | CI/CD Build Pipelines | Automated build scripts, linting, typechecks, deployment hooks | Pipeline | `REQUIRES HUMAN ASSIGNMENT` | Engineering Lead | GitHub Actions / Vercel | M | H | H | No | High | Vercel CI, npm registry | package.json; EVD-13 Supply Chain Controls | `PROVEN — IMPLEMENTED` |
| **AST-04** | Production Runtime | Live Next.js serverless execution and edge middleware | Cloud Compute | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Production (Vercel) | H | H | H | Yes | Critical | Vercel hosting; Enterprise plan unproven | EVD-07 production completion report Sections 2-3 (historical) | `PROVEN — IMPLEMENTED` |
| **AST-05** | Preview Runtime | Staging and pull-request preview environments | Cloud Compute | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Preview (Vercel) | M | M | M | No | Medium | Vercel Preview | EVD-08 isolation report Sections 2-3 (historical) | `PROVEN — OPERATING CONFORMITY` |
| **AST-06** | Local Development Worktree | Developer workstation execution environment | Local Compute | `REQUIRES HUMAN ASSIGNMENT` | Individual Devs | Localhost | H | M | L | Conditional PII / synthetic identifiers | Low | Node.js, PowerShell | docs/security/LOCAL_TEST_DATABASE_SAFETY.md (policy/guard) | `PROVEN — IMPLEMENTED` |
| **AST-07** | Managed PostgreSQL Database | Schema capability; historical Azure then Neon records; current topology unresolved | Data Store | `REQUIRES HUMAN ASSIGNMENT` | Database Admin | Historical hosting / current provider unverified | H | H | H | Yes | Critical | PostgreSQL / Prisma; Azure/Neon history | EVD-20 historical Azure; EVD-08 later Neon branches | `PARTIAL` |
| **AST-08** | Cloud Object Storage | Local and Vercel Blob interfaces; actual configuration unverified | Cloud Storage | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Configuration-dependent | M | H | H | Yes | High | Storage service / conditional Blob or local | src/lib/storage/storage-service.ts resolveAdapter | `PARTIAL` |
| **AST-09** | Database Backups & Snapshots | Backup/recovery design; enabled snapshots not established | Backup Data | `REQUIRES HUMAN ASSIGNMENT` | Database Admin | Planned / current provider unverified | H | H | H | Yes | Critical | Actual hosting inventory and backup configuration | EVD-15 plans only | `PARTIAL` |
| **AST-10** | Security Audit & Telemetry Logs | Append-only normalized audit records, SOC event logs | Log Store | `REQUIRES HUMAN ASSIGNMENT` | SOC Lead | Database / deployment-dependent | H | H | M | Pseudo | High | Prisma ORM, SOC Engine | EVD-10 audit registry; Phase 5J synthetic metrics | `PROVEN — IMPLEMENTED` |
| **AST-11** | Authentication System | NextAuth configuration, password hashes (algorithm varies by evidenced auth path), sessions | Security Service | `REQUIRES HUMAN ASSIGNMENT` | Security Lead | Multi-Env | H | H | H | Yes | Critical | NextAuth, JWT/Session DB | src/lib/auth.ts; src/lib/auth/session-registry.ts; EVD-03 | `PROVEN — IMPLEMENTED` |
| **AST-12** | Authorization & PBAC System | Server-authoritative role/permission matrix and guards | Security Service | `REQUIRES HUMAN ASSIGNMENT` | Security Lead | Multi-Env | H | H | H | Yes (user/role identifiers) | Critical | Server helpers, proxy guards | EVD-04 Enforced Principles | `PROVEN — IMPLEMENTED` |
| **AST-13** | Secrets & Encryption Keys | API tokens, database credentials, envelope master keys | Secret / Config | `REQUIRES HUMAN ASSIGNMENT` | Security Lead | Cloud / Secrets Vault | H | H | H | No | Critical | Cloud secrets store, env | EVD-06 synthetic rotation; EVD-13 scanning | `PROVEN — IMPLEMENTED` |
| **AST-14** | Domain Names & DNS Records | rentipid.com.ph domains in dated isolation report | Network / DNS | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Historical Vercel domain mappings | M | H | H | No | Critical | DNS operator unresolved; Vercel routing evidenced | EVD-08 isolation report Section 3 domain mappings | `PARTIAL` |
| **AST-15** | TLS/SSL Certificates | Public certificates securing transit encryption (TLS 1.2/1.3) | Certificate | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Production | M | H | H | No | High | HTTPS hosting; issuer/version not inferred | EVD-07/08 historical HTTPS endpoints; current TLS settings unverified | `PARTIAL` |
| **AST-16** | Cloud IAM Policies & Roles | Service accounts, deployment keys, least-privilege policies | IAM Config | `REQUIRES HUMAN ASSIGNMENT` | Cloud Ops Lead | Cloud configuration-dependent / AWS design only | H | H | H | No | Critical | Conditional cloud IAM; actual deployed policies require evidence | EVD-14 design; EVD-13 remote enforcement deferred | `PARTIAL` |
| **AST-17** | Autonomous SOC Rule Engine | Real-time threat detection DSL, evaluator, playbooks | Security Tool | `REQUIRES HUMAN ASSIGNMENT` | SOC Lead | Multi-Env | H | H | M | Yes (pseudonymous events) | High | In-memory evaluator, DB | EVD-11 engineering evidence | `PROVEN — IMPLEMENTED` |
| **AST-18** | Transaction Messaging Rail | Typed messages/notifications and conditional SMTP email | Communication | `REQUIRES HUMAN ASSIGNMENT` | Engineering Lead | Multi-Env | M | M | M | Yes | Medium | Communications services; SMTP vendor unresolved | src/lib/global-market/communications/contracts/message.ts; src/lib/auth/unified/email-delivery.ts | `PARTIAL` |
| **AST-19** | KYC Integration Rail | Biometric and ID verification connector to Sumsub API | Integration | `REQUIRES HUMAN ASSIGNMENT` | DPO / Security Lead | Scoped synthetic sandbox; Production not approved | H | H | H | Yes | Critical | Sumsub SDK, KYC webhooks | EVD-21 Observed real Sandbox evidence / limits | `PROVEN — IMPLEMENTED` |
| **AST-20** | Ingress Payment Gateways | Separate regional Xendit/domestic interfaces; no SEA fallback | Payment Service | `REQUIRES HUMAN ASSIGNMENT` | Finance Lead | Local fixtures / external sandbox pending | H | H | H | Yes | Critical | Payment partner APIs | EVD-22 Callback preparation / fixture harness | `REQUIRES EXTERNAL PROVIDER EVIDENCE` |
| **AST-21** | Payout & Escrow Infrastructure | Payout contracts/orchestrator; live execution pending | Payment Service | `REQUIRES HUMAN ASSIGNMENT` | Finance Lead | Sandbox preparation, not approved Production | H | H | H | Yes | Critical | Xendit Disbursements API | src/lib/global-market/financial/contracts/payout-record.ts; EVD-22 | `REQUIRES EXTERNAL PROVIDER EVIDENCE` |
| **AST-22** | Booking & Lease Records | Rental agreements, security deposits, lease terms, claims | Business Data | `REQUIRES HUMAN ASSIGNMENT` | Operations Lead | Schema / actual deployment-dependent | H | H | H | Yes | Critical | Booking / RentalAgreement models | prisma/schema.prisma Booking, RentalAgreement, DamageClaim, DisputeCase | `PROVEN — IMPLEMENTED` |
| **AST-23** | Admin & Support Console | Internal backoffice portal for disputes, user management | Application | `REQUIRES HUMAN ASSIGNMENT` | Operations Lead | Production (Vercel) | H | H | M | Yes | High | Next.js admin routes, PBAC | EVD-04; src/app/dashboard/ | `PROVEN — IMPLEMENTED` |
| **AST-24** | Controlled Governance Records | Master plan, promotion standard, ISO ledgers, registers | Documentation | `REQUIRES HUMAN ASSIGNMENT` | Governance Lead | Git / Markdown | M | H | M | Conditional (appointment records identify people) | High | Git worktree | docs/governance/iso-conformity/ at accepted C0 | `PROVEN — IMPLEMENTED` |
| **AST-25** | Jurisdictional Compliance Matrices | 46-country tax, invoicing, and local regulatory matrices | Legal/Compliance | `REQUIRES HUMAN ASSIGNMENT` | Legal / DPO | Git / JSON / MD | M | H | L | No | High | Git worktree | EVD-23 UNKNOWN/VALIDATION_REQUIRED and China blockers | `PARTIAL` |

---

## 4. Reviewed inventory limits

25 asset categories, including explicit planned/conditional services. Custodians and CIA/criticality values are proposed functional roles and conservative assessments, not human appointments. H/M/L mean High/Medium/Low. Pseudonymous identifiers are PII. Repository attribution can identify developers even where a row is not an intended customer-data store. Asset appointments require human validation; an existing owner/DPO memo does not appoint every asset custodian. Only dated Preview restoration supports an operating observation in this inventory. Core conformity counts remain those of the 30-domain control baseline. EVD selectors resolve through ISO_CONFORMITY_EVIDENCE_INHERITANCE_REGISTER.md at accepted C0.

## Licensed-source boundary

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label is provisional inherited alignment, not verified licensed text or legal conclusions.
