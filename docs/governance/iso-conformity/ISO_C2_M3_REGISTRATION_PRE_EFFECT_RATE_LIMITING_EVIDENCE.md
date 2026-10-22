# ISO-C2-M3 Registration Pre-Effect Rate Limiting Evidence

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M3-EVD`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Work Package:** `ISO-C2-M3-D1-E1`  
**Version:** `v1.0`  
**Status:** `PASS — IMPLEMENTED / LOCAL ACCEPTANCE`  
**Authoritative Technical Commit:** `dca5479`  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Evaluation Date:** 2026-10-22  

---

## 1. Project Owner Authorization

The Project Owner explicitly authorized Wave 3:
* **Scope:** Registration Pre-Effect Rate Limiting Implementation and Promotion Readiness.
* **Permitted Boundary:** Repository-local technical changes to implement the accepted M3 control and establish local acceptance / promotion readiness.
* **Production Deployment:** NOT AUTHORIZED.
* **Preview Promotion:** Conditioned on explicit authorization; stops at local readiness returning `PREVIEW AUTHORIZATION REQUIRED`.

---

## 2. Authoritative Governance & Defect Mapping

* **Wave 3 Title:** `ISO-C2-M3 — REGISTRATION PRE-EFFECT RATE LIMITING + CONTROLLED PROMOTION`
* **Risk Addressed:** `RSK-06` (Ingress APIs [`AST-01`]: Excessive automated scraping or API denial-of-service)
* **Confirmed Defect ID:** `DEF-RUNTIME-01`
* **Treatment ID:** `TRT-C02`
* **Affected Public Surface:** `POST /api/auth/register` ([src/app/api/auth/register/route.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/src/app/api/auth/register/route.ts))

---

## 3. First Registration Side Effect & Control Ordering

### A. Identification of the First Registration Side Effect
In the unpatched registration flow, incoming requests traversed input validation, operating jurisdiction checks, phone normalization, and profile field encryption, followed by:
1. `prisma.user.findUnique({ where: { email } })` — Database read query
2. `bcrypt.hash(password, 10)` — **First expensive CPU/memory resource exhaustion side effect**
3. `prisma.$transaction(...)` — **First persistent database mutation side effect** (creating `User`, `EmailCredential`, `UserGlobalPreference`, and `UserProfile` / `BusinessProfile`)
4. `createAuditLog(...)` — Audit logging side effect
5. `createAuthAncillaryService().requestEmailVerification(...)` — Outbound token & email dispatch

The only prior rate limiting was downstream inside `requestEmailVerification`, which executed *after* user account creation and password hashing, offering zero protection against registration endpoint denial-of-service or database exhaustion.

**FIRST SIDE EFFECT DEFINITION:**
`bcrypt.hash(password, 10)` (cryptographic computation) and `prisma.$transaction` creating the user account record.

### B. Old Control Ordering vs. Corrected Control Ordering

```mermaid
graph TD
    subgraph Old Unpatched Flow
        O1[POST /api/auth/register] --> O2[Input Validation]
        O2 --> O3[Jurisdiction Check]
        O3 --> O4[DB Lookup: findUnique]
        O4 --> O5[Expensive CPU: bcrypt.hash]
        O5 --> O6[Transactional DB Writes: tx.user.create]
        O6 --> O7[Audit Log: createAuditLog]
        O7 --> O8[Downstream Email Limiter & Send]
    end

    subgraph Corrected M3 Flow
        N1[POST /api/auth/register] --> N2[Input Validation]
        N2 --> N3[Pre-Effect Rate Limiting Admission Check]
        N3 -- Quota Exceeded --> N4[HTTP 429 Too Many Requests + Retry-After]
        N3 -- Within Quota --> N5[Jurisdiction Check]
        N5 --> N6[DB Lookup: findUnique]
        N6 --> N7[bcrypt.hash]
        N7 --> N8[Transactional DB Writes: tx.user.create]
        N8 --> N9[Audit Log: createAuditLog]
        N9 --> N10[Email Verification Dispatch]
    end
```

---

## 4. Rate-Limit Architecture, Key Strategy & Key Safety

1. **Storage Backend:** Reused existing PostgreSQL `"AuthRateLimit"` table (`key` VARCHAR PRIMARY KEY, `points` INT, `reset_at` TIMESTAMPTZ) via `DatabaseAuthRateLimiter` in [src/lib/auth/unified/rate-limiter.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/src/lib/auth/unified/rate-limiter.ts).
   * **Database Migration:** `PASS — REUSED / UNAFFECTED` (schema already exists).
   * **Required Data Seed/Sync:** `PASS — REUSED / UNAFFECTED` (no seed required).
2. **Pseudonymous Key Generation (Zero Raw PII):**
   * Keys are generated using HMAC-SHA256 digests via `createReferenceHash(value, scope)` with secret `AUTH_REFERENCE_HASH_SECRET`.
   * **Network Key:** `auth:register:network:${createReferenceHash(ip, 'register-network')}`
   * **Identity Key:** `auth:register:identity:${createReferenceHash(canonicalizeEmail(email), 'register-identity')}`
   * No raw IP addresses or email addresses are stored in rate-limit keys or logs.
3. **Trusted Reverse-Proxy IP Resolution:**
   * Respects reverse proxy architecture (Vercel, AWS ALB, Cloudflare).
   * Conservative parsing extracts the terminal element from `X-Forwarded-For` (`parts[parts.length - 1].trim()`) or `X-Real-IP` / `CF-Connecting-IP`, preventing attackers from rotating rate-limit buckets by prepending arbitrary spoofed IPs.
4. **Quotas & Configurable Policy:**
   * **IP Quota:** 10 attempts per 60 minutes (default). Configurable via `AUTH_REGISTRATION_RATE_LIMIT_IP`.
   * **Identity Quota:** 5 attempts per 60 minutes (default). Configurable via `AUTH_REGISTRATION_RATE_LIMIT_EMAIL`.
   * **Window Duration:** 3,600,000 ms (1 hour default). Configurable via `AUTH_REGISTRATION_RATE_LIMIT_WINDOW_MS`.
5. **Sanitized Throttled Response Contract:**
   * **HTTP Status:** `429 Too Many Requests`
   * **HTTP Headers:** `Retry-After: <seconds>` (bounded positive integer representing time until bucket expiry)
   * **Response Body:** `{"message": "Too many registration attempts. Please try again later."}`
   * **Information Disclosure:** ZERO tokens, keys, stack traces, or internal debug details disclosed.

---

## 5. Failure Behavior: Strict Fail-Closed

If the rate-limit storage backend or database encounters a failure or connectivity drop:
* The control **fails closed**: the exception is caught and terminates the request immediately.
* **HTTP Result:** `500 Internal server error during registration`.
* **Side-Effect Invariance:** Neither `bcrypt.hash`, `prisma.user.findUnique`, `prisma.$transaction`, nor email verification are reached. No partial user record or credential is created.

---

## 6. Zero Side-Effect Verification on Throttled Requests

Contract tests in [tests/auth/registration-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/registration-rate-limiter.test.ts) formally verified that throttled requests produce ZERO unintended effects:

| Side Effect Dimension | Unpatched Behavior | Patched M3 Behavior | Verification Evidence |
|---|---|---|---|
| **CPU Bcrypt Hashing** | EXECUTED | **NO (0 calls)** | Verified `bcrypt.hash` call count invariant |
| **User Created** | CREATED | **NO (0 records)** | Verified `tx.user.create` not called |
| **Credential Created** | CREATED | **NO (0 records)** | Verified `tx.emailCredential.create` not called |
| **Profile Created** | CREATED | **NO (0 records)** | Verified `userProfile` / `businessProfile` not called |
| **Global Preference Created**| CREATED | **NO (0 records)** | Verified `userGlobalPreference` not called |
| **DB Read Query** | EXECUTED | **NO (0 queries)** | Verified `prisma.user.findUnique` not called |
| **Audit Log Written** | WRITTEN | **NO (0 records)** | Verified `createAuditLog` not called |
| **Verification Token / Email**| ATTEMPTED | **NO (0 calls)** | Verified `requestEmailVerification` not called |
| **Session Created** | NO | **NO (0 sessions)** | Verified zero session records |
| **External Provider Calls** | NO | **NO (0 calls)** | Verified zero third-party invocations |

---

## 7. Targeted Test Evidence

Targeted test execution via Jest with isolated local test database guards:

```powershell
$env:NODE_ENV="test"; $env:ALLOW_TEST_DATABASE_MUTATION="true"; $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rentipid_test_drill"; npx jest tests/auth/registration-rate-limiter.test.ts
```

**Results:**
```
 PASS  tests/auth/registration-rate-limiter.test.ts
  ISO-C2-M3: Registration Pre-Effect Rate Limiting (DEF-RUNTIME-01 / TRT-C02)
    Contract A: Sub-threshold requests follow normal registration behavior
      √ executes password hashing, transactional account writes, audit log, and email verification below threshold (16 ms)
    Contract B & C: Exact threshold boundary behavior & HTTP 429 contract
      √ allows requests exactly up to the limit and rejects the very next request with HTTP 429 and Retry-After (8 ms)
    Contract D & E: Zero side-effect proof on throttled requests
      √ produces ZERO password hashing, ZERO database writes, ZERO audit logs, and ZERO emails when throttled (3 ms)
    Contract F: Multi-dimensional scoping (IP vs Email)
      √ throttles IP exhaustion without blocking different IPs (4 ms)
      √ throttles targeted email attacks across distributed IPs (3 ms)
    Contract G & H: Spoofable header safety & sanitized response
      √ safely extracts the nearest reverse-proxy client IP and ignores forged leading elements
      √ generates pseudonymous reference hashes with zero raw PII in limiter keys (4 ms)
      √ contains no secrets or sensitive debug info in HTTP 429 response (2 ms)
    Contract I: Fail-Closed behavior on limiter backend error
      √ fails closed and blocks registration when rate limiter backend is unavailable (32 ms)
    DatabaseAuthRateLimiter SQL Engine & Pruning
      √ correctly executes SQL upsert and returns RateLimitResult (1 ms)
      √ prunes expired records via DELETE query (1 ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

### Unaffected & Regression Suites:
* `tests/auth/unified-auth-routes.test.ts`: **15 passed, 15 total** (`PASS — REUSED / UNAFFECTED`)
* `tests/security/mfa-rate-limiter.test.ts`: **4 passed, 4 total** (`PASS — REUSED / UNAFFECTED`)
* TypeScript typecheck: `npx tsc --noEmit` exited **0** with zero errors across all repository files.

---

## 8. Milestone Promotion Gate Status

| Promotion Gate | Status | Justification / Evidence |
|---|---|---|
| **CODE COMPLETE** | `PASS — EXECUTED` | Rate limiter engine and pre-effect route admission check implemented; zero placeholders. |
| **LOCAL FUNCTIONAL** | `PASS — EXECUTED` | Registration route and limiter run locally with expected status codes, headers, and side-effect invariance. |
| **LOCAL DATABASE MIGRATED** | `PASS — REUSED / UNAFFECTED` | Reused existing `"AuthRateLimit"` table; schema unchanged. |
| **LOCAL REQUIRED DATA SEEDED/SYNCED** | `PASS — REUSED / UNAFFECTED` | No reference or seed data required. |
| **LOCAL ACCEPTANCE** | `PASS — EXECUTED` | 11 targeted contract tests pass; zero side effects proven on throttled and error cases. |
| **PREVIEW MIGRATED** | `PASS — REUSED / UNAFFECTED` | Existing `"AuthRateLimit"` table is present in Preview; no migration delta. |
| **PREVIEW ACCEPTANCE** | `NOT_RUN` | **PREVIEW AUTHORIZATION REQUIRED.** Runtime hosting proxy configuration and owner preview rollout required. |
| **PRODUCTION-READY** | `NOT_RUN` | Pending Preview acceptance and production change authorization. |
| **PRODUCTION DEPLOYMENT** | `NOT AUTHORIZED` | Strictly prohibited. |

---

## 9. Resulting Risk Status

* **Risk ID:** `RSK-06`
* **Status:** `PROVEN — IMPLEMENTED` (advanced from `PARTIAL`)
* **Residual Risk Accepted:** `NO`
* **Next Action:** Await Project Owner controlled Preview promotion authorization for Wave 3 live synthetic verification.
