# Unified Multi-Login v1.1 Restoration — G1 Code Complete Evidence

**Document ID:** `RENTIPID-AUTH-MULTILOGIN-G1-RESTORATION-001`  
**Gate:** `G1 — CODE COMPLETE`  
**Module:** `Unified Multi-Login v1.1 Restoration`  
**Status:** `PASS`  
**Branch:** `fix/restore-unified-multi-login-v1.1`  
**Restoration Parent SHA:** `6a755c1575db032f381e93e64f82e5816882fb69`  
**Known-Good Source SHA:** `0161b0043abb9c036129277fb64dfa9a82af5cba`  
**Restoration Application SHA:** `8330788895b06bd2078646f6bac54512cb335ca1`  
**Date:** `2026-09-03`  

---

## 1. Executive Summary

A controlled forward-port of the proven Unified Multi-Login implementation from `0161b0043abb9c036129277fb64dfa9a82af5cba` has been integrated into the active lineage (`feature/listingbridge-v1.1-assisted-imports` parent `6a755c1575db032f381e93e64f82e5816882fb69`).

All subsequent SOC MFA and AAL2 security fixes were preserved in full, with zero regressions.

---

## 2. Restored Provider Matrix

| Provider | Mechanism | Status | Visibility Condition |
| :--- | :--- | :---: | :--- |
| **Google** | `GoogleProvider` | **PASS** | `AUTH_GOOGLE_ENABLED=true` & credentials configured |
| **Facebook** | `FacebookProvider` | **PASS** | `AUTH_FACEBOOK_ENABLED=true` & credentials configured |
| **WhatsApp** | `CredentialsProvider(id: "phone-otp")` | **PASS** | `AUTH_WHATSAPP_OTP_ENABLED=true` & Twilio configured |
| **Email / Password** | `CredentialsProvider(id: "credentials")` | **PASS** | `AUTH_EMAIL_ENABLED=true` |
| **Apple** | `AppleProvider` | **PRESERVED_DEFERRED** | Deferred by default (`AUTH_APPLE_DEFERRED=true`) |
| **SMS / Mobile OTP** | Retired | **NO** | Not exposed in gateway UI |

---

## 3. Architecture & Security Invariant Preservation

1. **SOC MFA & AAL2 Session Assurance:**
   - Server authority `MfaSessionAssurance` in PostgreSQL is fully intact.
   - Post-MFA hard navigation `window.location.assign(safeTarget)` is preserved (resolving `CLIENT_ROUTER_STALE_AUTH_STATE`).
   - Stable `mfaSessionId` generated with 32-byte cryptographic random and hashed via SHA-256 is preserved.
2. **Safe Callback URL & Open Redirect Mitigation:**
   - All social, WhatsApp, and credentials sign-ins enforce `normalizeLoginCallbackUrl()` and reject external/open redirects.
3. **Account Linking Safeguards:**
   - Identity linking strictly requires active authenticated session and step-up AAL2 assurance (`MFA_SESSION_ASSURANCE_LEVEL_AAL2`).
   - Disallows blind email-string automatic linking.
4. **Active Sessions & Revocation:**
   - `UserSession` model and `session-registry.ts` restored.
   - Logout cleanly triggers session and AAL2 revocation.

---

## 4. Schema & Migration Delta

- **Schema Delta:**
  - Added models: `UserSession`, `EmailCredential`, `AuthProviderIdentity`, `PhoneIdentity`, `PhoneVerificationChallenge`, `AuthRateLimit`, `AuthConsentReceipt`, `AuthIdentityEvent`.
  - Added relations on `User`: `userSessions`, `emailCredential`, `authProviderIdentities`, `phoneIdentities`, `authConsentReceipts`, `authIdentityEvents`.
- **Migration Delta:**
  - `prisma/migrations/20260826120000_add_user_session_registry/migration.sql`
  - `prisma/migrations/20260827090000_unified_multi_login_auth_v1_1/migration.sql`
- **Database Mutation during G1:** `NO` (0 migrations applied to Preview or Production).

---

## 5. Test & Quality Gate Evidence

| Gate / Check | Scope / Command | Result |
| :--- | :--- | :---: |
| **Targeted Auth Tests** | 6 test suites (`unified-multi-login-v1.1`, `unified-auth-routes`, `multi-login-finalization`, `ancillary-email-password-flows`, `profile-display-email`, `login-page`) | **142/142 PASS** |
| **Targeted SOC Tests** | 4 test suites (`mfa-soc-redirect`, `mfa-authorization`, `session-step-up`, `phase8-session-management`) | **53/53 PASS** |
| **TypeScript Typecheck** | `npm run typecheck` | **PASS (0 errors)** |
| **Production Build** | `npm run build` | **PASS (exit code 0)** |
| **Prisma Validation** | `npx prisma validate` | **PASS (valid)** |
| **Targeted ESLint** | All restored & modified files | **PASS (0 errors, 0 warnings)** |
| **Git Diff Check** | `git diff --check` | **PASS (clean)** |

---

## 6. Lifecycle Gate Determination

- **G1 (Code Complete):** `PASS`
- **Blockers:** 0 Critical, 0 High
- **Next Gate:** `G2 LOCAL FUNCTIONAL` (Requires explicit user command)
