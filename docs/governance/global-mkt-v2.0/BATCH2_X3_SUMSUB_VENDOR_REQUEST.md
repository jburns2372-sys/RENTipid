# Batch 2-X3 Sumsub Vendor Request

Date: 2026-10-08. Workstream: RENTipid GLOBAL-MKT / v2.0.
Target: 46/46 full-function countries. TH/SG/MY/VN/ID are an implementation wave only.
Preparation/due diligence only; NOT Final Project Owner Acceptance, Batch 2 acceptance, legal clearance or Production activation. PH remains 1/46 locally accepted; all five SEA full local lifecycles remain BLOCKED. Global complete NO; freeze NO.

## Status and nonbinding request

DRAFT / NOT SENT. DEC-OWNER-001 selects a preferred candidate, not an executed contract. Request a written country-by-country eligibility/coverage matrix and nonbinding proposal for TH, SG, MY, VN, ID. Do not charge fees or provision Production based on this draft.

## Coverage questions

Confirm individual KYC, identity documents/liveness/address/age rules, business KYB, beneficial owners/authorized representatives, manual review, rejection/retry and AML/sanctions/PEP separately per country. Identify registry/document limitations, residency, retention/deletion, subprocessors, international transfers, DPA/contract prerequisites, pricing, support and onboarding timelines. Documentation coverage is not RENTipid approval.

## Sandbox handoff and engineering contract

Request sandbox app token, API signing secret and separate webhook secret through owner-controlled secret channels only. Confirm sandbox token identification, individual/company level names/evidence policy, SDK session lifetime, exact HMAC request contract and raw-body SHA256/SHA512 webhook headers. Provide synthetic applicant/document examples only.

The single adapter creates pseudonymous applicants, obtains account-bound SDK sessions, signs exact request bytes, retrieves current review state and normalizes results through the global KYC interface. Clarify stable event IDs/retries, applicant reset/reverification and lookup after ambiguous create. No implicit destructive reset/cancellation or fabricated approval is implemented.

Engineering must configure authenticated server authorization, account-owned private document resolution, vendor level policy and dedicated persistent sandbox storage. Credentials alone are insufficient. Keep keys, SDK tokens, evidence bytes and provider free-text comments out of logs/replay records. Vendor results cannot bypass trust-policy/admin RBAC.

## Verification evidence and limits

Test all five countries' individual/company flows, GREEN/RED FINAL/RED RETRY/manual review, wrong account, missing/invalid credentials, forged/raw signatures, duplicate/conflicting/replayed/delayed events and restart recovery. Current credentials MISSING; real sandbox verification NO.

Local sandbox SQLite demonstrates durability on a persistent sandbox host, not Production multi-instance/serverless readiness. Production persistence/backup/concurrency, contracts and activation need later authorization. No external submission, vendor account, real applicant or binding agreement was created.
