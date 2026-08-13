# RENTipid Freeze Register

| Freeze ID | Scope | Frozen baseline | Authority/evidence | Status | Reopen rule |
| --- | --- | --- | --- | --- | --- |
| FRZ-ADDR-2026-001 | Global Address, Google autocomplete/details, canonical PH resolution, PSGC barangays, encrypted persistence and regressions | `6f55296cdf1ff2bda3c550448fc307f264f1f397` | Address Pass 4 plus accepted protected Preview UI and Production readiness | CLOSED / FROZEN | Requires explicit `CR-YYYY-NNN`; delta-only pipeline |
| FRZ-SEC-LEGACY-001 | Formal Security Level 5, Gate 4F/4G/4H/4I and named SOC slices | Historical tagged/freeze records; many records omit one consolidated accepted SHA | Formal phase register and phase-specific evidence | FROZEN historical baseline; current promotion gate LOCAL ACCEPTANCE PASS | Do not reprocess; only missing Preview/Production gates or explicit change record |
| FRZ-PRIV-V1-001 | Privacy Module v1 defined scope | Certificate states no repository commit/tag | Final closure certificate and evidence bundle | FROZEN historical baseline; current promotion gate LOCAL ACCEPTANCE PASS | Preserve accepted controls/deferrals; fill missing Preview/Production gates |
| FRZ-INS-P0-2026-001 | Insurance Phase 0 requirements/architecture reconciliation only | `6f55296cdf1ff2bda3c550448fc307f264f1f397` plus frozen R1-R15 handoff | Owner-authoritative Insurance Phase 0 status | CLOSED / FROZEN for Phase 0 only | Does not freeze implementation; Slice 1 and later scopes use mandatory promotion gates |

## Active change records

- `CR-2026-001`: Identity/Auth fail-closed secret and account-state hardening. The delta is CODE COMPLETE, is not frozen, and awaits real local acceptance. Password recovery is outside this delta.

## Not frozen under this register

- Prohibited Items: conflicting evidence prevents a current freeze.
- Marketplace Sample Seed v1: accepted dataset, but not a freeze of the entire Marketplace module.
- Phase 19/19B live-payment documents: NO-GO/reserved decisions are safety controls, not proof that payment/refund/payout modules are complete.
- Deployment inventory labels: repository inventory closure does not close product modules.

## Change record format

Any frozen-scope modification must create `CR-YYYY-NNN` and record:

- frozen baseline and exact reopen reason;
- smallest affected scope and dependencies;
- source/database/security impact;
- migration and seed impact;
- focused regression and complete delta acceptance;
- Preview migration/acceptance and production-readiness evidence;
- new frozen SHA without erasing the prior baseline.

## FRZ-INS-S1-2026-001

- Scope: TRU-01 Insurance Technical Foundation Slice 1.
- Frozen baseline: 2ff068991950de64e3bf0931ed76a5650217dbe2.
- Authority/evidence: EVD-INS-S1-GATE1 through EVD-INS-S1-GATE9.
- Status: CLOSED / FROZEN.
- Reopen rule: targeted change control and affected-scope promotion only;
  later Insurance slices do not reopen unaffected Slice 1 behavior.
