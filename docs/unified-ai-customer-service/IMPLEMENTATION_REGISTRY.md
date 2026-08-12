# IMPLEMENTATION REGISTRY

## SYNCHRONIZATION MATRIX & DISCOVERY

| Capability | Existing Implementation | Evidence Path | Classification | Authoritative Owner | Planned Action | Expected Test | Notes |
| ---------- | ----------------------- | ------------- | -------------- | ------------------- | -------------- | ------------- | ----- |
| **Channel Layer** |
| /help workspace | Implemented | `src/app/help/page.tsx` | EXTEND | Shared Core | Replace placeholder with durable UI | T-HELP-01 | Reusing route |
| Digital Human | Implemented | `src/components/ai/RentipidAIAssistant.tsx` | NEW | DigitalHumanProviderAdapter | Implement provider integration/WebRTC | T-DH-01 | No duplicate logic |
| Contextual AI | Not implemented | N/A | NEW | Shared Core | Build context entry helper | T-HELP-02 | |
| PWA/Capacitor | Basic setup exists | `next.config.ts`, `package.json` | EXTEND | Shared Core | Add media permissions/lifecycle | T-DH-04 | |
| **Shared Core** |
| AI Service Orchestrator | Basic mock orchestrator | `src/lib/ai/ai-command-layer.ts` | EXTEND | ONE AI Service Orchestrator | Build out real prompt/tool loop | T-CASE-01 | Extend existing layer |
| Conversation Service | Schema missing | `prisma/schema.prisma` | NEW | ONE AI Service Orchestrator | Add `AiConversation` model | T-CASE-02 | |
| Session Service | Implemented | `src/lib/ai/broker/AiSessionBroker.ts` | NEW | AvatarSessionBroker | Add `AiServiceSession` model | T-AUTH-03 | |
| AI Support Case Platform | Implemented | `src/lib/ai/cases/AiCasePlatform.ts` | NEW | ONE AI Support Case Platform | Add `AiSupportCase` and lifecycle | T-CASE-01 | |
| Knowledge Service | Implemented | `src/lib/ai/` | NEW | ONE Knowledge Service | Add `AiKnowledgeSource` and retrieval | T-KNOW-01 | |
| AI Tool Gateway | Implemented | `src/lib/ai/tools/AiToolGateway.ts` | NEW | ONE RENTipid AI Tool Gateway | Implement strict tool authorization | T-SEC-02 | |
| Deterministic Policy | Implemented | `src/lib/ai/policy/AiPolicyEngine.ts` | NEW | ONE deterministic policy/transaction path | Enforce policy engine | T-PAY-02 | |
| Claims Automation | Implemented | `src/lib/ai/policy/AiPolicyEngine.ts` | NEW | ONE shared claim orchestration | Reuse `DamageClaim` via tool | T-CAS-01 | |
| Disputes Automation | Implemented | `src/lib/ai/policy/AiPolicyEngine.ts` | NEW | ONE shared dispute orchestration | Reuse `DisputeCase` via tool | T-CAS-02 | |
| KYC Automation | Implemented | `src/lib/ai/policy/AiPolicyEngine.ts` | NEW | Map existing KYC safely | Enforce via `AiToolGateway` | T-AUTH-05 | |
| Insurance Automation | Implemented | `src/lib/ai/policy/AiPolicyEngine.ts` | NEW | Access existing insurance safely | Enforce via `AiToolGateway` | T-INS-01 | |
| Contextual AI Entry | Implemented | `src/lib/ai/context/AiContextHelper.ts` | NEW | Safe route/entity context | Enforce server-side ownership | T-CTX-01 | |
| Technical Diagnostics | Implemented | `src/lib/ai/diagnostics/AiDiagnosticsHelper.ts` | NEW | Cross-channel self-repair | Network/PWA/Session checks | T-DIA-01 | |
| AI Guardrails | Implemented | `src/lib/ai/security/AiGuardrails.ts` | NEW | Prompt injection/PII filter | Defense for AI responses | T-SEC-03 | |
| Resilience/Breaker | Implemented | `src/lib/ai/resilience/AiCircuitBreaker.ts` | NEW | Provider outage safe hold | Fallback control & limits | T-RES-01 | |
| Verified Resolution | Implemented | `src/lib/ai/cases/AiCasePlatform.ts` | NEW | ONE stored verified resolution | Add `AiResolution` model | T-CASE-05 | |
| **Domain Layer** |
| Auth | NextAuth | `src/lib/auth.ts` | REUSE | Existing Auth | Reuse for actor resolution | T-AUTH-01 | |
| RBAC / Ownership | DB-backed | `src/lib/permissions.ts` | REUSE | Existing RBAC | Enforce in Tool Gateway | T-AUTH-04 | |
| Booking / Rental | Prisma models | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | T-BOOK-01 | |
| Listing / Provider | Prisma models | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | N/A | |
| Payment / Refund / Deposit | Prisma models | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | T-PAY-01 | |
| Claims / Disputes | `DamageClaim`, `DisputeCase` | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | T-CLAIM-01 | |
| KYC | `VerificationDocument` | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | T-KYC-01 | |
| Insurance | Insurance models | `prisma/schema.prisma` | REUSE | Existing Domain | Expose via tools | N/A | |
| Notifications | `Notification` | `prisma/schema.prisma` | REUSE | Existing Domain | AI to trigger notifications | N/A | |
| **Governance / Security** |
| AuditLog | `AuditLog` | `prisma/schema.prisma` | REUSE | Existing AuditLog | Gateway to write logs | T-SEC-02 | |
| SecurityEvent | `SecurityEvent` | `prisma/schema.prisma` | REUSE | Existing SecurityEvent | Log suspicious tool calls | T-SEC-01 | |
| Feature Flags / Controls | SystemSettings | `src/lib/ai/ai-settings-service.ts` | EXTEND | Shared Core | Add quotas and provider health | T-TECH-03 | |
