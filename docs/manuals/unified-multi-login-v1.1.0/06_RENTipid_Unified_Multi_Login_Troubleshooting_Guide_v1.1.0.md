# RENTipid Unified Multi-Login Authentication Module

## Troubleshooting Guide v1.1.0

**Status:** CLOSED / VERSION FROZEN  
**Audience:** users, support, operations and developers

## Table of Contents

1. [How to use this guide](#1-how-to-use-this-guide)
2. [User-first diagnostic matrix](#2-user-first-diagnostic-matrix)
3. [OAuth diagnosis](#3-oauth-diagnosis)
4. [WhatsApp OTP diagnosis](#4-whatsapp-otp-diagnosis)
5. [Email and password diagnosis](#5-email-and-password-diagnosis)
6. [Connected Methods diagnosis](#6-connected-methods-diagnosis)
7. [Session diagnosis](#7-session-diagnosis)
8. [Environment and database diagnosis](#8-environment-and-database-diagnosis)
9. [Support escalation](#9-support-escalation)

## 1. How to use this guide

Begin with the user's visible symptom. Ask for the time, environment, browser/device type and provider name. Do not ask for a password, OTP, OAuth code, token, cookie, provider secret or database URL. Use request/audit references that are already sanitized.

Escalation levels:

- **L1:** user guidance; no account mutation.
- **L2:** trained support inspection of connected methods, account status and sanitized audit history.
- **L3:** engineering/operations inspection of route, provider, deployment and database behavior.
- **Security:** suspected takeover, provider collision, secret leakage or cross-environment data access.

## 2. User-first diagnostic matrix

| Symptom | Likely cause | User action | Support action | Developer check | Escalation |
|---|---|---|---|---|---|
| “Sign-in method not connected” | Provider verified, but same-email existing account has no explicit link | Sign in with an existing method; open Account Security; connect provider | Explain anti-takeover rule; identify safe existing method | Confirm `AccountLinkRequired` redirect and `AUTH_ACCOUNT_LINK_REQUIRED` | L1/L2 |
| `AccountLinkRequired` | Same as above | Do not create another account; use existing method | Never merge by email alone | Verify no new `User` or provider identity was created | L2 |
| “Identity already in use” | Provider subject is linked to another user | Stop and contact support | Preserve both user references; do not transfer | Find `AUTH_IDENTITY_LINK_BLOCKED` / `IDENTITY_IN_USE` | Security/L3 |
| OAuth callback failure | Provider denial, state/PKCE/nonce/cookie problem or configuration mismatch | Return to RENTipid and restart once | Record provider, environment and time | Inspect callback registration and transient-cookie behavior | L2/L3 |
| `redirect_uri_mismatch` | Provider console callback does not exactly match current environment | Retry only after configuration is corrected | Confirm environment URL | Compare exact HTTPS callback; do not change code checks | L3 |
| Apple state cookie missing | Cross-site POST did not return transient cookie | Retry in normal browser; avoid blocked cookies | Capture browser/device without cookie value | Verify HTTPS, Secure and SameSite=None on transient cookies; proxy host | L3 |
| Facebook sign-in returns no email | Facebook account did not provide email | Continue if flow permits; manage profile contact separately | Explain that email is optional metadata | Confirm provider subject is present and used | L1/L2 |
| Provider button absent | Feature disabled, deferred or not configured | Use another available method | Check public methods endpoint | Check flags and variable presence, never values | L2/L3 |
| WhatsApp code not received | Provider delay, invalid number, rate limit or delivery failure | Confirm number/country code; wait; request one new code | Do not request the code itself | Check Twilio and sanitized OTP events | L1/L3 |
| OTP expired | More than five minutes or challenge expired | Request a new code | Explain expiry | Check challenge status/clock | L1 |
| OTP rejected after one success | Replay prevention | Start a new sign-in if no session exists | Explain one-time use | Confirm consumed challenge was denied | L1/L2 |
| Invalid credentials | Wrong password, unknown email or unverified credential | Retry, verify email or use recovery | Avoid confirming account existence | Check `INVALID_CREDENTIALS` vs verification event internally | L1/L2 |
| Reset email not received | Unknown/provider-only account, delivery issue, rate limit or spam filtering | Check inbox/spam; use connected provider | Keep response generic | Check SMTP and sanitized recovery events | L2/L3 |
| Cannot disconnect method | It is the last viable method | Connect and test another method first | Explain lockout protection | Confirm `LAST_SIGN_IN_METHOD` | L1 |
| Connected method missing | Wrong RENTipid account, unavailable provider or data issue | Sign out and use the expected existing method | Compare user ID and safe metadata | Inspect identity ownership; never reassign by email | L2/L3 |
| Session returns to login | Session expired/revoked, password reset, account status or registry failure | Sign in again; review active sessions | Check whether revocation was expected | Inspect UserSession and status, health and clock | L2/L3 |
| Duplicate account suspected | User used a new method outside explicit linking or historical data issue | Stop changing methods; contact support | Compare records without merging | Investigate durable subjects, profiles and audit history | Security/L3 |
| Preview and Production behave differently | Separate configuration/deployments/databases | Confirm correct hostname | State environment clearly | Compare provider registry, health and deployment evidence | L3 |
| Database unavailable | Health endpoint not ready | Retry later; use status guidance | Escalate outage | Check `/api/health`, database connection and platform logs | L3 |

## 3. OAuth diagnosis

### 3.1 Safe triage sequence

1. Confirm the exact hostname: local, `preview.rentipid.com.ph` or `www.rentipid.com.ph`.
2. Check `GET /api/health`.
3. Check `GET /api/auth/providers` and record provider IDs only.
4. Check `GET /api/auth/methods` for public enabled/configured state.
5. Confirm the external provider has the exact environment callback.
6. Inspect sanitized runtime/audit logs by time and provider.
7. For Apple, inspect transient cookie attributes in browser developer tools without copying values.
8. Confirm state, PKCE and nonce have not been disabled.

### 3.2 Same-email behavior is not a defect

If Google and Apple report the same email but only Google is linked, Apple sign-in should stop with AccountLinkRequired. That is the intended takeover defense. The resolution is explicit linking while signed into the Google-backed RENTipid account.

### 3.3 Provider collision is not a routine merge

If the provider subject is already owned by a different user, preserve evidence and escalate. Do not delete an `AuthProviderIdentity`, change its `user_id` or merge marketplace records through an ad hoc database update.

### 3.4 Apple-specific checks

- Provider ID `apple` appears in `/api/auth/providers`.
- The Services ID and callback use the correct environment.
- `response_mode=form_post` remains configured.
- State, PKCE and nonce checks remain present.
- State/PKCE/nonce/callback transient cookies are HttpOnly, Secure and SameSite=None on HTTPS.
- Browser privacy settings or extensions are not stripping required cross-site cookies.
- The Apple subject, not relay email, is used for resolution.

### 3.5 Facebook-specific checks

- Provider ID `facebook` appears in the registry.
- The exact callback is registered in Meta.
- Missing email is accepted when a durable Facebook subject exists.
- An `IDENTITY_IN_USE` result is escalated rather than worked around.

### 3.6 Google-specific checks

- Provider ID `google` appears in the registry.
- Issuer/audience/expiry/email-verification claims are accepted only when valid.
- State, PKCE and nonce remain enabled.
- A changed Google email does not create a new account if the subject is already linked.

## 4. WhatsApp OTP diagnosis

### 4.1 Code not received

Ask the user to verify the country code and last few digits verbally without sharing the full number in public tickets. Allow delivery time. Repeatedly requesting codes can trigger the one-per-30-second cooldown or 15-minute limits. Check Twilio Verify availability and `AUTH_PHONE_OTP_PROVIDER_UNAVAILABLE`, `AUTH_PHONE_OTP_STARTED` or delivery failure evidence.

### 4.2 Invalid, expired or replayed code

The default challenge expires in five minutes and permits five verification attempts. A challenge is one-time. The user should initiate a new challenge after expiry or consumption. Support must never ask for the OTP or try it on the user's behalf.

### 4.3 Verification stalls

Check callback URL normalization, NextAuth credentials callback, session creation and authentication-security logging. The regression suite verifies logging failures do not crash the caller and that phone-OTP success does not navigate back into a login loop.

### 4.4 SMS expectations

SMS is retired for this module. The service fails closed on SMS initiation and does not fall back from WhatsApp to SMS. Do not advise users that a text message will arrive.

## 5. Email and password diagnosis

### 5.1 Unverified email

Resend verification through the supported UI. The endpoint uses a generic response whether or not an account exists. Verification tokens expire after 24 hours and are single-use.

### 5.2 Forgotten password

Submit password recovery once, check spam and wait for delivery. The reset token expires after 30 minutes and can be used once. A successful reset logs out all sessions. Provider-only and phone-only accounts may not have an email credential; they should use their connected provider or controlled support recovery.

### 5.3 Repeated invalid credentials

Do not disclose whether the email exists. Confirm keyboard layout and exact email spelling, then use recovery. Operations reviews safe audit and rate-limit evidence for automation or widespread failure.

## 6. Connected Methods diagnosis

### 6.1 Account Security does not load

Check the current session and `GET /api/account/connected-methods`. A `401` means no valid session; `404` means the session user could not be loaded. Confirm database health before treating it as identity corruption.

### 6.2 Connect loops to sign-in

Confirm `POST /api/auth/oauth/link-intent` succeeded before provider navigation. The signed cookie lasts ten minutes and must survive the provider round trip. Verify the callback returns to the same environment and that the current session remains valid.

### 6.3 Disconnect is blocked

This usually means the method is the final usable sign-in method. Have the user connect and test another method first. Do not delete the database identity manually.

## 7. Session diagnosis

1. Check `/api/auth/session` from the affected browser without copying cookies.
2. Check `GET /api/account/sessions` after reauthentication.
3. Confirm whether password reset, user action or account-status change revoked the session.
4. Confirm server time and 30-day maximum-age behavior.
5. Inspect `SESSION_CREATED`, `SESSION_REVOKED`, `SESSION_REVOKED_BY_USER` and `OTHER_SESSIONS_REVOKED` evidence.
6. If compromise is suspected, revoke other sessions and rotate the affected established credential.

## 8. Environment and database diagnosis

| Check | Preview expected | Production expected |
|---|---|---|
| Host | `preview.rentipid.com.ph` | `www.rentipid.com.ph` |
| Health | HTTP 200, `ready`, database `connected` | HTTP 200, `ready`, database `connected` |
| Provider IDs | `credentials`, `phone-otp`, `google`, `facebook`, `apple` | Same five IDs |
| Deployment | Independent Preview deployment | Frozen `dpl_G2mNn7DAEJh4FMerSBcVhfnauZse` |
| Database | Independent Preview database/branch | Production database/branch |

If aliases or database targets appear crossed, stop. Do not migrate, redeploy or edit environment variables during diagnosis without an approved incident/change plan. Compare safe project/deployment/branch identifiers and preserve Production.

## 9. Support escalation

### 9.1 Include

- Environment and full page path, without query tokens
- UTC and local timestamp
- Provider/method ID
- User-visible error wording
- Sanitized event/request reference
- Browser/OS family and whether extensions/private mode were used
- Whether another connected method works
- Health/provider endpoint status and provider IDs

### 9.2 Exclude

- Password or password hash
- OTP value
- OAuth authorization code, access/refresh token or Apple ID token
- Cookie/header values
- Provider secret, private key or `.p8` content
- Database URL or credentials
- Full phone/email unless the approved support system requires it and access is controlled

### 9.3 Stop conditions

Escalate immediately to Security for suspected identity collision, session theft, unauthorized linking/unlinking, secret exposure or Preview access to Production customer data. Do not attempt a manual merge or direct database repair as first response.
