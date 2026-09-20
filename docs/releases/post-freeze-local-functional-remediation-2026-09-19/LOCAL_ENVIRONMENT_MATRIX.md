# Local Environment Audit Matrix

**Audited File:** `.env.local`  
**Security Standard:** Strict Redaction (Variable names and classifications only; zero secrets printed)  
**Date:** September 19, 2026  
**Target Environment:** Isolated Local Runtime (`rentipid_local_dev` @ `127.0.0.1:5432`)  

---

## 1. Classification Summary

| Classification | Count | Description |
|---|---|---|
| **VALID LOCAL/DEV VALUE** | 25 | Correctly formatted, isolated local/development configuration |
| **INVALID** | 3 | Malformed or unrecognized provider identifier (`GOOGLE_CLIENT_ID`, `FACEBOOK_CLIENT_ID`, `TWILIO_AUTH_TOKEN`) |
| **PLACEHOLDER** | 1 | Unsigned/dummy token (`APPLE_CLIENT_SECRET` non-JWT string) |
| **WRONG ENVIRONMENT** | 0 | Zero production database or live production resource contamination |
| **EMPTY / ABSENT** | 0 | All required core variables present |

---

## 2. Canonical Capability Audit Matrix

| Subsystem | Variable Name | Required? | Classification | Audit Findings & Remediation Requirement |
|---|---|---|---|---|
| **Database** | `DATABASE_URL` | Yes | **VALID LOCAL/DEV VALUE** | Targets `127.0.0.1:5432/rentipid_local_dev`. Completely isolated from Preview and Production. |
| **Database** | `DIRECT_URL` | Yes | **VALID LOCAL/DEV VALUE** | Targets `127.0.0.1:5432/rentipid_local_dev`. |
| **Database** | `RENTIPID_TEST_DATABASE_NAME` | Yes | **VALID LOCAL/DEV VALUE** | Configured to `rentipid_test_soc`. |
| **Auth Core** | `NEXTAUTH_URL` | Yes | **VALID LOCAL/DEV VALUE** | Currently `https://local.rentipid.com.ph:3000`. Upgrading to port 443 reverse proxy origin `https://local.rentipid.com.ph`. |
| **Auth Core** | `APP_BASE_URL` | Yes | **VALID LOCAL/DEV VALUE** | Synchronized with local origin. |
| **Auth Core** | `NEXTAUTH_SECRET` | Yes | **VALID LOCAL/DEV VALUE** | High-entropy 64-char string. Independent from production. |
| **Auth Core** | `MFA_ENCRYPTION_KEY_ID` | Yes | **VALID LOCAL/DEV VALUE** | Active field encryption key identifier (`loc1`). |
| **Auth Core** | `MFA_ENCRYPTION_KEY` | Yes | **VALID LOCAL/DEV VALUE** | 32-byte hex key for AES-256-GCM encryption of MFA secrets. |
| **Auth Core** | `SECURITY_TELEMETRY_HMAC_KEY` | Yes | **VALID LOCAL/DEV VALUE** | High-entropy HMAC signing key for local audit telemetry. |
| **Auth Core** | `SOC_CORRELATION_HMAC_KEY` | Yes | **VALID LOCAL/DEV VALUE** | High-entropy HMAC signing key for SOC event correlation. |
| **Google OAuth** | `AUTH_GOOGLE_ENABLED` | Yes | **VALID LOCAL/DEV VALUE** | Set to `"true"`. |
| **Google OAuth** | `GOOGLE_CLIENT_ID` | Yes | **INVALID** | Length 28 characters. Fails Google OAuth with `401 invalid_client: OAuth client was not found`. Requires dedicated Google Web Client ID (`*.apps.googleusercontent.com`). |
| **Google OAuth** | `GOOGLE_CLIENT_SECRET` | Yes | **VALID LOCAL/DEV VALUE** | Configured with secret string. |
| **Facebook OAuth** | `AUTH_FACEBOOK_ENABLED` | Yes | **VALID LOCAL/DEV VALUE** | Set to `"true"`. |
| **Facebook OAuth** | `FACEBOOK_CLIENT_ID` | Yes | **INVALID** | Length 30 characters (non-numeric string). Fails Meta OAuth with `Invalid App ID`. Requires real Meta App ID. |
| **Facebook OAuth** | `FACEBOOK_CLIENT_SECRET` | Yes | **VALID LOCAL/DEV VALUE** | Configured with secret string. |
| **Apple OAuth** | `AUTH_APPLE_ENABLED` | Yes | **VALID LOCAL/DEV VALUE** | Set to `"true"`. |
| **Apple OAuth** | `AUTH_APPLE_DEFERRED` | Yes | **VALID LOCAL/DEV VALUE** | Explicitly set to `"false"` to expose Apple on the local gateway. |
| **Apple OAuth** | `APPLE_CLIENT_ID` | Yes | **VALID LOCAL/DEV VALUE** | Configured with Services ID `com.rentipid.web`. |
| **Apple OAuth** | `APPLE_CLIENT_SECRET` | Yes | **PLACEHOLDER** | Length 31 characters. Dummy string. Apple Sign In requires an ES256 JWT (~300+ characters) signed by Apple Team Key. |
| **Twilio / WhatsApp** | `AUTH_WHATSAPP_OTP_ENABLED` | Yes | **VALID LOCAL/DEV VALUE** | Set to `"true"`. |
| **Twilio / WhatsApp** | `TWILIO_ACCOUNT_SID` | Yes | **VALID LOCAL/DEV VALUE** | Standard 34-char AC... identifier. |
| **Twilio / WhatsApp** | `TWILIO_AUTH_TOKEN` | Yes | **INVALID** | Length 29 characters. Invalid format (standard Twilio auth token is 32-char hex). Delivery fails. |
| **Twilio / WhatsApp** | `TWILIO_VERIFY_SERVICE_SID` | Yes | **VALID LOCAL/DEV VALUE** | Standard 34-char VA... identifier. |
| **Storage** | `STORAGE_PROVIDER` | Yes | **VALID LOCAL/DEV VALUE** | Configured to local storage provider. |
| **Payments** | `NEXT_PUBLIC_MOCK_PAYMENTS` | Yes | **VALID LOCAL/DEV VALUE** | Configured to `"true"` for local sandbox payment execution without live charges. |
| **Address System** | `ADDRESS_PROVIDER` | Yes | **VALID LOCAL/DEV VALUE** | Configured to `database` (PSGC reference tables). |
| **Maps** | `GOOGLE_MAPS_API_KEY` | Optional | **VALID LOCAL/DEV VALUE** | Configured for local map rendering. |
