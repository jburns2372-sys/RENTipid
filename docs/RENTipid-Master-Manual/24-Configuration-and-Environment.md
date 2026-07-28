# Chapter 24 — Configuration and Environment

## 24.1 The 12-Factor App Methodology

RENTipid adheres to the 12-Factor App methodology for configuration management. All environment-specific settings (database URIs, API keys, feature flags) are passed via environment variables, not hardcoded into the source.

## 24.2 Environment Variable Tiers

The system utilizes multiple `.env` files depending on the execution context:
- **`.env.example`:** The generic template defining required keys (committed to version control).
- **`.env.local`:** Developer's local overrides (git-ignored).
- **`.env.test.local`:** Configuration specifically for running the Jest/Playwright test suites against a dedicated test database (e.g., `rentipid_test_soc`).
- **Production Variables:** Managed securely within the Vercel dashboard or AWS Parameter Store.

## 24.3 Critical Configuration Variables

| Variable Name | Purpose | Risk Level |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma connection string for PostgreSQL. | **Critical** |
| `NEXTAUTH_SECRET` | Cryptographic key for signing JWT sessions. | **Critical** |
| `NEXTAUTH_URL` | The canonical URL of the application. | High |
| `PAYMONGO_SECRET_KEY` | Server-side key for API calls. | **Critical** |
| `PAYMONGO_WEBHOOK_SECRET` | Verifies incoming webhook payloads. | High |
| `SOC_CORRELATION_HMAC_KEY` | Secures internal telemetry routing. | High |

## 24.4 Feature Flagging

While core secrets are stored in `.env`, dynamic feature flags are managed within the database via the `SystemSetting` model. This allows Super Admins to toggle features (e.g., `ENABLE_LIVE_PAYMENTS = false`) without redeploying the application.

## Evidence References

| Evidence ID | Repository Path | Symbol, Model, Route, Test, or Report | Relevance | Verification Status |
| ----------- | --------------- | ------------------------------------- | --------- | ------------------- |
| REPO-001 | `.env.local`, `.env.test.local` | Environment templates | Local dev configuration | Verified |

## Known Limitations
- **Secret Rotation:** Automated secret rotation for `NEXTAUTH_SECRET` and HMAC keys is not currently implemented and requires a manual environment update and redeployment.

## Related Chapters
- Chapter 20: Technical Architecture
- Chapter 35: Environment Variable Registry
