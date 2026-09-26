# RENTipid GLCC v1.0 — P1B Design & Implementation Proposal
## Preference Persistence, Guest State & Reconciliation Architecture

**Document Status:** **PROPOSAL ONLY — AWAITING OWNER AUTHORIZATION**  
**Slice:** `GLCC-P1B — Preference Persistence & Reconciler`  
**Author:** Antigravity  
**Date:** 2026-09-25 (Asia/Shanghai)  
**Governing Architecture Lock:** `docs/governance/glcc-v1.0/RENTIPID_GLCC_ARCHITECTURE_LOCK.md` (Approved 2026-09-25)  
**Parent Package:** `P1 — Preference Foundation and Registries`  
**Prerequisite:** `GLCC-P1A` (Pass & Scoped Checks Verified under CHECK-005)

---

## 1. Architectural Scope & Purpose

`GLCC-P1A` established pure, dependency-free contracts, the 5-tier precedence hierarchy, and verified invariant assertions (`EffectiveGlobalPreference`).

`GLCC-P1B` designs the **storage, guest session, and server extraction layers** that feed tiers 2 (`accountSaved`) and 3 (`guestSession`) into the P1A resolver without violating domain authority boundaries.

> **MANDATORY BOUNDARY RULE:** This document is a design proposal only. Zero database migrations, schema edits, cookies, routes, or account mutations are executed by this document. Implementation requires separate, explicit owner authorization.

---

## 2. Requirement A: Existing Storage Reuse vs. Proposed Model

### 2.1 Audit of Existing Entities
1. **`User` (`prisma/schema.prisma:11`):**
   - Contains core authentication credentials, role, status (`Active`, `Suspended`), MFA references, and Stripe/PayMongo customer references.
   - Currently has zero localization or preference fields.
2. **`UserProfile` (`prisma/schema.prisma:363`):**
   - Contains KYC/identity fields: `first_name`, `last_name`, `address_encrypted`, `city`, `province`, `country`, `trust_score`, `verification_status`.
   - `UserProfile.country` represents physical mailing address/residence derived from `Address.countryCode`, **not** a user's market or display currency preference.
   - Encrypted with AES-GCM via `ProfileFieldProtection`.
3. **`src/app/api/profile/route.ts`:**
   - Accepts `preferred_language` and `timezone` in `profileUpdateSchema`, but immediately drops them before persistence. No database columns exist.

### 2.2 Storage Model Tradeoff Analysis

| Option | Schema Location | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Add columns to `UserProfile`** | `UserProfile` table | Reuses existing 1:1 profile record. | Confounds verified physical KYC address with user UI preference; triggers unnecessary profile encryption overhead; complicates unverified guest conversion. | Not Recommended |
| **Option 2: Add columns to `User`** | `User` table | Zero joins for session hydration; minimal schema footprint. | Pollutes core identity model with localization UI state; requires migrating the central table of the application. | Viable Alternative |
| **Option 3: Dedicated `UserPreference` Model** | New `UserPreference` table (`user_id` unique FK to `User`) | Clean separation of concerns; zero impact on core `User` or KYC `UserProfile`; supports optimistic locking versioning; isolated rollback. | Requires a single 1:1 join when hydrating full user profile. | **RECOMMENDED** |

### 2.3 Proposed Schema Specification (Option 3)
```prisma
model UserPreference {
  id                         String   @id @default(cuid())
  user_id                    String   @unique
  user                       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  language_tag               String   @default("en-PH") // BCP 47
  country_code               String   @default("PH")    // ISO 3166-1 alpha-2
  display_currency           String   @default("PHP")   // ISO 4217
  is_manual_display_override Boolean  @default(false)
  timezone                   String?
  version                    Int      @default(1)       // Optimistic concurrency control
  created_at                 DateTime @default(now())
  updated_at                 DateTime @updatedAt

  @@index([user_id])
}
```

---

## 3. Requirement B: Persisted vs. Derived Data

To prevent database bloat and authority leaks, data is strictly categorized:

| Field | Persisted in DB? | Stored in Cookie? | Nature | Authority |
| :--- | :--- | :--- | :--- | :--- |
| `language_tag` | Yes | Yes | Explicit / Saved User Choice | User |
| `country_code` | Yes | Yes | Explicit / Saved User Choice | User |
| `display_currency` | Yes | Yes | Explicit / Saved User Choice | User |
| `is_manual_display_override` | Yes | Yes | Metadata Flag | User Interaction |
| `timezone` | Yes (nullable) | Yes (nullable) | Optional User Choice | User |
| `version` | Yes (integer) | Yes (integer) | Concurrency / Schema Version | System |
| `chargeCurrency` | **NO (NEVER)** | **NO (NEVER)** | Derived Platform Truth | Finance Policy (`PHP`) |
| `provenance` | **NO** | **NO** | Derived at Request Time | P1A Resolver |
| `registryVersion` | **NO** | **NO** | Derived at Request Time | Registry Context |
| `resolvedAt` | **NO** | **NO** | Request Timestamp | System Clock |

> **INVARIANT:** `chargeCurrency` is **never persisted** as a user preference. The platform charge currency remains an authoritative business rule enforced by the payment domain, preventing users or guests from persisting a multi-currency payment entitlement.

---

## 4. Requirement C: Identity, Authentication & Ownership

1. **Trusted Server-Side Actor Source:**
   - Identity must be derived strictly from `getServerSession(authOptions)` via NextAuth session validation.
   - Client-provided `user_id` query parameters or body fields are **strictly rejected**.
2. **Access Control:**
   - Users may only read or mutate their own `UserPreference` record (`where: { user_id: session.user.id }`).
   - Admin access to preferences requires `ADMIN` or `SUPER_ADMIN` role validation through existing `src/lib/auth.ts` RBAC helpers.
3. **Non-Escalation Guarantee:**
   - Changing country, language, currency, or guest cookie headers grants **zero** permissions, does not modify `User.role`, does not satisfy KYC verification, and does not alter account ownership.

---

## 5. Requirement D: Guest/Account Reconciliation Lifecycle

Reconciliation separates request-time resolution from account persistence across three distinct events:

```text
[Guest Browsing]
      │  (Reads guest cookie; resolves via P1A Tier 3)
      ▼
[Sign-In Event]
      │
      ├── Case 1: Guest has NO manual override (ambient guest session)
      │     └── Active Session: Saved Account Preference (Tier 2) immediately wins.
      │     └── Account DB: Left unmodified.
      │
      └── Case 2: Guest has EXPLICIT manual override (chose language/country while guest)
            ├── Sub-option 2A (EXPLICIT_GUEST_CHOICE_WINS):
            │     └── Active Session: Guest choice applied.
            │     └── Account DB: Automatically updated to guest choice.
            ├── Sub-option 2B (ACCOUNT_SAVED_WINS):
            │     └── Active Session: Saved account preference wins.
            │     └── Account DB: Left unmodified.
            └── Sub-option 2C (PROMPT_USER - RECOMMENDED):
                  └── Active Session: Guest choice applied for current session.
                  └── Client Prompt: "Keep current language/currency for your account?"
                  └── Account DB: Only written if user confirms.
```

### Owner Decision Required:
Prior to implementing P1B, the owner must approve the production reconciliation policy for Case 2:
- **Policy Option A:** `PROMPT_USER` (Recommended — zero silent account overwrites).
- **Policy Option B:** `ACCOUNT_SAVED_WINS` (Strict account priority).
- **Policy Option C:** `EXPLICIT_GUEST_CHOICE_WINS` (Active session convenience).

---

## 6. Requirement E: Guest Preference Cookie & Request Adapter

### 6.1 Cookie Specifications
- **Cookie Name:** `rentipid_pref`
- **Security Flags:** `HttpOnly = true`, `SameSite = Lax`, `Path = /`, `Secure = true` (in production/HTTPS).
- **Expiration:** 30 days rolling.
- **Maximum Payload Size:** < 256 bytes (bounded JSON or compact string).

### 6.2 Format & Integrity
```typescript
interface GuestPreferenceCookiePayload {
  v: 1;                 // Payload format version
  lng?: string;         // e.g. "fil-PH"
  cnt?: string;         // e.g. "PH"
  cur?: string;         // e.g. "USD"
  man?: boolean;        // isManualDisplayOverride
  tz?: string;          // e.g. "Asia/Manila"
  ts: number;           // Unix epoch timestamp
}
```

### 6.3 Server Request Adapter (`src/lib/glcc/server-adapter.ts`)
- **Incoming Header Extraction:**
  - `Accept-Language` header parsed for Tier 4 (`firstRunSuggestion.languageTag`).
  - Cloudflare/Vercel/Cloud-proxy headers (`x-vercel-ip-country`, `cf-ipcountry`) parsed for Tier 4 (`firstRunSuggestion.countryCode`).
- **Fail-Closed Malformed Input Handling:**
  - If `rentipid_pref` cookie is malformed, has invalid JSON, has unsupported codes, or fails BCP 47/ISO regex validation:
    - The adapter discards the candidate silently and logs a structured security telemetry warning.
    - Resolver falls closed to Tier 4 (suggestion) or Tier 5 (platform default).
    - Under no circumstances does a malformed cookie cause a 500 error.

---

## 7. Requirement F: Atomicity, Concurrency & Validation

1. **Atomic Mutation:**
   - Preference updates occur via a single atomic database operation (`prisma.userPreference.upsert`).
   - If country changes and policy requires display currency reset, both fields are mutated in the same database transaction.
2. **Optimistic Concurrency Control:**
   - `UserPreference.version` increments on each update (`version: { increment: 1 }`).
   - Stale writes from concurrent tabs are rejected with HTTP 409 Conflict.
3. **Pre-Persistence Validation:**
   - Incoming preference inputs are strictly validated against `RegistryContext` before attempting database writes.
   - Unsupported countries or currencies return HTTP 400 Bad Request with structured error codes.

---

## 8. Requirement G: Implementation Boundary & Work Plan

### 8.1 Proposed File Allowlist for P1B (When Authorized)
- `src/lib/glcc/server-adapter.ts` *(new — cookie reader, header parser, session adapter)*
- `src/lib/glcc/preference-service.ts` *(new — database repository & cache layer)*
- `src/app/api/preferences/route.ts` *(new — authenticated GET/PATCH endpoints)*
- `prisma/schema.prisma` *(edit — add UserPreference model)*
- `prisma/migrations/XXXXXXXXXXXXXX_add_user_preference/migration.sql` *(new migration)*
- `tests/glcc/server-adapter.test.ts` *(new unit tests)*
- `tests/glcc/preference-service.test.ts` *(new isolated integration tests)*
- `tests/glcc/preferences-api.test.ts` *(new route tests)*

### 8.2 Testing Strategy & Acceptance ID Mapping
- **Unit Tests (In-Memory / Isolated):**
  - Cookie serialization, deserialization, tampering detection, and header parsing.
  - Acceptance IDs: `LNG-01`, `CNT-01`, `CUR-01`, `SEC-01`.
- **Integration Tests (Isolated Test Database):**
  - `UserPreference` upsert, optimistic concurrency conflict, cascade delete with `User`.
  - Acceptance IDs: `LNG-03`, `CNT-02`, `CUR-03`.

### 8.3 Rollback & Forward-Fix Strategy
- The additive `UserPreference` table has zero foreign-key dependencies on other domain tables (only points to `User`).
- Rollback requires only dropping the `UserPreference` table without affecting `User`, `UserProfile`, or existing listings/bookings.

### 8.4 Explicit Blocking Decisions
Before P1B implementation code can begin:
1. **Owner Approval of this P1B Design Proposal.**
2. **Owner Decision on Storage Location:** Option 3 (`UserPreference` table) vs. Option 2 (add columns to `User`).
3. **Owner Decision on Sign-In Reconciliation Policy:** `PROMPT_USER` vs. `ACCOUNT_SAVED_WINS` vs. `EXPLICIT_GUEST_CHOICE_WINS`.
