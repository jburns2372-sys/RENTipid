# FROZEN SCOPE

## MODULE
RENTipid Unified Autonomous AI Customer Service & Digital Human (v1)

## COMMIT
- Repository: RENTipid
- Branch: current
- Final HEAD: 81980e30328131dc27bce96a340458b5a7218284

## ACCEPTED COMPONENTS
- Routes: /help, /api/ai/*, webhooks
- Services: AiSessionBroker, AiCasePlatform, AiToolGateway, AiPolicyEngine, InsuranceTelemetry, InsuranceReconciliationService, InsuranceCancellationService
- AI Models: Google GenAI (gemini-2.5-pro, gemini-2.5-flash)
- Prisma Models: AiSupportCase, AiCaseEntityLink, AiCaseEvidence, AiResolution, AiFollowUp, AiConversation, Insurance models
- Security Controls: Input validation, RBAC, Data privacy masking, Rate limiting
- Tests: P1-P12 unit/integration test suites
- Digital Human Provider Contract: Defined via MockProviderAdapter & DigitalHumanProviderAdapter
- Provider Status: B — APPROVED DEGRADED PRODUCTION MODE
- Contextual AI: Embedded context handler integrated in PWA
- Capacitor: Deferred (N/A)
- Claims/Disputes/KYC/Insurance: Shared AI orchestration leveraging authoritative domain logic

Any future changes require UAICS-DH-CR-###.

---

# FROZEN SCOPE — AI PRODUCTION MODULE ANSWER-QUALITY REMEDIATION

## MODULE
RENTipid AI Production Module — Listing Creation & Prohibited Item Answer Quality Remediation

## FROZEN COMMIT
- Functional Remediation Commit: `edd5b69dd27b316485cf501e623b4a538f5a3411`
- Production Deployment: `dpl_F21Q2K9kd2or86QmFF8BXfN1LHHK`
- Production Domain: `https://www.rentipid.com.ph`
- Freeze Timestamp: `2026-09-09T13:32:00+08:00`
- Status: **VERSION FROZEN**

## FROZEN CANONICAL LOGIC & ROUTING
1. **Listing Creation Knowledge Isolation**:
   - `listing.create.how_to` access scopes strictly bound to `knowledgeSectionKey: 'provider-workflow-status:workflow-status-guidance-listings'`.
   - Prevents Booking Process contamination.
2. **Prohibited Items Policy Enumeration**:
   - Exact query `"What items are prohibited on RENTipid"` and canonical aliases mapped to `listing.item.restriction` bound to `POLICY_TAXONOMY` (`RENTAL_CATEGORY_AND_PROHIBITED_ITEM_POLICY`).
   - Returns 25 active prohibited item policy definitions.
3. **Canonical Intent Registry**:
   - [`src/lib/ai/context/canonical-intent-registry.ts`](file:///src/lib/ai/context/canonical-intent-registry.ts) locked for these intents.
4. **Regression Test Suite**:
   - [`tests/ai/production-answer-quality-defect-regression.integration.test.ts`](file:///tests/ai/production-answer-quality-defect-regression.integration.test.ts) locked as the authoritative regression gate.

Any future modification to this frozen baseline must be processed through a new tracked defect/change request and promote through the standard 13-gate promotion pipeline.

