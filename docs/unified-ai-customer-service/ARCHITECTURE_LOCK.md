# ARCHITECTURE LOCK - UNIFIED AI CUSTOMER SERVICE & DIGITAL HUMAN

## 1. SHARED CORE
- **AI Service Orchestrator:** ONE shared orchestrator (`src/lib/ai/ai-command-layer.ts` EXTENDED).
- **AI Support Case Platform:** ONE canonical platform (to be built in `src/lib/ai/cases/`). Uses `AiSupportCase` model. No parallel `IssueTicket`/`SupportTicket` workflows for AI operations.
- **AI Tool Gateway:** ONE typed gateway (to be built in `src/lib/ai/gateway/`). All channels use the same tools.
- **Knowledge Service:** ONE versioned retrieval service (to be built in `src/lib/ai/knowledge/`).
- **Policy/Transaction Path:** Existing RENTipid deterministic services are authoritative.

## 2. CHANNELS (Presentation Only)
- **/help:** Durable text/case presentation using the Shared Core.
- **Digital Human:** Voice/avatar/media presentation. Media-only state managed by `DigitalHumanProviderAdapter`; business logic managed by Shared Core.
- **Contextual AI:** Route-specific helper using Shared Core.
- **PWA/Capacitor:** Mobile-optimized media presentation using Shared Core.

## 3. ADDITIVE DATABASE DESIGN (LOCKED)
Existing PostgreSQL/Prisma database to be EXTENDED (No separate DBs, No shadow business logic).
Models to CREATE in P3:
1. `AiServiceSession`
2. `AiConversation`
3. `AiSupportCase` (with `caseNumber` unique constraint)
4. `AiCaseEntityLink`
5. `AiCaseEvidence`
6. `AiToolExecution` (with idempotency controls)
7. `AiPolicyDecision`
8. `AiResolution`
9. `AiFollowUp`
10. `AiKnowledgeSource`
11. `AiProviderSession`

## 4. SECURITY & BOUNDARIES
- **No Human Routine Support:** No human queue, manual assignment, or takeover. Cases stay in AI platform.
- **External Authorities:** Insurer, Payment Gateway, KYC Provider, Legal/Arbitration are authoritative. AI cannot invent their results.
- **Privacy:** Data minimization, strict RBAC, no credential leaking.

## 5. FILE OWNERSHIP
- Architecture files frozen. See `FILE_OWNERSHIP.md` for exact assignments.
