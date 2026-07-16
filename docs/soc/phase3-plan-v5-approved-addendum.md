# PHASE 3 IMPLEMENTATION PLAN V5 APPROVED ADDENDUM

## Pre-Migration Corrections (Gate 3A)

The following corrections have been incorporated into the final Phase 3 design prior to schema generation:

1. **confidence_increment_per_evidence**: Added as a required field in `DetectionRule` to explicitly control the multiplier when the confidence formula is `BASE_PLUS_EVIDENCE_MULTIPLIER`.
2. **Confidence-formula consistency**: Database constraints enforce that if `confidence_formula` is `STATIC_BASE`, `confidence_increment_per_evidence` must be null or 0. If `BASE_PLUS_EVIDENCE_MULTIPLIER`, it must be > 0.
3. **DSL null behavior**: Explicitly codified: if the evaluated field is null, `EQUALS`/`CONTAINS`/`IN` returns `false`, while `NOT_EQUALS` returns `true`.
4. **Exact field/operator compatibility**: Type definitions restrict operators to scalar types (e.g., `EQUALS` on string) and array types (`IN` on string array).
5. **target_user_id support**: Added `target_user_id` to the allowed DSL fields.
6. **Strategy-specific suppression keys**: 
   - `EXACT_MATCH`: `Hash(RuleID + RuleVersion + Lifecycle + Environment + TriggerEventID)`
   - `WINDOW_BUCKET`: `Hash(RuleID + RuleVersion + Lifecycle + Environment + CorrelationSubjectHash + WindowBucketStart)`
7. **EXACT_MATCH requirements**: Enforced `threshold_count = 1` and `max_evidence_events = 1` for `EXACT_MATCH` deduplication strategy via DB constraints.
8. **WINDOW_BUCKET suppression-period calculation**: Enforces one alert per fixed UTC bucket based on `FLOOR(event_time / window_seconds) * window_seconds`.
9. **Worker limit**: Aligned evaluator maximum batch size to strictly `500` events.
10. **Processing deadline**: Implemented a `45-second` processing deadline under the `60-second` lease to ensure safe expiration padding.
11. **Activation lookback**: Initial rule evaluation cursor lookback is bounded to `min(window_seconds, 300 seconds)` to prevent unbounded historical ingestion.
12. **QUARANTINED state**: Evaluator failures exceeding 3 attempts transition to `QUARANTINED`, a terminal and read-only state for Phase 3.
13. **Emergency-freeze rule**: Renamed to `OPS-FREEZE-CHECKOUT-BLOCKED` and classified strictly as an operational countermeasure (`POLICY_VIOLATION`), explicitly dropping any unverified "fraud" claims.
14. **Stable pagination indexes**: Added composite indexes to `SecurityAlert` (`created_at`, `id`) and `RuleEvaluationLog` (`evaluation_timestamp`, `id`) to guarantee strict cursor pagination stability.
15. **SQL consistency and length constraints**: String length limits (e.g., `review_notes` <= 1000), valid promotion-pair constraints, and exact review state machine integrity checks added directly to Prisma/PostgreSQL.
