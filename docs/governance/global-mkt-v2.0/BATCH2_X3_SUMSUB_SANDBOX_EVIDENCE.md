# Batch 2-X3 Sumsub Sandbox Evidence

Recorded 2026-10-09 from local execution in RENTipid-GLOBAL-MKT-V2. Status: VERIFIED, with the scope and residual checks below. No secrets, SDK tokens, applicant IDs, webhook payloads or personal data are included.

## Observed real Sandbox evidence

- Sandbox API authentication and Individual level RENTipid-SEA-Provider-KYC passed.
- A synthetic TH Individual applicant was created; WebSDK token generation and signed status retrieval passed. No real personal information or documents were supplied.
- Reopening the dedicated SQLite store in a separate process preserved the binding and current status. A creation retry reused the original applicant.
- A distinct, newly created synthetic applicant generated a genuine applicantCreated delivery on 2026-10-09, immediately after the 09:50:12 UTC creation observation. No Dashboard Test webhook or locally fabricated event was used.
- The HTTP callback logged one POST 200, stored a durable receipt for that new applicant and advanced its persisted state version to 1.
- Receipt creation is downstream of verified SHA256/SHA512 HMAC, sandboxMode=true, testMode not true, account binding and signed status reconciliation. Thus genuine authenticated sandbox processing is evidenced; the specific digest algorithm and absent-versus-false testMode were not retained.
- Reopening the real receipt in another process returned the same current state on duplicate lookup without a version change. Reusing its event key with a different fingerprint raised KYC_EVENT_CONFLICT.
- Unsigned and invalidly signed local/public HTTP requests returned 401. Configured credentials and synthetic account/applicant identifiers were absent from checked server logs; raw payloads and SDK tokens are not logged or persisted.

## Outstanding evidence / limits

Genuine delivery header/body metadata is still needed to evidence SHA256 specifically and distinguish absent testMode from testMode=false. Actual duplicate HTTP redelivery of that genuine event has NOT been observed; durable receipt replay is not labelled HTTP-redelivery evidence.

This is Individual API/callback smoke validation, not document upload, liveness, AML/PEP, business verification, final applicant approval, full marketplace lifecycle or five-country external coverage validation. Credential presence alone does not assert verification; this record is based on real execution. Runtime configuration getters do not automatically promote any provider to SANDBOX_VERIFIED or PRODUCTION_READY.

The temporary public tunnel must be kept alive and its target updated whenever its URL changes. Dedicated local SQLite is sandbox-only, not approved multi-instance/serverless Production storage.

Global target remains 46/46 full-function countries; accepted 1/46. TH/SG/MY/VN/ID full local lifecycles remain BLOCKED. Batch 2 NOT ACCEPTED, global complete NO, freeze NO.
