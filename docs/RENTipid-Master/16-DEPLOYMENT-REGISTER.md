# RENTipid Deployment Register

Insurance Technical Foundation Slice 1 performed no deployment, Preview action,
Production action, database migration, seed or real insurer request. Real
Insurance activation remains disabled and BLOCKED-EXTERNAL.

No deployment, Production database connection or Production database write was performed during Wave 0.

## Release baselines

| Release scope | SHA | Local | Preview | Production readiness | Deployment status |
| --- | --- | --- | --- | --- | --- |
| Address module | `6f55296cdf1ff2bda3c550448fc307f264f1f397` | Accepted | Migrated and accepted; closed/frozen | PASS | No Production deployment performed by final closure |
| Whole RENTipid application | Current working tree based on `6f55296cdf1ff2bda3c550448fc307f264f1f397` | Multiple gates open | Not eligible | NOT STARTED | Prohibited until LOCAL-RC1 and Preview gates pass |

## Accepted Address Production environment contract

Name/presence only was previously verified for the frozen Address release:

| Name | Presence |
| --- | --- |
| `DATABASE_URL` | PASS |
| `NEXTAUTH_SECRET` | PASS |
| `NEXTAUTH_URL` | PASS |
| `ADDRESS_PROVIDER` | PASS |
| `GOOGLE_MAPS_API_KEY` | PASS |
| `PRIVACY_FIELD_ENCRYPTION_KEY_B64` | PASS |
| `MFA_ENCRYPTION_KEY_ID` | PASS |
| `MFA_ENCRYPTION_KEY` | PASS |

No value is recorded or printed. This contract applies to the accepted Address release and is not evidence that every whole-application integration is configured.

## Whole-application environment families still requiring reconciliation

| Family | Names |
| --- | --- |
| Database/runtime | `DATABASE_URL`, `DIRECT_URL`, `NODE_ENV`, `APP_BASE_URL`, `PORT` |
| Authentication | `NEXTAUTH_URL`, `NEXTAUTH_SECRET` |
| Address | `ADDRESS_PROVIDER`, `GOOGLE_MAPS_API_KEY` |
| Privacy/MFA/crypto | `PRIVACY_FIELD_ENCRYPTION_KEY_B64`, `MFA_ENCRYPTION_KEY_ID`, `MFA_ENCRYPTION_KEY`, `BLIND_INDEX_KEY`, `BLIND_INDEX_KEY_ID`, `PROFILE_FIELD_PROTECTION_MODE`, `RETIRED_FIELD_ENCRYPTION_KEYS` |
| SOC | `SECURITY_TELEMETRY_HMAC_KEY`, `SECURITY_TELEMETRY_HMAC_KEY_VERSION`, `SOC_CORRELATION_HMAC_KEY`, `SOC_GEOIP_DATABASE_PATH`, `SOC_GEOLOCATION_HMAC_SECRET`, `SOC_GEOLOCATION_PROVIDER` |
| Payments | `PAYMENT_PROVIDER_MODE`, `PAYMENT_MODE`, `PAYMENT_LIVE_MODE`, `ENABLE_LIVE_PAYMENTS`, `PAYMONGO_SANDBOX`, `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET` and live variants |
| Azure backend/storage | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_AZURE_BACKEND`, `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_ACCOUNT_KEY`, `STORAGE_PROVIDER` |
| Azure AI/search | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, deployment names, `AZURE_SEARCH_ENDPOINT`, `AZURE_SEARCH_API_KEY`, `AZURE_SEARCH_INDEX` |
| Telemetry/mobile | `APPLICATIONINSIGHTS_CONNECTION_STRING`, `CAPACITOR_SERVER_URL` |

The committed production environment template is incomplete relative to these source references and must be corrected without adding values.

## Deployment gate decisions

| Gate | Whole application status | Evidence / next requirement |
| --- | --- | --- |
| CODE COMPLETE | IN IMPLEMENTATION | Known gaps remain across required modules |
| LOCAL FUNCTIONAL | NOT STARTED globally | Module-local evidence is not a full application run |
| LOCAL DATABASE MIGRATED | LOCAL DATABASE MIGRATED for existing history | Fresh whole-app proof required at LOCAL-RC1 |
| LOCAL REQUIRED DATA SEEDED/SYNCED | IN IMPLEMENTATION | Required-data manifest incomplete |
| LOCAL ACCEPTANCE PASS | NOT STARTED globally | Required six master journeys not accepted |
| PREVIEW MIGRATED | NOT STARTED globally | Absolute Preview barrier remains closed |
| PREVIEW ACCEPTANCE PASS | NOT STARTED globally | Not eligible |
| PRODUCTION-READY | NOT STARTED globally | Not eligible |
| CLOSED / FROZEN | NOT STARTED globally | Not eligible |

## Release safety

- No Production deployment is authorized by these registers.
- No Production database connection/write is required to complete local engineering.
- Preview and Production databases must never reuse Local/reset commands.
- Before Preview, create `RENTipid LOCAL-RC1` with SHA, branch, lockfile/schema checksums, migration list, seed version, test/acceptance/security evidence and external blockers.
- After LOCAL-RC1, only release-blocking corrections are permitted.
