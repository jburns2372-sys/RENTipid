# IMPLEMENTATION REGISTRY - UNIFIED AI v1.1

Baseline: aa180160d25cb12764099d487382d3f98e534a97 (UAICS-DH-CR-001).

| Capability | Current implementation | Classification | Canonical owner / P0 disposition |
| --- | --- | --- | --- |
| /help workspace | src/app/help/page.tsx | REUSE + EXTEND | P1 may change presentation only. |
| AI chat endpoint | src/app/api/ai/chat/route.ts | REUSE | Sole customer AI API; calls processAICommand. |
| AI command layer | src/lib/ai/ai-command-layer.ts | REUSE + EXTEND | Sole command entry; no competing response path. |
| Injection/security guard | security AIGuard; src/lib/ai/ai-guardrails.ts | REUSE | Existing prompt/output protections. |
| Authentication | src/lib/auth.ts | REUSE | Existing NextAuth session authority. |
| RBAC/permissions | src/lib/permissions.ts; database user role; src/lib/ai/ai-permissions.ts | REUSE | Existing roles remain authoritative; AI bot access is additive authorization only. |
| Context authorization | src/lib/ai/context/AiContextHelper.ts | REUSE + ADDITIVE EXTENSION POSSIBLE | Client IDs remain hints; replace mock ownership source in a later authorized phase. |
| Conversation history | AiConversation, AiMessage | REUSE | Canonical message/history persistence. |
| AI support cases | src/lib/ai/cases/AiCasePlatform.ts; AiSupportCase | REUSE | Canonical autonomous case platform. |
| Case/entity relationships | AiCaseEntityLink | REUSE + ADDITIVE EXTENSION POSSIBLE | Re-authorize every entity server-side. |
| Follow-ups | AiFollowUp | REUSE + ADDITIVE EXTENSION POSSIBLE | Worker/lease hardening deferred. |
| Knowledge registry | src/lib/ai/knowledge/source-registry.ts | CONFIG/REGISTRY ONLY | Registry KB1-INITIAL-146; no P0 mutation. |
| Knowledge retrieval/storage | src/lib/ai/context/knowledge-retrieval.ts; AiKnowledgeSource; AiKnowledgeChunk | REUSE | Sole approved Knowledge Center/storage. |
| Knowledge validation/sync | scripts/knowledge/knowledge-runner.ts | REUSE | Read-only checks passed; bootstrap/sync not run. |
| Tool Gateway | src/lib/ai/tools/AiToolGateway.ts; src/lib/ai/tools/registry.ts | REUSE + EXTEND | Sole transactional AI gateway. |
| Policy/domain authority | src/lib/ai/policy/AiPolicyEngine.ts plus existing domain services | REUSE | AI cannot replace domain authority. |
| Audit/interaction telemetry | AuditLog, SecurityEvent, AIBotLog, src/lib/ai/ai-telemetry.ts | REUSE + ADDITIVE EXTENSION POSSIBLE | Durable telemetry hardening deferred. |
| Digital Human adapter | src/lib/ai/adapters/DigitalHumanProviderAdapter.ts | REUSE + EXTEND | Adapter only; credentials pending. |
| Text/mock fallback | src/lib/ai/adapters/MockProviderAdapter.ts; AiSessionBroker | REUSE | Text fallback preserved. |
| OAT framework | scripts/oat/oat-runner.ts; src/lib/oat/modules/ai-oat.ts | REUSE | OAT-AI-MASTER-001 enabled and READY in guarded test check. |
| AI interaction feedback | No dedicated model | NEW MODEL REQUIRED only if later approved | Not required for P1; do not reuse unrelated beta/social feedback as AI authority. |

Legacy IssueTicket and SupportTicket models are not runtime-integrated with Unified AI and are not an approved support queue.
