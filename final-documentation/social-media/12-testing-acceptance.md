# Testing & Acceptance

Targeted test suite implemented at `tests/social-media/phase3-foundation.test.ts` and `tests/social-media/phase4-provider-connections.test.ts`.

## Coverage
1. **Schema/Foundation**: Prisma models generate and persist records.
2. **Adapter Contract**: MockSocialAdapter resolves successfully.
3. **Idempotency**: Duplicate event processing ignores secondary operations.
4. **Metrics**: Normalized persistence validated.
5. **Attribution**: Cross-table relations verified.
6. **Security**: Credential scrubbing validated; secrets not leaked to DTOs.
7. **RBAC**: Dictionary-based validation behaves predictably.
8. **Health Simulation**: Mock provider validates AUTH_REQUIRED, DEGRADED, RATE_LIMITED correctly.
9. **Account Registry**: All adapters register dynamically.


## Phase 5 Acceptance
Test suite (phase5-content-studio.test.ts) verifies optimistic locking, AI facade boundaries, MockSocialAdapter integration, capability checks, media reference path traversal rejection, and AuditLog event generation.

## Phase 12 Comprehensive End-to-End Acceptance
Authoritative module validation successfully executed via Playwright (`tests/e2e/soc-phase12-e2e.spec.ts`).
Verified 18 critical scenarios including full Content Studio, Scheduling, Approval, Publishing IDempotency, Feedback Intelligence, Campaign Integration, RBAC Denial, Prompt Injection Guardrails, and production build integrity (`npm run build`).

**Phase Status: PASS / FROZEN**