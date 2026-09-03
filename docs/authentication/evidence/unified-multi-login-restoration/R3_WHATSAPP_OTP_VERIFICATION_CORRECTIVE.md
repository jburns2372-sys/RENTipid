# R3 — WhatsApp OTP Login Verification Corrective Evidence

**Document ID:** `RENTIPID-AUTH-R3-WHATSAPP-OTP-CORRECTIVE`  
**Classification:** `FOCUSED PRODUCTION RUNTIME HOTFIX`  
**Base Lineage SHA:** `255187468eedac4ded0e53d6c02ed270fdcad89d`  
**Application Fix SHA:** `9a4dc9bd8bf189eb2601f6fc540c4cdd6fe16ef8`  
**Rollback Target Deployment ID:** `dpl_3o2N2BjG6wh5PhAFGfyT4U1u2XPT`  
**New Production Hotfix Deployment ID:** `dpl_HzbURXqC8bL4AkX9aanVAQnDCpFg`  
**Canonical Production URL:** `https://www.rentipid.com.ph`  

---

## 1. Incident Context & Root Cause Analysis

### Observed Production Symptom
During live Owner testing of the restored login gateway on `https://www.rentipid.com.ph`:
1. User enters WhatsApp number.
2. Twilio OTP delivery succeeds (`/api/auth/otp` -> 200).
3. User receives and enters verification code.
4. User clicks "Verify & Sign In".
5. Button transitioned to "Verifying..." and stalled indefinitely without completing navigation or displaying an actionable error.

### Server Log Investigation
Production serverless telemetry revealed:
```text
POST /api/auth/callback/phone-otp
ACTUAL INGESTION ERROR: Error [PrismaClientInitializationError]:
Invalid prisma.securityEvent.create() invocation:
Timed out fetching a new connection from the connection pool. More info: http://pris.ly/d/connection-pool (Current connection pool timeout: 10, connection limit: 5)
    at async P (.next/server/chunks/src_lib_security_events_event-ingestion_ts_1zebnrn._.js:1:39635)
```

### Technical Root Cause
1. **Unpooled Connection Proliferation:** `src/lib/security/events/writers/authentication-writer.ts` and `src/lib/security/events/event-ingestion.ts` directly instantiated independent `new PrismaClient()` instances instead of using the central, serverless-pooled `@prisma/adapter-neon` singleton from `@/lib/prisma`. Under concurrent auth queries, these direct instances exhausted the connection pool and timed out after 10 seconds.
2. **Client-Side Unbounded Promise:** In `src/app/login/page.tsx`, `handleVerify()` lacked an execution timeout, causing the UI to lock on "Verifying..." indefinitely when the backend response timed out.

---

## 2. Minimal Corrective Modifications

1. **`src/lib/security/events/writers/authentication-writer.ts`:**
   - Removed `const prisma = new PrismaClient();`
   - Replaced with shared `import { prisma } from "@/lib/prisma";`
2. **`src/lib/security/events/event-ingestion.ts`:**
   - Removed `const prisma = new PrismaClient();`
   - Replaced with shared `import { prisma } from "@/lib/prisma";`
3. **`src/app/login/page.tsx`:**
   - Added bounded 12-second `Promise.race` execution safeguard with `clearTimeout`.
   - Prevented double-submission while loading.
   - Restores actionable error message and re-enables UI if an upstream timeout occurs.
4. **`tests/auth/whatsapp-otp-verification-stall.test.ts`:**
   - Added automated regression suite verifying fail-safe telemetry error handling, callbackUrl normalization, and timeout containment.

---

## 3. Verification & Safety Pipeline

| Verification Step | Target / Command | Result |
| :--- | :--- | :---: |
| **New Regression Tests** | `npx jest tests/auth/whatsapp-otp-verification-stall.test.ts` | **PASS (5/5)** |
| **Auth Baseline Test Suite** | 6 suites / 142 tests | **PASS (142/142)** |
| **SOC/MFA Test Suite** | 4 suites / 53 tests | **PASS (53/53)** |
| **TypeScript Typecheck** | `npm run typecheck` | **PASS (0 errors)** |
| **Production Build** | `npm run build` | **PASS (Exit 0)** |
| **Database Schema Changed** | None | **NO** |
| **Database Migrations Executed**| None | **NO** |
| **Preview Deployment** | `dpl_F85BLK6MLYNXYgqS7b66XephSWxd` | **PASS (HTTP 200)** |
| **Production Hotfix Deployment**| `dpl_HzbURXqC8bL4AkX9aanVAQnDCpFg` | **PASS (HTTP 200)** |
| **Canonical Production Alias** | `https://www.rentipid.com.ph` | **PASS** |

---

## 4. Current Acceptance State

- **Application Hotfix SHA:** `9a4dc9bd8bf189eb2601f6fc540c4cdd6fe16ef8`
- **Active Production Deployment:** `dpl_HzbURXqC8bL4AkX9aanVAQnDCpFg`
- **Owner Targeted Runtime Test:** `AWAITING_OWNER`
- **ListingBridge G11:** `HOLD` (resumes once Owner verifies WhatsApp login path)
