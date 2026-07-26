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
The existing Slice 2 additive schema and migration are accepted and unchanged. No migration reapplication occurred. It utilizes a three-structure design:
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
The integration test suite (`tests/security/intelligence/behavioral-risk.persistence.integration.test.ts`) executed on the guarded isolated local PostgreSQL test database, successfully asserting 20 required behaviors.

**Exact Inherited Test Totals**:
- 1 focused suite passed
- 20 tests passed
- 0 failed or skipped

### Validation History and R2 Correction
- **R1 Context**: The initial R1 TypeScript result occurred before the final import-related edit and was therefore not final evidence. The initial R1 build failed because `BehavioralSignalCode` was used but not imported.
- **R2 Context**: R2 added the missing type import without runtime or behavioral changes. Integration tests and ESLint were not repeated because the R2 production change was type-import-only. Inherited targeted ESLint result is 0 errors.
- **R2 TypeScript Validation**: Completed. Zero new Slice 2 errors or persistence errors. (Command: `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit`, Exit code: 1 due to existing inherited Phase 3 test typing issues).
- **R2 Build Validation**: Production build completed successfully without Slice 1 or Slice 2 errors. Checkout and protected-route corrections remain intact. (Command: `npx cross-env NODE_ENV=production dotenv -e .env.test.local -e .env.test -- npm run build`, Exit code: 0).
- **R2 Commit**: `fix(security): finalize Slice 2 build evidence` (committed following this document's creation).

### Boundary and Compliance Statements
- Complete repository production readiness is not claimed solely by this slice.
- No schema modification or migration reapplication.
- No database access during R2.
- No API or dashboard.
- No AI.
- No autonomous enforcement.
- No production access, push, or deployment.
- This document does not claim certification, compliance, external assurance, or autonomous intelligence.

### Next Planned Slice
The next planned slice will build the protected investigation API and Phase 5 dashboard read interface over these queries.
