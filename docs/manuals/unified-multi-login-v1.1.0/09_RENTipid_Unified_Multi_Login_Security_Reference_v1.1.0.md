# RENTipid Unified Multi-Login Authentication Module

## Security Reference v1.1.0

**Status:** CLOSED / VERSION FROZEN  
**Security baseline:** `rentipid-unified-auth-v1.1.0-frozen`  
**Audience:** security engineering, application engineering, operations, incident response, audit and support leadership

## Table of Contents

1. [Security objectives](#1-security-objectives)
2. [Threat model](#2-threat-model)
3. [Identity assurance and linking](#3-identity-assurance-and-linking)
4. [OAuth security](#4-oauth-security)
5. [Apple form-post cookie policy](#5-apple-form-post-cookie-policy)
6. [Credential and recovery security](#6-credential-and-recovery-security)
7. [OTP security](#7-otp-security)
8. [Session and cookie security](#8-session-and-cookie-security)
9. [RBAC, KYC and business-data protection](#9-rbac-kyc-and-business-data-protection)
10. [Audit and logging](#10-audit-and-logging)
11. [Secret management](#11-secret-management)
12. [Incident response](#12-incident-response)
13. [Security controls matrix](#13-security-controls-matrix)
14. [Residual risks and non-claims](#14-residual-risks-and-non-claims)

## 1. Security objectives

The module is designed to:

1. Bind every successful authentication to exactly one permanent RENTipid `User.id`.
2. Prevent an email address alone from authorizing OAuth account linking.
3. Prevent one durable provider identity from being owned by two users.
4. Preserve internal roles, account status, KYC and business records independently of provider claims.
5. Resist OAuth request forgery, callback substitution and cross-site callback failures without bypassing validation.
6. Limit password, OTP and recovery abuse.
7. Permit session revocation and account-status enforcement after login.
8. Retain useful security evidence without logging authentication secrets.

## 2. Threat model

### 2.1 Protected assets

- Permanent user ownership and `User.id` continuity
- Roles, permissions and privileged application access
- KYC and verification status
- Profiles and business-provider records
- Listings, bookings, reviews and history
- Payments and ledger relationships
- Password hashes, one-time verification/reset tokens and MFA material
- OAuth identities, session state and consent records
- Security and audit evidence

### 2.2 Trust boundaries

| Boundary | Untrusted or external input | Required validation |
|---|---|---|
| Browser to RENTipid | Form fields, callback URLs, cookies and headers | Zod/route validation, signed cookies, safe redirect normalization, session validation |
| OAuth provider to callback | Authorization response, ID/profile claims | State; PKCE/nonce where configured; subject, issuer/audience/expiry/email-verification checks where claims are present |
| Twilio Verify to service | Challenge status | Bound challenge ID, phone/channel, expiry, attempts and atomic consumption |
| Session to authorization | User ID, role/status and session identifier | Registry lookup, account-status validation and database-backed RBAC |
| Support to identity data | Ownership assertions and recovery requests | Evidence-based procedure; never email-only reassignment |
| Local/Preview/Production | Configuration, callbacks and database selection | Environment isolation and gated promotion |

### 2.3 Principal threats

1. Account takeover through automatic same-email OAuth linking.
2. Provider identity collision or reassignment.
3. OAuth CSRF, state substitution or missing transient cookies.
4. Open redirects and callback-environment confusion.
5. Credential stuffing and account enumeration.
6. OTP guessing, flooding, replay or cross-channel substitution.
7. Session theft, replay and stale access after password reset or account suspension.
8. Role escalation through provider claims or public registration fields.
9. Secret disclosure through logs, documentation or support tooling.
10. Preview accidentally using Production deployment or customer database.

## 3. Identity assurance and linking

### 3.1 Durable external identity

OAuth ownership is based on `(provider, provider_subject)`. Email is optional metadata. This choice handles:

- Apple Hide My Email and relay-address behavior
- Facebook profiles that do not provide an email
- Google account email changes
- Two different providers reporting the same email string

### 3.2 Same-email takeover protection

When a new provider subject is not linked but its canonical email matches an existing account, the service emits `AUTH_ACCOUNT_LINK_REQUIRED` and returns `ACCOUNT_LINK_REQUIRED`. It does not create a second user and does not attach the provider.

The safe user flow is dual proof:

1. Authenticate the existing RENTipid account through a connected method.
2. Start Connect from Account Security, creating a signed provider/user-bound intent.
3. Authenticate the new external provider.
4. Verify that the provider subject is not owned by another user.
5. Create the link to the already authenticated `User.id`.

`allowDangerousEmailAccountLinking` is not enabled and must not be recommended for this architecture.

### 3.3 Provider collision protection

The service checks identity ownership and the database enforces unique `(provider, provider_subject)`. If a subject belongs to a different user, linking is denied with `IDENTITY_IN_USE` and a sanitized `AUTH_IDENTITY_LINK_BLOCKED` event. Support must not move the identity merely because names or emails appear similar.

### 3.4 Unlink safety

The service counts viable authentication methods. An attempt to remove the final method fails with `LAST_SIGN_IN_METHOD`. This protects against self-lockout. A user should connect and test an alternative before disconnecting a provider they no longer want to use.

## 4. OAuth security

### 4.1 Controls by provider

| Provider | State | PKCE | Nonce | Durable key | Email required |
|---|---|---|---|---|---|
| Google | Yes | Yes | Yes | Google subject | A supplied email must be verified; subject remains key |
| Facebook | Yes | Not configured in provider checks | Not configured in provider checks | Facebook subject | No |
| Apple | Yes | Yes | Yes | Apple subject | A supplied email must be verified; may be relay/private |

The table describes the actual configured provider checks. It does not claim controls the provider configuration does not contain.

### 4.2 State and CSRF

State binds an OAuth response to the request that initiated it. Missing or mismatched state is rejected. The framework CSRF token continues to use its normal stricter cookie behavior. Apple callback compatibility is achieved by changing only the transient OAuth cookies needed on the cross-site POST, not by disabling CSRF protection.

### 4.3 PKCE

Google and Apple use PKCE. The verifier is retained in a transient HttpOnly cookie and has a 15-minute maximum age. PKCE protects the authorization-code exchange against interception. A missing verifier is an error, not a condition to bypass.

### 4.4 Nonce and claim validation

Google and Apple use a nonce. The unified profile normalization also rejects missing or inconsistent provider subjects, expired claim sets, invalid Google/Apple issuers and wrong audiences when those claims are present. Google and Apple email metadata must be verified when supplied. Facebook email may be absent.

### 4.5 Consent evidence

First-time OAuth onboarding requires a signed consent intent bound to the provider, current terms version and current privacy version. It expires after ten minutes. Returning linked users do not need to repeat first-time consent merely because the provider omits profile fields on later callbacks.

## 5. Apple form-post cookie policy

Apple's web flow uses `response_mode=form_post`; the browser therefore returns from `appleid.apple.com` with a cross-site POST. Browsers will not send ordinary `SameSite=Lax` cookies with that POST. The accepted remediation applies the following policy under HTTPS/Production conditions:

| Cookie | HttpOnly | Secure | SameSite | Maximum age |
|---|---|---|---|---|
| OAuth state | Yes | Yes | `None` | 15 minutes |
| PKCE code verifier | Yes | Yes | `None` | 15 minutes |
| Nonce | Yes | Yes | `None` | 15 minutes |
| Callback URL | Yes | Yes | `None` | 15 minutes |
| OAuth consent intent | Yes | Yes | `None` | 10 minutes |
| OAuth link intent | Yes | Yes | `None` | 10 minutes |

For local HTTP, the signed consent/link cookies use `Secure=false` and `SameSite=Lax` because `SameSite=None` requires Secure. Production must remain HTTPS.

Session and CSRF cookies are not globally changed to `SameSite=None`. The regression suite confirms that state, PKCE and nonce checks remain enabled and that state mismatch or absence is rejected.

## 6. Credential and recovery security

### 6.1 Password storage

Passwords are handled by bcrypt. The unified password hasher uses cost 12; the registration route uses bcrypt cost 10 in the frozen implementation. Documentation does not expose or store passwords. The accepted password schema permits 8 to 128 characters and rejects null bytes.

### 6.2 Email verification

New email credentials start unverified. Verification tokens use 32 random bytes, are stored only as SHA-256 hashes, expire after 24 hours and are invalid after consumption. A resend invalidates outstanding tokens and uses generic, rate-limited responses.

### 6.3 Password recovery

Recovery uses the same generic response for known and unknown email addresses. Reset tokens use 32 random bytes, hash-only storage, a 30-minute lifetime and single consumption. A successful reset changes the credential and revokes all registered sessions. Provider-only and phone-only users do not receive an implicit password through recovery.

### 6.4 Account enumeration

Recovery and verification-resend endpoints avoid revealing account existence. Sign-in maps wrong password and unknown email to `INVALID_CREDENTIALS`. Public registration returns a conflict for an existing email, so the release does not claim perfect enumeration resistance on every public route.

### 6.5 Credential stuffing

The module provides generic errors, account-status checks and database-backed rate-limit infrastructure for relevant flows. Operators should add platform monitoring and incident thresholds. The release evidence does not justify claiming a specific credential-stuffing detection percentage or universal lockout policy.

## 7. OTP security

### 7.1 Lifecycle

1. Normalize phone input to E.164.
2. Enforce per-phone, per-network and signed-client start limits.
3. Create a Twilio Verify WhatsApp challenge.
4. Persist a derived provider reference, expiry, channel and attempt budget.
5. Verify the submitted code with Twilio and local challenge state.
6. Atomically consume the challenge.
7. Resolve the existing `PhoneIdentity` or create a default Renter user and verified identity.

### 7.2 Implemented limits

- Default expiry: 5 minutes
- Default maximum attempts: 5
- Start: 5 per phone per 15 minutes
- Start cooldown: 1 per phone per 30 seconds
- Start: 30 per network and 10 per signed client per 15 minutes
- Verify: 20 per phone, 60 per network and 30 per signed client per 15 minutes

### 7.3 Replay and channel protection

Expired, consumed or exhausted challenges are rejected. The supplied phone and channel must match the challenge. SMS initiation is retired and fails closed; WhatsApp delivery is not retried through SMS. Raw OTP values must never be stored or logged.

## 8. Session and cookie security

### 8.1 Hybrid session control

NextAuth uses JWT sessions with a maximum age of 30 days. The JWT includes an opaque session identifier. The server stores only its hash in `UserSession`. Each protected session resolution checks the registry and current account status, allowing revocation without waiting for the browser token to expire.

### 8.2 Revocation paths

- Current logout revokes the current registry row and associated AAL2 assurance.
- A user can revoke a selected other session.
- A user can revoke all other sessions.
- Password reset revokes all sessions.
- Account-status checks deny inactive users.

### 8.3 Cookie principles

- Session and OAuth cookies are HttpOnly where configured by the framework/application.
- Secure cookies are used under HTTPS/Production conditions.
- Cross-site `SameSite=None` is limited to transient OAuth cookies that require it.
- Cookie values are never included in logs, support attachments or manuals.
- Callback URLs are normalized to local safe destinations to prevent external redirects.

### 8.4 Step-up assurance

TOTP or a valid recovery code can grant AAL2 to the current registered session for up to four hours. Generic email/phone link and unlink routes require AAL2. Ordinary provider login, phone OTP or service-level OAuth success does not itself grant AAL2.

## 9. RBAC, KYC and business-data protection

Authentication providers establish control of an external identity. They do not establish marketplace authority.

After identity resolution, the application reads `User.role` and `User.status` and applies RENTipid authorization policy. New OAuth and phone users receive `Renter`. Public email registration accepts only the configured safe public roles. Staff, operator and administrator roles require internal governance.

Because KYC, profiles, listings, bookings, payments, ledger entries and other history remain related to `User.id`, adding or removing an authentication method does not duplicate or transfer those records. Tests and owner acceptance confirmed role and profile/KYC continuity for the accepted module; business records should still be covered by release and regression tests before future identity changes.

## 10. Audit and logging

### 10.1 Implemented authentication events

The frozen source includes events such as:

- `AUTH_LOGIN_FAILED`
- `AUTH_ACCOUNT_STATUS_DENIED`
- `AUTH_LOGIN_SUCCEEDED`
- `AUTH_OAUTH_LOGIN_FAILED`
- `AUTH_OAUTH_LOGIN_SUCCEEDED`
- `AUTH_OAUTH_USER_CREATED`
- `AUTH_ACCOUNT_LINK_REQUIRED`
- `AUTH_IDENTITY_LINK_BLOCKED`
- `AUTH_PHONE_OTP_STARTED`
- `AUTH_PHONE_OTP_FAILED`
- `AUTH_PHONE_OTP_EXPIRED`
- `AUTH_PHONE_OTP_REPLAY_DENIED`
- `AUTH_PHONE_OTP_ATTEMPT_LIMITED`
- `AUTH_PHONE_OTP_RATE_LIMITED`
- `AUTH_PHONE_OTP_VERIFIED`
- `AUTH_PHONE_LOGIN_SUCCEEDED`
- `AUTH_PHONE_USER_CREATED`
- `AUTH_EMAIL_VERIFIED`
- `AUTH_PASSWORD_RESET_COMPLETED`
- `SESSION_CREATED`
- `SESSION_REVOKED`
- `SESSION_REVOKED_BY_USER`
- `OTHER_SESSIONS_REVOKED`

`AuthIdentityEvent` separately records `CREATE`, `LINK`, `LINK_BLOCKED` and `UNLINK` actions with controlled outcomes. `PROVIDER_IDENTITY_COLLISION` is a useful conceptual label but is not the event-code spelling in v1.1.0; collision evidence is represented by `AUTH_IDENTITY_LINK_BLOCKED` with reason `IDENTITY_IN_USE`.

### 10.2 Prohibited log contents

The following must never be logged:

- Passwords or password hashes
- OTP values
- OAuth authorization codes, access tokens, refresh tokens or Apple ID tokens
- Session cookies or raw opaque session IDs
- Client secrets, private keys or Apple `.p8` contents
- Twilio auth tokens
- `NEXTAUTH_SECRET`, reference-hash secrets or MFA encryption secrets
- Database URLs, usernames or passwords
- Full provider subjects when a derived reference is sufficient

Use masked phone values and HMAC-derived reference hashes where implemented. Tests confirm that successful and failed auth evidence omits passwords, OTPs, provider secrets and raw provider subjects in blocked-link events.

## 11. Secret management

Configuration names are documented, values are not. Secrets belong in environment-scoped secret storage. Production must provide strong values even where local development fallbacks exist.

Secret variables include `NEXTAUTH_SECRET`, `AUTH_REFERENCE_HASH_SECRET`, OAuth client secrets, `TWILIO_AUTH_TOKEN`, SMTP password, database URLs and MFA/security keys. Non-secret feature flags and public client IDs must still be environment-controlled.

Do not copy `.env` files into tickets or documentation. Do not reuse Production secrets in Preview. Rotate a secret if it is exposed, then invalidate affected sessions/tokens and review audit evidence.

## 12. Incident response

### 12.1 Suspected account takeover

1. Preserve audit records and timestamps.
2. Revoke current/all sessions as policy permits.
3. Reset the established password credential if applicable.
4. Verify connected methods against durable provider subjects and masked metadata.
5. Do not unlink or transfer a disputed identity until ownership is established.
6. Review recent link, unlink, MFA and session events.
7. Restore access through a verified existing method or controlled support procedure.

### 12.2 Provider collision

Treat `IDENTITY_IN_USE` as a security boundary, not an inconvenience. Preserve both user IDs and identity-event evidence. Confirm which user previously linked the durable provider subject. Do not use matching email, display name or screenshots as sufficient reassignment proof.

### 12.3 OAuth callback anomaly

Check the exact environment callback registration, scheme, host, provider ID, state/PKCE/nonce cookie behavior, clock and deployment configuration. Never disable state, PKCE, nonce or secure-cookie rules to clear the error.

### 12.4 OTP abuse

Review rate-limit and verification events using derived references. Confirm Twilio Verify status and delivery health. Do not request or collect a user's OTP. Repeated failures may require temporary access controls outside this module's documented scope.

### 12.5 Preview/Production isolation incident

Stop promotion. Compare aliases, deployment IDs and database branch identifiers without printing connection strings. Preserve Production. Correct Preview only through controlled infrastructure change, then recheck `/api/health` and `/api/auth/providers` and document the recovery. The post-freeze restoration report is the current precedent.

## 13. Security controls matrix

| Threat | Preventive control | Detective evidence | Recovery control | Status |
|---|---|---|---|---|
| Same-email takeover | No auto-link; signed explicit link intent | `AUTH_ACCOUNT_LINK_REQUIRED` | Authenticate existing account and connect | Implemented/tested |
| Provider collision | Ownership check plus unique database key | `AUTH_IDENTITY_LINK_BLOCKED` | Controlled investigation | Implemented/tested |
| OAuth CSRF | State; CSRF token; provider-bound intents | Callback failures | Restart flow; fix registration/cookies | Implemented/tested |
| Code interception | PKCE for Google and Apple | Callback failure | Restart without bypass | Implemented/tested |
| Apple cross-site cookie loss | Secure `SameSite=None` transient cookies | Apple cookie regression suite | Correct HTTPS/proxy behavior | Implemented/tested |
| OTP replay | Atomic consumption and status checks | Replay/expired/attempt events | Start new challenge | Implemented/tested |
| OTP flooding | Persisted phone/network/client limits | Rate-limit events | Wait/escalate abuse | Implemented/tested |
| Password token theft at rest | Hash-only one-time tokens | Recovery audit | Expiry, invalidation and rotation | Implemented/tested |
| Stale sessions | UserSession registry and revocation | Session events | Logout/reset/revoke | Implemented/tested |
| Provider role escalation | Database role authority | Login/security events | Deny and investigate | Implemented/tested |
| Secret leakage in auth audit | Sanitized metadata and derived references | Tests and review | Rotate exposed secrets | Implemented/tested |
| Environment data crossover | Separate Preview/Production deployments and databases | Health/provider and release evidence | Controlled isolation restoration | Configured/documented |

## 14. Residual risks and non-claims

- External providers and Twilio can experience outages. Multiple methods reduce dependency but do not guarantee uninterrupted authentication.
- Recovery still depends on the user retaining at least one usable method or satisfying a controlled support process.
- Registration conflict behavior can reveal that an email is already registered; enumeration protection is stronger on recovery and sign-in paths than on that route.
- The source contains development fallback secrets. Production security depends on correctly configured environment secrets; the release evidence confirms configuration, not the disclosure of values.
- The release does not claim passkeys, hardware security keys, universal device binding, offline authentication, biometric authentication or automated identity merging. Those are not implemented in v1.1.0.
- This document is not a guarantee against all account compromise. It records implemented controls and operating duties for the frozen module.
