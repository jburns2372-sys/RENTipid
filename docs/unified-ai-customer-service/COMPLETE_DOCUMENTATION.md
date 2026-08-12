# COMPLETE DOCUMENTATION
## RENTipid Unified Autonomous AI Customer Service & Digital Human (v1)

This document serves as the consolidated documentation for the unified AI core. (Substitute for .pdf due to format constraints)

### 1. Functional Architecture
- Merges generic customer support (/help) with conversational contextual AI and the Digital Human overlay.
- All actions are processed by the same underlying `AiCasePlatform` and `AiSessionBroker`.

### 2. Technical Architecture
- Framework: Next.js 16
- Database: PostgreSQL (Prisma ORM)
- AI Model: Google GenAI (Gemini 2.5 Pro / Flash)
- Core components: `AiSessionBroker`, `AiCasePlatform`, `AiToolGateway`, `AiPolicyEngine`, `AiCircuitBreaker`.

### 3. Database
- `AiSupportCase`: Central entity for all support tickets.
- `AiConversation`: Conversational turn history.
- `AiServiceSession`: Real-time session data.
- `AiCaseEvidence`: Attachments and proof for cases.
- `AiResolution`: Final outcomes and actions.

### 4. Deterministic Policies
- Refunds, cancellations, payout limits ($1000/$500 test thresholds) and damage claims are driven by deterministic, state-machine-backed services (`InsuranceReconciliationService`, `InsuranceCancellationService`, etc.). AI does NOT make binding financial decisions.

### 5. Security & Privacy
- Strict RBAC on tools (AiToolGateway).
- Rate limits on endpoints.
- PII masking applied before sending data to LLM.
- All mutating actions require explicit user confirmation unless pre-approved by policy.

### 6. Operations & Rollback
- Production readiness: Passing build, successful P12 regression tests.
- Rollback: Supported via schema reversions and feature flags documented in `ROLLBACK_VERIFICATION.md`.

*Closure completed and frozen under commit 81980e30328131dc27bce96a340458b5a7218284.*
