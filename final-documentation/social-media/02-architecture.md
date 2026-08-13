# Social Media, Promotion & Feedback Intelligence Architecture

## 1. Locked Module Boundaries
The Social Media module is firmly scoped within existing RENTipid boundaries:
- Unified AI remains the ONLY AI orchestration layer.
- Feedback pipeline routes into existing Case Management (`AiSupportCase`/`IncidentCase`).
- Analytics pipeline tracks events strictly tied to marketplace entities without fabricating deterministic conversion logic.

## 2. Deterministic Publishing Control
AI is forbidden from autonomous publishing. The strict pipeline is:
AI DRAFT -> HUMAN REVIEW -> AUTHORIZATION CHECK -> HUMAN APPROVAL -> DETERMINISTIC SCHEDULER -> PROVIDER ADAPTER -> PROVIDER RESULT -> AUDIT.

## 3. Provider Abstraction
All core business logic interacts exclusively with `SocialAdapter` (e.g. `MockSocialAdapter`). Raw SDKs (Meta, TikTok) are abstracted behind this layer.

## 4. Provider Capability Model
Each provider explicitly declares supported capabilities (e.g. `publishText`, `analytics`, `webhookEvents`). The UI and backend dynamically discover these capabilities to avoid assuming provider parity.

## 5. Health Model
Provider connections have deterministic health states (`HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `AUTH_REQUIRED`, `RATE_LIMITED`). This ensures safe degradation without leaking provider SDK internals to the UI.


## Phase 5 Content Studio
Content Studio architecture is centralized in SocialContentStudioService. It implements optimistic concurrency (version checking) for safe draft editing and explicitly relies on MockSocialAdapter (or real adapters via SocialProviderRegistry) to validate capabilities before assigning target accounts. The UI resides in Next.js Server Components at /dashboard/social/content.

## Phase 12 Comprehensive End-to-End Acceptance
All architectures validated across the 18 unified E2E workflows, including Feedback, Analytics, and Content generation. Mock provider and integration constraints were successfully preserved.

**Phase Status: PASS / FROZEN**