# ISO-C2-R1 Independent Verification and Remediation Plan Checkpoint

Project RENTIPID-ISO-CONFORMITY-001 / v1.0. Date 2026-10-22. Reviewer Codex; original draft Antigravity. Result PASS after documentary corrections. Verification ACCEPTED, not technical remediation completion or full ISO conformity. Baseline 47f54aae5bfc99b7ba97f94347c7bfb232627a5a; branch feat/iso-conformity-v1.0; worktree RENTipid-GLOBAL-MKT-V2. Initial state: two modified governance roll-ups and eight untracked C2 reports only. Initial worktree not clean. Git records subsequent checkpoint SHA/push/cleanliness.

## 1. Domain results

| Area | Operating | Implemented | Partial | Gap | Human | Provider |
|---|---:|---:|---:|---:|---:|---:|
| Technical Security | 1 | 6 | 3 | 0 | 2 | 1 |
| Privacy / PIMS | 0 | 3 | 2 | 0 | 0 | 0 |
| Cloud / Supplier | 0 | 0 | 1 | 0 | 0 | 1 |
| SDLC / Change | 1 | 2 | 2 | 0 | 5 | 0 |
| Total core domains | 2 | 11 | 8 | 0 | 7 | 2 |

Operating claims are only dated executed promotion/isolation observations. Current CTRL-10 enforcement is PARTIAL, not a fully effective mandatory gate. Zero Gap domains does not mean no scoped defects. Standard mappings require licensed verification; no certification/full conformity claimed.

## 2. Confirmed findings and count units

- CONFIRMED TECHNICAL DEFECT (code/runtime):1, DEF-RUNTIME-01 registration POST lacks pre-effect quota guard; no generic middleware-tuning defect asserted.
- CI/CD / TOOLING DEFECT:2, DEF-TOOL-01 CI test failure suppression/runtime contract, DEF-TOOL-02 recovery harness swallowed failures/unmeasured success fields.
- CONFIGURATION DEFECT:0 on a proved deployed cloud/resource state; CI runtime mismatch is part of the coupled tooling issue.
- OPERATING EVIDENCE GAP:2 primary risks (RSK-22/23).
- DOCUMENTATION GAP:3 deduplicated subjects (RSK-05/09 plus actual C1 candidate RSK-18).
- HUMAN/ORGANIZATIONAL GAP:2 (RSK-03/24).
- EXTERNAL DEPENDENCY:6 (4 provider:RSK-14/15/17/26; 2 legal/counsel:RSK-12/30).
- ALREADY CONTROLLED:0 whole authorized risks. Scoped implemented controls and approved retention deferral are retained, not mislabelled complete risk treatment.

These final counts cover one primary finding for each of 15 authorized risks plus one separate RSK-18 C1 candidate, total16. Candidate disposition counts are a separate view, not duplicate findings.

## 3. Actual four C1 conditional items

TRT-B01 secret enforcement:documentation gap. TRT-C02 registration ingress:confirmed runtime defect. TRT-D02 dispute checksums:documentation requirement gap, not a proven code defect. TRT-F02 backup monitoring:operating evidence gap. The original draft wrongly substituted retention/drift/restore items and asserted three defects. Those claimed absences do not establish application defects; genuine CI/harness issues are separately source-supported. Approved manual retention deferral remains intact and production automated deletion disabled.

## 4. Source evidence and contradictions

Exact selectors are in the four domain reports and ISO_C2_RISK_TREATMENT_EVIDENCE_MAP.md. .github/workflows/security-supply-chain.yml line33 masks focused test failures; workflow Node20 differs from package24.x contract. scripts/security/phase5l-backup-restore-drill.ts lines84-107 swallow pg_restore status and emit metrics not measured there; existing guard tests do not exercise these assertions. src/app/api/auth/register/route.ts performs bcrypt/account effects before its later email limiter, while src/proxy.ts matches dashboards only. These are static confirmed conditions; no technical execution needed to establish source behavior.

Historical Phase5I/5L accepted tests and isolated drill observations are retained within scope. Their mere existence does not prove current fail-closed CI or trustworthy future harness outputs. No allegation that every historical observation was fabricated. Current topology remains unresolved from historical Azure/Neon records; active AWS/RDS/CloudWatch, Cloudflare WAF, Resend/SendGrid and universal provider approval claims removed. Scoped crypto, KYC, financial/privacy boundaries corrected to match C1 and actual models. Xendit callback-token fixtures are not HMAC or real approved payment/payout execution. Sumsub smoke does not close marketplace fraud/full KYC lifecycle. MannyPay stays separate/paused.

## 5. Three future waves and impact

1. ISO-C2-M1 — CI GATE ENFORCEMENT + EXECUTION RUNTIME ALIGNMENT. CODEX; RSK-08. Workflow-only fail-closed/runtime-contract repair, focused controlled CI checks; no app DB/schema/seed or runtime deployment delta.
2. ISO-C2-M2 — SYNTHETIC RECOVERY HARNESS FAILURE PROPAGATION + MEASURED EVIDENCE. CODEX; RSK-21, supporting RSK-23. Isolated synthetic database fixtures/restore are actual database mutations; no application migration/live provider access or Preview/Production mutation. Repair harness only, not a human/live-cloud restore exercise.
3. ISO-C2-M3 — REGISTRATION PRE-EFFECT RATE LIMITING + CONTROLLED PROMOTION. CODEX; RSK-06. Runtime change; local/Preview and Production-ready/deployment/verification required before live closure. Existing-schema reuse expected; new quota data writes are real runtime effects. Scope changes require a new impact assessment.

All require limited frozen artifact/module reopening; no blanket NO accepted. Details include files, owner/external prerequisites and each affected/unaffected gate in ISO_C2_CONSOLIDATED_REMEDIATION_PLAN.md and ISO_C2_DELTA_IMPACT_MATRIX.md. Human operations, current inventory/backup evidence, legal counsel and providers remain separate tracks. No unjustified wave dependency or mixing of exercises into application remediation.

## 6. Current lifecycle and safety

Governance inspection/count/JSON/reference/secret and changed-file scope checks:PASS — EXECUTED. Historical unaffected scoped technical evidence:PASS — REUSED / UNAFFECTED; no fresh pass for the three defective conditions. Preview/Production promotion:N/A — NOT APPLICABLE for current docs. This verification package COMPLETED/ACCEPTED/CLOSED:PASS — EXECUTED, with open remediation/evidence requirements. VERSION FROZEN:N/A — NOT APPLICABLE. No builds/typecheck/tests/scans/migrations/seeds/provider/environment validation rerun; no technical remediation/application/database/environment changes, tag/deployment/freeze or ISO-C3. All30 risk scores and 15 treatment authorizations unchanged; zero residual acceptance.

## 7. Decisions and exact next package

Owner must authorize each bounded execution/frozen-artifact reopening before work begins, approve isolated DB fixture envelope for M2 and request-identity/quota/promotion policy for M3. Inventory/provider/operational and legal evidence remain open. Prior treatment authorization is preserved; it does not execute remediation in C2-R1. The review does not require invented provider approvals or new risk acceptance.

Only next recommended remediation package: **ISO-C2-M1 — CI GATE ENFORCEMENT + EXECUTION RUNTIME ALIGNMENT**. NOT STARTED. Stop after C2-R1 checkpoint.
