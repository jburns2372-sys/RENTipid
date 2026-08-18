# R15 — CHANGE CONTROL

| Baseline Identifier | Source |
|---|---|
| MASTER BASELINE | Insurance Module Master Plan v1.1 |
| ENGINEERING BASELINE | 6f55296cdf1ff2bda3c550448fc307f264f1f397 (pre-Slice-1 baseline) |
| TECHNICAL FOUNDATION SLICE 1 FROZEN BASELINE | 2ff068991950de64e3bf0931ed76a5650217dbe2 |

**Process**:
Any post-freeze architecture change requires:
1. CR number
2. reason
3. affected requirement IDs
4. affected files
5. regression scope
6. approval
7. new frozen baseline if accepted

## FRZ-INS-S1-2026-001

- Scope: TRU-01 Insurance Technical Foundation Slice 1.
- Status: COMPLETED / CLOSED / FROZEN.
- Evidence: EVD-INS-S1-GATE1 through EVD-INS-S1-GATE9.
- Reopen rule: any change to normalized contracts, adapter registry, Mock
  adapter, domain/config/audit boundaries or the six-model schema requires a
  targeted change record and affected-scope regression/promotion gates.
- Unaffected frozen behavior must not be reopened.

## CR-2026-INS-001

- Reason: Transaction Block consumes the frozen normalized foundation.
- Affected Slice 1 surface: additive InsurancePolicy failed state, normalized
  webhook policy status fields and deterministic Mock webhook fixture.
- Architecture impact: none; Domain Service -> Registry -> Adapter unchanged.
- Database impact: one additive Transaction Block migration.
- Regression scope: Transaction Block only; Slice 1 evidence was not rerun.
- Status: LOCAL ACCEPTANCE PASS; Preview promotion pending.
