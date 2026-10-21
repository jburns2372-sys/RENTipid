# ISO-C2 Technical Security Verification

Project: RENTIPID-ISO-CONFORMITY-001 / v1.0. Package: ISO-C2-R1. Date: 2026-10-22. Reviewer: Codex. Source tree: 47f54aae5bfc99b7ba97f94347c7bfb232627a5a.

This is repository inspection and documentary reconciliation only. No existing tests, builds, migrations, seeds, scans, provider or environment validations rerun. Evidence inherited within its original scope is PASS — REUSED / UNAFFECTED. No remediation, deployment, tag, freeze, ISO-C3 or residual-risk acceptance.

## 1. Assessed domains

| Domain IDs | Classification | Count | Evidence / limits |
|---|---|---:|---|
| CTRL-11 | PROVEN — OPERATING CONFORMITY | 1 | EVD-08 dated Sept 19 Preview isolation restoration Sections 2-3; historical observation, not continuous/current live proof |
| CTRL-03, CTRL-04, CTRL-06, CTRL-12, CTRL-13, CTRL-14 | PROVEN — IMPLEMENTED | 6 | EVD-03/04/06/09/10/11 exact selectors in inheritance register; scoped mechanisms, not complete operating conformity |
| CTRL-15, CTRL-18, CTRL-19 | PARTIAL | 3 | Vulnerability cadence, deployed backup/recovery and continuity evidence incomplete |
| None | GAP | 0 | Partial controls have scoped implementation; zero wholly absent domains is not zero confirmed defects |
| CTRL-05, CTRL-20 | REQUIRES HUMAN EVIDENCE | 2 | Access certification and tabletop records |
| CTRL-23 | REQUIRES EXTERNAL PROVIDER EVIDENCE | 1 | Xendit pending; scoped fixtures are not real vendor acceptance |

## 2. Actual source selectors

- Authentication: src/lib/auth.ts cookie options use SameSite none/lax, HttpOnly and conditional Secure. src/lib/auth/unified/password.ts BcryptPasswordHasher uses bcrypt; src/app/api/auth/register/route.ts hashes with bcrypt. Argon2id and SameSite Strict are not asserted. src/lib/security/authorization.ts and EVD-04 provide scoped authorization evidence; no universal two-person financial/freeze claim.
- Cryptography: EVD-06 PHASE5F_E_ENCRYPTED_ONLY_ROTATION_EVIDENCE.md PROTECTED_FIELD_SCOPE is address, business_address, business_registration_number; SYNTHETIC_DATA_ONLY=true. No all-PII/payment/identity-token encryption guarantee. src/lib/security/crypto/blind-index.ts proves mechanism, not universal email/phone coverage.
- Database: prisma/schema.prisma and EVD-09 prove schema/ownership capability. Tagged SQL exists in src/lib/auth/unified/rate-limiter.ts and src/lib/address/rate-limiter.ts; no claim of zero raw SQL or complete repository-wide injection proof.
- Telemetry: src/lib/security/serializers.ts redactSensitiveData and serializePrivacySafeIp are bounded mechanisms; IP masking there is not HMAC. EVD-10/11 include synthetic event evidence; no recurring live operating logs or blanket redaction guarantee inferred.
- Callbacks: EVD-22 and src/lib/global-market/financial/services/xendit-sandbox-webhook-http.ts use product-specific callback-token authentication. Routes are src/app/api/webhooks/xendit/payment/route.ts and payout/route.ts. No invented shared xendit/route.ts or HMAC claim. Separate orchestrators and durable sandbox stores retain provider limits.

## 3. Confirmed scoped defect and unaffected controls

DEF-RUNTIME-01: src/app/api/auth/register/route.ts POST (line 18) performs lookup (79), bcrypt (87) and transactional account writes (89) without an application-level registration quota check. The later ancillary email request (163) is rate-limited after these effects; it cannot protect them. src/proxy.ts matcher (81) covers dashboards only. Existing OTP, recovery, MFA and address limiters remain implemented; no broad platform WAF is established by repository evidence. This is a missing application guard at an identified expensive public endpoint, not proof of deployed exploitation or absence of all provider DDoS protections. RSK-06 score stays unchanged. A registration throttle changes runtime behavior and requires candidate Preview and Production validation before live closure; see delta matrix/Wave 3.

No current target-traffic evidence supports arbitrary threshold tightening elsewhere. Existing accepted unaffected tests remain inherited. Historical Phase 5L guard evidence is retained; current restore-harness output limitations are DEF-TOOL-02, not proof all past recovery evidence was fabricated.

## Licensed-source limit

EXACT STANDARD MAPPING — REQUIRES LICENSED STANDARD VERIFICATION. Domain IDs are internal mappings; no verified exhaustive ISO clause conformity or certification is claimed. Existing human/provider/legal gaps remain open.
