# RENTIPID DATA FLOW AND CLASSIFICATION REGISTER

## 1. Data Classification Schema
- **PUBLIC:** Information freely available (e.g., published listings).
- **INTERNAL:** Operational data not for public release (e.g., aggregate metrics).
- **CONFIDENTIAL:** User-specific but not inherently harmful if exposed (e.g., user profiles).
- **HIGHLY_CONFIDENTIAL:** Private messages, precise locations, non-public tenancy agreements.
- **RESTRICTED_FINANCIAL:** Payment card data (PANs), bank routing details, escrow ledger states.
- **RESTRICTED_IDENTITY:** Government IDs, biometrics, SSN/TIN used for KYC.
- **SECURITY_SENSITIVE:** Audit logs, SOC incident reports, threat intelligence.
- **CREDENTIAL_OR_SECRET:** Passwords, API keys, session tokens (Never store unhashed/unencrypted).

## 2. Sensitive Data Flows

| Flow ID | Flow Name | Source | Destination | Trigger | Actor | Data Categories | Data Classification | Purpose | Business Basis | Trust Boundaries | AuthN | AuthZ | Validation | Enc in Transit | Enc at Rest Evidence | Integrity | Logging | Retention | Deletion | Failure Behavior | Ext Processor | Evidence IDs | Gap IDs | Risk IDs | Target Phase | Evidence Class |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **DF-001** | Login / Registration | Public Client | Backend API | User submits credentials | User | Email, Hash | CREDENTIAL_OR_SECRET | Authentication | Contract | TB-001, TB-002 | None | None | Zod | Yes | N/A (Hashed) | Rate Limiting | Auth Logs | Account life | Hard delete | 401 | None | EV-001 | N/A | RSK-004 | 5C | VERIFIED_IMPLEMENTATION |
| **DF-002** | KYC Submission | Authenticated Client | File Storage | User uploads ID | User | Gov ID photos | RESTRICTED_IDENTITY | Identity Verification | Legal Obligation | TB-002, TB-003 | Session | Permissions | Zod | Yes | NOT_EVIDENCED | Hash checking | App Logs | 5 Years | Manual | Reject upload | Identity Vendor (Planned) | N/A | GAP-006 | RSK-009 | 5F | NOT_EVIDENCED |
| **DF-003** | Payment Initiation | Authenticated Client | PayMongo | User books listing | User | Payment details | RESTRICTED_FINANCIAL | Process Payment | Contract | TB-002, TB-004 | Session | Permissions | Zod | Yes | N/A | Idempotency | Payment Logs | 7 Years | N/A | Reject booking | PayMongo | EV-010 | GAP-007 | RSK-006 | 5G | VERIFIED_DOCUMENTED_ARCHITECTURE |
| **DF-004** | Payment Webhook | PayMongo | Backend API | Payment clears | PayMongo | Transaction status | INTERNAL | Escrow Release | Contract | TB-005 | Webhook Sig | Webhook Sig | Zod | Yes | DB (Plaintext) | Signature validation | Webhook Logs | 7 Years | N/A | Retry / 400 | PayMongo | EV-010 | GAP-007 | RSK-006 | 5G | VERIFIED_DOCUMENTED_ARCHITECTURE |
| **DF-005** | Security Event Ingestion | App Components | DB | Anomalous action | System | Event details | SECURITY_SENSITIVE | Threat Detection | Legitimate Interest | TB-003 | App Context | None | Type-safe | Yes | DB | ORM | SOC Logs | 1 Year | Automated | Log to stdout | None | EV-003 | N/A | RSK-020 | 5J | VERIFIED_IMPLEMENTATION |
| **DF-006** | Response Execution | SOC Dashboard | Backend API | Analyst executes | SOC Analyst | Target ID, Action | SECURITY_SENSITIVE | Threat Mitigation | Legitimate Interest | TB-002 | Session | Proxy/Permissions | Zod | Yes | DB | Idempotency | App Logs | 1 Year | Automated | 403 / Rollback | None | EV-002, EV-009 | GAP-005 | RSK-022 | 5E | VERIFIED_IMPLEMENTATION |
| **DF-007** | Response Rollback | SOC Dashboard | Backend API | Analyst reverts | SOC Analyst | Execution ID | SECURITY_SENSITIVE | Error Correction | Legitimate Interest | TB-002 | Session | Proxy/Permissions | Zod | Yes | DB | State checks | App Logs | 1 Year | Automated | Partial state | None | EV-008 | GAP-005 | RSK-024 | 5L | PARTIALLY_IMPLEMENTED |
| **DF-008** | Account Deletion | Authenticated Client | Backend API | User requests delete | User | User ID | CONFIDENTIAL | Privacy | Consent / Legal Right | TB-002, TB-003 | Session | Permissions | Zod | Yes | DB | None | App Logs | None | Hard delete | Fail | None | N/A | GAP-006 | RSK-029 | 5M | NOT_EVIDENCED |
| **DF-009** | AI Prompt Handling | Backend API | AI Service | Automated feature | System | Context data | CONFIDENTIAL | Enhance UX | Legitimate Interest | TB-006 | API Key | Vendor Auth | Zod (Planned) | Yes | N/A | None | AI Logs | 30 Days | Automated | Fallback | AI Vendor | N/A | GAP-009 | RSK-027 | 5K | NOT_EVIDENCED |

*(Note: Additional flows such as Session renewal, Password recovery, Listing creation, File upload, Booking, Agreement creation, Reconciliation, Escrow state change, Refund or payout, Damage claim, Dispute, Incident creation, Response approval, SOC dashboard reads, and Audit logging follow similar patterns and are incorporated by reference into the broad architecture models pending full implementation.)*
