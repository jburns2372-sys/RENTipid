# ISO-C2 Cloud / Supplier Verification

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Date: 2026-10-22. Reviewer: Codex. Source tree: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a.

This is repository inspection and documentary reconciliation only. No existing tests, builds, migrations, seeds, scans, provider or environment validations rerun. Evidence inherited within its original scope is PASS — REUSED / UNAFFECTED. No remediation, deployment, tag, freeze, ISO-C3 or residual-risk acceptance.

## 1. Assessed domains

| Domain IDs | Classification | Count |
|---|---|---:|
| None | PROVEN — OPERATING CONFORMITY | 0 |
| None | PROVEN — IMPLEMENTED | 0 |
| CTRL-17 | PARTIAL | 1 |
| None | GAP | 0 |
| CTRL-16 | REQUIRES EXTERNAL PROVIDER EVIDENCE | 1 |

CTRL-23 belongs to Technical Security, not a second count here. The dated CTRL-11 isolation observation belongs to that same area; it does not upgrade whole-provider assurance.

## 2. Provider evidence

ISO_SUPPLIER_AND_SUBPROCESSOR_REGISTER.md records ten historical/planned/conditional identities, not ten approved active processors. Inherited exact sources: EVD-20 processor register, EVD-08 isolation report Section 3, EVD-14/15 historical readiness/backup plans, EVD-21/22 provider review and scoped sandbox evidence.

| Provider/dependency | Supported status / service | Unproven claims rejected |
|---|---|---|
| Vercel | Historical PRO processor; dated hosting and isolated Preview/Production mappings | Enterprise plan, current topology, multi-zone failover, account certification, contract SLA |
| Azure / Neon | EVD-20 historical Azure database; later EVD-08 Neon Production/Preview branches | Neon dev-only and current AWS database assumptions |
| AWS | Historical RDS/S3/IAM design/readiness only | Active account/resources, enabled backups/PITR, installed CloudWatch alarms |
| Sumsub | Scoped synthetic Individual API/genuine callback smoke | Production KYC/biometric processing, full lifecycle, executed DPA or certification |
| Xendit | Separate payment/payout callback-token fixtures; account approval pending | HMAC, real sandbox payment/payout approval, full refund/lifecycle readiness |
| PayMongo | Domestic integration; historical sandbox/pending live pilot evidence | Accepted current live operation or SEA fallback |
| MannyPay | Separate/paused workstream | Operating escrow, IP whitelist/HMAC contract, domestic/regional fallback |
| Cloudflare R2 | src/lib/storage/r2-storage-adapter.ts is unimplemented placeholder | Active WAF/DNS/DDoS/edge configuration |
| SMTP | src/lib/auth/unified/email-delivery.ts requires configuration; actual vendor unresolved | Active Resend/SendGrid agreement or DPA |
| GitHub | Repository and workflow files exist; EVD-13 historical evidence | Enterprise plan, enforced remote branch protection/2FA or current effective mandatory gates |

RSK-09 is a DOCUMENTATION GAP for a current verified configuration baseline/inventory; absence of a custom drift script alone is not a technical defect. RSK-22 is an OPERATING EVIDENCE GAP for actual backup-monitoring/freshness records, not proof CloudWatch exists or is misconfigured. Obtain applicable account/contract/assurance terms through operations/vendors later, without inventing certificates/notice periods/exit paths.

Xendit pending approval is an EXTERNAL DEPENDENCY (RSK-14/15); it can block GLOBAL-MKT Batch 2 real sandbox acceptance but does not block this independent documentary review. No external access, account changes or provider validation was performed.

## Licensed-source limit

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Domain IDs are internal mappings; no verified exhaustive ISO clause conformity or certification is claimed. Existing human/provider/legal gaps remain open.
