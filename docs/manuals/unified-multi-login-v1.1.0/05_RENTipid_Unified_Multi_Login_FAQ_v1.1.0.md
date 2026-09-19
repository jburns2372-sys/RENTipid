# RENTipid Unified Multi-Login Authentication Module

## Frequently Asked Questions v1.1.0

**Status:** CLOSED / VERSION FROZEN

## Table of Contents

1. [User questions](#1-user-questions)
2. [Business questions](#2-business-questions)
3. [Developer questions](#3-developer-questions)
4. [Operations and security questions](#4-operations-and-security-questions)

## 1. User questions

### 1.1 What is Unified Multi-Login?

It lets one RENTipid account be reached through several verified sign-in methods: email/password, WhatsApp OTP, Google, Facebook and Apple. Your RENTipid account remains one account.

### 1.2 Will using Google and Apple create two accounts?

Not after both are correctly connected to the same account. Each method then resolves to the same permanent RENTipid user ID.

### 1.3 Why did RENTipid say “Sign-in method not connected” when the emails matched?

Matching email addresses do not prove that the same person controls both accounts. RENTipid asks you to sign in with an existing method and connect the new one from Account Security. This helps prevent account takeover.

### 1.4 Where do I connect a provider?

Sign in, open **Dashboard**, choose **Account Security**, then find **Connected Login Methods**. Select **Connect Google**, **Connect Facebook** or **Connect Apple** as available.

### 1.5 Can I disconnect a method?

Yes, when another usable sign-in method remains. RENTipid blocks removal of the final usable method so you do not lock yourself out.

### 1.6 What if Apple hides my email?

Apple may provide a private relay address. RENTipid identifies the linked Apple method using Apple's durable subject, not by relying on the relay address as the account key.

### 1.7 What if Facebook does not provide my email?

Facebook email is optional for this module. A valid Facebook subject can still identify a connected method. Add or maintain contact information inside RENTipid through the appropriate profile process.

### 1.8 Is WhatsApp OTP the same as SMS?

No. v1.1.0 uses Twilio Verify over WhatsApp. Public SMS login is retired and is not a fallback.

### 1.9 How long is a WhatsApp code valid?

The implemented default challenge lifetime is five minutes, with up to five verification attempts. A successfully consumed challenge cannot be reused.

### 1.10 Does a successful provider login decide whether I am a renter or provider?

No. Google, Facebook and Apple prove control of their external identity. RENTipid assigns and enforces internal roles.

### 1.11 What happens after a password reset?

All registered RENTipid sessions are revoked. Sign in again with the new password or another connected method.

### 1.12 Should I send support my OTP or password?

No. RENTipid support should never need your password, OTP, OAuth code or session cookie.

## 2. Business questions

### 2.1 What business problem does the module solve?

It gives customers familiar sign-in choices while preserving one internal customer record. This is designed to reduce registration friction, support account continuity and limit duplicate records without weakening linking security.

### 2.2 Does RENTipid automatically merge customers who share an email?

No. Same-email automatic linking is intentionally disabled. Explicit proof of the existing RENTipid account and the new provider identity is required.

### 2.3 Can an external provider grant an internal business role?

No. RENTipid's database and authorization policies control roles and permissions.

### 2.4 Does multi-login change bookings, payments or ledger ownership?

No. Those records remain attached to the permanent internal `User.id`. Authentication methods are access paths to that user.

### 2.5 Does the module guarantee higher conversion?

No numerical uplift is claimed. The multiple familiar options are designed to reduce friction, but measured outcomes require analytics and controlled evaluation.

### 2.6 What happens if one provider is unavailable?

Users with another connected method can use it. Provider independence improves continuity but does not guarantee every user has an alternative.

### 2.7 Is the module mobile and PWA compatible?

The flows are web-based and available through RENTipid's responsive/PWA surfaces. Provider browsers and WhatsApp handoffs still depend on platform behavior and connectivity.

## 3. Developer questions

### 3.1 What is the canonical identity key?

`User.id` is the canonical RENTipid key. OAuth identities use the unique pair `(provider, provider_subject)`.

### 3.2 Is the NextAuth `Account` model authoritative?

No. The accepted module uses `AuthProviderIdentity` as the authoritative OAuth mapping.

### 3.3 Why use a synthetic internal email?

The existing `User.email` field is required/unique. OAuth-only and phone-only users receive a reserved internal identifier so optional or changing external email metadata is not misused as ownership. Synthetic emails must not be displayed.

### 3.4 Is `allowDangerousEmailAccountLinking` enabled?

No. It is not enabled and conflicts with the accepted explicit-linking rule.

### 3.5 How is an explicit OAuth link distinguished from sign-in?

Account Security creates a short-lived signed cookie bound to the current user and selected provider. The callback consumes and validates it before linking.

### 3.6 Which providers use PKCE and nonce?

Google and Apple. Facebook is configured with state protection in the frozen implementation.

### 3.7 Why is Apple cookie handling different?

Apple returns through a cross-site POST. The short-lived OAuth state, PKCE, nonce and callback cookies use `SameSite=None; Secure` on HTTPS so the browser returns them. Session/CSRF cookie policy is not broadly weakened.

### 3.8 Does phone OTP grant MFA AAL2?

No. Service-level phone authentication does not automatically create AAL2. TOTP/recovery-code verification grants the session assurance used by routes that require recent strong authentication.

### 3.9 What is the public phone provider ID?

`phone-otp`, with user-facing name WhatsApp OTP and channel fixed to `whatsapp`.

### 3.10 What events represent a provider collision?

`AUTH_IDENTITY_LINK_BLOCKED` with reason `IDENTITY_IN_USE`, plus the corresponding denied `AuthIdentityEvent`. `PROVIDER_IDENTITY_COLLISION` is not the literal event code in v1.1.0.

## 4. Operations and security questions

### 4.1 What should the provider registry contain?

In accepted Production and current isolated Preview: `credentials`, `phone-otp`, `google`, `facebook`, `apple`.

### 4.2 What is the health probe?

`GET /api/health`. A healthy response is HTTP 200 with `status: ready` and `database: connected`.

### 4.3 Can Preview and Production share a database?

No. The documented current topology uses independent deployments and databases. Cross-environment sharing risks customer-data exposure and invalid acceptance evidence.

### 4.4 Which configuration values may be documented?

Variable names, purpose and required status. Never publish secret values, connection strings, private keys, tokens or cookies.

### 4.5 What should support do with `IDENTITY_IN_USE`?

Preserve evidence and escalate. Do not delete or reassign the provider identity based on email or display-name similarity.

### 4.6 What should be monitored?

Health readiness, provider registry, authentication failure/denial trends, OTP rate limits and provider availability, link-required/collision events, session revocations, callback failures and environment isolation.

### 4.7 What is frozen?

The v1.1.0 module source and accepted release evidence at `rentipid-unified-auth-v1.1.0-frozen`. Successor work must use a new version/change-control path. The frozen tag must not be moved or amended.

### 4.8 Where is the detailed runbook?

See the [Developer & Operations Manual](03_RENTipid_Unified_Multi_Login_Developer_Operations_Manual_v1.1.0.md), the [Security Reference](09_RENTipid_Unified_Multi_Login_Security_Reference_v1.1.0.md) and the [Troubleshooting Guide](06_RENTipid_Unified_Multi_Login_Troubleshooting_Guide_v1.1.0.md).
