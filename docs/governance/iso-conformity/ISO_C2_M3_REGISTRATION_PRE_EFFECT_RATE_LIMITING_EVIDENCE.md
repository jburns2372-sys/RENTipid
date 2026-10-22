# ISO-C2-M3 Registration Pre-Effect Rate Limiting Evidence

**Document ID:** `RENTIPID-ISO-CONFORMITY-001-M3-EVD`  
**Program:** RENTipid ISO Compliance & Conformity Program  
**Project ID:** `RENTIPID-ISO-CONFORMITY-001`  
**Work Package:** `ISO-C2-M3-D3-E3`  
**Version:** `v1.0`  
**Status:** `PASS — OPERATING CONTROL VERIFIED / CLOSED`  
**Authoritative Technical Candidate:** `dca547904791535ca44485747065961dbf8fc421`  
**Authoritative Governance Baseline:** `2d237d030009bb98730ef9a5bcf70a6fff6d0879`  
**Executor:** Antigravity / Gemini 3.8 Flash High  
**Evaluation Date:** 2026-10-22  

---

## 1. Project Owner Production Authorization

The Project Owner explicitly authorized Wave 3 Controlled Production Promotion & Operating Verification:
* **Scope:** Controlled Production promotion and runtime operating verification of ISO-C2-M3 registration pre-effect rate limiting.
* **Authorized Actions:**
  * Identify the existing approved Production deployment mechanism (Vercel Production Promotion);
  * Promote/deploy the exact accepted M3 application candidate (`dca547904791535ca44485747065961dbf8fc421`);
  * Verify the exact deployed Production SHA;
  * Perform minimal synthetic registration verification;
  * Verify normal below-threshold operation;
  * Verify bounded over-limit HTTP 429 behavior and `Retry-After` header;
  * Verify zero unintended registration side effects for a blocked synthetic request;
  * Inspect only M3-relevant Production logs/telemetry/database evidence;
  * Update ISO M3 evidence;
  * Close M3 under accepted operating conformity.
* **Prohibited Actions:**
  * Unrelated Production changes: STRICTLY PROHIBITED;
  * Destructive database actions: STRICTLY PROHIBITED;
  * Customer-data modification / real customer testing: STRICTLY PROHIBITED;
  * Load/stress testing or destructive testing: STRICTLY PROHIBITED;
  * Changing thresholds for testing convenience: STRICTLY PROHIBITED;
  * Weakening rate limiting / broad Auth changes: STRICTLY PROHIBITED;
  * M4 work: STRICTLY PROHIBITED;
  * Residual-risk acceptance / ISO certification claims: STRICTLY PROHIBITED.

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
* **Failure Policy Disposition:** `PASS — REUSED / UNAFFECTED` (verified under local unit contract test I; non-destructive production operation confirmed).

---

## 6. Zero Side-Effect Verification on Throttled Requests

Contract tests in [tests/auth/registration-rate-limiter.test.ts](file:///C:/Users/user/Documents/JD%20SOFTWARE%20PROJECTS/RENTipid-GLOBAL-MKT-V2/tests/auth/registration-rate-limiter.test.ts), Preview runtime verification, and Production operating verification formally proved that throttled requests produce ZERO unintended effects:

| Side Effect Dimension | Unpatched Behavior | Patched M3 Behavior | Verification Evidence |
|---|---|---|---|
| **CPU Bcrypt Hashing** | EXECUTED | **NO (0 calls)** | Verified `bcrypt.hash` bypassed on 429 response |
| **User Created** | CREATED | **NO (0 records)** | Verified zero `User` records created on throttled request |
| **Credential Created** | CREATED | **NO (0 records)** | Verified zero `EmailCredential` records created on throttled request |
| **Profile Created** | CREATED | **NO (0 records)** | Verified `userProfile` / `businessProfile` writes bypassed |
| **Global Preference Created**| CREATED | **NO (0 records)** | Verified `userGlobalPreference` writes bypassed |
| **DB Read Query** | EXECUTED | **NO (0 queries)** | Verified `prisma.user.findUnique` bypassed |
| **Audit Log Written** | WRITTEN | **NO (0 records)** | Verified `createAuditLog` bypassed |
| **Verification Token / Email**| ATTEMPTED | **NO (0 calls)** | Verified `requestEmailVerification` bypassed |
| **Session Created** | NO | **NO (0 sessions)** | Verified zero session records |
| **External Provider Calls** | NO | **NO (0 calls)** | Verified zero third-party invocations |

---

## 7. Controlled Preview Deployment & Runtime Evidence (Reused)

* **Deployment Identifier:** `7251560631` (`dpl_HqiN1awwSPk3VkGYzfoiPaeJ1nR7`)
* **Deployment SHA:** `710122f5b0c70abf81017c3248ca3d4c36af54fd`
* **Preview Target URL:** `https://ren-tipid-mc05sddzv-jburns2372-sys-projects.vercel.app`
* **Environment Classification:** `Preview – ren-tipid` (Non-Production)
* **Results:** Below-threshold `201 Created` PASS; over-threshold `429 Too Many Requests` + `Retry-After: 3546` PASS; zero throttled side effects verified.
* **Preview Acceptance Status:** `PASS — EXECUTED` (Documented in commit `2d237d0`).

---

## 8. Controlled Production Promotion & Target Boundary

* **Promotion Mechanism:** Vercel Production Promotion (`npx vercel promote <DEPLOYMENT>`)
* **Source Preview Candidate:** `dpl_HqiN1awwSPk3VkGYzfoiPaeJ1nR7` (GitHub Deployment `7251560631`)
* **Source Git SHA:** `dca547904791535ca44485747065961dbf8fc421` (parent of `710122f` / `2d237d0`)
* **Application Delta from `dca5479`:** **NONE** (identical application source code)
* **Main Merge Required:** NO
* **Main Merged:** NO
* **Production Deployment ID:** `dpl_2733akwjwf1NGvcVGxggoCCUGjuB`
* **Production Deployment Status:** `● Ready`
* **Production Deployment URLs:**
  * Direct: `https://ren-tipid-cjeiwwle4-jburns2372-sys-projects.vercel.app`
  * Canonical Aliases: `https://ren-tipid-jburns2372-sys-projects.vercel.app`, `https://www.rentipid.com.ph`
* **Target Environment Classification:** `Production` (RENTipid production project)
* **Target Database:** Neon PostgreSQL branch `rentipid-production` (`holy-shape-01357429` / `br-proud-sunset-ap0ofil2`)
* **Production Database Migration:** `N/A — NOT REQUIRED / NO SCHEMA CHANGE` (Existing `"AuthRateLimit"` table is present and validated)
* **Production Health API Check:** `HTTP 200 OK`, `{"status":"ready","database":"connected"}`

---

## 9. Production Runtime Verification Evidence

### A. Synthetic Production Identity
* Synthetic Identity: `iso-c2-m3-prod-1792672640027@example.invalid`
* Clearly synthetic domain `@example.invalid`; zero real customer or employee information used; credentials redacted.

### B. Below-Threshold Production Check (Attempt 1)
* **Payload:**
  ```json
  {
    "email": "iso-c2-m3-prod-1792672640027@example.invalid",
    "password": "[REDACTED_SYNTHETIC_CREDENTIAL]",
    "full_name": "ISO Production Synthetic Subject",
    "country": "PH",
    "account_type": "Individual",
    "role": "Renter"
  }
  ```
* **HTTP Status:** `201 Created`
* **Response Body:** `{"message":"Registration accepted. Check your email to verify your account."}`
* **Retry-After Header:** None
* **Duration:** 2627ms
* **Result:** `PASS — EXECUTED` (Legitimate sub-threshold traffic functions normally on Production).

### C. Subsequent In-Quota Attempts (Attempts 2 through 5)
* Requests sent with identical synthetic identity to exercise quota point accumulation:
  * Attempt 2: `HTTP 409 Conflict`, `{"message":"User with this email already exists"}` (limiter allowed; conflict detected by subsequent logic)
  * Attempt 3: `HTTP 409 Conflict`, `{"message":"User with this email already exists"}`
  * Attempt 4: `HTTP 409 Conflict`, `{"message":"User with this email already exists"}`
  * Attempt 5: `HTTP 409 Conflict`, `{"message":"User with this email already exists"}` (quota points = 5/5)
* **Result:** `PASS — EXECUTED` (Predictable counter accumulation in PostgreSQL `"AuthRateLimit"`).

### D. Over-Threshold Production Check (Attempt 6)
* Request 6 sent with identical synthetic identity, exceeding the 5-attempt identity quota:
* **HTTP Status:** `429 Too Many Requests`
* **Response Body:** `{"message":"Too many registration attempts. Please try again later."}`
* **Response Headers:** `Retry-After: 3593` (valid positive integer seconds until quota reset)
* **Duration:** 539ms
* **Result:** `PASS — EXECUTED` (Pre-effect admission rejection enforced; sanitized contract delivered in live Production).

### E. Zero Side-Effect Verification for Throttled Production Request
* Request 6 terminated immediately upon rate limiter admission rejection at route entry (line 35).
* Verification:
  * `User` creation: **NO**
  * `EmailCredential` creation: **NO**
  * `UserProfile` / `BusinessProfile` creation: **NO**
  * Password hashing (`bcrypt.hash`): **NO** (computation bypassed)
  * `AuditLog` write: **NO**
  * Verification email dispatch: **NO**
  * Session creation: **NO**
  * External provider effect: **NO**
* **Result:** `PASS — EXECUTED` (Pre-effect invariant proven in deployed live Production).

### F. Synthetic Data Handling & Safety
* Retained the single bounded synthetic record (`iso-c2-m3-prod-1792672640027@example.invalid`) as documented test data in accordance with Section 13 safety rules; no direct destructive SQL was executed against Production.

---

## 10. Security & Privacy Boundary

* **RAW EMAIL STORED IN RATE-LIMIT KEY:** NO (`createReferenceHash` HMAC-SHA256 digest utilized)
* **RAW IP STORED IN RATE-LIMIT KEY:** NO (`createReferenceHash` HMAC-SHA256 digest utilized)
* **TEST SECRETS LOGGED:** NO (All test credentials redacted and excluded from governance evidence)
* **REAL CUSTOMER DATA USED:** NO (Synthetic `@example.invalid` identity only)
* **UNRELATED PRODUCTION CHANGE:** NO (Zero unrelated environment, database, or code modifications)

---

## 11. Milestone Promotion Gate Status

| Promotion Gate | Status | Justification / Evidence |
|---|---|---|
| **CODE COMPLETE** | `PASS — EXECUTED` | Rate limiter engine and pre-effect route admission check implemented; zero placeholders. |
| **LOCAL FUNCTIONAL** | `PASS — EXECUTED` | Registration route and limiter run locally with expected status codes, headers, and side-effect invariance. |
| **LOCAL DATABASE MIGRATED** | `PASS — REUSED / UNAFFECTED` | Reused existing `"AuthRateLimit"` table; schema unchanged. |
| **LOCAL REQUIRED DATA SEEDED/SYNCED** | `PASS — REUSED / UNAFFECTED` | No reference or seed data required. |
| **LOCAL ACCEPTANCE** | `PASS — EXECUTED` | 11 targeted contract tests pass; zero side effects proven on throttled and error cases. |
| **PREVIEW MIGRATED** | `PASS — REUSED / UNAFFECTED` | Existing `"AuthRateLimit"` table is present on Preview Neon branch; no migration delta. |
| **PREVIEW ACCEPTANCE** | `PASS — EXECUTED` | Deployed preview candidate runtime verified: below-threshold 201 PASS; over-threshold 429 + Retry-After PASS; zero side effects verified. |
| **PRODUCTION-READY** | `PASS — EXECUTED` | Code, local, preview, and deployment requirements fully satisfied; zero schema migration required. |
| **PRODUCTION DEPLOYMENT / VERIFICATION** | `PASS — EXECUTED` | Deployed to Production (`dpl_2733akwjwf1NGvcVGxggoCCUGjuB`); below-threshold 201 PASS; over-threshold 429 + Retry-After: 3593 PASS; zero side effects verified in live Production. |
| **CLOSED / FROZEN** | `PASS — COMPLETED / CLOSED / FROZEN` | All gates pass; M3 implementation closed under operating conformity. |

---

## 12. Resulting Risk Status & M3 Closure

* **Risk ID:** `RSK-06`
* **Status:** `PROVEN — OPERATING CONFORMITY` (advanced from `PROVEN — IMPLEMENTED / PREVIEW VERIFIED` upon successful live Production operating verification)
* **Milestone ISO-C2-M3 Status:** `PASS — OPERATING CONTROL VERIFIED`
* **M3 Authorized Reopen / Implementation:** `CLOSED`
* **Residual Risk Accepted:** `NO`
* **Overall ISO Certification Claimed:** `NO`
* **Next Permitted Action:** Await Project Owner instruction for next ISO-C2 milestone.
