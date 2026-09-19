# RENTipid Unified Multi-Login Authentication Module

## API Reference v1.1.0

**Status:** CLOSED / VERSION FROZEN  
**Audience:** RENTipid developers, operations engineers, security reviewers and support tooling owners  
**Authority:** frozen tag `rentipid-unified-auth-v1.1.0-frozen`

> **Security notice:** Examples contain structures and error names only. Never place credentials, OAuth tokens, OTP values, session cookies, provider secrets or database connection strings in documentation, tickets or logs.

## Table of Contents

1. [Conventions](#1-conventions)
2. [Framework-managed authentication endpoints](#2-framework-managed-authentication-endpoints)
3. [Public method discovery](#3-public-method-discovery)
4. [Registration and credentials](#4-registration-and-credentials)
5. [OAuth consent and linking](#5-oauth-consent-and-linking)
6. [WhatsApp OTP](#6-whatsapp-otp)
7. [Connected login methods](#7-connected-login-methods)
8. [Generic link and unlink](#8-generic-link-and-unlink)
9. [Sessions and logout](#9-sessions-and-logout)
10. [MFA endpoints](#10-mfa-endpoints)
11. [Health](#11-health)
12. [Error reference](#12-error-reference)

## 1. Conventions

### 1.1 Base URLs

| Environment | Base URL |
|---|---|
| Local | repository-specific local Next.js origin, normally `http://localhost:3000` |
| Preview | `https://preview.rentipid.com.ph` |
| Production | `https://www.rentipid.com.ph` |

Use the same origin for initiation and callback. Never point Preview callbacks at Production or Production callbacks at Preview.

### 1.2 Authentication modes

`Public` means no existing RENTipid session is required. `Session` means a valid current RENTipid session is required. `Session + AAL2` means the current session must also have valid MFA step-up assurance.

### 1.3 Response hygiene

The service deliberately uses generic messages for sensitive recovery and OTP operations. Clients must not translate a generic response into an account-existence claim. Auth responses should use `Cache-Control: no-store` where supplied and must not be persisted in shared caches.

## 2. Framework-managed authentication endpoints

These paths are served by the NextAuth catch-all route at `src/app/api/auth/[...nextauth]/route.ts`. Payload shapes are governed by NextAuth 4.24.15 and the configured providers.

| Method | Path | Auth | Purpose | Important security behavior |
|---|---|---|---|---|
| `GET` | `/api/auth/providers` | Public | Lists runtime provider registry | Safe for health verification; IDs should be `credentials`, `phone-otp`, `google`, `facebook`, `apple` in accepted environments |
| `GET` | `/api/auth/session` | Cookie | Returns current session view or empty session | Server callback revalidates session registry and account status |
| `GET` | `/api/auth/csrf` | Public | Issues framework CSRF material | Do not log or publish token values |
| `GET/POST` | `/api/auth/signin/{provider}` | Public or session-dependent | Starts provider/credential sign-in | OAuth linking requires a separate signed link intent |
| `GET/POST` | `/api/auth/callback/{provider}` | Provider callback | Completes provider sign-in | Apple uses POST; callback validates configured OAuth protections |
| `GET/POST` | `/api/auth/signout` | Session | Framework sign-out surface | Application logout route is preferred when registry revocation is required |

Accepted callback paths are:

- `/api/auth/callback/google`
- `/api/auth/callback/facebook`
- `/api/auth/callback/apple`
- `/api/auth/callback/credentials`
- `/api/auth/callback/phone-otp`

External OAuth consoles must register the complete environment-specific HTTPS URL. A `redirect_uri_mismatch` normally indicates a console registration, hostname, scheme or environment error, not an invitation to weaken state or PKCE checks.

## 3. Public method discovery

### 3.1 `GET /api/auth/methods`

**Authentication:** Public  
**Purpose:** Returns the user-facing availability state used by the login page.  
**Input:** None.  
**Success:** `200 OK` with a `methods` array.  
**Caching:** `no-store`.

Conceptual response:

```json
{
  "methods": [
    { "id": "google", "enabled": true, "configured": true },
    { "id": "facebook", "enabled": true, "configured": true },
    { "id": "apple", "enabled": true, "configured": true },
    { "id": "email", "enabled": true, "configured": true },
    { "id": "sms", "enabled": false, "configured": false },
    { "id": "whatsapp", "enabled": true, "configured": true }
  ]
}
```

`sms` may appear as a retired internal state but remains disabled and must not be shown as a supported v1.1.0 login option.

## 4. Registration and credentials

### 4.1 `POST /api/auth/register`

**Authentication:** Public  
**Purpose:** Creates an email/password account and associated profile under allowed public onboarding roles.  
**Input:** validated registration fields including email, password, consent and role/profile data.  
**Success:** `201 Created`.  
**Common errors:** `400` validation failure, `409` existing email, `500` controlled server failure.  
**Security:** Only `Renter`, `Individual Provider` and `Business Provider` are allowed public roles. Elevated internal roles cannot be selected by a public payload. Passwords are hashed; new credentials begin unverified.

### 4.2 Credentials sign-in

**Method/path:** NextAuth credentials callback through `/api/auth/callback/credentials`.  
**Authentication:** Public.  
**Input:** normalized email and password through the NextAuth sign-in contract.  
**Success:** a session for the existing `User.id`.  
**Errors:** invalid credentials, unverified email, disabled account or unavailable configuration.  
**Security:** Wrong-password and unknown-email service errors share `INVALID_CREDENTIALS`; clients must not expose which condition occurred.

### 4.3 `POST /api/auth/email-verification/resend`

**Authentication:** Public  
**Input:** email address  
**Success:** `202 Accepted` with a generic response for known and unknown accounts  
**Controls:** per-identity and network rate limits, one-minute cooldown, token hash storage, 24-hour verification-token lifetime.

### 4.4 `GET /api/auth/email-verification/verify`

**Authentication:** possession of the one-time token  
**Input:** `token` query parameter  
**Success:** `200 OK`  
**Errors:** `400` invalid, expired or consumed token; `503` controlled dependency failure  
**Security:** Raw tokens are not stored and cannot be replayed after successful consumption.

### 4.5 `POST /api/auth/password-recovery`

**Authentication:** Public  
**Input:** email address  
**Success:** `202 Accepted` with the same generic contract for known and unknown accounts  
**Controls:** rate limits, one-minute cooldown, no implicit password creation for provider-only or phone-only accounts.

### 4.6 `POST /api/auth/password-reset`

**Authentication:** possession of a reset token  
**Input:** reset token and new password  
**Success:** `200 OK`  
**Errors:** `400` invalid/expired/consumed token or invalid password; `503` controlled failure  
**Controls:** 30-minute lifetime, single use, hash-only storage, password-policy validation and revocation of all active sessions after success.

## 5. OAuth consent and linking

### 5.1 `POST /api/auth/oauth/intent`

**Authentication:** Public  
**Purpose:** Records explicit terms/privacy acceptance and issues a signed, provider-bound consent cookie before first-time OAuth onboarding.  
**Input:** provider plus affirmative terms and privacy flags.  
**Success:** `200 OK` with generic continuation state.  
**Errors:** controlled `200` generic response when initiation must not reveal sensitive configuration.  
**Security:** The cookie is HttpOnly, signed, expires after ten minutes and is bound to the provider and document versions. On HTTPS it uses `Secure` and `SameSite=None` for cross-site OAuth callback compatibility.

### 5.2 `POST /api/auth/oauth/link-intent`

**Authentication:** Session  
**Purpose:** Starts explicit linking of Google, Facebook or Apple to the currently authenticated user.  
**Input:**

```json
{ "provider": "apple" }
```

**Success:** `200 OK` and a signed HttpOnly link-intent cookie.  
**Errors:** `400` unsupported provider, `401` missing session.  
**Security:** The intent expires after ten minutes and is bound to the current `User.id` and provider. The provider callback consumes it. Same-email authentication without this proof remains an ordinary sign-in and can return `AccountLinkRequired`.

## 6. WhatsApp OTP

### 6.1 `POST /api/auth/otp`

**Authentication:** Public for sign-in initiation  
**Purpose:** Starts a Twilio Verify WhatsApp challenge.  
**Input:** phone number and channel; the implemented public channel is `whatsapp`.  
**Success:** `200 OK`, generic message and a challenge ID when creation succeeds.  
**Controlled failure:** usually a generic `200` response so configuration, rate-limit and account state are not unnecessarily disclosed.  
**Security:** E.164 normalization, channel binding, derived phone/network/client rate-limit keys, signed anonymous-client bucket and no raw OTP storage.

Default controls implemented in the service:

| Control | Default |
|---|---|
| Challenge lifetime | 5 minutes |
| Maximum verification attempts | 5 |
| Start per phone | 5 per 15 minutes |
| Start cooldown | 1 per 30 seconds |
| Start per network | 30 per 15 minutes |
| Start per signed client | 10 per 15 minutes |
| Verify per phone | 20 per 15 minutes |
| Verify per network | 60 per 15 minutes |
| Verify per signed client | 30 per 15 minutes |

### 6.2 Phone credentials callback

**Method/path:** NextAuth credentials callback through `/api/auth/callback/phone-otp`.  
**Input:** challenge identifier, normalized phone, channel and submitted verification code through the provider contract.  
**Success:** session for the existing or newly onboarded user.  
**Errors:** invalid, expired, replayed or attempt-limited challenge; disabled account; provider unavailable.  
**Security:** Challenge consumption is atomic. A code accepted by Twilio cannot be used to consume the same challenge twice.

## 7. Connected login methods

### 7.1 `GET /api/account/connected-methods`

**Authentication:** Session  
**Purpose:** Returns the five-method Account Security view for the current user.  
**Input:** None.  
**Success:** `200 OK` with user ID and method states.  
**Errors:** `401` unauthenticated, `404` user not found.  
**Caching:** `no-store`.

Each method object describes its ID, label, enabled/configured state, connection state and safe metadata such as a verified display email or phone. Synthetic internal emails must not be displayed.

### 7.2 `DELETE /api/account/connected-methods`

**Authentication:** Session  
**Purpose:** Disconnects an OAuth method from the current user.  
**Input:**

```json
{ "provider": "facebook" }
```

**Success:** `200 OK` with updated method list.  
**Errors:** `400` invalid provider or last viable method, `401` unauthenticated, `404` identity not connected, `500` controlled failure.  
**Security:** Only `google`, `facebook` and `apple` are accepted by this route. Ownership is always scoped to the session user. The final usable sign-in method cannot be removed.

## 8. Generic link and unlink

### 8.1 `POST /api/auth/link`

**Authentication:** Session + AAL2  
**Purpose:** Links an email/password or verified phone identity through the generic service API.  
**Input:** discriminated request for `email_password` or `phone`, with the proof required by that method.  
**Success:** generic `200 OK`.  
**Errors:** controlled responses for recent-auth requirement, identity collision, invalid proof, unavailable method or rate limit.  
**Security:** An email or phone already owned by another user is blocked. Provider-only email metadata is not promoted into a password credential.

### 8.2 `POST /api/auth/unlink`

**Authentication:** Session + AAL2  
**Purpose:** Unlinks a provider, phone or email credential through the generic service API.  
**Success:** generic `200 OK`.  
**Errors:** `LAST_SIGN_IN_METHOD`, recent-auth failure or controlled ownership/not-found results.  
**Security:** Scope is the current user; another user's identity cannot be removed.

## 9. Sessions and logout

### 9.1 `POST /api/auth/logout`

**Authentication:** Session if present  
**Purpose:** Revokes the current `UserSession`, removes associated AAL2 assurance and completes NextAuth sign-out.  
**Success:** sign-out response.  
**Security:** Prefer this application route over merely deleting a client cookie because it updates server-side revocation state.

### 9.2 `GET /api/account/sessions`

**Authentication:** Session  
**Purpose:** Lists active sessions for the current user and marks the current session.  
**Success:** `200 OK`.  
**Errors:** `401` when the user or server binding is unavailable.  
**Caching:** `no-store`.

### 9.3 `DELETE /api/account/sessions/{sessionId}`

**Authentication:** Session  
**Purpose:** Revokes one other active session.  
**Success:** `200 OK`.  
**Errors:** `400` if it is the current session, `401` invalid binding, `404` not found, `500` controlled failure.  
**Security:** Session IDs are scoped to the authenticated user. Use normal logout for the current session.

### 9.4 `POST /api/account/sessions/logout-others`

**Authentication:** Session  
**Purpose:** Revokes every active session except the current one.  
**Success:** `200 OK` with `revokedCount`.  
**Errors:** `401` invalid binding, `500` controlled failure.

## 10. MFA endpoints

MFA is an existing security subsystem integrated with session assurance. It is not a sixth login provider.

| Method | Path | Auth | Purpose | Main responses |
|---|---|---|---|---|
| `POST` | `/api/auth/mfa/enroll` | Session | Generate TOTP enrollment secret and QR data | `200`, `401`, `429`, `400` |
| `POST` | `/api/auth/mfa/activate` | Session | Verify six-digit TOTP, activate MFA, return recovery codes and grant AAL2 | `200`, `400`, `401`, `429` |
| `POST` | `/api/auth/mfa/verify` | Session | Verify TOTP or 12-character recovery code and grant AAL2 | `200`, `400`, `401`, `429` |

Enrollment output contains sensitive material. It must use no-store caching, must not be logged and must only be shown to the authenticated user. Recovery codes are one-time account recovery secrets.

## 11. Health

### 11.1 `GET /api/health`

**Authentication:** Public  
**Purpose:** Checks application readiness and database connectivity.  
**Success:** `200 OK`:

```json
{ "status": "ready", "database": "connected" }
```

**Failure:** `503 Service Unavailable` with a non-ready/unavailable state.  
**Caching:** `no-store`.

On 2026-09-19, read-only checks returned `200` and database `connected` for both Production and Preview.

## 12. Error reference

| Code or UI state | Meaning | Client/support action |
|---|---|---|
| `ACCOUNT_LINK_REQUIRED` / `AccountLinkRequired` | Provider verified, but a same-email account already exists and no explicit link proof exists | Sign in with an existing method; connect the new provider in Account Security |
| `IDENTITY_IN_USE` | The durable identity is owned by another `User.id` | Stop; escalate ownership investigation; do not move identity by email |
| `LAST_SIGN_IN_METHOD` | Unlink would strand the account | Connect and verify another method first |
| `INVALID_CREDENTIALS` | Email/password proof failed | Use recovery or retry; do not reveal whether email exists |
| `EMAIL_NOT_VERIFIED` | Credential exists but verification is incomplete | Complete email verification or resend |
| `INVALID_OTP` | Challenge/code is invalid, expired, replayed or exhausted | Start a new WhatsApp challenge when appropriate |
| `RATE_LIMITED` | Abuse-control threshold reached | Honor retry guidance; investigate automation if repeated |
| `PROVIDER_UNAVAILABLE` | External provider or required configuration unavailable | Use another connected method and check provider/configuration health |
| `METHOD_DISABLED` | Feature flag or configuration disables the method | Operations checks environment configuration; do not expose secrets |
| `ACCOUNT_DISABLED` | RENTipid account status denies sign-in | Follow account-status support policy |
| `CONSENT_REQUIRED` | First-time OAuth onboarding lacks valid consent evidence | Restart from the RENTipid sign-in page and accept current terms/privacy |
| `RECENT_AUTH_REQUIRED` | A generic sensitive link/unlink action lacks AAL2 assurance | Complete MFA step-up, then retry |

For user-facing language, see [User Manual Section 18](02_RENTipid_Unified_Multi_Login_User_Manual_v1.1.0.md#18-sign-in-method-not-connected). For operational diagnosis, see the [Troubleshooting Guide](06_RENTipid_Unified_Multi_Login_Troubleshooting_Guide_v1.1.0.md).
