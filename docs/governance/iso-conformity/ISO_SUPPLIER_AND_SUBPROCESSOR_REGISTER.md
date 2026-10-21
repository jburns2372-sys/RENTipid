# RENTipid ISO Supplier and Subprocessor Register

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Reviewer: Codex / ISO-C1-R1.

## 1. Boundary

Ten distinct provider identities are historical, scoped, planned or conditional dependencies, not ten approved active subprocessors. EVD references resolve through ISO_CONFORMITY_EVIDENCE_INHERITANCE_REGISTER.md. SMTP email has no identified vendor in src/lib/auth/unified/email-delivery.ts; Resend/SendGrid are not assumed active suppliers. No contract, DPA, certificate, SOC report, incident-notice SLA, Production approval or alternative failover is invented.

## 2. Register

| Supplier ID | Provider | Service role | Data dependency | Approval/environment evidence | Specific evidence selector | Security/privacy/contract limit |
|---|---|---|---|---|---|---|
| SUP-01 | Vercel Inc. | Hosting / conditional Blob | Web requests, rendered PII, conditional files | Historical PRO / dated Production-Preview reports | EVD-20 PROC-01; EVD-07/08; src/lib/storage/storage-service.ts | Historical standard online terms/DPA only; current account assurance not verified |
| SUP-02 | Amazon Web Services (AWS) | Historical RDS/S3/IAM design | Conditional database/files if deployed | DESIGN / READINESS ONLY | EVD-14/15 | No active service, contract, DPA or certification inferred |
| SUP-03 | Sumsub | Scoped synthetic Individual API/callback smoke | Synthetic applicant/status; real documents/biometrics conditional | SCOPED SANDBOX VERIFIED; full lifecycle pending | EVD-21 observed evidence and limits | Contracting entity, agreements and attestations require external evidence |
| SUP-04 | Xendit | Separate payment/payout sandbox preparation | Conditional financial references / trusted beneficiary metadata | PENDING ACCOUNT APPROVAL | EVD-22 Callback preparation / fixtures | Callback-token, not HMAC; no account approval or certification inferred |
| SUP-05 | PayMongo | Domestic Philippine integration | Conditional checkout/payment references | Historical SANDBOX; live approval unproven | EVD-20; EVD-14 pending live pilot; EVD-21 no SEA fallback | No live approval, PCI or regulatory attestation inferred |
| SUP-06 | MannyPay | Separate/paused workstream | Conditional financial references | SEPARATE / PAUSED; no activation | EVD-23 provider boundary; EVD-21 no SEA fallback | No contract, operating escrow or regulatory approval inferred |
| SUP-07 | Neon | Historical PostgreSQL branches | Historical Production/Preview data, not dev-only | Dated Sept 19 isolation report; current topology unresolved | EVD-08 isolation Section 3 | No current plan, approval, DPA or attestation inferred |
| SUP-08 | Microsoft Azure / Microsoft Corporation | Historical managed PostgreSQL | Historical persistent marketplace/PII | Historical active processor; later Neon evidence needs reconciliation | EVD-20 PROC-02 | Standard provider terms verified historically; negotiated DPA not separately verified |
| SUP-09 | Cloudflare R2 (conditional candidate) | Unimplemented storage adapter | No transfer evidenced | NOT IMPLEMENTED / NOT ACTIVE-EVIDENCED | src/lib/storage/r2-storage-adapter.ts placeholder | Not active DNS/WAF service; no contract or certification inferred |
| SUP-10 | GitHub | Repository / CI workflow references | Code, developer attribution, conditional CI logs/secrets | Repository evidenced; Enterprise/enforcement unverified | Git origin; EVD-13 Supply Chain Controls | No enforced 2FA/branch rules, Enterprise agreement or attestation inferred |

## 3. Responsibilities and actions

RENTipid verifies its own account configuration, data flows, applicable terms, assurance and exit feasibility. Suppliers operate their services and issue their attestations. Obtain applicable contractual incident/continuity terms before relying on them. Exit/substitution proposals are unapproved and untested. Xendit approval stays pending; MannyPay stays separate/paused; Sumsub is limited smoke evidence. Reconcile dated Azure/Neon hosting history later without a fresh provider validation in C1.

Total registered identities: **10**. No count of approved active providers is asserted. One conditional unimplemented R2 candidate is retained explicitly; it does not establish a current data processor.

## Licensed-source boundary

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Every edition/clause label is provisional inherited alignment, not verified licensed text or legal conclusions.
