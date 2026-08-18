# ARCHITECTURE LOCK - UNIFIED AI CUSTOMER SERVICE & DIGITAL HUMAN v1.1

## Canonical shared core

- AI entry route: ONE route, src/app/api/ai/chat/route.ts.
- AI command layer: ONE canonical entry, processAICommand in src/lib/ai/ai-command-layer.ts.
- AI support cases: ONE canonical autonomous case family using AiSupportCase and related Ai models through src/lib/ai/cases/AiCasePlatform.ts.
- AI Tool Gateway: ONE typed gateway at src/lib/ai/tools/AiToolGateway.ts; transactional execution must use its server-resolved actor, RBAC, confirmation, policy, idempotency, and audit controls.
- Knowledge Center: ONE approved retrieval service under src/lib/ai/knowledge/ and src/lib/ai/context/knowledge-retrieval.ts, backed by AiKnowledgeSource and AiKnowledgeChunk.
- Policy and transactions: existing RENTipid domain/policy services remain authoritative. AI output is never transactional authority.
- RBAC and ownership: existing authenticated session, database roles, permissions, and server-side ownership checks remain authoritative. Client context is a hint only.

## Presentation channels

- /help: durable text/case presentation using /api/ai/chat and the shared command layer.
- Digital Human: media adapter only. DigitalHumanProviderAdapter is selected by AiSessionBroker and cannot own business logic.
- Text fallback: MockProviderAdapter and normal text support remain available when Digital Human is disabled, unhealthy, or uncredentialed.
- Contextual AI and PWA/Capacitor: presentation adapters only; they must converge on the same AI/case/context flow.

## Prohibited duplicates

Do not create a second AI framework, chat API, Knowledge Center, role system, vector database, transactional authority, human customer-support queue, manual support-agent takeover, or routine customer-support mailbox.

The legacy IssueTicket and SupportTicket Prisma models are excluded from the Unified AI v1.1 flow. Targeted usage search found no runtime consumer outside schema/migration history. They must not be adopted as an alternate AI case platform or human queue.

## Data and safety boundaries

- Existing PostgreSQL/Prisma remains the single database.
- Existing AiConversation, AiMessage, AiSupportCase, AiCaseEntityLink, AiFollowUp, AiKnowledgeSource, AiKnowledgeChunk, tool/policy/resolution, audit, and security records are reused.
- Previous AI messages and client-provided entity IDs are not authoritative live-state evidence.
- Protected record existence must not be leaked through suggestions, context cards, or errors.
- SAFE_HOLD and SYSTEM_BLOCKED stop automated action; they do not imply a human support takeover.
- Digital Human provider failure must degrade to text without disabling /help.

## P0 disposition

Verified at source HEAD aa180160d25cb12764099d487382d3f98e534a97 under change record UAICS-DH-CR-001. No architecture-lock violation blocks P1.
