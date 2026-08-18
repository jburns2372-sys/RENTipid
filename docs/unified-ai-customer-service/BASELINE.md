# RENTIPID UNIFIED AI v1.1 - P0 CONTROLLED BASELINE

## Status

- P0 status: PASS
- Reconciliation date: 2026-08-14
- Phase: P0 controlled baseline reconciliation
- Change record: UAICS-DH-CR-001
- Repository: C:\Users\user\Documents\JD SOFTWARE PROJECTS\RENTipid

## Source identity

- Source branch: feature/soc-phase4-threat-response
- Current implementation source HEAD: aa180160d25cb12764099d487382d3f98e534a97
- Documented/historical source baseline: 067ad72db92d73de58b6cf4463473c44650a173c
- Historical Unified AI closure commit: 88565b721d0a4e404fd6a3c6ab7d3146a394665b
- Remote relationship at reconciliation entry: local branch was four commits ahead of origin/feature/soc-phase4-threat-response
- Worktree at reconciliation entry: CLEAN; no staged, unstaged, or untracked files

067ad72db92d73de58b6cf4463473c44650a173c is a verified Git ancestor of the current source HEAD. The descendant history includes the committed Unified AI closure, /api/ai/chat restoration, customer-role concierge access, approved-knowledge grounding, OAT onboarding, the canonical knowledge synchronization engine and guards, and subsequent documentation/progress commits. The current HEAD is therefore a legitimate descendant baseline, not an unexplained replacement or destructive reset.

## Canonical architecture evidence

- One customer AI endpoint: src/app/api/ai/chat/route.ts.
- One canonical command entry: processAICommand in src/lib/ai/ai-command-layer.ts.
- Approved knowledge retrieval: src/lib/ai/context/knowledge-retrieval.ts backed by AiKnowledgeSource and AiKnowledgeChunk.
- Injection/output protection: existing security AIGuard plus src/lib/ai/ai-guardrails.ts.
- Bot authorization: the authenticated session role enters the canonical command layer; transactional tools independently resolve the actor from the database.
- One Tool Gateway: src/lib/ai/tools/AiToolGateway.ts with the canonical registry in src/lib/ai/tools/registry.ts.
- One conversation/case family: AiConversation, AiMessage, AiSupportCase, AiCaseEntityLink, AiFollowUp, evidence, resolution, policy-decision, and tool-execution models.
- One Digital Human adapter: src/lib/ai/adapters/DigitalHumanProviderAdapter.ts, selected by AiSessionBroker; MockProviderAdapter and text fallback remain available.
- One Help route: src/app/help/page.tsx, posting text through /api/ai/chat.
- One OAT registry/runner: src/lib/oat/oat-module-registry.ts and scripts/oat/oat-runner.ts; AI module OAT-AI-MASTER-001 is registered.
- One knowledge registry/runner: src/lib/ai/knowledge/source-registry.ts and scripts/knowledge/knowledge-runner.ts.

The pre-existing IssueTicket and SupportTicket schema models are legacy beta/UAT records originating before the Unified AI implementation. No runtime consumers were found under src, apps, or tests, and they are not wired into the Unified AI command or case flow. They do not constitute a human customer-support queue for v1.1.

## Schema impact classification

| Area | P0 classification | Basis |
| --- | --- | --- |
| AiConversation | REUSE | Existing canonical conversation root. |
| AiMessage | REUSE | Existing canonical message history. |
| AiSupportCase | REUSE | Existing canonical autonomous support-case state. |
| AiCaseEntityLink | REUSE + ADDITIVE EXTENSION POSSIBLE | Existing entity-link shell; later server-authorized relationship hardening may be additive. |
| AiFollowUp | REUSE + ADDITIVE EXTENSION POSSIBLE | Existing model; later worker/lease hardening is outside P0/P1. |
| AiKnowledgeSource | REUSE | Canonical approved knowledge source. |
| AiKnowledgeChunk | REUSE | Canonical chunk storage; no second vector store is required. |
| Audit/interaction telemetry | REUSE + ADDITIVE EXTENSION POSSIBLE | AuditLog, SecurityEvent, and AIBotLog exist; durable usage telemetry may be extended later. |
| AiInteractionFeedback | NEW MODEL REQUIRED only if later approved | Existing beta/social feedback models do not represent per-interaction AI feedback. It is not required for P1 and must remain deferred to its approved schema phase. |

No P0 schema or migration change is required.

## Process-memory and later-hardening risks

- AiSessionBroker keeps nonce, quota, concurrency, and activity state in process-local maps/sets.
- AiToolGateway uses a process-local replay cache in addition to persisted execution records.
- AiTelemetryService keeps session token counters in process memory and logs usage to stdout.
- MockProviderAdapter keeps mock sessions in process memory.
- AiContextHelper currently uses mock ownership records; client entity identifiers must remain hints until server-backed authorization is used.
- The canonical command layer currently blocks simulated direct tool syntax and does not yet dispatch production actions through the Tool Gateway. P1 must remain presentation-only and route all text/suggestions through the existing command entry.

These are known later-phase persistence/authorization hardening items. None requires a second framework or blocks the P1 Help Center UX shell.

## Non-mutating validation

- git branch --show-current -> feature/soc-phase4-threat-response.
- git rev-parse HEAD -> aa180160d25cb12764099d487382d3f98e534a97.
- git merge-base --is-ancestor 067ad72... aa180160... -> PASS.
- npm run knowledge:inventory -> 146 candidates, 107 synchronizable, 0 unclassified, 0 unaccounted.
- npm run knowledge:validate -> valid; 0 registry issues and 0 content issues.
- npm run knowledge:diff -> exit 0; canonical entries reconciled without missing/invalid actions.
- npm run knowledge:check -> 100% coverage; 0 missing, invalid, duplicate, or stale; 107 active sources and 705 chunks.
- npm run knowledge:report -> 146/146 accounted and 100% coverage.
- .\node_modules\.bin\prisma.cmd validate -> schema valid.
- npm run oat:list -> AI OAT module enabled.
- Guarded local-test AI OAT check -> fixtures/dependencies/RBAC/mock provider/feature flags READY; blockers NONE; overall READY.
- Targeted Jest validation -> 3 suites passed, 25 tests passed.

## Integrity confirmation

- CUSTOMER_FACING_FEATURE_CHANGED_DURING_P0 = NO
- DATABASE_SCHEMA_CHANGED_DURING_P0 = NO
- DATABASE_BUSINESS_DATA_CHANGED_DURING_P0 = NO
- KNOWLEDGE_BOOTSTRAP_OR_SYNC_PERFORMED_DURING_P0 = NO
- PREVIEW_OR_PRODUCTION_DEPLOYMENT_PERFORMED_DURING_P0 = NO
- P0_CONTROLLED_BASELINE_GATE_SATISFIED_FOR_CURRENT_REPOSITORY_STATE = YES
