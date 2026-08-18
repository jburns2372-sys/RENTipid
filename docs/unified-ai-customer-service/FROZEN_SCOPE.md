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
