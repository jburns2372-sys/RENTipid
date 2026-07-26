# RENTIPID SOC PHASE 5: BEHAVIORAL RISK ENGINE
## SLICE 2: BEHAVIORAL RISK PERSISTENCE & HISTORY

**Status**: Completed and Accepted
**Scope**: Behavioral Risk Engine persistence controls and read queries

### Purpose
To provide the minimum additive persistence and read-only investigation data layer for the accepted SOC Phase 5 Slice 1 behavioral-risk engine. This slice persists completed advisory BehavioralRiskAssessment results, their contributing signals, and exact links to SecurityEvent evidence.

### Context
- **Inherited**: SOC Phases 0–4 (Identity, Database, Session, Role, and Threat Response) are accepted, inherited, and unchanged.
- **Foundation**: Slice 1 (Explainable Behavioral Intelligence Foundation) is restored and remains completely unchanged.

### Schema and Migration
The existing Slice 2 additive schema and migration are accepted and unchanged. It utilizes a three-structure design:
- `BehavioralRiskAssessment`
- `BehavioralRiskSignal`
- `BehavioralRiskEvidenceLink`
All relationships are correctly indexed with safe delete behavior (cascade internally, restrict against `SecurityEvent`).

### Persistence Implementation
The persistence service requires explicit, server-side `environment` and `lifecycle` context. It does not modify the output of Slice 1.

**Validation Controls**:
- Rejects non-advisory assessments (`advisoryOnly` must be exactly `true`).
- Validates that `score` is finite and within the 0–100 bounds.
- Validates the `riskBand` and `confidence` enums.
- Strictly validates all dates (generated time, observation windows) for chronological correctness.
- Rejects duplicate signal codes and normalizes duplicate evidence IDs within signals.
- Enforces strict policy caps on signal `effectiveWeight`.
- Subject references must be valid and are trimmed.

**Atomicity and Evidence Existence**:
- Retrieves all required `SecurityEvent` IDs within a single transaction.
- Verifies that every referenced `SecurityEvent` exists before creating any records. Rejects if any are missing.
- Persists the assessment, all contributing signals, and exact evidence links in a single atomic Prisma transaction.
- Never mutates the raw `SecurityEvent` records.

**Idempotency and Concurrency (Fingerprint Design)**:
- Deterministic idempotency fingerprint uses SHA-256 over: subject reference, environment, lifecycle, policy version, window start, window end, sorted evidence IDs, and sorted signal properties.
- Concurrency and duplicate generation are safely resolved utilizing the database's unique constraint on the fingerprint, returning the existing assessment on `P2002` collisions.

### Investigation Queries
Three read functions were implemented in `behavioral-risk.queries.ts`:
1. `getBehavioralRiskAssessmentById`: Fetch an assessment by ID within the strict environment/lifecycle context.
2. `getLatestBehavioralRiskAssessmentForSubject`: Fetch the latest assessment sorted by generated time for a given subject.
3. `listBehavioralRiskHistoryForSubject`: List history with bounded pagination (`MAX_ASSESSMENT_HISTORY_LIMIT` = 50).

**Data Privacy**:
- Queries mandate subject, environment, and lifecycle isolation.
- Returns `PersistedBehavioralRiskAssessment` ensuring privacy-safe outputs.
- Contains no raw `SecurityEvent` metadata, credentials, tokens, or actor payloads.
- Preserves `advisoryOnly: true`.
- Contains no authorization or mutation logic.

### 20-Behavior Test Matrix
The integration test suite (`tests/security/intelligence/behavioral-risk.persistence.integration.test.ts`) executed on the guarded isolated local PostgreSQL test database, successfully asserting:

1. **Atomic assessment, signal, and evidence-link persistence**
2. **Identical logical assessment is idempotent**
3. **Concurrent duplicates result in one assessment**
4. **Score below 0 and above 100 rejected**
5. **advisoryOnly false rejected**
6. **Malformed dates rejected**
7. **Duplicate signal codes rejected**
8. **Duplicate evidence IDs normalize safely**
9. **Missing SecurityEvent ID rejected before persistence**
10. **Existing SecurityEvent rows remain unchanged**
11. **Assessment-by-ID returns the correct privacy-safe record**
12. **Latest assessment query returns the correct record**
13. **History ordering is deterministic**
14. **Maximum page size is enforced**
15. **Environment isolation**
16. **Lifecycle isolation**
17. **Subject isolation**
18. **Signals link to exact evidence IDs without raw metadata**
19. **No alert or incident case is created**
20. **No response, approval, permission, account, marketplace, or payment mutation occurs**

**Exact Test Totals**:
- 1 suite passed
- 20 tests passed
- 0 failed or skipped

### Validation Results
- **Changed-File ESLint**: 0 errors on target changed files.
- **TypeScript Classification**: Zero new Slice 2 errors. Inherited phase 3 test typing issues accurately reported without modification.
- **Build**: Production build completed successfully.

### Prohibitions Verified
- No schema or migration changes were made.
- No database reset or global seed occurred.
- No API, dashboard, or React components were added.
- No AI or automatic schedulers were implemented.
- No production database, push, or deployment access occurred.
- No alerts, cases, or automatic enforcement workflows were triggered.

### Next Planned Slice
The next planned slice will build the protected investigation API and Phase 5 dashboard read interface over these queries.
