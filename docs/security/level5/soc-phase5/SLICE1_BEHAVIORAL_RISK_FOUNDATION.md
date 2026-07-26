# SOC Phase 5 Slice 1: Explainable Behavioral Intelligence Foundation

## Purpose
This document provides evidence for the implementation of the first SOC Phase 5 capability: a deterministic, read-only, explainable behavioral-risk engine operating over the normalized security-event evidence provided by accepted SOC Phases 0–4. This slice establishes the intelligence foundation without persistence, UI, or enforcement.

## SOC Phases 0–4 Inherited Controls
- SecurityEvent normalization and ingestion
- Deterministic detection rules
- SecurityAlert records and Incident Cases
- Scoped response execution, rollback, and emergency freeze
- Database-authoritative RBAC/PBAC boundaries

## Exact Inherited SecurityEvent Fields Consumed
- `eventId` (Maps to DB `id`)
- `eventType` (Maps to `event_code` or `event_category`)
- `severity` (`SecuritySeverity`)
- `occurredAt` (`Date`)
- `outcome` (`action_result`)
- `subjectRef` (Target/Subject user ID)
- `actorRef` (Actor user ID)
- `sourceId` (`source_type`)
- `environment` (`SecurityEnvironment`)
- `lifecycle` (`SecurityLifecycle`)

## Architecture
- **Types**: Minimal privacy-safe DTOs defining `BehavioralRiskAssessment`, `BehavioralRiskSignal`, and bounded enums for confidence and risk bands.
- **Policy**: A strictly versioned and deterministic rule definition, mapping signals to base/max weights and required thresholds.
- **Engine**: A pure, stateless calculation function receiving an array of events and yielding a bounded advisory risk score based purely on the policy logic.

## Policy Version
Current active policy version: **1.0.0**

## Signal Families Implemented
- `AUTH_REPEATED_DENIAL`: Repeated Authentication Denials
- `PRIVILEGED_ACTION_ANOMALY`: Privileged Action Anomaly
- `HIGH_SEVERITY_CONCENTRATION`: High Severity Concentration
- `CROSS_SOURCE_ANOMALY`: Cross-Source Anomaly

## Score Boundaries
- Minimum score: 0
- Maximum score: 100
- Risk bands map to total score: LOW (0-29), MEDIUM (30-59), HIGH (60-84), CRITICAL (85+).

## Confidence Calculation
Confidence is determined solely by the raw number of evidence events contributing to the final score calculation:
- VERY_HIGH (10+)
- HIGH (5-9)
- MEDIUM (3-4)
- LOW (< 3)

## Time-Decay Behavior
Signals employ a mathematical time decay over a specified half-life (default 3 days). Evidence events occurring exactly at the half-life window are weighted at exactly 50% of the base weight. Future events are safely ignored and trigger no decay.

## Environment and Lifecycle Isolation
The engine strictly rejects cross-environment (e.g. `PRODUCTION` vs `STAGING`) and cross-lifecycle (e.g. `LIVE` vs `DRY_RUN`/`TESTING`) contamination.

## Privacy-Safe Output
Raw database payloads, passwords, and user-sensitive text are implicitly stripped by the input interface `NormalizedEventEvidence`. The output contains exactly the defined bounds and references.

## Evidence-Linking Behavior
Every returned `BehavioralRiskSignal` retains the exact `eventId` strings that contributed to its creation, ensuring a perfect audit trail from the advisory risk output back to the SOC Phase 0 immutable ingestion record.

## Advisory-Only Restrictions
The final generated assessment strictly specifies `advisoryOnly: true`. It calculates intelligence metrics without making authorization, response, transaction, or playbook enforcement decisions.

## Test Totals
- Test files: 1
- Suites: 1 passed, 1 total
- Tests: 13 passed, 13 total
- Skipped: 0

## ESLint Result
0 errors, 0 warnings. (Any suppressions explicitly avoided).

## TypeScript Classification
0 new TS errors from the intelligence module.

## Build Result
Production Turbopack build `npm run build` completed successfully with 0 errors. The existing Next.js `context.params` fixes remain perfectly intact.

## Known Limitations
- Purely in-memory: Recomputes entirely for every request over the provided array.
- Depends on correct upstream chronological sorting of passed events.
- Evaluates behavior for a single distinct `subjectRef` in a single pass.

## Explicit Non-Goals (Slice 1 Boundaries)
- No database persistence in Slice 1
- No dashboard in Slice 1
- No AI in Slice 1
- No autonomous response
- No production activation

## Next Planned Slice
Persistence, correlation records, and investigation queries.
